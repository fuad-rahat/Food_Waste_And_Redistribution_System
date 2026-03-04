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

    for (const ngo of ngos) {
      if (ngo.location && ngo.location.lat != null && ngo.location.lng != null) {
        const dist = haversineDistance(location.lat, location.lng, ngo.location.lat, ngo.location.lng);
        console.log(`Checking NGO ${ngo.name} at distance ${dist.toFixed(2)}km`);
        if (dist <= 5) { // 5km radius
          notifications.push({
            recipient: ngo._id,
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


// GET /api/food/available — public list with search, proximity filter, and pagination


// DELETE /api/food/:id — provider deletes their own food post
//mahbub

module.exports = router;
