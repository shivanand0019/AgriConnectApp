const FPOProfile = require('../models/FPOProfile');
const FPOInventory = require('../models/FPOInventory');
const ProcurementRequest = require('../models/ProcurementRequest');
const PurchaseOrder = require('../models/PurchaseOrder');

// @desc    Get or update FPO profile
const getFPOProfile = async (req, res) => {
  try {
    let profile = await FPOProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = await FPOProfile.create({ user: req.user._id, fpoName: `${req.user.name} FPO` });
    }
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateFPOProfile = async (req, res) => {
  try {
    const profile = await FPOProfile.findOneAndUpdate(
      { user: req.user._id },
      req.body,
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get FPO aggregated inventory
const getFPOInventory = async (req, res) => {
  try {
    const inventory = await FPOInventory.find({ fpo: req.user._id })
      .populate('sourceFarmers.farmer', 'name email phone location');
    res.json({ success: true, count: inventory.length, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add or manually adjust FPO inventory entry
const addFPOInventory = async (req, res) => {
  try {
    const { cropName, variety, totalQuantity, qualityGrade, unit } = req.body;

    let item = await FPOInventory.findOne({ fpo: req.user._id, cropName });

    if (item) {
      item.totalQuantity += Number(totalQuantity);
      item.availableQuantity += Number(totalQuantity);
      if (qualityGrade) item.qualityGrade = qualityGrade;
      await item.save();
    } else {
      item = await FPOInventory.create({
        fpo: req.user._id,
        cropName,
        variety: variety || 'Grade A Standard',
        totalQuantity: Number(totalQuantity),
        availableQuantity: Number(totalQuantity),
        reservedQuantity: 0,
        qualityGrade: qualityGrade || 'Grade A',
        unit: unit || 'kg',
      });
    }

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    FPO Dashboard statistics & metrics
const getFPODashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const procurements = await ProcurementRequest.find({ requester: userId });
    const inventory = await FPOInventory.find({ fpo: userId });

    const totalAggregatedQty = inventory.reduce((sum, item) => sum + item.totalQuantity, 0);

    // Unique farmers connected
    const farmerSet = new Set();
    inventory.forEach((item) => {
      item.sourceFarmers.forEach((sf) => {
        if (sf.farmer) farmerSet.add(sf.farmer.toString());
      });
    });

    const orders = await PurchaseOrder.find({ $or: [{ buyer: userId }, { seller: userId }] });

    const activeOrders = orders.filter((o) => ['PENDING', 'ACCEPTED', 'IN_FULFILLMENT'].includes(o.status)).length;
    const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
    const completedOrders = orders.filter((o) => o.status === 'COMPLETED').length;

    const revenue = orders
      .filter((o) => o.seller.toString() === userId.toString() && (o.status === 'COMPLETED' || o.paymentStatus === 'PAID'))
      .reduce((sum, o) => sum + o.totalAmount, 0);

    res.json({
      success: true,
      data: {
        procurementCount: procurements.length,
        farmersConnected: farmerSet.size,
        totalAggregatedQty,
        activeOrders,
        pendingOrders,
        completedOrders,
        revenue,
        inventory,
        procurements,
        recentOrders: orders.slice(0, 5),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getFPOProfile,
  updateFPOProfile,
  getFPOInventory,
  addFPOInventory,
  getFPODashboard,
};
