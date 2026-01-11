const User = require('../models/User');
const Company = require('../models/Company');
const { StatusCodes } = require('http-status-codes');
const mongoose = require('mongoose');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const sendNepaliSMS = require('../utils/sendSMS');

/**
 * Helper to normalize email addresses
 */
const normalizeEmail = (email) => {
    if (!email || typeof email !== 'string') return null;
    const [local, domain] = email.toLowerCase().trim().split('@');
    if (!local || !domain) return null;
    return `${local.split('+')[0]}@${domain}`;
};

/**
 * Password Policy: 8+ chars, 1 Upper, 1 Number, 1 Special Char
 */
const validatePasswordPolicy = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
};

// 1. REGISTER ADMIN & COMPANY (Agency Registration)
const register = async (req, res) => {
    const { agencyName, fullAddress, fullName, email, contactNumber, password } = req.body;

    // VALIDATION: Email is optional, everything else REQUIRED
    if (!agencyName || !fullName || !password || !contactNumber || !fullAddress) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Full Name, Password, Contact, Address, and Agency Name are required.' });
    }

    if (!validatePasswordPolicy(password)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            msg: 'Password too weak. Use 8+ chars, 1 uppercase, 1 number, and 1 special character.'
        });
    }

    const cleanEmail = email ? normalizeEmail(email) : null;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Check if phone already exists (always) or email exists (if provided)
        const existingUser = await User.findOne({
            $or: [
                ...(cleanEmail ? [{ email: cleanEmail }] : []),
                { contactNumber: contactNumber }
            ]
        }).session(session);

        if (existingUser) {
            await session.abortTransaction();
            const field = existingUser.contactNumber === contactNumber ? 'Phone number' : 'Email';
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: `${field} already exists.` });
        }

        const adminId = new mongoose.Types.ObjectId();
        const isFirstAccount = (await User.countDocuments({}).session(session)) === 0;
        const userRole = isFirstAccount ? 'super_admin' : 'admin';

        // A. Create Company
        const company = await Company.create([{
            name: agencyName,
            adminId: adminId,
            logo: null // Handled via separate upload if needed
        }], { session });

        // B. Create Admin User
        const user = await User.create([{
            _id: adminId,
            fullName,
            email: cleanEmail || undefined,
            password,
            role: userRole,
            contactNumber,
            address: fullAddress,
            companyId: company[0]._id
        }], { session });

        await session.commitTransaction();
        const token = user[0].createJWT();

        res.status(StatusCodes.CREATED).json({
            success: true,
            user: {
                fullName: user[0].fullName,
                role: user[0].role,
                agencyName: company[0].name
            },
            token
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: error.message });
    } finally {
        session.endSession();
    }
};

// 2. LOGIN (Supports Email OR Phone Number)
const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Please provide both ID and password' });
        }

        const cleanEmail = identifier.includes('@') ? normalizeEmail(identifier) : "NOT_AN_EMAIL";

        const user = await User.findOne({
            $or: [
                { email: cleanEmail },
                { contactNumber: identifier }
            ]
        }).select('+password');

        // Split errors for clarity
        if (!user) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Account not found. Please check your credentials.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Incorrect password. Try again.' });
        }

        const token = user.createJWT();
        res.status(StatusCodes.OK).json({
            success: true,
            user: {
                userId: user._id,
                fullName: user.fullName,
                role: user.role,
                companyId: user.companyId
            },
            token
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Login failed. Server error.' });
    }
};

// 3. FORGOT PASSWORD
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Please provide email' });

    const user = await User.findOne({ email: normalizeEmail(email) });
    if (!user) return res.status(StatusCodes.OK).json({ msg: 'If an account exists, an OTP has been sent.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpRef = crypto.randomBytes(2).toString('hex').toUpperCase();

    user.passwordResetToken = crypto.createHash('sha256').update(otp).digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    user.otpReference = otpRef;
    await user.save();

    try {
        await Promise.all([
            sendEmail({
                to: user.email,
                subject: `[${otpRef}] Password Reset OTP`,
                html: `<h3>OTP: ${otp}</h3><p>Reference: ${otpRef}</p>`
            }),
            sendNepaliSMS(user.contactNumber, `OTP: ${otp} (Ref: ${otpRef})`)
        ]);
        res.status(StatusCodes.OK).json({ success: true, otpReference: otpRef });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Notification failed' });
    }
};

// 4. RESET PASSWORD
const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!validatePasswordPolicy(newPassword)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'New password must meet security requirements.' });
    }

    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.findOne({
        email: normalizeEmail(email),
        passwordResetToken: hashedOTP,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Invalid or expired OTP' });

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.otpReference = undefined;

    await user.save();
    res.status(StatusCodes.OK).json({ success: true, msg: 'Password updated successfully.' });
};

// 5. REGISTER EMPLOYEE (Email Optional, Everything Else Required)
const registerEmployee = async (req, res) => {
    const { fullName, email, password, contactNumber, address } = req.body;
    const adminCompanyId = req.user.companyId;

    // VALIDATION: All required except email
    if (!fullName || !password || !contactNumber || !address) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Full Name, Password, Contact, and Address are required.' });
    }

    if (!validatePasswordPolicy(password)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            msg: 'Password must be 8+ chars with 1 Uppercase, 1 Number, and 1 Special character.'
        });
    }

    const cleanEmail = email ? normalizeEmail(email) : null;

    try {
        // Check for duplicates
        const existingUser = await User.findOne({
            $or: [
                ...(cleanEmail ? [{ email: cleanEmail }] : []),
                { contactNumber: contactNumber }
            ]
        });

        if (existingUser) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Email or Contact Number already in use.' });
        }

        const employee = await User.create({
            fullName,
            email: cleanEmail || undefined,
            password,
            contactNumber,
            address,
            role: 'employee',
            companyId: adminCompanyId
        });

        const loginUrl = process.env.CLIENT_URL || "http://localhost:3000";

        // Notify via Email (Only if provided)
        if (cleanEmail) {
            await sendEmail({
                to: cleanEmail,
                subject: 'Your Account Credentials - Manpower MS',
                html: `
                    <h3>Welcome to the team, ${fullName}!</h3>
                    <p>Your account is ready.</p>
                    <ul>
                        <li><b>Email:</b> ${cleanEmail}</li>
                        <li><b>Password:</b> ${password}</li>
                    </ul>
                    <p>Login here: <a href="${loginUrl}">${loginUrl}</a></p>`
            });
        }

        // Notify via SMS (Always required)
        const smsBody = `Hi ${fullName}, your account is ready. Phone: ${contactNumber}, Pass: ${password}. Login: ${loginUrl}`;
        await sendNepaliSMS(contactNumber, smsBody);

        res.status(StatusCodes.CREATED).json({ success: true, msg: 'Employee registered and notified via SMS.' });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: error.message });
    }
};

// 6. GET ALL EMPLOYEES
const getAllEmployees = async (req, res) => {
    const employees = await User.find({
        companyId: req.user.companyId,
        role: 'employee'
    }).select('-password').sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({ success: true, data: employees });
};

module.exports = {
    register,
    login,
    registerEmployee,
    getAllEmployees,
    forgotPassword,
    resetPassword
};