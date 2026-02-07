const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    description: { type: String, required: true },
    amount: { type: Number, required: true }, // Total amount paid
    date: { type: Date, default: Date.now },
    category: { type: String, default: 'General' }, // e.g., Food, Travel

    // Who actually paid the bill?
    payer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Which group does this belong to?
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },

    // How is it split?
    splitType: { 
        type: String, 
        enum: ['EQUAL', 'PERCENTAGE', 'EXACT'], 
        required: true,
        default: 'EQUAL'
    },

    // Split between people
    splits: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        amount: { type: Number },     
        percentage: { type: Number }, // Only used if splitType is PERCENTAGE
        status: { 
            type: String, 
            enum: ['PENDING', 'SETTLED'], 
            default: 'PENDING' 
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);