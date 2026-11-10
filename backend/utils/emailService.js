/**
 * AgriConnect Email Service
 * Production Nodemailer wrapper for SMTP email delivery (OTP, Notifications)
 * Implements:
 * - SMTP connection verification
 * - Safe diagnostic logging (Masked recipient, message ID, accepted/rejected status)
 * - Strict delivery confirmation (Verifies recipient was accepted by SMTP)
 * - Zero exposure of credentials, passwords, or OTP values in logs
 */

const nodemailer = require('nodemailer');
const tls = require('tls');
const fs = require('fs');
const path = require('path');

/**
 * Mask email address for safe logging (e.g. nay***@gmail.com)
 */
function maskEmail(email) {
  if (!email || typeof email !== 'string') return '***';
  const parts = email.trim().split('@');
  if (parts.length !== 2) return '***';
  const [localPart, domain] = parts;
  const visible = localPart.length <= 3 ? localPart[0] : localPart.substring(0, 3);
  return `${visible}***@${domain}`;
}

/**
 * Build trusted Certificate Authority (CA) list.
 * Preserves all default Node.js root CAs (Mozilla CA bundle) and appends
 * any custom local CAs (such as antivirus Mail Shield certificates, system CAs,
 * or certificates referenced by NODE_EXTRA_CA_CERTS).
 * Keeps rejectUnauthorized: true strictly enabled for maximum TLS security.
 */
function getTrustedCaCertificates() {
  const caList = [...tls.rootCertificates];

  // 1. Check NODE_EXTRA_CA_CERTS environment variable if provided
  if (process.env.NODE_EXTRA_CA_CERTS) {
    try {
      const extraCaPath = path.resolve(process.env.NODE_EXTRA_CA_CERTS);
      if (fs.existsSync(extraCaPath)) {
        const extraCert = fs.readFileSync(extraCaPath, 'utf8');
        caList.push(extraCert);
      }
    } catch (err) {
      console.warn(`[EmailService] ⚠️ Could not load NODE_EXTRA_CA_CERTS: ${err.message}`);
    }
  }

  // 2. Automatically load any PEM/CRT files in backend/certs directory
  const certsDir = path.join(__dirname, '..', 'certs');
  if (fs.existsSync(certsDir)) {
    try {
      const certFiles = fs.readdirSync(certsDir);
      for (const file of certFiles) {
        if (file.endsWith('.pem') || file.endsWith('.crt')) {
          const certPath = path.join(certsDir, file);
          const certData = fs.readFileSync(certPath, 'utf8');
          caList.push(certData);
        }
      }
    } catch (err) {
      console.warn(`[EmailService] ⚠️ Could not load certificates from ${certsDir}: ${err.message}`);
    }
  }

  return caList;
}

/**
 * Build Nodemailer transporter from environment variables
 */
function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.SMTP_EMAIL || '';
  const pass = process.env.SMTP_PASSWORD || '';

  const isSecure = port === 465; // false for port 587 (STARTTLS)

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: true,
      ca: getTrustedCaCertificates(),
      minVersion: 'TLSv1.2',
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
}

/**
 * Verify SMTP server connection without printing credentials
 * @returns {Promise<{ success: boolean, message: string, code?: string }>}
 */
async function verifySmtpConnection() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.SMTP_EMAIL || '';

  if (!user || !process.env.SMTP_PASSWORD) {
    const msg = 'SMTP credentials not configured (SMTP_USER/SMTP_PASSWORD missing in config.env)';
    console.warn(`[EmailService] ⚠️ ${msg}`);
    return { success: false, message: msg, code: 'MISSING_CREDENTIALS' };
  }

  const transporter = createTransporter();

  try {
    console.log(`[EmailService] Verifying SMTP connection to ${host}:${port} (secure: ${port === 465}) for user ${maskEmail(user)}...`);
    await transporter.verify();
    console.log(`[EmailService] ✅ SMTP Connection verified successfully with ${host}:${port}`);
    return { success: true, message: 'SMTP connection verified successfully' };
  } catch (error) {
    console.error(`[EmailService] ❌ SMTP Connection failed for ${host}:${port}`);
    console.error(`[EmailService] Error Code: ${error.code || 'UNKNOWN'} | Response Code: ${error.responseCode || 'N/A'}`);
    console.error(`[EmailService] Error Message: ${error.message}`);
    return {
      success: false,
      message: error.message,
      code: error.code || 'SMTP_CONNECTION_FAILED',
      responseCode: error.responseCode,
    };
  }
}

/**
 * Send OTP Verification Email via Nodemailer
 * @param {object} params
 * @param {string} params.to - Farmer/User recipient email
 * @param {string} params.otp - 6-digit verification code
 * @param {string} [params.userName] - Recipient name
 * @returns {Promise<object>} Result containing messageId, accepted recipients, and SMTP response
 */
async function sendOtpEmail({ to, otp, userName = 'Farmer / Agri Partner' }) {
  if (!to || typeof to !== 'string') {
    throw new Error('Recipient email address is required');
  }
  if (!otp) {
    throw new Error('OTP code is required');
  }

  const normalizedTo = to.trim().toLowerCase();
  const maskedTo = maskEmail(normalizedTo);
  const user = process.env.SMTP_USER || process.env.SMTP_EMAIL || '';

  if (!user || !process.env.SMTP_PASSWORD) {
    const err = new Error('SMTP service is not configured. Please configure SMTP_USER and SMTP_PASSWORD.');
    err.code = 'SMTP_NOT_CONFIGURED';
    console.error(`[EmailService] ❌ Failed to send OTP to ${maskedTo}: ${err.message}`);
    throw err;
  }

  const transporter = createTransporter();

  const mailOptions = {
    from: `"AgriConnect" <${user}>`,
    to: normalizedTo,
    subject: `Your AgriConnect Verification Code: ${otp}`,
    text: `Hello ${userName},\n\nYour AgriConnect verification code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you did not request this code, please ignore this email.\n\nWarm regards,\nAgriConnect Team`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #15803d 0%, #166534 100%); padding: 28px 32px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">🌾 AgriConnect</h1>
          <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9; font-weight: 500;">Connecting Farmers, FPOs & Buyers Directly</p>
        </div>
        <div style="padding: 32px; color: #334155; line-height: 1.6;">
          <h2 style="margin-top: 0; font-size: 18px; color: #0f172a;">Account Verification Code</h2>
          <p style="font-size: 14px; margin-bottom: 24px;">Hello <strong>${userName}</strong>,</p>
          <p style="font-size: 14px; margin-bottom: 24px;">Please use the following one-time password (OTP) to complete your registration or login on AgriConnect:</p>
          
          <div style="text-align: center; margin: 28px 0;">
            <div style="display: inline-block; background-color: #f0fdf4; border: 2px dashed #22c55e; border-radius: 12px; padding: 16px 36px;">
              <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #15803d;">${otp}</span>
            </div>
            <p style="margin: 10px 0 0; font-size: 12px; color: #64748b;">⏱️ This verification code expires in <strong>5 minutes</strong>.</p>
          </div>

          <div style="background-color: #f8fafc; border-left: 4px solid #16a34a; padding: 12px 16px; border-radius: 6px; margin: 24px 0;">
            <p style="margin: 0; font-size: 12px; color: #475569;">
              <strong>Security Notice:</strong> Never share your verification code or passwords with anyone. AgriConnect representatives will never ask for your OTP.
            </p>
          </div>

          <p style="font-size: 13px; color: #64748b; margin-top: 24px;">If you did not request this verification code, please ignore this email or contact support.</p>
        </div>
        <div style="background-color: #f1f5f9; padding: 16px 32px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
          © ${new Date().getFullYear()} AgriConnect Karnataka. All rights reserved.
        </div>
      </div>
    `,
  };

  try {
    console.log(`[EmailService] Attempting to send OTP email to ${maskedTo} via ${process.env.SMTP_HOST || 'smtp.gmail.com'}...`);
    const info = await transporter.sendMail(mailOptions);

    // 1. Safe Diagnostic Logging (NO credentials, NO passwords, NO OTP logged)
    const acceptedMasked = (info.accepted || []).map(maskEmail);
    const rejectedMasked = (info.rejected || []).map(maskEmail);

    console.log(`[EmailService] ✅ SMTP Delivery Attempt Complete:`);
    console.log(`   - Message ID: ${info.messageId}`);
    console.log(`   - Recipient (Target): ${maskedTo}`);
    console.log(`   - Accepted Recipients: [${acceptedMasked.join(', ')}]`);
    console.log(`   - Rejected Recipients: [${rejectedMasked.join(', ')}]`);
    console.log(`   - SMTP Response: ${info.response}`);

    // 2. Strict Delivery Confirmation Check
    // The target recipient MUST be in accepted recipients and NOT in rejected recipients
    const wasTargetAccepted = Array.isArray(info.accepted) && info.accepted.some((addr) => {
      const normalizedAddr = String(addr).toLowerCase().trim();
      return normalizedAddr === normalizedTo || normalizedAddr.includes(normalizedTo);
    });

    const wasTargetRejected = Array.isArray(info.rejected) && info.rejected.some((addr) => {
      const normalizedAddr = String(addr).toLowerCase().trim();
      return normalizedAddr === normalizedTo || normalizedAddr.includes(normalizedTo);
    });

    if (!wasTargetAccepted || wasTargetRejected) {
      const failureMsg = `SMTP server did not accept recipient email: ${maskedTo} (Accepted: ${acceptedMasked.length}, Rejected: ${rejectedMasked.length})`;
      console.error(`[EmailService] ❌ ${failureMsg}`);
      const err = new Error(failureMsg);
      err.code = 'RECIPIENT_NOT_ACCEPTED';
      err.info = { messageId: info.messageId, response: info.response };
      throw err;
    }

    return {
      success: true,
      messageId: info.messageId,
      accepted: acceptedMasked,
      rejected: rejectedMasked,
      response: info.response,
    };
  } catch (error) {
    console.error(`[EmailService] ❌ Failed to send OTP to ${maskedTo}:`);
    console.error(`   - Error Code: ${error.code || 'UNKNOWN'}`);
    console.error(`   - Error Message: ${error.message}`);
    if (error.responseCode) {
      console.error(`   - SMTP Response Code: ${error.responseCode}`);
    }
    throw error;
  }
}

module.exports = {
  sendOtpEmail,
  verifySmtpConnection,
  maskEmail,
  createTransporter,
};

