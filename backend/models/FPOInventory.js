const mongoose = require('mongoose');

const fpoInventorySchema = new mongoose.Schema(
  {
    fpo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cropName: {
      type: String,
      required: true,
    },
    variety: {
      type: String,
      default: 'Standard Grade A',
    },
    totalQuantity: {
      type: Number,
      required: true,
      default: 0,
    },
    reservedQuantity: {
      type: Number,
      default: 0,
    },
    availableQuantity: {
      type: Number,
      required: true,
      default: 0,
    },
    qualityGrade: {
      type: String,
      default: 'Grade A',
    },
    unit: {
      type: String,
      default: 'kg',
    },
    sourceFarmers: [
      {
        farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        farmerName: String,
        order: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
        quantity: Number,
        pricePerUnit: Number,
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('FPOInventory', fpoInventorySchema);
