const express = require('express');
const router = express.Router();
const {
  createProduce,
  getProduces,
  getProduceById,
  updateProduce,
  deleteProduce,
} = require('../controllers/produceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.route('/')
  .get(getProduces)
  .post(protect, authorize('FARMER', 'ADMIN'), createProduce);

router.route('/:id')
  .get(getProduceById)
  .put(protect, authorize('FARMER', 'ADMIN'), updateProduce)
  .delete(protect, authorize('FARMER', 'ADMIN'), deleteProduce);

module.exports = router;
