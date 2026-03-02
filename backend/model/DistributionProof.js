const mongoose = require('mongoose');

const DistributionProofSchema = new mongoose.Schema({
    collectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection', required: true },
    ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    proofImages: [{ type: String }], // array of ImgBB URLs
    description: { type: String },
    uploadDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DistributionProof', DistributionProofSchema);
