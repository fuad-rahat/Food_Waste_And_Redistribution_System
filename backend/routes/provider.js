const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isProvider, isActiveUser } = require('../middleware/roles');
const Request = require('../models/Request');
const Food = require('../models/Food');
const Collection = require('../models/Collection');

// GET /api/provider/requests — view requests grouped by food
router.get('/requests', auth, isProvider, isActiveUser, async (req, res) => {
  try {
    const requests = await Request.find({ providerId: req.user.id })
      .populate('ngoId', 'name email')
      .populate('foodId')
      .sort({ createdAt: -1 });
    const grouped = {};
    requests.forEach(r => {
      const fid = String(r.foodId._id);
      if (!grouped[fid]) grouped[fid] = { food: r.foodId, requests: [] };
      grouped[fid].requests.push(r);
    });
    res.json({ grouped });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/provider/request/:id/accept
router.put('/request/:id/accept', auth, isProvider, isActiveUser, async (req, res) => {
  try {
    const { grantedAmount } = req.body;
    const reqDoc = await Request.findById(req.params.id);
    if (!reqDoc) return res.status(404).json({ message: 'Request not found' });
    if (String(reqDoc.providerId) !== req.user.id) return res.status(403).json({ message: 'Not allowed' });
    if (reqDoc.status === 'accepted') return res.status(400).json({ message: 'Already accepted' });

    reqDoc.status = 'accepted';
    reqDoc.grantedAmount = grantedAmount || reqDoc.requestedAmount || 0;
    await reqDoc.save();

    // Create a Collection record so the NGO can track pickup & upload distribution proof
    const existingCol = await Collection.findOne({ foodId: reqDoc.foodId, ngoId: reqDoc.ngoId });
    if (!existingCol) {
      const col = new Collection({
        foodId: reqDoc.foodId,
        providerId: req.user.id,
        ngoId: reqDoc.ngoId,
        pickup_status: 'pending'
      });
      await col.save();
      // Store collectionId on the request for easy frontend lookup
      reqDoc.collectionId = col._id;
      await reqDoc.save();
    }

    const food = await Food.findById(reqDoc.foodId);
    if (food) {
      food.quantity = Math.max(0, (food.quantity || 0) - (reqDoc.grantedAmount || 0));
      if (food.quantity === 0) food.status = 'claimed';
      await food.save();
      if (food.quantity === 0) {
        await Request.updateMany({ foodId: food._id, status: 'pending' }, { status: 'rejected' });
      }
    }
    res.json({ message: 'Accepted', request: reqDoc, food });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/provider/request/:id/reject
router.put('/request/:id/reject', auth, isProvider, isActiveUser, async (req, res) => {
  try {
    const reqDoc = await Request.findById(req.params.id);
    if (!reqDoc) return res.status(404).json({ message: 'Request not found' });
    if (String(reqDoc.providerId) !== req.user.id) return res.status(403).json({ message: 'Not allowed' });
    reqDoc.status = 'rejected';
    await reqDoc.save();
    res.json({ message: 'Rejected', request: reqDoc });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
