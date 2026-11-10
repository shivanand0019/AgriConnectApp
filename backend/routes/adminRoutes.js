const express = require('express');
const router = express.Router();
const { getAdminStats, toggleUserVerification } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect, authorize('ADMIN'));

router.get('/stats', getAdminStats);
router.put('/users/:id/verify', toggleUserVerification);

module.exports = router;
