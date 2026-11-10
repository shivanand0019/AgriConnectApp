const express = require('express');
const router = express.Router();
const {
  createShipment,
  getShipments,
  getShipmentById,
  updateShipmentStatus,
} = require('../controllers/shipmentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getShipments)
  .post(createShipment);

router.route('/:id')
  .get(getShipmentById);

router.put('/:id/status', updateShipmentStatus);

module.exports = router;
