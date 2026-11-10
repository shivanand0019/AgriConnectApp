const express = require('express');
const router = express.Router();
const {
  getFPOProfile,
  updateFPOProfile,
  getFPOInventory,
  addFPOInventory,
  getFPODashboard,
} = require('../controllers/fpoController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/profile')
  .get(getFPOProfile)
  .post(updateFPOProfile)
  .put(updateFPOProfile);

router.route('/inventory')
  .get(getFPOInventory)
  .post(authorize('FPO', 'ADMIN'), addFPOInventory);

router.get('/dashboard', getFPODashboard);

module.exports = router;
