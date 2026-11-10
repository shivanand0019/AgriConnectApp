const mongoose = require('mongoose');

let mongoMemoryServer = null;

const connectDB = async () => {
  const targetUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agriconnect';

  // 1. Try connecting to configured MongoDB (local or Atlas)
  try {
    const conn = await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    await checkAndSeedData();
    return conn;
  } catch (error) {
    console.warn(`[Database] Local / external MongoDB not detected (${error.message}).`);
    console.log(`[Database] Launching embedded MongoDB service...`);
  }

  // 2. Fallback to embedded in-memory MongoDB for zero-config local run
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoMemoryServer = await MongoMemoryServer.create({
      binary: { version: '4.4.29' },
    });
    const memoryUri = mongoMemoryServer.getUri();
    const conn = await mongoose.connect(memoryUri);
    console.log(`✅ Embedded In-Memory MongoDB Connected at: ${memoryUri}`);

    await checkAndSeedData();
    return conn;
  } catch (memError) {
    console.error(`❌ Failed to start embedded MongoDB: ${memError.message}`);
    return null;
  }
};

async function checkAndSeedData() {
  try {
    const User = require('../models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log(`🌱 Fresh database detected. Auto-seeding initial demo datasets...`);
      const { seedDatabase } = require('../utils/seedData');
      await seedDatabase(false);
      console.log(`✅ Demo database automatically populated!`);
    }
  } catch (seedErr) {
    console.warn(`[Database] Auto-seed notice: ${seedErr.message}`);
  }
}

// Clean shutdown handler
process.on('SIGINT', async () => {
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
  process.exit(0);
});

module.exports = connectDB;
