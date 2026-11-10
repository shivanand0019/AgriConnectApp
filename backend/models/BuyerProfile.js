const mongoose = require('mongoose');

const buyerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    businessType: {
      type: String,
      enum: ['Supermarket', 'Exporter', 'Food Processing', 'Restaurant Chain', 'Wholesaler'],
      default: 'Supermarket',
    },
    gstNumber: {
      type: String,
      default: '29ABCDE1234F1Z5',
    },
    annualRequirementTons: {
      type: Number,
      default: 2000,
    },
    preferredCrops: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('BuyerProfile', buyerProfileSchema);
