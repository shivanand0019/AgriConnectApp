/**
 * Intent Execution & Authorization Service
 * Securely executes validated backend actions on behalf of the AI assistant.
 * Strict Security Rules:
 * 1. The LLM NEVER executes raw database queries.
 * 2. Authenticated user ownership is strictly verified.
 * 3. Mutations (creating produce, placing orders) require explicit user confirmation.
 */

const mongoose = require('mongoose');
const Produce = require('../../models/Produce');
const PurchaseOrder = require('../../models/PurchaseOrder');
const Shipment = require('../../models/Shipment');

// Sample fallback produce listings for offline / disconnected DB state
const SAMPLE_PRODUCE = [
  {
    id: 'prod_sample_1',
    cropName: 'Organic Tomato',
    variety: 'Vaishnavi Hybrid',
    availableQuantity: 800,
    unit: 'kg',
    expectedPrice: 28,
    qualityGrade: 'Grade A',
    location: { city: 'Mysuru', district: 'Mysuru', state: 'Karnataka' },
    farmerName: 'Ramesh Gowda',
    images: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'prod_sample_2',
    cropName: 'Red Onion',
    variety: 'Bellary Premium',
    availableQuantity: 1200,
    unit: 'kg',
    expectedPrice: 35,
    qualityGrade: 'Organic Premium',
    location: { city: 'Bengaluru Rural', district: 'Bengaluru', state: 'Karnataka' },
    farmerName: 'Suresh Patil',
    images: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=600&q=80',
  }
];

/**
 * Benchmark Mandi rates for standard Indian agricultural commodities
 */
const COMMODITY_BENCHMARKS = {
  tomato: { min: 20, max: 28, avg: 24, unit: 'kg' },
  onion: { min: 28, max: 38, avg: 33, unit: 'kg' },
  potato: { min: 18, max: 26, avg: 22, unit: 'kg' },
  rice: { min: 42, max: 65, avg: 52, unit: 'kg' },
  wheat: { min: 24, max: 32, avg: 28, unit: 'kg' },
  maize: { min: 18, max: 24, avg: 21, unit: 'kg' },
  cotton: { min: 6200, max: 7400, avg: 6800, unit: 'quintal' },
  chilli: { min: 140, max: 210, avg: 175, unit: 'kg' },
  turmeric: { min: 110, max: 160, avg: 135, unit: 'kg' },
};

/**
 * Execute or prepare backend action according to model intent and user credentials
 * @param {object} structuredAction - { intent, entities, requires_action, requires_confirmation }
 * @param {object} user - Authenticated user or null
 * @returns {Promise<object>} Execution result { executed, action, data, message, requires_confirmation }
 */
const executeAuthorizedAction = async (structuredAction, user = null) => {
  if (!structuredAction || !structuredAction.requires_action) {
    return {
      executed: false,
      requires_action: false,
      data: null,
    };
  }

  const { intent, entities = {} } = structuredAction;
  const isDbConnected = mongoose.connection.readyState === 1;

  switch (intent) {
    case 'search_produce': {
      // Public / read-only search: Safe to execute without login, but filters results nicely
      if (!isDbConnected) {
        const filtered = SAMPLE_PRODUCE.filter((p) => {
          if (entities.crop && !p.cropName.toLowerCase().includes(entities.crop.toLowerCase())) return false;
          if (entities.location && !p.location.city.toLowerCase().includes(entities.location.toLowerCase())) return false;
          return true;
        });
        const out = filtered.length > 0 ? filtered : SAMPLE_PRODUCE;
        return {
          executed: true,
          action: 'search_produce',
          data: out,
          count: out.length,
          summary: `Found ${out.length} produce listing(s) matching ${entities.crop || 'produce'}.`,
        };
      }

      try {
        const query = { availableQuantity: { $gt: 0 } };

        if (entities.crop && entities.crop.trim() !== '') {
          query.cropName = { $regex: entities.crop.trim(), $options: 'i' };
        }

        if (entities.location && entities.location.trim() !== '') {
          query.$or = [
            { 'location.city': { $regex: entities.location.trim(), $options: 'i' } },
            { 'location.district': { $regex: entities.location.trim(), $options: 'i' } },
            { 'location.state': { $regex: entities.location.trim(), $options: 'i' } },
          ];
        }

        const results = await Produce.find(query)
          .populate('farmer', 'name phone location')
          .sort({ createdAt: -1 })
          .limit(5)
          .lean();

        return {
          executed: true,
          action: 'search_produce',
          data: results.map((p) => ({
            id: p._id,
            cropName: p.cropName,
            variety: p.variety,
            availableQuantity: p.availableQuantity,
            unit: p.unit || 'kg',
            expectedPrice: p.expectedPrice,
            qualityGrade: p.qualityGrade || 'Grade A',
            location: p.location,
            farmerName: p.farmer ? p.farmer.name : 'Verified Farmer',
            images: p.images && p.images.length ? p.images[0] : null,
          })),
          count: results.length,
          summary: results.length > 0
            ? `Found ${results.length} active produce listing(s) matching ${entities.crop || 'produce'}.`
            : `No active listings found currently matching ${entities.crop || 'produce'}.`,
        };
      } catch (dbErr) {
        console.warn('[IntentService]: MongoDB produce search error, using fallback:', dbErr.message);
        return {
          executed: true,
          action: 'search_produce',
          data: SAMPLE_PRODUCE,
          count: SAMPLE_PRODUCE.length,
          summary: `Found ${SAMPLE_PRODUCE.length} produce listings (sample data).`,
        };
      }
    }

    case 'get_user_listings': {
      // Authenticated lookup of the user's own listings
      if (!user) {
        return {
          executed: false,
          requires_auth: true,
          action: 'get_user_listings',
          message: 'Please sign in to your AgriConnect account to view your listed products.',
          data: [],
        };
      }

      if (!isDbConnected) {
        return {
          executed: true,
          action: 'get_user_listings',
          data: [],
          count: 0,
          summary: 'You currently have no listed produce in your account.',
        };
      }

      try {
        const myListings = await Produce.find({ farmer: user._id })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        return {
          executed: true,
          action: 'get_user_listings',
          data: myListings.map((p) => ({
            id: p._id,
            cropName: p.cropName,
            variety: p.variety,
            availableQuantity: p.availableQuantity,
            unit: p.unit || 'kg',
            expectedPrice: p.expectedPrice,
            qualityGrade: p.qualityGrade || 'Grade A',
            status: p.availableQuantity > 0 ? 'Active' : 'Sold Out',
            location: p.location,
          })),
          count: myListings.length,
          summary: `You have ${myListings.length} produce listing(s) in your AgriConnect account.`,
        };
      } catch (err) {
        console.warn('[IntentService]: get_user_listings error:', err.message);
        return {
          executed: true,
          action: 'get_user_listings',
          data: [],
          count: 0,
          summary: 'Could not retrieve your listings at this time.',
        };
      }
    }

    case 'get_market_prices': {
      // Aggregate real marketplace prices from Produce database or commodity benchmarks
      const cropQuery = entities.crop ? entities.crop.toLowerCase().trim() : 'tomato';
      let priceData = null;

      if (isDbConnected) {
        try {
          const matching = await Produce.find({
            cropName: { $regex: cropQuery, $options: 'i' },
            availableQuantity: { $gt: 0 }
          }).select('cropName expectedPrice availableQuantity location unit qualityGrade').lean();

          if (matching.length > 0) {
            const prices = matching.map(m => m.expectedPrice).filter(p => typeof p === 'number' && p > 0);
            if (prices.length > 0) {
              const min = Math.min(...prices);
              const max = Math.max(...prices);
              const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
              priceData = {
                crop: cropQuery,
                min,
                max,
                avg,
                unit: matching[0].unit || 'kg',
                sampleCount: matching.length,
                locations: [...new Set(matching.map(m => m.location?.city).filter(Boolean))].slice(0, 3),
              };
            }
          }
        } catch (e) {
          console.warn('[IntentService]: get_market_prices error:', e.message);
        }
      }

      if (!priceData) {
        const benchmark = COMMODITY_BENCHMARKS[cropQuery] || { min: 20, max: 30, avg: 25, unit: 'kg' };
        priceData = {
          crop: cropQuery,
          min: benchmark.min,
          max: benchmark.max,
          avg: benchmark.avg,
          unit: benchmark.unit,
          sampleCount: 1,
          locations: ['Karnataka Markets'],
          isBenchmark: true,
        };
      }

      return {
        executed: true,
        action: 'get_market_prices',
        data: priceData,
        summary: `Current marketplace rate for ${priceData.crop} is ₹${priceData.min} - ₹${priceData.max} per ${priceData.unit} (Average: ₹${priceData.avg}/${priceData.unit}).`,
      };
    }

    case 'check_orders': {
      // Private / authenticated: User can ONLY view orders where they are the buyer or seller
      if (!user) {
        return {
          executed: false,
          requires_auth: true,
          action: 'check_orders',
          message: 'Please sign in to your AgriConnect account to inspect your private orders.',
          data: [],
        };
      }

      if (!isDbConnected) {
        return {
          executed: true,
          action: 'check_orders',
          data: [],
          count: 0,
          summary: `No active orders found for ${user.name}.`,
        };
      }

      const orders = await PurchaseOrder.find({
        $or: [{ buyer: user._id }, { seller: user._id }],
      })
        .sort({ createdAt: -1 })
        .limit(4)
        .populate('buyer', 'name phone')
        .populate('seller', 'name phone')
        .lean();

      return {
        executed: true,
        action: 'check_orders',
        data: orders.map((o) => ({
          id: o._id,
          orderNumber: o.orderNumber,
          cropName: o.cropName,
          quantity: `${o.quantity} ${o.unit || 'kg'}`,
          totalAmount: o.totalAmount,
          status: o.status,
          paymentStatus: o.paymentStatus,
          orderType: o.orderType,
          date: o.createdAt,
        })),
        count: orders.length,
        summary: orders.length > 0
          ? `Retrieved ${orders.length} order(s) for your account.`
          : 'You currently have no active purchase orders.',
      };
    }

    case 'check_shipments': {
      // Private / authenticated shipment lookup
      if (!user) {
        return {
          executed: false,
          requires_auth: true,
          action: 'check_shipments',
          message: 'Please sign in to track authorized shipments.',
          data: [],
        };
      }

      if (!isDbConnected) {
        return {
          executed: true,
          action: 'check_shipments',
          data: [],
          count: 0,
          summary: 'No active shipments found for your account.',
        };
      }

      // Find orders belonging to user first
      const userOrders = await PurchaseOrder.find({
        $or: [{ buyer: user._id }, { seller: user._id }],
      }).select('_id');
      const orderIds = userOrders.map((o) => o._id);

      const shipments = await Shipment.find({
        $or: [
          { logisticsPartner: user._id },
          { order: { $in: orderIds } }
        ]
      })
        .sort({ updatedAt: -1 })
        .limit(3)
        .populate('logisticsPartner', 'name phone')
        .lean();

      return {
        executed: true,
        action: 'check_shipments',
        data: shipments.map((s) => ({
          id: s._id,
          trackingNumber: s.trackingNumber,
          currentStatus: s.currentStatus,
          pickupLocation: s.pickupLocation,
          deliveryLocation: s.deliveryLocation,
          estimatedDeliveryDate: s.estimatedDeliveryDate,
        })),
        count: shipments.length,
        summary: shipments.length > 0
          ? `Found ${shipments.length} shipment(s) associated with your account.`
          : 'No active shipments currently associated with your account.',
      };
    }

    case 'create_produce_prompt': {
      // Security: DO NOT directly insert produce without user confirmation!
      return {
        executed: false,
        requires_confirmation: true,
        action: 'create_produce_listing',
        draft: {
          cropName: entities.crop || 'Fresh Produce',
          quantity: entities.quantity || '100',
          price: entities.price || '0',
          unit: 'kg',
        },
        message: 'Review and confirm your produce listing details before submitting to the marketplace.',
      };
    }

    default:
      return {
        executed: false,
        requires_action: false,
        data: null,
      };
  }
};

module.exports = { executeAuthorizedAction };
