const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

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

module.exports = router;
