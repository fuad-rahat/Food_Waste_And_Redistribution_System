// Check admin role
module.exports.isAdmin = function (req, res, next) {
  if (!req.user || req.user.role !== 'admin')
    return res.status(403).json({ message: 'Admin access only' });
  next();
};

// Check provider role
module.exports.isProvider = function (req, res, next) {
  if (!req.user || req.user.role !== 'provider')
    return res.status(403).json({ message: 'Provider access only' });
  next();
};

// Check NGO role
module.exports.isNGO = function (req, res, next) {
  if (!req.user || req.user.role !== 'ngo')
    return res.status(403).json({ message: 'NGO access only' });
  next();
};

// Check account is active (run AFTER role check)
module.exports.isActiveUser = function (req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (req.user.role === 'admin') return next();
  const User = require('../models/User');
  User.findById(req.user.id).select('isActive verificationStatus').then(user => {
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.isActive) {
      const status = user.verificationStatus;
      if (status === 'rejected') return res.status(403).json({ message: 'Account rejected', verificationStatus: status });
      return res.status(403).json({ message: 'Account pending verification', verificationStatus: status });
    }
    next();
  }).catch(() => res.status(500).json({ message: 'Server error' }));
};
