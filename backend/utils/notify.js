// backend/utils/notify.js
const twilio = require('twilio');

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_FROM_NUMBER
} = process.env;

let client = null;
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

/**
 * Send an SMS if Twilio is configured. No-ops in dev if not configured.
 * @param {string} to E.164 phone number (+233..., +1..., etc.)
 * @param {string} body text message
 */
async function sendSMS(to, body) {
  if (!client || !TWILIO_FROM_NUMBER) {
    console.log('[notify] SMS skipped (Twilio not configured). To:', to, 'Msg:', body);
    return;
  }
  try {
    await client.messages.create({ from: TWILIO_FROM_NUMBER, to, body });
    console.log('[notify] SMS sent to', to);
  } catch (err) {
    console.error('[notify] SMS error:', err.message);
  }
}

module.exports = { sendSMS };
