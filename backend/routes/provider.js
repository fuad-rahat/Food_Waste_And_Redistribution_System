const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isProvider, isActiveUser } = require('../middleware/roles');
const Request = require('../models/Request');
const Food = require('../models/Food');
const Collection = require('../models/Collection');
const Notification = require('../models/Notification');
const DistributionProof = require('../models/DistributionProof');
const { sendNotification } = require('../utils/socket');

// GET /api/provider/requests — view requests grouped by food
router.get('/requests', auth, isProvider, isActiveUser, async (req, res) => {
  try {
    const requests = await Request.find({ providerId: req.user.id })
      .populate('ngoId', 'name email slug')
      .populate('foodId')
      .sort({ createdAt: -1 });
    const grouped = {};
    requests.forEach(r => {
      // If foodId is null (food was deleted), we use a placeholder or skip it.
      // Skipping ensures the dashboard doesn't crash.
      if (!r.foodId) return; 

      const fid = String(r.foodId._id);
      if (!grouped[fid]) grouped[fid] = { food: r.foodId, requests: [] };
      grouped[fid].requests.push(r);
    });
    res.json({ grouped });
  } catch (err) {
    console.error('Error fetching provider requests:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/provider/distribution-proofs — view proofs for provider's food
router.get('/distribution-proofs', auth, isProvider, isActiveUser, async (req, res) => {
  try {
    // Find all collections where this user is the provider
    const collections = await Collection.find({ providerId: req.user.id }).select('_id');
    const colIds = collections.map(c => c._id);

    // Find proofs matched with these collections
    const proofs = await DistributionProof.find({ collectionId: { $in: colIds } })
      .populate({ path: 'collectionId', populate: { path: 'foodId' } })
      .populate('ngoId', 'name email slug')
      .sort({ uploadDate: -1 });
    
    res.json({ proofs });
  } catch (err) {
    console.error('Error fetching provider distribution proofs:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ... rest of file (accept/reject routes)

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
        const others = await Request.find({ foodId: food._id, status: 'pending' });
        await Request.updateMany({ foodId: food._id, status: 'pending' }, { status: 'rejected' });
        // Notify others
        if (others.length > 0) {
          const bulkNotifs = others.map(r => ({
            recipient: r.ngoId,
            type: 'request_update',
            message: `Request for ${food.foodName} was rejected (already claimed by another NGO).`,
            foodId: food._id
          }));
          await Notification.insertMany(bulkNotifs);
          // Emit socket events for each notification
          bulkNotifs.forEach(n => sendNotification(n.recipient, n));
        }
      }
    }

    // Notify the accepted NGO
    const acceptedNotif = new Notification({
      recipient: reqDoc.ngoId,
      type: 'request_update',
      message: `Your request for ${food?.foodName || 'food'} was accepted!`,
      foodId: reqDoc.foodId
    });
    await acceptedNotif.save();
    sendNotification(reqDoc.ngoId, acceptedNotif);
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

    // Notify them
    const rejectedNotif = new Notification({
      recipient: reqDoc.ngoId,
      type: 'request_update',
      message: `Your request for food was rejected by the provider.`,
      foodId: reqDoc.foodId
    });
    await rejectedNotif.save();
    sendNotification(reqDoc.ngoId, rejectedNotif);
    res.json({ message: 'Rejected', request: reqDoc });
  } catch (err) {
    console.error('Error rejecting request:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
