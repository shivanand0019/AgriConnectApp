const LogisticsProfile = require('../models/LogisticsProfile');
const Vehicle = require('../models/Vehicle');
const Shipment = require('../models/Shipment');

// @desc    Get or update logistics profile
const getLogisticsProfile = async (req, res) => {
  try {
    let profile = await LogisticsProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = await LogisticsProfile.create({
        user: req.user._id,
        companyName: `${req.user.name} Logistics`,
      });
    }
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateLogisticsProfile = async (req, res) => {
  try {
    const profile = await LogisticsProfile.findOneAndUpdate(
      { user: req.user._id },
      req.body,
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get registered vehicles for logistics partner
const getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ owner: req.user._id });
    res.json({ success: true, count: vehicles.length, data: vehicles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register a new vehicle
const addVehicle = async (req, res) => {
  try {
    const { vehicleType, registrationNumber, capacityTons, pricePerKm, currentCity, availableDate, driverName, driverPhone } = req.body;

    const existingVehicle = await Vehicle.findOne({ registrationNumber });
    if (existingVehicle) {
      return res.status(400).json({ success: false, message: 'Vehicle already registered with this registration number' });
    }

    const vehicle = await Vehicle.create({
      owner: req.user._id,
      vehicleType,
      registrationNumber,
      capacityTons: Number(capacityTons),
      pricePerKm: Number(pricePerKm),
      currentCity: currentCity || req.user.location.city,
      availableDate: availableDate || new Date(),
      driverName: driverName || 'Driver Partner',
      driverPhone: driverPhone || req.user.phone,
    });

    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logistics dashboard statistics & metrics
const getLogisticsDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const vehicles = await Vehicle.find({ owner: userId });
    const shipments = await Shipment.find({ logisticsPartner: userId })
      .populate({
        path: 'order',
        populate: [{ path: 'buyer' }, { path: 'seller' }],
      })
      .populate('vehicle');

    const openMarketplaceRequests = await Shipment.find({ status: 'REQUESTED' })
      .populate({
        path: 'order',
        populate: [{ path: 'buyer' }, { path: 'seller' }],
      });

    const activeShipments = shipments.filter((s) => ['ACCEPTED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'IN_TRANSIT'].includes(s.status)).length;
    const completedShipments = shipments.filter((s) => s.status === 'DELIVERED').length;

    const earnings = shipments
      .filter((s) => s.status === 'DELIVERED')
      .reduce((sum, s) => sum + (s.totalCost || 0), 0);

    res.json({
      success: true,
      data: {
        totalVehicles: vehicles.length,
        activeShipments,
        completedShipments,
        earnings,
        openMarketplaceRequests,
        recentShipments: shipments.slice(0, 5),
        vehicles,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLogisticsProfile,
  updateLogisticsProfile,
  getVehicles,
  addVehicle,
  getLogisticsDashboard,
};
