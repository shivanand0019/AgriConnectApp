const mongoose = require('mongoose');

const farmerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    farmSizeAcres: {
      type: Number,
      default: 5,
    },
    primaryCrops: [
      {
        type: String,
      },
    ],
    experienceYears: {
      type: Number,
      default: 5,
    },
    soilType: {
      type: String,
      default: 'Red Loam',
    },
    irrigationSource: {
      type: String,
      default: 'Borewell & Rainfed',
    },
    fpoMembership: {
      type: String,
      default: 'Mysuru Organic Farmers Producer Co.',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FarmerProfile', farmerProfileSchema);
