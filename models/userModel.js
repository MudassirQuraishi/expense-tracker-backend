const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    profilePhoto: {
        type: String,
    },
    fullname: {
        type: String,
    },
    phoneNumber: {
        type: String,
    },
    firstLogin: {
        type: Boolean,
        default: true,
    },
    keepLoggedIn: {
        type: Boolean,
        default: false,
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    emailVerificationToken: {
        type: String,
    },
    totalExpense: {
        type: Number,
        default: 0,
    },
    isPremium: {
        type: Boolean,
        default: false,
    },
    isPremiumEligible: {
        type: Boolean,
        default: false,
    },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
