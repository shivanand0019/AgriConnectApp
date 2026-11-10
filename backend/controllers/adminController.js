const User = require('../models/User');
const Produce = require('../models/Produce');
const ProcurementRequest = require('../models/ProcurementRequest');
const PurchaseOrder = require('../models/PurchaseOrder');
const Shipment = require('../models/Shipment');
const Payment = require('../models/Payment');

// @desc    Get overall platform analytics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const farmersCount = await User.countDocuments({ role: 'FARMER' });
    const fposCount = await User.countDocuments({ role: 'FPO' });
    const buyersCount = await User.countDocuments({ role: 'BUYER' });
    const logisticsCount = await User.countDocuments({ role: 'LOGISTICS' });

    const totalListings = await Produce.countDocuments();
    const totalProcurements = await ProcurementRequest.countDocuments();
    const totalOrders = await PurchaseOrder.countDocuments();
    const totalShipments = await Shipment.countDocuments();

    const orders = await PurchaseOrder.find();
    const totalVolumeTraded = orders
      .filter((o) => o.status === 'COMPLETED' || o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const totalQuantityKg = orders
      .filter((o) => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + o.quantity, 0);

    const recentUsers = await User.find().select('-password').sort({ createdAt: -1 }).limit(10);
    const recentOrders = await PurchaseOrder.find()
      .populate('buyer seller')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        totalUsers,
        roleBreakdown: {
          FARMER: farmersCount,
          FPO: fposCount,
          BUYER: buyersCount,
          LOGISTICS: logisticsCount,
        },
        totalListings,
        totalProcurements,
        totalOrders,
        totalShipments,
        totalVolumeTraded,
        totalQuantityKg,
        recentUsers,
        recentOrders,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle user verification status
// @route   PUT /api/admin/users/:id/verify
// @access  Private/Admin
const toggleUserVerification = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isVerified = !user.isVerified;
    await user.save();

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAdminStats,
  toggleUserVerification,
};
