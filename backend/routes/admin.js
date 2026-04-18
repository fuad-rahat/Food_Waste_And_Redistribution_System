const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/roles');
const User = require('../models/User');
const Food = require('../models/Food');
const Collection = require('../models/Collection');
const Request = require('../models/Request');
const DistributionProof = require('../models/DistributionProof');

// ─── USER MANAGEMENT ────────────────────────────────────────────────────────

// GET /api/admin/users — all users
router.get('/users', auth, isAdmin, async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json({ users });
});

// GET /api/admin/pending-users — users awaiting verification
router.get('/pending-users', auth, isAdmin, async (req, res) => {
  const users = await User.find({ verificationStatus: 'pending', role: { $in: ['provider', 'ngo'] } })
    .select('-password')
    .sort({ createdAt: -1 });
  res.json({ users });
});

// PUT /api/admin/user/:id/verify — approve or reject a user
router.put('/user/:id/verify', auth, isAdmin, async (req, res) => {
  try {
    const { action } = req.body; // 'approve' | 'reject'
    if (!['approve', 'reject'].includes(action)) return res.status(400).json({ message: 'Invalid action' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (action === 'approve') {
      user.verificationStatus = 'approved';
      user.isActive = true;
    } else {
      user.verificationStatus = 'rejected';
      user.isActive = false;
    }

    await user.save();
    res.json({ message: `User ${action}d successfully`, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/user/:id/block — toggle isActive (for already-verified users)
router.put('/user/:id/block', auth, isAdmin, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.isActive = !user.isActive;
  await user.save();
  res.json({ message: 'User updated', user });
});

// DELETE /api/admin/user/:id/delete
router.delete('/user/:id/delete', auth, isAdmin, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

// ─── FOOD MANAGEMENT ────────────────────────────────────────────────────────

// GET /api/admin/foods — all foods
router.get('/foods', auth, isAdmin, async (req, res) => {
  try {
    const foods = await Food.find().populate('providerId', 'name slug').sort({ createdAt: -1 });
    res.json({ foods });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/food/:id
router.delete('/food/:id', auth, isAdmin, async (req, res) => {
  try {
    await Food.findByIdAndDelete(req.params.id);
    res.json({ message: 'Food deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── STATS & PROOFS ────────────────────────────────────────────────────────

// GET /api/admin/stats — dashboard statistics
router.get('/stats', auth, isAdmin, async (req, res) => {
  try {
    const now = new Date();
    const totalFood = await Food.countDocuments();
    
    // Sum quantities for items claimed by NGOs and confirmed by Providers (Accepted Requests)
    const rescuedAggr = await Request.aggregate([
      { $match: { status: 'accepted' } },
      { $group: { _id: null, total: { $sum: '$grantedAmount' } } }
    ]);
    const totalCollected = rescuedAggr.length > 0 ? rescuedAggr[0].total : 0;

    // Sum quantities for expired items (either status 'expired' or time passed)
    const expiredAggr = await Food.aggregate([
      { 
        $match: { 
          $or: [
            { status: 'expired' },
            { status: 'available', expiryTime: { $lt: now } }
          ] 
        } 
      },
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);
    const totalExpired = expiredAggr.length > 0 ? expiredAggr[0].total : 0;

    const activeProviders = await User.countDocuments({ role: 'provider', isActive: true });
    const activeNGOs = await User.countDocuments({ role: 'ngo', isActive: true });
    const pendingVerification = await User.countDocuments({ verificationStatus: 'pending', role: { $in: ['provider', 'ngo'] } });

    res.json({
      totalFood,
      totalCollected,
      totalExpired,
      activeProviders,
      activeNGOs,
      pendingVerification,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/distribution-proofs
router.get('/distribution-proofs', auth, isAdmin, async (req, res) => {
  try {
    const proofs = await DistributionProof.find()
      .populate('ngoId', 'name email slug')
      .populate({
        path: 'collectionId',
        populate: [
          { path: 'foodId', select: 'foodName' },
          { path: 'providerId', select: 'name slug' }
        ]
      })
      .sort({ createdAt: -1 });
    res.json({ proofs });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
// ─── USER PROFILE ────────────────────────────────────────────────────────────

// GET /api/admin/user/:id/profile
router.get('/user/:id/profile', auth, isAdmin, async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  const foods = await Food.find({ providerId: req.params.id });
  const requests = await Request.find({ $or: [{ ngoId: req.params.id }, { providerId: req.params.id }] }).populate('foodId');
  res.json({ user, foods, requests });
});

// ─── NGO ACCOUNTABILITY ─────────────────────────────────────────────────────

// GET /api/admin/red-alert-ngos — NGOs with overdue distribution proofs
router.get('/red-alert-ngos', auth, isAdmin, async (req, res) => {
  try {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const ngos = await User.aggregate([
      { $match: { role: 'ngo' } },
      // 1. Get total completed collections and total proofs for each NGO (for stats)
      {
        $lookup: {
          from: 'collections',
          let: { ngoId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$ngoId', '$$ngoId'] }, pickup_status: 'completed' } }
          ],
          as: 'allCollections'
        }
      },
      {
        $lookup: {
          from: 'distributionproofs',
          localField: '_id',
          foreignField: 'ngoId',
          as: 'allProofs'
        }
      },
      // 2. Find specifically the delayed collections for the red alert list
      {
        $lookup: {
          from: 'collections',
          let: { ngoId: '$_id' },
          pipeline: [
            { 
              $match: { 
                $expr: { $eq: ['$ngoId', '$$ngoId'] },
                pickup_status: 'completed'
              } 
            },
            {
              $addFields: {
                effectivePickedAt: { $ifNull: ['$pickedAt', '$collectedAt'] }
              }
            },
            {
              $match: {
                effectivePickedAt: { $lte: twoDaysAgo }
              }
            },
            {
              $lookup: {
                from: 'distributionproofs',
                localField: '_id',
                foreignField: 'collectionId',
                as: 'collectionProofs'
              }
            },
            { $match: { collectionProofs: { $size: 0 } } },
            {
              $lookup: {
                from: 'foods',
                localField: 'foodId',
                foreignField: '_id',
                as: 'foodInfo'
              }
            },
            { $unwind: { path: '$foodInfo', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                foodName: { $ifNull: ['$foodInfo.foodName', 'Unknown Food'] },
                pickedAt: '$effectivePickedAt'
              }
            }
          ],
          as: 'delayedProofItems'
        }
      },
      // 3. Filter only those with delayed items
      { $match: { delayedProofItems: { $not: { $size: 0 } } } },
      // 4. Final projection
      {
        $project: {
          name: 1,
          email: 1,
          role: 1,
          slug: 1,
          isActive: 1,
          totalPicked: { $size: '$allCollections' },
          totalProofUploaded: { $size: '$allProofs' },
          delayedProofItems: 1
        }
      }
    ]);

    res.json({ ngos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
