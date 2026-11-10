const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vehicleType: {
      type: String,
      enum: ['Container Truck 10-Ton', 'Eicher 5-Ton', 'Pickup Van 2-Ton', 'Refrigerated Truck 8-Ton'],
      required: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
    },
    capacityTons: {
      type: Number,
      required: true,
    },
    pricePerKm: {
      type: Number,
      required: true,
    },
    currentCity: {
      type: String,
      default: 'Mysuru',
    },
    availableDate: {
      type: Date,
      default: Date.now,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    driverName: {
      type: String,
      default: 'Ramesh Kumar',
    },
    driverPhone: {
      type: String,
      default: '+91 9876543210',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
