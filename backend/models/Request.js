const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  collectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection' },
  message: { type: String },
  requestedAmount: { type: Number, default: 0 },
  grantedAmount: { type: Number },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'picked'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Request', RequestSchema);
