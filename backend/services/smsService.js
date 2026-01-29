import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let client;

if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
} else {
    console.warn("⚠️ Twilio credentials missing. SMS service will not work.");
}

/**
 * Format phone number to E.164
 * Defaults to +91 (India) if 10 digits
 */
const formatPhoneNumber = (phone) => {
    if (!phone) return null;
    
    // Remove all characters except digits and +
    const cleaned = phone.toString().replace(/[^\d+]/g, '');
    
    // If empty
    if (!cleaned) return null;
    
    // If starts with +, assume international format
    if (cleaned.startsWith('+')) {
        return cleaned;
    }
    
    // If 10 digits, assume India and add +91
    if (cleaned.length === 10) {
        return `+91${cleaned}`;
    }
    
    // Otherwise return as is
    return cleaned;
};

/**
 * Send an SMS message
 * @param {string} to - Recipient phone number
 * @param {string} body - Message body
 */
export const sendSMS = async (to, body) => {
    if (!client) {
        console.warn("⚠️ SMS skipped: Twilio client not initialized.");
        return;
    }

    const formattedTo = formatPhoneNumber(to);

    // Basic validation
    if (!formattedTo || formattedTo.length < 10) {
        console.warn(`⚠️ SMS skipped: Invalid phone number format '${to}'`);
        return null;
    }

    try {
        const message = await client.messages.create({
            body,
            from: fromPhoneNumber,
            to: formattedTo
        });
        console.log(`✅ SMS sent successfully to ${formattedTo}. SID: ${message.sid}`);
        return message;
    } catch (error) {
        console.error("❌ SMS sending failed:", error.message);
        // We don't throw here to prevent breaking the main flow, but log strictly
        return null;
    }
};

/**
 * Send Welcome SMS with credentials
 * @param {Object} params
 * @param {string} params.mobile - User's mobile number
 * @param {string} params.name - User's name
 * @param {string} params.role - User's role
 * @param {string} params.email - User's email (login ID)
 * @param {string} params.password - Temporary password
 */
export const sendWelcomeSMS = async ({ mobile, name, role, email, password }) => {
    if (!mobile) return;

    const message = `Welcome to Insurance CRM, ${name}!
Your account has been created accordingly:
Role: ${role}
Login ID: ${email}
Temporary Password: ${password}

Please login and change your password immediately.`;

    return await sendSMS(mobile, message);
};
