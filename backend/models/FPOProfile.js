const mongoose = require('mongoose');

const fpoProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    fpoName: {
      type: String,
      required: true,
    },
    registrationNumber: {
      type: String,
      required: true,
    },
    operatingRegions: [
      {
        type: String,
      },
    ],
    procurementCrops: [
      {
        type: String,
      },
    ],
    memberCount: {
      type: Number,
      default: 250,
    },
    warehouseCapacityTons: {
      type: Number,
      default: 500,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FPOProfile', fpoProfileSchema);
