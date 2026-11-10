const Shipment = require('../models/Shipment');
const PurchaseOrder = require('../models/PurchaseOrder');
const Notification = require('../models/Notification');
const Vehicle = require('../models/Vehicle');
const Payment = require('../models/Payment');

// @desc    Create shipment request for an order
// @route   POST /api/shipments
// @access  Private/FPO/Buyer/Admin
const createShipment = async (req, res) => {
  try {
    const { orderId, pickupLocation, deliveryLocation, vehicleId, distanceKm, totalCost } = req.body;

    const order = await PurchaseOrder.findById(orderId).populate('buyer seller');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const shipmentNumber = `SHP-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const shipment = await Shipment.create({
      shipmentNumber,
      order: order._id,
      requester: req.user._id,
      vehicle: vehicleId || undefined,
      pickupLocation: pickupLocation || {
        city: order.seller.location.city || 'Mysuru',
        district: order.seller.location.district || 'Mysuru',
        address: order.seller.location.address || 'Mysuru APMC Yard',
        lat: 12.2958,
        lng: 76.6394,
      },
      deliveryLocation: deliveryLocation || {
        city: order.deliveryAddress?.city || 'Bengaluru',
        district: order.deliveryAddress?.district || 'Bengaluru Urban',
        address: order.deliveryAddress?.fullAddress || 'Yeshwanthpur Wholesale Market',
        lat: 12.9716,
        lng: 77.5946,
      },
      cargoDetails: {
        cropName: order.cropName,
        quantityKg: order.quantity,
      },
      distanceKm: Number(distanceKm) || 150,
      totalCost: Number(totalCost) || 4500,
      status: 'REQUESTED',
      timeline: [
        {
          status: 'REQUESTED',
          timestamp: new Date(),
          location: pickupLocation?.city || 'Origin APMC Yard',
          note: 'Shipment request created by FPO / Buyer',
        },
      ],
    });

    const populatedShipment = await Shipment.findById(shipment._id)
      .populate({
        path: 'order',
        populate: [{ path: 'buyer' }, { path: 'seller' }],
      })
      .populate('logisticsPartner', 'name email phone profileImage')
      .populate('vehicle');

    res.status(201).json({ success: true, data: populatedShipment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all shipments (Filtered by user role or status)
// @route   GET /api/shipments
// @access  Private
const getShipments = async (req, res) => {
  try {
    const { status, availableOnly } = req.query;

    let query = {};

    if (availableOnly === 'true' || status === 'REQUESTED') {
      query.status = 'REQUESTED';
    } else if (req.user.role === 'LOGISTICS') {
      query.$or = [{ logisticsPartner: req.user._id }, { status: 'REQUESTED' }];
    } else if (req.user.role !== 'ADMIN') {
      query.requester = req.user._id;
    }

    if (status && status !== 'REQUESTED') {
      query.status = status;
    }

    const shipments = await Shipment.find(query)
      .populate({
        path: 'order',
        populate: [{ path: 'buyer' }, { path: 'seller' }],
      })
      .populate('logisticsPartner', 'name email phone profileImage')
      .populate('vehicle')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: shipments.length, data: shipments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single shipment details
// @route   GET /api/shipments/:id
// @access  Private
const getShipmentById = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate({
        path: 'order',
        populate: [{ path: 'buyer' }, { path: 'seller' }],
      })
      .populate('logisticsPartner', 'name email phone profileImage')
      .populate('vehicle');

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    res.json({ success: true, data: shipment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update shipment status & logistics partner assignment
// @route   PUT /api/shipments/:id/status
// @access  Private/Logistics/Admin
const updateShipmentStatus = async (req, res) => {
  try {
    const { status, vehicleId, note, currentCity } = req.body;
    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    // Assign logistics partner if accepting
    if (status === 'ACCEPTED' && !shipment.logisticsPartner) {
      shipment.logisticsPartner = req.user._id;
      if (vehicleId) {
        shipment.vehicle = vehicleId;
      } else {
        const vehicle = await Vehicle.findOne({ owner: req.user._id });
        if (vehicle) shipment.vehicle = vehicle._id;
      }
    }

    if (status) {
      shipment.status = status;
      shipment.timeline.push({
        status,
        timestamp: new Date(),
        location: currentCity || shipment.pickupLocation.city,
        note: note || `Shipment status updated to ${status}`,
      });
    }

    // If shipment DELIVERED -> complete the underlying Purchase Order & release payment!
    if (status === 'DELIVERED') {
      const order = await PurchaseOrder.findById(shipment.order);
      if (order) {
        order.status = 'COMPLETED';
        order.paymentStatus = 'PAID';
        await order.save();

        await Payment.findOneAndUpdate({ order: order._id }, { status: 'PAID' });

        // Notify Buyer and Seller
        await Notification.create({
          recipient: order.buyer,
          sender: req.user._id,
          title: 'Shipment Delivered!',
          message: `Your shipment #${shipment.shipmentNumber} for ${order.cropName} has been successfully delivered.`,
          type: 'SHIPMENT_DELIVERED',
          relatedId: shipment._id,
        });

        await Notification.create({
          recipient: order.seller,
          sender: req.user._id,
          title: 'Shipment Delivered & Payment Released',
          message: `Order #${order.orderNumber} delivered to buyer. Escrow payment of ₹${order.totalAmount.toLocaleString('en-IN')} has been released.`,
          type: 'SHIPMENT_DELIVERED',
          relatedId: shipment._id,
        });
      }
    } else {
      // General Notification to requester
      await Notification.create({
        recipient: shipment.requester,
        sender: req.user._id,
        title: `Shipment Status: ${status}`,
        message: `Shipment #${shipment.shipmentNumber} status changed to ${status}.`,
        type: status === 'ACCEPTED' ? 'SHIPMENT_ASSIGNED' : 'SYSTEM',
        relatedId: shipment._id,
      });
    }

    await shipment.save();

    const updatedShipment = await Shipment.findById(shipment._id)
      .populate({
        path: 'order',
        populate: [{ path: 'buyer' }, { path: 'seller' }],
      })
      .populate('logisticsPartner', 'name email phone profileImage')
      .populate('vehicle');

    res.json({ success: true, data: updatedShipment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createShipment,
  getShipments,
  getShipmentById,
  updateShipmentStatus,
};
