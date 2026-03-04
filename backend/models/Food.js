const mongoose = require('mongoose');

const FoodSchema = new mongoose.Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  foodName: { type: String, required: true },
  quantity: { type: Number, required: true },
  expiryTime: { type: Date, required: true },
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  details: { type: String },
  status: { type: String, enum: ['available','claimed','collected','expired'], default: 'available' },
  claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Food', FoodSchema);
