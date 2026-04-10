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
    const foods = await Food.find({ status: 'available', expiryTime: { $gt: now } }).populate('providerId', 'name location email');
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

    // Also update associated request status to 'picked'
    await Request.findOneAndUpdate({ collectionId: col._id }, { status: 'picked' });

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
router.get('/requests', auth, isNGO, isActiveUser, async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const userLat = lat ? parseFloat(lat) : null;
    const userLng = lng ? parseFloat(lng) : null;

    const rawList = await Request.find({ ngoId: req.user.id })
      .populate('foodId')
      .populate('providerId', 'name')
      .populate('collectionId')
      .sort({ createdAt: -1 });

    const list = rawList.map(r => {
      let distanceKm = null;
      if (userLat && userLng) {
        const foodLoc = r.foodId?.location;
        if (foodLoc && foodLoc.lat != null) {
          distanceKm = haversineDistance(userLat, userLng, foodLoc.lat, foodLoc.lng);
        }
      }
      return { ...r.toObject(), distanceKm };
    });

    res.json({ list });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/ngo/collections — NGO's own collections
router.get('/collections', auth, isNGO, isActiveUser, async (req, res) => {
  try {
    const collections = await Collection.find({ ngoId: req.user.id })
      .populate('foodId')
      .populate('providerId', 'name email')
      .sort({ collectedAt: -1 });
    res.json({ collections });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/ngo/distribution-proof/:collectionId — upload distribution proof
router.post('/distribution-proof/:collectionId', auth, isNGO, isActiveUser, async (req, res) => {
  try {
    const { proofImages, description } = req.body;
    if (!proofImages || !Array.isArray(proofImages) || proofImages.length === 0) {
      return res.status(400).json({ message: 'At least one proof image is required' });
    }
    const col = await Collection.findById(req.params.collectionId);
    if (!col) return res.status(404).json({ message: 'Collection not found' });
    if (String(col.ngoId) !== req.user.id) return res.status(403).json({ message: 'Not allowed' });

    const proof = new DistributionProof({
      collectionId: req.params.collectionId,
      ngoId: req.user.id,
      proofImages,
      description
    });
    await proof.save();

    // Auto-complete the pickup status
    col.pickup_status = 'completed';
    await col.save();

    // Also update associated request status to 'picked'
    await Request.findOneAndUpdate({ collectionId: col._id }, { status: 'picked' });

    res.json({ message: 'Distribution proof uploaded', proof });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/ngo/distribution-proofs — NGO's uploaded proofs
router.get('/distribution-proofs', auth, isNGO, isActiveUser, async (req, res) => {
  try {
    const proofs = await DistributionProof.find({ ngoId: req.user.id })
      .populate({ path: 'collectionId', populate: { path: 'foodId' } })
      .sort({ uploadDate: -1 });
    res.json({ proofs });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
