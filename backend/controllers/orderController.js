const PurchaseOrder = require('../models/PurchaseOrder');
const Produce = require('../models/Produce');
const FPOInventory = require('../models/FPOInventory');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Create purchase order with strict quantity validation
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const {
      sellerId,
      produceId,
      procurementRequestId,
      cropName,
      quantity,
      unit,
      pricePerUnit,
      orderType,
      deliveryAddress,
    } = req.body;

    const requestedQty = Number(quantity);
    const unitPrice = Number(pricePerUnit);

    if (requestedQty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be greater than 0' });
    }

    let produceObj = null;
    let inventoryObj = null;

    // 1. If ordering from a specific Farmer Produce Listing
    if (produceId) {
      produceObj = await Produce.findById(produceId);
      if (!produceObj) {
        return res.status(404).json({ success: false, message: 'Produce listing not found' });
      }

      if (produceObj.availableQuantity < requestedQty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient quantity available. Requested: ${requestedQty} ${produceObj.unit}, Available: ${produceObj.availableQuantity} ${produceObj.unit}`,
        });
      }

      // Decrement produce available quantity immediately
      produceObj.availableQuantity -= requestedQty;
      if (produceObj.availableQuantity === 0) {
        produceObj.status = 'SOLD_OUT';
      } else {
        produceObj.status = 'PARTIALLY_SOLD';
      }
      await produceObj.save();
    } else if (orderType === 'BUYER_FPO') {
      // 2. If Large Buyer ordering from FPO aggregated inventory
      inventoryObj = await FPOInventory.findOne({ fpo: sellerId, cropName });
      if (inventoryObj) {
        if (inventoryObj.availableQuantity < requestedQty) {
          return res.status(400).json({
            success: false,
            message: `FPO inventory insufficient. Requested: ${requestedQty} kg, Available in FPO Stock: ${inventoryObj.availableQuantity} kg`,
          });
        }
        // Reserve inventory quantity
        inventoryObj.availableQuantity -= requestedQty;
        inventoryObj.reservedQuantity += requestedQty;
        await inventoryObj.save();
      }
    }

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const totalAmount = requestedQty * unitPrice;

    const order = await PurchaseOrder.create({
      orderNumber,
      buyer: req.user._id,
      seller: sellerId,
      produce: produceId || undefined,
      procurementRequest: procurementRequestId || undefined,
      cropName,
      quantity: requestedQty,
      unit: unit || 'kg',
      pricePerUnit: unitPrice,
      totalAmount,
      orderType,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      deliveryAddress: deliveryAddress || req.user.location,
    });

    // Create Payment record abstraction
    await Payment.create({
      order: order._id,
      payer: req.user._id,
      payee: sellerId,
      amount: totalAmount,
      transactionId: `TXN-${orderNumber}`,
      status: 'PENDING',
    });

    // Create Notification for seller
    await Notification.create({
      recipient: sellerId,
      sender: req.user._id,
      title: 'New Purchase Order Received',
      message: `${req.user.name} placed an order #${orderNumber} for ${requestedQty} ${unit || 'kg'} of ${cropName} valued at ₹${totalAmount.toLocaleString('en-IN')}`,
      type: 'PURCHASE_REQUEST',
      relatedId: order._id,
    });

    const populatedOrder = await PurchaseOrder.findById(order._id)
      .populate('buyer', 'name email phone role location profileImage')
      .populate('seller', 'name email phone role location profileImage')
      .populate('produce');

    res.status(201).json({ success: true, data: populatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
  try {
    const { status, type } = req.query;

    let query = {};

    if (req.user.role === 'ADMIN') {
      // Admin sees all
    } else {
      query.$or = [{ buyer: req.user._id }, { seller: req.user._id }];
    }

    if (status) query.status = status;
    if (type) query.orderType = type;

    const orders = await PurchaseOrder.find(query)
      .populate('buyer', 'name email phone role location profileImage')
      .populate('seller', 'name email phone role location profileImage')
      .populate('produce')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get order details by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id)
      .populate('buyer', 'name email phone role location profileImage')
      .populate('seller', 'name email phone role location profileImage')
      .populate('produce');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order status (Accept, Complete, Cancel, Aggregate inventory)
// @route   PUT /api/orders/:id/status
// @access  Private
const updateOrderStatus = async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const order = await PurchaseOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const isBuyer = order.buyer.toString() === req.user._id.toString();
    const isSeller = order.seller.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this order' });
    }

    if (status) {
      order.status = status;
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
      await Payment.findOneAndUpdate(
        { order: order._id },
        { status: paymentStatus }
      );
    }

    // Business logic: If FPO accepts/completes order from Farmer -> AGGREGATE INTO FPO INVENTORY!
    if ((status === 'ACCEPTED' || status === 'COMPLETED') && order.orderType === 'FPO_FARMER') {
      const fpoId = order.buyer; // FPO is the buyer of farmer produce
      const farmerObj = await User.findById(order.seller);

      let inventory = await FPOInventory.findOne({ fpo: fpoId, cropName: order.cropName });

      if (!inventory) {
        inventory = new FPOInventory({
          fpo: fpoId,
          cropName: order.cropName,
          totalQuantity: order.quantity,
          availableQuantity: order.quantity,
          reservedQuantity: 0,
          sourceFarmers: [
            {
              farmer: order.seller,
              farmerName: farmerObj ? farmerObj.name : 'Farmer Partner',
              order: order._id,
              quantity: order.quantity,
              pricePerUnit: order.pricePerUnit,
            },
          ],
        });
      } else {
        // Prevent duplicate aggregation for same order
        const alreadyAggregated = inventory.sourceFarmers.some(
          (sf) => sf.order && sf.order.toString() === order._id.toString()
        );

        if (!alreadyAggregated) {
          inventory.totalQuantity += order.quantity;
          inventory.availableQuantity += order.quantity;
          inventory.sourceFarmers.push({
            farmer: order.seller,
            farmerName: farmerObj ? farmerObj.name : 'Farmer Partner',
            order: order._id,
            quantity: order.quantity,
            pricePerUnit: order.pricePerUnit,
          });
        }
      }

      await inventory.save();
    }

    // If order CANCELLED or REJECTED -> Restock produce or FPO inventory!
    if (status === 'CANCELLED' || status === 'REJECTED') {
      if (order.produce) {
        const produce = await Produce.findById(order.produce);
        if (produce) {
          produce.availableQuantity += order.quantity;
          produce.status = produce.availableQuantity >= produce.quantity ? 'AVAILABLE' : 'PARTIALLY_SOLD';
          await produce.save();
        }
      }

      if (order.orderType === 'BUYER_FPO') {
        const inventory = await FPOInventory.findOne({ fpo: order.seller, cropName: order.cropName });
        if (inventory) {
          inventory.reservedQuantity = Math.max(0, inventory.reservedQuantity - order.quantity);
          inventory.availableQuantity += order.quantity;
          await inventory.save();
        }
      }
    }

    await order.save();

    // Create notification to counterpart
    const targetUserId = isBuyer ? order.seller : order.buyer;
    await Notification.create({
      recipient: targetUserId,
      sender: req.user._id,
      title: `Order #${order.orderNumber} Status Updated`,
      message: `Order #${order.orderNumber} for ${order.cropName} is now ${order.status}. Payment status: ${order.paymentStatus}`,
      type: 'SYSTEM',
      relatedId: order._id,
    });

    const updatedOrder = await PurchaseOrder.findById(order._id)
      .populate('buyer', 'name email phone role location profileImage')
      .populate('seller', 'name email phone role location profileImage')
      .populate('produce');

    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
};
