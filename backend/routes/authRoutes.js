const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, getUsers, sendOtp, checkSmtpStatus } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/send-otp', sendOtp);
router.get('/smtp-status', checkSmtpStatus);
router.get('/me', protect, getMe);
router.get('/users', protect, authorize('ADMIN'), getUsers);

module.exports = router;
