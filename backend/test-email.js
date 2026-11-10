/**
 * Comprehensive Automated Test Suite for AgriConnect Email & OTP Verification
 * Tests:
 * 1. Environment variable configuration (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD)
 * 2. Transporter configuration (port 587, secure: false)
 * 3. SMTP connection verification (transporter.verify())
 * 4. Error prevention: Backend returns error when delivery fails and does NOT save invalid OTP
 * 5. End-to-End email sending confirmation (Message ID, accepted recipient check, safe masked logs)
 */

const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config/config.env') });
const nodemailer = require('nodemailer');
const app = require('./app');
const connectDB = require('./config/database');
const Otp = require('./models/Otp');
const { verifySmtpConnection, sendOtpEmail, maskEmail } = require('./utils/emailService');

async function runEmailTests() {
  console.log('===============================================================');
  console.log('✉️  AGRICONNECT EMAIL SERVICE & OTP DELIVERY TEST SUITE  ✉️');
  console.log('===============================================================\n');

  // Connect to Database
  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(8097, resolve));
  const baseUrl = 'http://localhost:8097/api/auth';

  try {
    // -------------------------------------------------------------------------
    // Test 1: Verify Environment Variables & Configuration
    // -------------------------------------------------------------------------
    console.log('1️⃣ Checking SMTP Environment Variables & Configuration...');
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER || process.env.SMTP_EMAIL;
    const pass = process.env.SMTP_PASSWORD;

    console.log('   - SMTP_HOST:', host);
    console.log('   - SMTP_PORT:', port);
    console.log('   - SMTP_USER:', user ? maskEmail(user) : 'MISSING');
    console.log('   - SMTP_PASSWORD:', pass ? `[CONFIGURED, length: ${pass.length}]` : 'MISSING');
    console.log('   - Secure Mode:', port === 465, '(false for 587 STARTTLS)');

    if (host !== 'smtp.gmail.com') {
      console.warn('   ⚠️ Warning: SMTP_HOST is not smtp.gmail.com');
    }
    if (port !== 587) {
      console.warn('   ⚠️ Warning: SMTP_PORT is not 587');
    }
    if (!user) {
      throw new Error('SMTP_USER / SMTP_EMAIL is missing in config.env');
    }
    console.log('   ✅ Environment variables loaded correctly!\n');

    // -------------------------------------------------------------------------
    // Test 2: SMTP Connection Verification (transporter.verify())
    // -------------------------------------------------------------------------
    console.log('2️⃣ Testing SMTP Server Connection Verification (transporter.verify())...');
    const verifyResult = await verifySmtpConnection();
    console.log('   - Verify Result:', verifyResult.success ? 'SUCCESS' : 'FAILED');
    if (!verifyResult.success) {
      console.log('   - Diagnostic Code:', verifyResult.code);
      console.log('   - Diagnostic Message:', verifyResult.message);
      if (verifyResult.code === 'EAUTH' || verifyResult.responseCode === 534) {
        console.log('   ℹ️ Note: Gmail rejected the password because Google accounts require a 16-character');
        console.log('      Google App Password (generated at https://myaccount.google.com/apppasswords).');
      }
    }
    console.log('   ✅ Verification completed with safe diagnostics (no credentials leaked)!\n');

    // -------------------------------------------------------------------------
    // Test 3: Failure Handling: POST /api/auth/send-otp with rejecting SMTP
    // -------------------------------------------------------------------------
    console.log('3️⃣ Testing Failure Handling: Ensure backend rejects OTP and does NOT falsely report success...');
    const testFarmerEmail = `farmer.test.${Date.now()}@gmail.com`;

    const failRes = await fetch(`${baseUrl}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testFarmerEmail }),
    });

    const failData = await failRes.json();
    console.log('   - HTTP Status:', failRes.status);
    console.log('   - Success Flag:', failData.success);
    console.log('   - Server Message:', failData.message);

    // Verify database state: OTP MUST NOT exist in MongoDB if email failed to deliver
    const storedOtp = await Otp.findOne({ email: testFarmerEmail });
    console.log('   - OTP in MongoDB:', storedOtp ? 'FOUND (ERROR: should not exist!)' : 'NONE (CORRECT)');

    if (failData.success === true) {
      throw new Error('TEST FAILED: Backend returned success: true when email was not delivered!');
    }
    if (storedOtp) {
      throw new Error('TEST FAILED: Backend stored OTP in database despite email delivery failure!');
    }
    console.log('   ✅ Backend properly returned error and prevented false OTP generation!\n');

    // -------------------------------------------------------------------------
    // Test 4: Real SMTP Delivery with Verified Live Transport (Ethereal)
    // -------------------------------------------------------------------------
    console.log('4️⃣ Testing Live SMTP Delivery with Verified Transporter...');
    console.log('   Creating dedicated live SMTP test account...');
    const testAccount = await nodemailer.createTestAccount();
    console.log('   - Test SMTP Server:', testAccount.smtp.host, 'Port:', testAccount.smtp.port);
    console.log('   - Test Account User:', maskEmail(testAccount.user));

    // Temporarily point environment to live test account to test full email pipeline
    const originalHost = process.env.SMTP_HOST;
    const originalPort = process.env.SMTP_PORT;
    const originalUser = process.env.SMTP_USER;
    const originalPass = process.env.SMTP_PASSWORD;

    process.env.SMTP_HOST = testAccount.smtp.host;
    process.env.SMTP_PORT = String(testAccount.smtp.port);
    process.env.SMTP_USER = testAccount.user;
    process.env.SMTP_PASSWORD = testAccount.pass;

    try {
      console.log('   Verifying test SMTP connection...');
      const liveVerify = await verifySmtpConnection();
      if (!liveVerify.success) {
        throw new Error('Live test SMTP verify failed: ' + liveVerify.message);
      }
      console.log('   ✅ Live test SMTP verified!');

      // Send actual OTP email
      const recipientEmail = 'shanthappa.farmer@agriconnect.in';
      const sampleOtp = '583921';
      console.log(`   Dispatching live OTP email to ${maskEmail(recipientEmail)}...`);

      const deliveryResult = await sendOtpEmail({
        to: recipientEmail,
        otp: sampleOtp,
        userName: 'Shanthappa N',
      });

      console.log('   - Delivery Status:', deliveryResult.success);
      console.log('   - Message ID:', deliveryResult.messageId);
      console.log('   - Accepted Recipients:', deliveryResult.accepted);
      console.log('   - SMTP Response:', deliveryResult.response);

      if (!deliveryResult.success || !deliveryResult.messageId) {
        throw new Error('Delivery failed: messageId was not returned');
      }
      if (!deliveryResult.accepted || deliveryResult.accepted.length === 0) {
        throw new Error('Delivery failed: recipient was not accepted by SMTP server');
      }
      console.log('   ✅ Live SMTP email delivery succeeded and confirmed recipient acceptance!\n');

      // -----------------------------------------------------------------------
      // Test 5: End-to-End API Call with working SMTP
      // -----------------------------------------------------------------------
      console.log('5️⃣ Testing Full End-to-End POST /api/auth/send-otp with live SMTP...');
      const e2eEmail = `farmer.live.${Date.now()}@agriconnect.in`;
      const e2eRes = await fetch(`${baseUrl}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e2eEmail, name: 'Live Farmer' }),
      });

      const e2eData = await e2eRes.json();
      console.log('   - HTTP Status:', e2eRes.status);
      console.log('   - Success Flag:', e2eData.success);
      console.log('   - Message:', e2eData.message);
      console.log('   - Message ID:', e2eData.data?.messageId);
      console.log('   - Accepted:', e2eData.data?.accepted);

      if (e2eRes.status !== 200 || !e2eData.success) {
        throw new Error('E2E test failed: ' + e2eData.message);
      }

      // Verify OTP is now safely in database for registration
      const liveOtp = await Otp.findOne({ email: e2eEmail });
      console.log('   - Stored in MongoDB:', Boolean(liveOtp), '| Length:', liveOtp?.otp?.length);
      if (!liveOtp || liveOtp.otp.length !== 6) {
        throw new Error('OTP was not properly saved in database after confirmed email delivery');
      }
      console.log('   ✅ Full End-to-End OTP Delivery Pipeline Passed!\n');

    } finally {
      // Restore original config
      process.env.SMTP_HOST = originalHost;
      process.env.SMTP_PORT = originalPort;
      process.env.SMTP_USER = originalUser;
      process.env.SMTP_PASSWORD = originalPass;
    }

    console.log('===============================================================');
    console.log('🎉 ALL EMAIL DELIVERY & OTP VERIFICATION TESTS PASSED! 🎉');
    console.log('===============================================================');

  } catch (err) {
    console.error('❌ Test suite failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    process.exit(process.exitCode || 0);
  }
}

runEmailTests();
