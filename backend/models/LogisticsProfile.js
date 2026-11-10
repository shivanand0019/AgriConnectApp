const mongoose = require('mongoose');

const logisticsProfileSchema = new mongoose.Schema(
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
    fleetSize: {
      type: Number,
      default: 10,
    },
    operatingRegions: [
      {
        type: String,
      },
    ],
    serviceTypes: [
      {
        type: String,
        default: 'Refrigerated & Dry Transport',
      },
    ],
    licenseNumber: {
      type: String,
      default: 'KA-LOG-2024-8849',
    },
    rating: {
      type: Number,
      default: 4.8,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LogisticsProfile', logisticsProfileSchema);
