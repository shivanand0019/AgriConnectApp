const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema(
  {
    shipmentNumber: {
      type: String,
      required: true,
      unique: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      required: true,
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    logisticsPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    pickupLocation: {
      city: { type: String, required: true },
      district: String,
      address: String,
      lat: Number,
      lng: Number,
    },
    deliveryLocation: {
      city: { type: String, required: true },
      district: String,
      address: String,
      lat: Number,
      lng: Number,
    },
    cargoDetails: {
      cropName: String,
      quantityKg: Number,
    },
    distanceKm: {
      type: Number,
      default: 150,
    },
    totalCost: {
      type: Number,
      default: 4500,
    },
    status: {
      type: String,
      enum: [
        'REQUESTED',
        'ACCEPTED',
        'PICKUP_SCHEDULED',
        'PICKED_UP',
        'IN_TRANSIT',
        'DELIVERED',
        'CANCELLED',
      ],
      default: 'REQUESTED',
    },
    timeline: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        location: String,
        note: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shipment', shipmentSchema);
