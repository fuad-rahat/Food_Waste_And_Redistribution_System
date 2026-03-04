const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isNGO, isActiveUser } = require('../middleware/roles');
const Food = require('../models/Food');
const Collection = require('../models/Collection');
const Request = require('../models/Request');
const DistributionProof = require('../models/DistributionProof');

const { haversineDistance } = require('../utils/geo');

// GET /api/ngo/nearby?lat=..&lng=..&maxKm=5
router.get('/nearby', auth, isNGO, isActiveUser, async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const maxKm = parseFloat(req.query.maxKm) || 10;
    const now = new Date();
    const foods = await Food.find({ status: 'available', expiryTime: { $gt: now } });
    const list = foods.map(f => {
      const dist = haversineDistance(lat, lng, f.location.lat, f.location.lng);
      const hoursToExpiry = (new Date(f.expiryTime) - now) / (1000 * 60 * 60);
      const priority = hoursToExpiry * 0.7 + dist * 0.3;
      return { food: f, distanceKm: dist, hoursToExpiry, priority };
    }).filter(x => x.distanceKm <= maxKm).sort((a, b) => a.priority - b.priority);
    res.json({ list });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/ngo/claim/:id
router.put('/claim/:id', auth, isNGO, isActiveUser, async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) return res.status(404).json({ message: 'Not found' });
    if (food.status !== 'available') return res.status(400).json({ message: 'Not available' });
    food.status = 'claimed';
    food.claimedBy = req.user.id;
    await food.save();
    res.json({ message: 'Claimed', food });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/ngo/collect/:id
router.put('/collect/:id', auth, isNGO, isActiveUser, async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) return res.status(404).json({ message: 'Not found' });
    if (food.status === 'collected') return res.status(400).json({ message: 'Already collected' });
    food.status = 'collected';
    await food.save();
    const collection = new Collection({
      foodId: food._id,
      providerId: food.providerId,
      ngoId: req.user.id,
      pickup_status: 'pending'
    });
    await collection.save();
    res.json({ message: 'Collected', food, collection });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/ngo/collection/:id/complete — mark pickup as completed
router.put('/collection/:id/complete', auth, isNGO, isActiveUser, async (req, res) => {
  try {
    const col = await Collection.findById(req.params.id);
    if (!col) return res.status(404).json({ message: 'Collection not found' });
    if (String(col.ngoId) !== req.user.id) return res.status(403).json({ message: 'Not allowed' });
    col.pickup_status = 'completed';
    await col.save();
    res.json({ message: 'Pickup marked complete', collection: col });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/ngo/request/:foodId — NGO requests food
router.post('/request/:foodId', auth, isNGO, isActiveUser, async (req, res) => {
  try {
    const { message, requestedAmount } = req.body;
    const food = await Food.findById(req.params.foodId);
    if (!food) return res.status(404).json({ message: 'Food not found' });
    const existing = await Request.findOne({ foodId: req.params.foodId, ngoId: req.user.id });
    if (existing) return res.status(400).json({ message: 'Already requested' });
    const reqDoc = new Request({
      foodId: req.params.foodId,
      providerId: food.providerId,
      ngoId: req.user.id,
      message,
      requestedAmount: requestedAmount || 0
    });
    await reqDoc.save();
    res.json({ message: 'Requested', request: reqDoc });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/ngo/requests — NGO's own requests


// GET /api/ngo/collections — NGO's own collections


// POST /api/ngo/distribution-proof/:collectionId — upload distribution proof


// GET /api/ngo/distribution-proofs — NGO's uploaded proofs


module.exports = router;
