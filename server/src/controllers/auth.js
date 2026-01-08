const User = require('../models/User');
const Company = require('../models/Company');
const { StatusCodes } = require('http-status-codes');
const mongoose = require('mongoose');

const register = async (req, res) => {
    const { fullName, email, password, role, companyName, contactNumber, address } = req.body;

    // 1. Precise Validation
    if (!fullName || !email || !password) {
        return res.status(StatusCodes.BAD_REQUEST).json({ 
            msg: 'Full Name, Email, and Password are required.' 
        });
    }

    // 2. Role Logic
    const isFirstAccount = (await User.countDocuments({})) === 0;
    let userRole = isFirstAccount ? 'super_admin' : (role || 'admin');

    // 3. Check existing
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Email already exists.' });
    }

    // 4. Create User and Company
    try {
        const userId = new mongoose.Types.ObjectId();
        let companyId = null;

        if (userRole === 'admin') {
            if (!companyName) return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Company Name required.' });
            const company = await Company.create({ name: companyName, adminId: userId });
            companyId = company._id;
        }

        const user = await User.create({
            _id: userId,
            fullName,
            email,
            password, // Mongoose middleware should hash this
            role: userRole,
            contactNumber: contactNumber || 'N/A',
            address: address || 'N/A',
            companyId
        });

        res.status(StatusCodes.CREATED).json({
            success: true,
            msg: "Registration successful",
            user: { fullName: user.fullName, email: user.email }
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: error.message });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Missing credentials' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Invalid Credentials' });
    }

    const token = user.createJWT();
    res.status(StatusCodes.OK).json({
        success: true,
        user: { userId: user._id, fullName: user.fullName, role: user.role, companyId: user.companyId },
        token
    });
};

// Simplified placeholders for other functions to ensure the file exports correctly
const registerEmployee = async (req, res) => { /* ... same as your original ... */ };
const getAllEmployees = async (req, res) => { /* ... same as your original ... */ };

module.exports = { register, login, registerEmployee, getAllEmployees };