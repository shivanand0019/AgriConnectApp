const express = require('express');
const router = express.Router();
const {
  getFarmerProfile,
  updateFarmerProfile,
  getFarmerDashboard,
} = require('../controllers/farmerController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/profile')
  .get(getFarmerProfile)
  .post(updateFarmerProfile)
  .put(updateFarmerProfile);

router.get('/dashboard', getFarmerDashboard);

module.exports = router;
