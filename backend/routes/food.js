const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isProvider, isActiveUser } = require('../middleware/roles');
const Food = require('../models/Food');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { haversineDistance } = require('../utils/geo');

// POST /api/food/create — provider posts food
router.post('/create', auth, isProvider, isActiveUser, async (req, res) => {
  try {
    const { foodName, quantity, expiryTime, details } = req.body;
    let { location } = req.body;

    // Use provider's location if submitted location is empty or default (0,0)
    const provider = await User.findById(req.user.id);
    if ((!location || (location.lat === 0 && location.lng === 0)) && provider.location) {
      location = { lat: provider.location.lat, lng: provider.location.lng };
    }

    const food = new Food({ providerId: req.user.id, foodName, quantity, expiryTime, location, details });
    await food.save();

    // Notify nearby NGOs
    const ngos = await User.find({ role: 'ngo', isActive: true });
    const notifications = [];

    const foodLat = parseFloat(location.lat);
    const foodLng = parseFloat(location.lng);

    for (const ngo of ngos) {
      if (ngo.location && ngo.location.lat != null && ngo.location.lng != null) {
        const ngoLat = parseFloat(ngo.location.lat);
        const ngoLng = parseFloat(ngo.location.lng);
        
        const dist = haversineDistance(foodLat, foodLng, ngoLat, ngoLng);
        console.log(`Checking NGO ${ngo.name} at distance ${dist.toFixed(2)}km`);
        
        if (dist <= 5) { // 5km radius
          notifications.push({
            recipient: ngo._id,
            type: 'new_food',
            message: `New food available nearby: ${foodName} (${quantity} units)`,
            foodId: food._id
          });
        }
      }
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.json({ message: 'Food posted and nearby NGOs notified', food, notifiedCount: notifications.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/food/my-food — provider's food
router.get('/my-food', auth, isProvider, isActiveUser, async (req, res) => {
  try {
    const foods = await Food.find({ providerId: req.user.id }).sort({ createdAt: -1 });
    res.json({ foods });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/food/available — public list with search, proximity filter, and pagination

router.get('/available', async (req, res) => {
  try {
    const { search, page = 1, limit = 10, lat, lng, nearMe } = req.query;
    const now = new Date();
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { status: 'available' };

    // 1. Search Logic
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      // Find providers matching search in name or email
      const matchingProviders = await User.find({
        role: 'provider',
        $or: [
          { name: searchRegex },
          { email: searchRegex }
        ]
      }).select('_id');
      const providerIds = matchingProviders.map(p => p._id);

      query.$or = [
        { foodName: searchRegex },
        { providerId: { $in: providerIds } }
      ];
    }

    let foods = await Food.find(query)
      .populate('providerId', 'name email location')
      .sort({ createdAt: -1 });

    // 2. Ensure location is present (backwards compatibility/sync)
    for (let f of foods) {
      const prov = f.providerId;
      if (prov && (!prov.location || prov.location.lat == null || (prov.location.lat === 0 && prov.location.lng === 0))) {
        try {
          const user = await User.findById(prov._id || prov).select('location name email');
          if (user && user.location) {
            f.providerId.location = { lat: user.location.lat, lng: user.location.lng };
          }
        } catch (e) { }
      }
    }

    // 3. Proximity Filter (JS side for simplicity with population)
    const userLat = lat ? parseFloat(lat) : null;
    const userLng = lng ? parseFloat(lng) : null;

    if (nearMe === 'true' && userLat && userLng) {
      foods = foods.filter(f => {
        const pLoc = f.providerId?.location || f.location;
        if (!pLoc || pLoc.lat == null) return false;
        const d = haversineDistance(userLat, userLng, pLoc.lat, pLoc.lng);
        return d <= 5; // 5km radius
      });
    }

    const total = foods.length;
    const paginatedFoods = foods.slice(skip, skip + parseInt(limit));

    const transformed = paginatedFoods.map(f => {
      let distanceKm = null;
      if (userLat && userLng) {
        const pLoc = f.providerId?.location || f.location;
        if (pLoc && pLoc.lat != null) {
          distanceKm = haversineDistance(userLat, userLng, pLoc.lat, pLoc.lng);
        }
      }
      return {
        _id: f._id,
        foodName: f.foodName,
        quantity: f.quantity,
        expiryTime: f.expiryTime,
        location: f.location,
        details: f.details,
        status: f.status,
        providerId: f.providerId,
        isExpired: f.expiryTime && (new Date(f.expiryTime) < now),
        distanceKm
      };
    });

    res.json({
      foods: transformed,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error('available err', err);
    res.status(500).json({ message: 'Server error' });
  }
});
// DELETE /api/food/:id — provider deletes their own food post
router.delete('/:id', auth, isProvider, isActiveUser, async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) return res.status(404).json({ message: 'Food not found' });

    // Check ownership
    if (food.providerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this food post' });
    }

   
    if (food.status !== 'available') {
      return res.status(400).json({ message: `Cannot delete food that is already ${food.status}` });
    }

    await Food.deleteOne({ _id: req.params.id });

    // Also cleanup any notifications related to this food
    await Notification.deleteMany({ foodId: req.params.id });

    res.json({ message: 'Food post deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
