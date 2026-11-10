const mongoose = require('mongoose');
const User = require('../models/User');
const FarmerProfile = require('../models/FarmerProfile');
const FPOProfile = require('../models/FPOProfile');
const BuyerProfile = require('../models/BuyerProfile');
const LogisticsProfile = require('../models/LogisticsProfile');
const Otp = require('../models/Otp');
const generateToken = require('../utils/generateToken');
const { sendOtpEmail, verifySmtpConnection, maskEmail } = require('../utils/emailService');

const isDbConnected = () => mongoose.connection.readyState === 1;

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database service is temporarily unavailable. Please verify your MongoDB Atlas IP Whitelist in Atlas Network Access.',
        code: 'DATABASE_UNAVAILABLE',
      });
    }

    const { name, email, phone, password, role, location, organizationName, businessType, otp } = req.body;

    const normalizedEmail = email ? email.toLowerCase().trim() : '';

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email address' });
    }

    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP is required' });
    }

    const cleanOtp = String(otp).trim();
    const validOtp = await Otp.findOne({ email: normalizedEmail, otp: cleanOtp });
    if (!validOtp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // OTP is valid, clean up OTPs for this email so it cannot be used again
    await Otp.deleteMany({ email: normalizedEmail });

    const user = await User.create({
      name: name ? name.trim() : 'Agri Partner',
      email: normalizedEmail,
      phone: phone ? phone.trim() : '+91 9800000000',
      password: password || 'password123',
      role: role || 'FARMER',
      location: location && location.city ? location : { city: 'Mysuru', district: 'Mysuru', state: 'Karnataka' },
    });

    // Create role-specific profile safely (does not abort account creation if profile defaults fail)
    try {
      if (user.role === 'FARMER') {
        await FarmerProfile.create({ user: user._id });
      } else if (user.role === 'FPO') {
        await FPOProfile.create({
          user: user._id,
          fpoName: organizationName || `${name} Farmers Producer Co.`,
          registrationNumber: `REG-FPO-${Math.floor(100000 + Math.random() * 900000)}`,
          operatingRegions: [user.location?.district || 'Mysuru'],
        });
      } else if (user.role === 'BUYER') {
        await BuyerProfile.create({
          user: user._id,
          companyName: organizationName || `${name} Enterprises`,
          businessType: businessType || 'Supermarket',
        });
      } else if (user.role === 'LOGISTICS') {
        await LogisticsProfile.create({
          user: user._id,
          companyName: organizationName || `${name} Logistics Services`,
          operatingRegions: [user.location?.district || 'Mysuru'],
        });
      }
    } catch (profileErr) {
      console.warn(`[Auth] Note: Initial profile creation for ${user.role} deferred:`, profileErr.message);
    }

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        location: user.location,
        isVerified: user.isVerified,
        token,
      },
    });
  } catch (error) {
    console.error('[Auth] Registration error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'User already exists with this email address' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: error.message || 'Registration failed' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database service is temporarily unavailable. Please verify your MongoDB Atlas IP Whitelist in Atlas Network Access.',
        code: 'DATABASE_UNAVAILABLE',
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        location: user.location,
        isVerified: user.isVerified,
        profileImage: user.profileImage,
        token,
      },
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ success: false, message: error.message || 'Authentication failed' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let profile = null;

    if (user.role === 'FARMER') {
      profile = await FarmerProfile.findOne({ user: user._id });
    } else if (user.role === 'FPO') {
      profile = await FPOProfile.findOne({ user: user._id });
    } else if (user.role === 'BUYER') {
      profile = await BuyerProfile.findOne({ user: user._id });
    } else if (user.role === 'LOGISTICS') {
      profile = await LogisticsProfile.findOne({ user: user._id });
    }

    res.json({
      success: true,
      data: {
        user,
        profile,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users (Admin/utility)
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send OTP to email via Nodemailer SMTP
// @route   POST /api/auth/send-otp
// @access  Public
const sendOtp = async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid email address is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database service is temporarily unavailable. Please verify that your IP is whitelisted in MongoDB Atlas Network Access.',
        code: 'DATABASE_UNAVAILABLE',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email address' });
    }

    // Generate a 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // 1. Attempt actual SMTP email delivery FIRST
    // Only proceed to store OTP and return success if sendMail succeeds and recipient is accepted
    let emailResult;
    try {
      emailResult = await sendOtpEmail({
        to: normalizedEmail,
        otp: generatedOtp,
        userName: name || 'Farmer / Agri Partner',
      });
    } catch (deliveryError) {
      console.error(`[Auth] ⚠️ OTP delivery notice for ${maskEmail(normalizedEmail)}:`, deliveryError.message);

      // In development or when SMTP is not configured, generate valid mock OTP so registration succeeds smoothly
      if (deliveryError.code === 'SMTP_NOT_CONFIGURED' || !process.env.SMTP_PASSWORD) {
        console.log(`[Auth] 💡 [DEV MODE OTP]: Verification code for ${normalizedEmail} is: ${generatedOtp}`);
        await Otp.deleteMany({ email: normalizedEmail });
        await Otp.create({
          email: normalizedEmail,
          otp: generatedOtp,
        });

        return res.status(200).json({
          success: true,
          message: `Dev Mode: OTP generated successfully! Your verification code is ${generatedOtp}`,
          devOtp: generatedOtp,
          data: {
            devMode: true,
            otp: generatedOtp,
          },
        });
      }
      
      let clientMsg = 'Failed to deliver OTP email. Please try again.';
      if (deliveryError.code === 'EAUTH') {
        clientMsg = 'SMTP authentication failed. For Gmail, Google requires a 16-character Google App Password (not your standard account password) in backend config.';
      } else if (deliveryError.message && deliveryError.message.toLowerCase().includes('certificate')) {
        clientMsg = 'SMTP TLS certificate verification failed. Please ensure the local root certificate is configured or check network security settings.';
      } else if (deliveryError.code === 'ETIMEDOUT' || deliveryError.code === 'ESOCKET') {
        clientMsg = 'SMTP server connection timed out or was interrupted. Please check network connection and try again.';
      } else if (deliveryError.code === 'RECIPIENT_NOT_ACCEPTED') {
        clientMsg = 'The email address was rejected by the SMTP mail server. Please verify the email address.';
      }

      return res.status(503).json({
        success: false,
        message: clientMsg,
        code: deliveryError.code || 'EMAIL_DELIVERY_FAILED',
      });
    }

    // 2. Clear any prior unexpired OTPs for this email and store the fresh OTP
    await Otp.deleteMany({ email: normalizedEmail });
    await Otp.create({
      email: normalizedEmail,
      otp: generatedOtp,
    });

    console.log(`[Auth] ✅ OTP email dispatched successfully to ${maskEmail(normalizedEmail)} (MessageID: ${emailResult.messageId})`);

    // 3. Return confirmed success response to the client
    res.status(200).json({
      success: true,
      message: 'Verification OTP has been sent successfully to your email address.',
      data: {
        messageId: emailResult.messageId,
        accepted: emailResult.accepted,
      },
    });
  } catch (error) {
    console.error('[Auth] Unexpected error in sendOtp:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify SMTP server configuration (Development / Diagnostic)
// @route   GET /api/auth/smtp-status
// @access  Public / Diagnostic
const checkSmtpStatus = async (req, res) => {
  try {
    const status = await verifySmtpConnection();
    res.status(status.success ? 200 : 503).json(status);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  getUsers,
  sendOtp,
  checkSmtpStatus,
};
