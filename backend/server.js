// Ensure SSL certificates (e.g. Avast / local antivirus proxy inspection) are trusted in development
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const app = require('./app');
const connectDB = require('./config/database');
const { verifySmtpConnection } = require('./utils/emailService');

const PORT = process.env.PORT || 8080;

async function startServer() {
  // 1. Connect to Database first
  await connectDB();

  // 2. Start HTTP server
  const server = app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🌾 AgriConnect Backend Server running in ${process.env.NODE_ENV || 'development'} mode on PORT ${PORT}`);
    console.log(`📡 Healthcheck: http://localhost:${PORT}/api/health`);
    console.log(`==================================================`);
  });

  // 3. Verify SMTP Email Service on startup
  verifySmtpConnection().catch((err) => {
    console.warn(`[SMTP Startup Check] Notice: ${err.message}`);
  });

  return server;
}

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
});
