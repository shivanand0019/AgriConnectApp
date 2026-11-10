const FarmerProfile = require('../models/FarmerProfile');
const Produce = require('../models/Produce');
const PurchaseOrder = require('../models/PurchaseOrder');
const ProcurementRequest = require('../models/ProcurementRequest');

// @desc    Get or update farmer profile
// @route   GET /api/farmers/profile, PUT /api/farmers/profile
const getFarmerProfile = async (req, res) => {
  try {
    let profile = await FarmerProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = await FarmerProfile.create({ user: req.user._id });
    }
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateFarmerProfile = async (req, res) => {
  try {
    const profile = await FarmerProfile.findOneAndUpdate(
      { user: req.user._id },
      req.body,
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Farmer dashboard analytics & metrics
// @route   GET /api/farmers/dashboard
const getFarmerDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const listings = await Produce.find({ farmer: userId });
    const totalListings = listings.length;

    const orders = await PurchaseOrder.find({ seller: userId });
    const activeOrders = orders.filter((o) => ['PENDING', 'ACCEPTED', 'IN_FULFILLMENT'].includes(o.status)).length;
    const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
    const completedOrders = orders.filter((o) => o.status === 'COMPLETED').length;

    const earnings = orders
      .filter((o) => o.status === 'COMPLETED' || o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    // Nearby FPO requirements
    const fpoDemands = await ProcurementRequest.find({ requesterRole: 'FPO', status: 'OPEN' })
      .populate('requester', 'name email phone location profileImage')
      .limit(5);

    // Buyer demands
    const buyerDemands = await ProcurementRequest.find({ requesterRole: 'BUYER', status: 'OPEN' })
      .populate('requester', 'name email phone location profileImage')
      .limit(5);

    res.json({
      success: true,
      data: {
        totalListings,
        activeOrders,
        pendingOrders,
        completedOrders,
        earnings,
        recentListings: listings.slice(0, 5),
        recentOrders: orders.slice(0, 5),
        fpoDemands,
        buyerDemands,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getFarmerProfile,
  updateFarmerProfile,
  getFarmerDashboard,
};
