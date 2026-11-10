// Ensure SSL certificates (e.g. Avast / local antivirus proxy inspection) are trusted in development
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'config', 'config.env') });

const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Body Parser & CORS
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'AgriConnect API is running', timestamp: new Date() });
});

// Register API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/farmers', require('./routes/farmerRoutes'));
app.use('/api/fpo', require('./routes/fpoRoutes'));
app.use('/api/buyers', require('./routes/buyerRoutes'));
app.use('/api/logistics', require('./routes/logisticsRoutes'));
app.use('/api/produce', require('./routes/produceRoutes'));
app.use('/api/procurement', require('./routes/procurementRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/shipments', require('./routes/shipmentRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/ai', require('./routes/voiceAssistantRoutes'));

// Serve frontend build if present
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
const fs = require('fs');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Fallback & Error Middlewares
app.use(notFound);
app.use(errorHandler);

module.exports = app;
