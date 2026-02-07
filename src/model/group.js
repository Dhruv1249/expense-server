const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    thumbnail: { type: String },
    // Changed admin to creator since I want to allow multiple admins
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { 
            type: String, 
            enum: ['admin', 'manager', 'member', 'viewer'], 
            default: 'member'
        },
        joinedAt: { type: Date, default: Date.now }
    }],

    currency: { type: String, default: 'INR' },
    
    totalSpent: { type: Number, default: 0 }

}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);