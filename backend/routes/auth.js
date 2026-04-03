const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Request = require('../models/Request');
const Collection = require('../models/Collection');
const DistributionProof = require('../models/DistributionProof');
const auth = require('../middleware/auth');
const { haversineDistance } = require('../utils/geo');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, location, legalDocumentImages } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing required fields' });
    if (role === 'admin') return res.status(403).json({ message: 'Cannot register admin via this endpoint' });

    const allowed = ['provider', 'ngo'];
    const userRole = allowed.includes(role) ? role : 'provider';

    // Require legal docs for provider/ngo
    if (!legalDocumentImages || !Array.isArray(legalDocumentImages) || legalDocumentImages.length === 0) {
      return res.status(400).json({ message: 'Legal documents are required for registration' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);

    // New provider/ngo accounts start with isActive=false, verificationStatus=pending
    const user = new User({
      name,
      email,
      password: hashed,
      role: userRole,
      location: location || { lat: 0, lng: 0 },
      legalDocumentImages,
      verificationStatus: 'pending',
      isActive: false
    });

    await user.save();

    // Do NOT issue token — user must be approved by admin first
    res.json({
      message: 'Registration successful! Your account is pending admin verification. You will be able to login once approved.',
      verificationStatus: 'pending'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    // Block login for non-active accounts (except admin who is always active)
    if (!user.isActive) {
      if (user.verificationStatus === 'rejected') {
        return res.status(403).json({ message: 'Your account has been rejected. Please contact support.', verificationStatus: 'rejected' });
      }
      return res.status(403).json({ message: 'Your account is pending admin verification. Please wait for approval.', verificationStatus: 'pending' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, role: user.role, verificationStatus: user.verificationStatus } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/profile — update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, location, password } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: user._id } });
      if (existing) return res.status(400).json({ message: 'Email already in use' });
      user.email = email;
    }
    if (location) {
      user.location = {
        lat: Number(location.lat ?? user.location.lat),
        lng: Number(location.lng ?? user.location.lng)
      };
    }
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }
    await user.save();
    res.json({
      message: 'Profile updated successfully',
      user: { id: user._id, name: user.name, email: user.email, role: user.role, location: user.location }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/profile/:id — fetch public profile data
router.get('/profile/:id', auth, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id).select('-password');
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    const isSelf = String(targetUser._id) === String(req.user.id);

    // Privacy rule: Providers are private (only self).
    if (targetUser.role === 'provider' && !isSelf) {
      return res.status(403).json({ message: 'Provider profiles are private' });
    }

    // Privacy rule: NGO documents are hidden for public view
    if (targetUser.role === 'ngo' && !isSelf) {
      targetUser.legalDocumentImages = [];
    }

    // For NGOs, fetch public stats and activities
    let stats = null;
    let activities = [];
    if (targetUser.role === 'ngo') {
      const { lat, lng } = req.query;
      const userLat = lat ? parseFloat(lat) : null;
      const userLng = lng ? parseFloat(lng) : null;

      const allReqs = await Request.find({ ngoId: targetUser._id });
      stats = {
        total: allReqs.length,
        accepted: allReqs.filter(r => r.status === 'accepted').length,
        pending: allReqs.filter(r => r.status === 'pending').length
      };

      // Completed pickups and their proofs
      const collections = await Collection.find({ ngoId: targetUser._id, pickup_status: 'completed' })
        .populate('foodId')
        .sort({ collectedAt: -1 });
      
      const proofs = await DistributionProof.find({ ngoId: targetUser._id });

      activities = collections.map(col => {
        const proof = proofs.find(p => String(p.collectionId) === String(col._id));
        let distanceKm = null;
        if (userLat && userLng && col.foodId?.location) {
          distanceKm = haversineDistance(userLat, userLng, col.foodId.location.lat, col.foodId.location.lng);
        }
        return {
          collectionId: col._id,
          foodName: col.foodId?.foodName || 'Food Item',
          pickupDate: col.collectedAt,
          proofImages: proof ? proof.proofImages : [],
          description: proof ? proof.description : '',
          hasProof: !!proof,
          distanceKm
        };
      });
    }

    res.json({ user: targetUser, stats, activities });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
