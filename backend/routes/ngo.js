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


// PUT /api/ngo/collect/:id


// PUT /api/ngo/collection/:id/complete — mark pickup as completed


// POST /api/ngo/request/:foodId — NGO requests food


// GET /api/ngo/requests — NGO's own requests


// GET /api/ngo/collections — NGO's own collections


// POST /api/ngo/distribution-proof/:collectionId — upload distribution proof


// GET /api/ngo/distribution-proofs — NGO's uploaded proofs


module.exports = router;
