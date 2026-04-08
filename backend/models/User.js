const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['provider', 'ngo', 'admin'], default: 'provider' },
  location: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },
  // Legal document images (array of ImgBB URLs) — required for provider/ngo
  legalDocumentImages: [{ type: String }],
  // Verification workflow
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  // Only set to true by admin after approving documents
  isActive: { type: Boolean, default: false },
  slug: { type: String, unique: true }, // slug: Red_Cross_BD
  createdAt: { type: Date, default: Date.now }
});

// Auto-generate slug from name
UserSchema.pre('save', async function(next) {
  if (this.isModified('name') || !this.slug) {
    let baseSlug = this.name.trim().replace(/\s+/g, '_');
    this.slug = baseSlug;
    
    // Check if slug already exists (CASE-INSENSITIVE check for real uniqueness)
    const User = mongoose.model('User');
    let count = await User.countDocuments({ 
      slug: { $regex: new RegExp(`^${baseSlug}$`, 'i') }, 
      _id: { $ne: this._id } 
    });
    if (count > 0) {
      this.slug = `${baseSlug}_${Math.floor(1000 + Math.random() * 8999)}`;
    }
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
