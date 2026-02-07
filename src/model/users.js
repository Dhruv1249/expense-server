const { header } = require('express-validator');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true},
    email: { type: String, required: true, unique: true },
    password: { type: String, select: false }, // Select false means it will not be returned by default
    googleId: { type: String, required: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
