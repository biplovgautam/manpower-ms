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
        unique: true,
        sparse: true, // IMPORTANT: Allows multiple null/undefined values
        lowercase: true,
        trim: true,
        match: [
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            'Please provide a valid email',
        ],
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
    contactNumber: { type: String, required: [true, 'Contact number required'] },
    address: { type: String, required: [true, 'Address required'] },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: function () {
            // companyId is required for everyone except super_admin
            return this.role !== 'super_admin';
        },
    },
}, { timestamps: true });

// CENTRALIZED SALT + PEPPER LOGIC
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(10);
    // Combine password with secret PEPPER from .env
    const pepperedPassword = this.password + process.env.PASSWORD_PEPPER;

    this.password = await bcrypt.hash(pepperedPassword, salt);
});

// PASSWORD VERIFICATION
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