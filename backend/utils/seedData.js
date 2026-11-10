const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '..', 'config', 'config.env') });

const User = require('../models/User');
const FarmerProfile = require('../models/FarmerProfile');
const FPOProfile = require('../models/FPOProfile');
const BuyerProfile = require('../models/BuyerProfile');
const LogisticsProfile = require('../models/LogisticsProfile');
const Produce = require('../models/Produce');
const ProcurementRequest = require('../models/ProcurementRequest');
const PurchaseOrder = require('../models/PurchaseOrder');
const FPOInventory = require('../models/FPOInventory');
const Shipment = require('../models/Shipment');
const Vehicle = require('../models/Vehicle');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');

const seedDatabase = async (exitOnComplete = true) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agriconnect';
      console.log(`Connecting to MongoDB at ${mongoUri}...`);
      await mongoose.connect(mongoUri);
    }

    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany(),
      FarmerProfile.deleteMany(),
      FPOProfile.deleteMany(),
      BuyerProfile.deleteMany(),
      LogisticsProfile.deleteMany(),
      Produce.deleteMany(),
      ProcurementRequest.deleteMany(),
      PurchaseOrder.deleteMany(),
      FPOInventory.deleteMany(),
      Shipment.deleteMany(),
      Vehicle.deleteMany(),
      Payment.deleteMany(),
      Notification.deleteMany(),
    ]);

    console.log('Creating demo users...');

    // 1. Admin
    const admin = await User.create({
      name: 'AgriConnect System Admin',
      email: 'admin@agriconnect.com',
      phone: '+91 9900011122',
      password: 'password123',
      role: 'ADMIN',
      location: { city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka' },
      isVerified: true,
    });

    // 2. 10 Farmers
    const farmerNames = [
      { name: 'Ramesh Gowda', city: 'Mysuru', district: 'Mysuru', crop: 'Tomato' },
      { name: 'Suresh Patel', city: 'Mandya', district: 'Mandya', crop: 'Sugarcane & Ragi' },
      { name: 'Basavarajappa K', city: 'Hassan', district: 'Hassan', crop: 'Potato' },
      { name: 'Appaiah Swamy', city: 'Madikeri', district: 'Kodagu', crop: 'Coffee & Spices' },
      { name: 'Mahesh Kumar', city: 'Chamarajanagar', district: 'Chamarajanagar', crop: 'Turmeric' },
      { name: 'Ningappa Hegde', city: 'Mysuru', district: 'Mysuru', crop: 'Onion' },
      { name: 'Venkatesha Rao', city: 'Mandya', district: 'Mandya', crop: 'Maize' },
      { name: 'Chandrashekar B', city: 'Tiptur', district: 'Tumakuru', crop: 'Coconut' },
      { name: 'Kempe Gowda', city: 'Ramanagara', district: 'Ramanagara', crop: 'Silk & Tomato' },
      { name: 'Shanthappa N', city: 'Hassan', district: 'Hassan', crop: 'Green Chilly' },
    ];

    const farmers = [];
    for (let i = 0; i < farmerNames.length; i++) {
      const fn = farmerNames[i];
      const farmer = await User.create({
        name: fn.name,
        email: i === 0 ? 'farmer@agriconnect.com' : `farmer${i + 1}@agriconnect.com`,
        phone: `+91 98450${10000 + i}`,
        password: 'password123',
        role: 'FARMER',
        location: { city: fn.city, district: fn.district, state: 'Karnataka' },
        isVerified: true,
      });

      await FarmerProfile.create({
        user: farmer._id,
        farmSizeAcres: 4 + i * 2,
        primaryCrops: [fn.crop],
        experienceYears: 6 + i,
      });

      farmers.push(farmer);
    }

    // 3. 3 FPOs
    const fpoData = [
      { name: 'Mysuru Farmers Producer Co. Ltd', email: 'fpo@agriconnect.com', city: 'Mysuru', district: 'Mysuru' },
      { name: 'Cauvery Organic Agri Producer Co', email: 'fpo2@agriconnect.com', city: 'Mandya', district: 'Mandya' },
      { name: 'Hassan Multi-Crop Farmer Alliance', email: 'fpo3@agriconnect.com', city: 'Hassan', district: 'Hassan' },
    ];

    const fpos = [];
    for (let i = 0; i < fpoData.length; i++) {
      const f = fpoData[i];
      const fpo = await User.create({
        name: f.name,
        email: f.email,
        phone: `+91 98800${20000 + i}`,
        password: 'password123',
        role: 'FPO',
        location: { city: f.city, district: f.district, state: 'Karnataka' },
        isVerified: true,
      });

      await FPOProfile.create({
        user: fpo._id,
        fpoName: f.name,
        registrationNumber: `FPO-KA-2024-00${i + 1}`,
        operatingRegions: [f.district, 'Bengaluru'],
        procurementCrops: ['Tomato', 'Onion', 'Potato', 'Ragi', 'Maize'],
        memberCount: 200 + i * 150,
      });

      fpos.push(fpo);
    }

    // 4. 3 Large Buyers
    const buyerData = [
      { name: 'FreshToHome Foods Corp', email: 'buyer@agriconnect.com', type: 'Supermarket', city: 'Bengaluru' },
      { name: 'Karnataka Agro Processing Ind.', email: 'buyer2@agriconnect.com', type: 'Food Processing', city: 'Bengaluru' },
      { name: 'Royal Spices & Produce Exports', email: 'buyer3@agriconnect.com', type: 'Exporter', city: 'Bengaluru' },
    ];

    const buyers = [];
    for (let i = 0; i < buyerData.length; i++) {
      const b = buyerData[i];
      const buyer = await User.create({
        name: b.name,
        email: b.email,
        phone: `+91 99450${30000 + i}`,
        password: 'password123',
        role: 'BUYER',
        location: { city: b.city, district: 'Bengaluru Urban', state: 'Karnataka' },
        isVerified: true,
      });

      await BuyerProfile.create({
        user: buyer._id,
        companyName: b.name,
        businessType: b.type,
      });

      buyers.push(buyer);
    }

    // 5. 3 Logistics Partners
    const logisticsData = [
      { name: 'GreenExpress Logistics', email: 'logistics@agriconnect.com', city: 'Mysuru' },
      { name: 'Cauvery Cold Chain Carriers', email: 'logistics2@agriconnect.com', city: 'Mandya' },
      { name: 'Deccan Cargo Transports', email: 'logistics3@agriconnect.com', city: 'Bengaluru' },
    ];

    const logisticsUsers = [];
    for (let i = 0; i < logisticsData.length; i++) {
      const l = logisticsData[i];
      const logistics = await User.create({
        name: l.name,
        email: l.email,
        phone: `+91 97400${40000 + i}`,
        password: 'password123',
        role: 'LOGISTICS',
        location: { city: l.city, district: l.city, state: 'Karnataka' },
        isVerified: true,
      });

      await LogisticsProfile.create({
        user: logistics._id,
        companyName: l.name,
        fleetSize: 12 + i * 5,
        operatingRegions: ['Mysuru', 'Mandya', 'Hassan', 'Bengaluru'],
      });

      logisticsUsers.push(logistics);
    }

    console.log('Creating 20 Produce Listings...');
    const cropsList = [
      { name: 'Tomato', price: 25, unit: 'kg', variety: 'Roma Red Premium', img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80' },
      { name: 'Onion', price: 32, unit: 'kg', variety: 'Bellary Pink', img: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80' },
      { name: 'Potato', price: 22, unit: 'kg', variety: 'Kufri Jyoti', img: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80' },
      { name: 'Ragi (Finger Millet)', price: 40, unit: 'kg', variety: 'Indaf-9 Organic', img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80' },
      { name: 'Maize (Yellow Corn)', price: 20, unit: 'kg', variety: 'Hybrid Yellow', img: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80' },
      { name: 'Turmeric', price: 110, unit: 'kg', variety: 'Erode Gold', img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80' },
      { name: 'Coconut', price: 28, unit: 'kg', variety: 'Tiptur Tall', img: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=600&q=80' },
    ];

    const produces = [];
    for (let i = 0; i < 20; i++) {
      const farmer = farmers[i % farmers.length];
      const crop = cropsList[i % cropsList.length];
      const qty = (i + 1) * 1000 + 2000;

      const p = await Produce.create({
        farmer: farmer._id,
        cropName: crop.name,
        variety: crop.variety,
        quantity: qty,
        availableQuantity: qty,
        unit: crop.unit,
        expectedPrice: crop.price,
        minOrderQuantity: 500,
        harvestDate: new Date(Date.now() - i * 86400000),
        qualityGrade: i % 3 === 0 ? 'Organic Premium' : i % 2 === 0 ? 'Grade A' : 'Grade B',
        location: farmer.location,
        images: [crop.img],
        description: `High grade fresh ${crop.name} harvested from ${farmer.location.city} farm. Direct grower quality assurance.`,
        status: 'AVAILABLE',
      });
      produces.push(p);
    }

    console.log('Creating 10 Procurement Requests (FPO & Buyer)...');
    const procurements = [];
    for (let i = 0; i < 10; i++) {
      const isFPO = i < 5;
      const requester = isFPO ? fpos[i % fpos.length] : buyers[i % buyers.length];
      const crop = cropsList[i % cropsList.length];

      const pr = await ProcurementRequest.create({
        requester: requester._id,
        requesterRole: isFPO ? 'FPO' : 'BUYER',
        cropName: crop.name,
        requiredQuantity: (i + 1) * 5000,
        fulfilledQuantity: isFPO ? (i + 1) * 1500 : 0,
        unit: crop.unit,
        targetPrice: crop.price + 2,
        qualityGrade: 'Grade A',
        location: requester.location,
        deadline: new Date(Date.now() + (10 + i) * 86400000),
        description: `Bulk procurement requirement for ${crop.name} for food processing & retail distribution network.`,
        status: i === 0 ? 'PARTIALLY_FULFILLED' : 'OPEN',
      });
      procurements.push(pr);
    }

    console.log('Creating 5 Vehicles for Logistics...');
    const vehicles = [];
    const vehicleTypes = ['Container Truck 10-Ton', 'Eicher 5-Ton', 'Pickup Van 2-Ton', 'Refrigerated Truck 8-Ton'];

    for (let i = 0; i < 5; i++) {
      const owner = logisticsUsers[i % logisticsUsers.length];
      const v = await Vehicle.create({
        owner: owner._id,
        vehicleType: vehicleTypes[i % vehicleTypes.length],
        registrationNumber: `KA-09-F-${3000 + i}`,
        capacityTons: 5 + i * 2,
        pricePerKm: 30 + i * 5,
        currentCity: owner.location.city,
        availableDate: new Date(),
        isAvailable: true,
        driverName: `Driver ${i + 1}`,
        driverPhone: `+91 9112233${400 + i}`,
      });
      vehicles.push(v);
    }

    console.log('Creating Aggregated FPO Inventory entries...');
    // FPO 1 aggregated Tomatoes from Farmer 1, 2, 3
    const fpoInv1 = await FPOInventory.create({
      fpo: fpos[0]._id,
      cropName: 'Tomato',
      variety: 'Roma Red Premium',
      totalQuantity: 4500,
      reservedQuantity: 1000,
      availableQuantity: 3500,
      qualityGrade: 'Grade A',
      sourceFarmers: [
        { farmer: farmers[0]._id, farmerName: farmers[0].name, quantity: 1000, pricePerUnit: 24 },
        { farmer: farmers[1]._id, farmerName: farmers[1].name, quantity: 2000, pricePerUnit: 25 },
        { farmer: farmers[2]._id, farmerName: farmers[2].name, quantity: 1500, pricePerUnit: 25 },
      ],
    });

    console.log('Creating 10 Orders...');
    const orders = [];
    for (let i = 0; i < 10; i++) {
      const isFPOOrder = i < 5;
      const buyer = isFPOOrder ? fpos[i % fpos.length] : buyers[i % buyers.length];
      const seller = isFPOOrder ? farmers[i % farmers.length] : fpos[i % fpos.length];
      const produce = produces[i % produces.length];

      const qty = 1000 + i * 500;
      const totalAmount = qty * produce.expectedPrice;
      const statusList = ['PENDING', 'ACCEPTED', 'IN_FULFILLMENT', 'COMPLETED', 'ACCEPTED'];
      const currentStatus = statusList[i % statusList.length];

      const ord = await PurchaseOrder.create({
        orderNumber: `ORD-2026-00${10 + i}`,
        buyer: buyer._id,
        seller: seller._id,
        produce: produce._id,
        cropName: produce.cropName,
        quantity: qty,
        unit: produce.unit,
        pricePerUnit: produce.expectedPrice,
        totalAmount,
        orderType: isFPOOrder ? 'FPO_FARMER' : 'BUYER_FPO',
        status: currentStatus,
        paymentStatus: currentStatus === 'COMPLETED' ? 'PAID' : 'PENDING',
        deliveryAddress: buyer.location,
        expectedDeliveryDate: new Date(Date.now() + (3 + i) * 86400000),
      });

      await Payment.create({
        order: ord._id,
        payer: buyer._id,
        payee: seller._id,
        amount: totalAmount,
        transactionId: `TXN-ORD-2026-00${10 + i}`,
        status: currentStatus === 'COMPLETED' ? 'PAID' : 'PENDING',
      });

      orders.push(ord);
    }

    console.log('Creating 5 Shipments for Logistics...');
    for (let i = 0; i < 5; i++) {
      const order = orders[i];
      const logisticsPartner = logisticsUsers[i % logisticsUsers.length];
      const vehicle = vehicles[i % vehicles.length];

      const statuses = ['REQUESTED', 'ACCEPTED', 'PICKUP_SCHEDULED', 'IN_TRANSIT', 'DELIVERED'];
      const currentStatus = statuses[i];

      await Shipment.create({
        shipmentNumber: `SHP-2026-90${i + 1}`,
        order: order._id,
        requester: order.buyer,
        logisticsPartner: currentStatus !== 'REQUESTED' ? logisticsPartner._id : undefined,
        vehicle: currentStatus !== 'REQUESTED' ? vehicle._id : undefined,
        pickupLocation: {
          city: order.seller.location ? order.seller.location.city : 'Mysuru',
          district: 'Mysuru',
          address: 'APMC Market Yard, Highway 275',
          lat: 12.2958,
          lng: 76.6394,
        },
        deliveryLocation: {
          city: 'Bengaluru',
          district: 'Bengaluru Urban',
          address: 'Yeshwanthpur APMC Yard',
          lat: 12.9716,
          lng: 77.5946,
        },
        cargoDetails: {
          cropName: order.cropName,
          quantityKg: order.quantity,
        },
        distanceKm: 145,
        totalCost: 4350,
        status: currentStatus,
        timeline: [
          { status: 'REQUESTED', timestamp: new Date(Date.now() - 48 * 3600000), location: 'Mysuru APMC' },
          { status: currentStatus, timestamp: new Date(), location: currentStatus === 'IN_TRANSIT' ? 'Ramanagara Highway' : 'Mysuru APMC' },
        ],
      });
    }

    console.log(`==================================================`);
    console.log(`✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!`);
    console.log(`==================================================`);
    console.log(`Demo Credentials (Password: password123 for all):`);
    console.log(`  🌾 Farmer: farmer@agriconnect.com`);
    console.log(`  🏢 FPO: fpo@agriconnect.com`);
    console.log(`  🛒 Buyer: buyer@agriconnect.com`);
    console.log(`  🚚 Logistics: logistics@agriconnect.com`);
    console.log(`  🛡️ Admin: admin@agriconnect.com`);
    console.log(`==================================================`);

    if (exitOnComplete) {
      process.exit(0);
    }
    return true;
  } catch (error) {
    console.error('Seeding Failed:', error);
    if (exitOnComplete) {
      process.exit(1);
    }
    throw error;
  }
};

if (require.main === module) {
  seedDatabase(true);
}

module.exports = { seedDatabase };
