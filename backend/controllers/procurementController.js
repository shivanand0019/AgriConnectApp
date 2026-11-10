const ProcurementRequest = require('../models/ProcurementRequest');
const Notification = require('../models/Notification');
const PurchaseOrder = require('../models/PurchaseOrder');

// @desc    Create procurement request or buyer demand
// @route   POST /api/procurement
// @access  Private/FPO/Buyer/Admin
const createProcurement = async (req, res) => {
  try {
    const {
      cropName,
      requiredQuantity,
      unit,
      targetPrice,
      qualityGrade,
      location,
      deadline,
      description,
    } = req.body;

    const procurement = await ProcurementRequest.create({
      requester: req.user._id,
      requesterRole: req.user.role,
      cropName,
      requiredQuantity: Number(requiredQuantity),
      unit: unit || 'kg',
      targetPrice: Number(targetPrice),
      qualityGrade: qualityGrade || 'Grade A',
      location: location || req.user.location,
      deadline: deadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      description,
    });

    const populatedProcurement = await ProcurementRequest.findById(procurement._id).populate('requester', 'name email phone role location profileImage');

    res.status(201).json({ success: true, data: populatedProcurement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all procurement requests & demands
// @route   GET /api/procurement
// @access  Public
const getProcurements = async (req, res) => {
  try {
    const { crop, role, status, location } = req.query;

    let query = {};

    if (crop) query.cropName = { $regex: crop, $options: 'i' };
    if (role) query.requesterRole = role;
    if (status) query.status = status;
    if (location) {
      query.$or = [
        { 'location.city': { $regex: location, $options: 'i' } },
        { 'location.district': { $regex: location, $options: 'i' } },
      ];
    }

    const procurements = await ProcurementRequest.find(query)
      .populate('requester', 'name email phone role location profileImage')
      .populate('responses.responder', 'name email phone role profileImage')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: procurements.length, data: procurements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single procurement request
// @route   GET /api/procurement/:id
// @access  Public
const getProcurementById = async (req, res) => {
  try {
    const procurement = await ProcurementRequest.findById(req.params.id)
      .populate('requester', 'name email phone role location profileImage')
      .populate('responses.responder', 'name email phone role profileImage');

    if (!procurement) {
      return res.status(404).json({ success: false, message: 'Procurement request not found' });
    }

    res.json({ success: true, data: procurement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Respond to procurement request (Farmer to FPO, or FPO to Buyer)
// @route   POST /api/procurement/:id/respond
// @access  Private
const respondToProcurement = async (req, res) => {
  try {
    const { offeredQuantity, pricePerUnit, note } = req.body;
    const procurement = await ProcurementRequest.findById(req.params.id);

    if (!procurement) {
      return res.status(404).json({ success: false, message: 'Procurement request not found' });
    }

    // Check if user already responded
    const existingIndex = procurement.responses.findIndex(
      (r) => r.responder.toString() === req.user._id.toString()
    );

    const newResponse = {
      responder: req.user._id,
      offeredQuantity: Number(offeredQuantity),
      pricePerUnit: Number(pricePerUnit),
      note,
      status: 'PENDING',
    };

    if (existingIndex >= 0) {
      procurement.responses[existingIndex] = newResponse;
    } else {
      procurement.responses.push(newResponse);
    }

    await procurement.save();

    // Create notification for requester
    await Notification.create({
      recipient: procurement.requester,
      sender: req.user._id,
      title: 'New Response to Procurement Requirement',
      message: `${req.user.name} responded with an offer of ${offeredQuantity} ${procurement.unit} of ${procurement.cropName} at ₹${pricePerUnit}/${procurement.unit}`,
      type: procurement.requesterRole === 'FPO' ? 'PURCHASE_REQUEST' : 'FPO_OFFER',
      relatedId: procurement._id,
    });

    const updatedProcurement = await ProcurementRequest.findById(req.params.id)
      .populate('requester', 'name email phone role location profileImage')
      .populate('responses.responder', 'name email phone role profileImage');

    res.json({ success: true, data: updatedProcurement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Accept/Reject response to procurement
// @route   PUT /api/procurement/:id/accept-response
// @access  Private/Requester
const handleResponseStatus = async (req, res) => {
  try {
    const { responseId, status } = req.body; // status = ACCEPTED or REJECTED
    const procurement = await ProcurementRequest.findById(req.params.id);

    if (!procurement) {
      return res.status(404).json({ success: false, message: 'Procurement request not found' });
    }

    if (procurement.requester.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to manage this request' });
    }

    const response = procurement.responses.id(responseId);
    if (!response) {
      return res.status(404).json({ success: false, message: 'Response item not found' });
    }

    response.status = status;

    if (status === 'ACCEPTED') {
      procurement.fulfilledQuantity += response.offeredQuantity;
      if (procurement.fulfilledQuantity >= procurement.requiredQuantity) {
        procurement.status = 'FULFILLED';
      } else {
        procurement.status = 'PARTIALLY_FULFILLED';
      }
    }

    await procurement.save();

    // Create notification to responder
    await Notification.create({
      recipient: response.responder,
      sender: req.user._id,
      title: `Procurement Response ${status}`,
      message: `Your offer for ${procurement.cropName} was ${status.toLowerCase()} by ${req.user.name}.`,
      type: status === 'ACCEPTED' ? 'REQUEST_ACCEPTED' : 'REQUEST_REJECTED',
      relatedId: procurement._id,
    });

    res.json({ success: true, data: procurement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createProcurement,
  getProcurements,
  getProcurementById,
  respondToProcurement,
  handleResponseStatus,
};
