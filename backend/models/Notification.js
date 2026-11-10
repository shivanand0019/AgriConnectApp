const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'PURCHASE_REQUEST',
        'REQUEST_ACCEPTED',
        'REQUEST_REJECTED',
        'BUYER_DEMAND',
        'FPO_OFFER',
        'BUYER_ACCEPTANCE',
        'SHIPMENT_ASSIGNED',
        'PICKUP_SCHEDULED',
        'SHIPMENT_DELIVERED',
        'SYSTEM',
      ],
      default: 'SYSTEM',
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
