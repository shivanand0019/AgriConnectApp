const express = require('express');
const router = express.Router();
const {
  getBuyerProfile,
  updateBuyerProfile,
  createBuyerDemand,
  getBuyerDemands,
  getBuyerDashboard,
} = require('../controllers/buyerController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/profile')
  .get(getBuyerProfile)
  .post(updateBuyerProfile)
  .put(updateBuyerProfile);

router.route('/demand')
  .get(getBuyerDemands)
  .post(authorize('BUYER', 'ADMIN'), createBuyerDemand);

router.get('/dashboard', getBuyerDashboard);

module.exports = router;
