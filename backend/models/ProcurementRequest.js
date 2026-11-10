const mongoose = require('mongoose');

const procurementRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requesterRole: {
      type: String,
      enum: ['FPO', 'BUYER'],
      required: true,
    },
    cropName: {
      type: String,
      required: true,
    },
    requiredQuantity: {
      type: Number,
      required: true,
    },
    fulfilledQuantity: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      enum: ['kg', 'ton', 'quintal'],
      default: 'kg',
    },
    targetPrice: {
      type: Number,
      required: true,
    },
    qualityGrade: {
      type: String,
      enum: ['Grade A', 'Grade B', 'Grade C', 'Organic Premium'],
      default: 'Grade A',
    },
    location: {
      city: { type: String, required: true },
      district: { type: String, required: true },
      state: { type: String, default: 'Karnataka' },
    },
    deadline: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ['OPEN', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED'],
      default: 'OPEN',
    },
    responses: [
      {
        responder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        offeredQuantity: { type: Number, required: true },
        pricePerUnit: { type: Number, required: true },
        note: String,
        status: {
          type: String,
          enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
          default: 'PENDING',
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProcurementRequest', procurementRequestSchema);
