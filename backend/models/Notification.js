const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['new_food', 'request_update', 'new_request'], default: 'new_food' },
    message: { type: String, required: true },
    foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
    isRead: { type: Boolean, default: false },
    isSeen: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', NotificationSchema);
