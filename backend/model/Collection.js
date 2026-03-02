const mongoose = require('mongoose');

const CollectionSchema = new mongoose.Schema({
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pickup_status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  collectedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Collection', CollectionSchema);
