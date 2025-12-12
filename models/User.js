const mongoose = require('mongoose');

// Define the schema for the User
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
        match: /^\+91\d{10}$/, // Must start with +91 and 10 digits
    },
    password: {
        type: String,
        required: true,
        minlength: 6, // Password must be at least 6 characters
    },
    role: {
        type: String,
        required: true,
        enum: ['Guest', 'Worker'], // Only allowed roles
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Create the model from the schema
const User = mongoose.model('User', userSchema);

module.exports = User;
