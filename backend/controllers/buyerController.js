const BuyerProfile = require('../models/BuyerProfile');
const ProcurementRequest = require('../models/ProcurementRequest');
const PurchaseOrder = require('../models/PurchaseOrder');

// @desc    Get or update buyer profile
const getBuyerProfile = async (req, res) => {
  try {
    let profile = await BuyerProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = await BuyerProfile.create({
        user: req.user._id,
        companyName: `${req.user.name} Foods`,
      });
    }
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateBuyerProfile = async (req, res) => {
  try {
    const profile = await BuyerProfile.findOneAndUpdate(
      { user: req.user._id },
      req.body,
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create buyer demand requirement
const createBuyerDemand = async (req, res) => {
  try {
    const { cropName, requiredQuantity, unit, targetPrice, qualityGrade, location, deadline, description } = req.body;

    const demand = await ProcurementRequest.create({
      requester: req.user._id,
      requesterRole: 'BUYER',
      cropName,
      requiredQuantity: Number(requiredQuantity),
      unit: unit || 'kg',
      targetPrice: Number(targetPrice),
      qualityGrade: qualityGrade || 'Grade A',
      location: location || req.user.location,
      deadline: deadline || new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      description,
    });

    const populatedDemand = await ProcurementRequest.findById(demand._id)
      .populate('requester', 'name email phone location profileImage');

    res.status(201).json({ success: true, data: populatedDemand });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get buyer demands created by current user
const getBuyerDemands = async (req, res) => {
  try {
    const demands = await ProcurementRequest.find({ requester: req.user._id, requesterRole: 'BUYER' })
      .populate('responses.responder', 'name email phone role profileImage')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: demands.length, data: demands });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Buyer Dashboard statistics & metrics
const getBuyerDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const demands = await ProcurementRequest.find({ requester: userId });
    const orders = await PurchaseOrder.find({ buyer: userId });

    const totalSpent = orders
      .filter((o) => o.status === 'COMPLETED' || o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const activeOrders = orders.filter((o) => ['PENDING', 'ACCEPTED', 'IN_FULFILLMENT'].includes(o.status)).length;
    const completedOrders = orders.filter((o) => o.status === 'COMPLETED').length;

    res.json({
      success: true,
      data: {
        activeDemands: demands.filter((d) => d.status === 'OPEN' || d.status === 'PARTIALLY_FULFILLED').length,
        totalDemands: demands.length,
        activeOrders,
        completedOrders,
        totalSpent,
        recentDemands: demands.slice(0, 5),
        recentOrders: orders.slice(0, 5),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getBuyerProfile,
  updateBuyerProfile,
  createBuyerDemand,
  getBuyerDemands,
  getBuyerDashboard,
};
