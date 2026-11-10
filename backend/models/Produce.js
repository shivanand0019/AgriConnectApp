const mongoose = require('mongoose');

const produceSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cropName: {
      type: String,
      required: [true, 'Crop name is required'],
      trim: true,
    },
    variety: {
      type: String,
      default: 'Standard Native',
    },
    quantity: {
      type: Number,
      required: [true, 'Total quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    availableQuantity: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      enum: ['kg', 'ton', 'quintal'],
      default: 'kg',
    },
    expectedPrice: {
      type: Number,
      required: [true, 'Expected price is required'],
    },
    minOrderQuantity: {
      type: Number,
      default: 100,
    },
    harvestDate: {
      type: Date,
      required: true,
    },
    qualityGrade: {
      type: String,
      enum: ['Grade A', 'Grade B', 'Grade C', 'Organic Premium'],
      default: 'Grade A',
    },
    location: {
      city: { type: String, default: 'Mysuru' },
      district: { type: String, default: 'Mysuru' },
      state: { type: String, default: 'Karnataka' },
    },
    images: [
      {
        type: String,
      },
    ],
    description: {
      type: String,
      default: 'Fresh high quality produce harvested directly from farm.',
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'PARTIALLY_SOLD', 'SOLD_OUT'],
      default: 'AVAILABLE',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Produce', produceSchema);
