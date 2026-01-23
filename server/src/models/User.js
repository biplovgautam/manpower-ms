const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Please provide full name'],
        minlength: 3,
        maxlength: 50,
        trim: true,
    },
    email: {
        type: String,
        required: false,
        lowercase: true,
        trim: true,
        // Removed unique: true
        index: true, // Speeds up login lookups without forcing uniqueness
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please provide a valid email'],
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6,
        select: false,
    },
    role: {
        type: String,
        enum: ['super_admin', 'admin', 'employee'],
        default: 'employee',
    },
    contactNumber: {
        type: String,
        required: [true, 'Contact number required'],
        unique: true, // Phone remains the unique key
        trim: true
    },
    address: { type: String, required: [true, 'Address required'] },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: function () { return this.role !== 'super_admin'; },
    },
    // Add these fields to your existing UserSchema
    isBlocked: { type: Boolean, default: false },
    notificationSettings: {
        enabled: { type: Boolean, default: true }, // Global Toggle
        newJob: { type: Boolean, default: true },
        newEmployer: { type: Boolean, default: true },
        newWorker: { type: Boolean, default: true },
        newSubAgent: { type: Boolean, default: true }
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    otpReference: String,
}, { timestamps: true });

UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    const pepperedPassword = this.password + process.env.PASSWORD_PEPPER;
    this.password = await bcrypt.hash(pepperedPassword, salt);
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
    const pepperedPassword = candidatePassword + process.env.PASSWORD_PEPPER;
    return await bcrypt.compare(pepperedPassword, this.password);
};

UserSchema.methods.createJWT = function () {
    return jwt.sign(
        { userId: this._id, role: this.role, companyId: this.companyId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_LIFETIME }
    );
};

module.exports = mongoose.model('User', UserSchema);