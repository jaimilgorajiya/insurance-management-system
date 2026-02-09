import nodemailer from "nodemailer";

/**
 * Create email transporter
 * @returns {Object} Nodemailer transporter
 */
const createTransporter = () => {
    const config = {
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true" || false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    };

    if (!config.auth.user || !config.auth.pass) {
        throw new Error("SMTP credentials not configured in environment variables");
    }

    return nodemailer.createTransport(config);
};

/**
 * Send credentials email to newly created user
 * @param {Object} emailData - Email data
 * @param {string} emailData.email - Recipient email
 * @param {string} emailData.name - Recipient name
 * @param {string} emailData.role - User role
 * @param {string} emailData.tempPassword - Temporary password
 * @param {string} emailData.loginUrl - Login URL
 */
export const sendCredentialsEmail = async (emailData) => {
    try {
        const { email, name, role, tempPassword, loginUrl } = emailData;

        const transporter = createTransporter();

        const roleDisplayName = role.charAt(0).toUpperCase() + role.slice(1);
        const appName = "Insurance CRM";

        const mailOptions = {
            from: `"${appName}" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `Welcome to ${appName} - Your ${roleDisplayName} Account`,
            html: generateEmailTemplate({
                appName,
                name,
                role: roleDisplayName,
                email,
                tempPassword,
                loginUrl
            })
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Credentials email sent to ${email} (Message ID: ${info.messageId})`);
        
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error("❌ Email sending error:", error.message);
        throw new Error(`Failed to send credentials email: ${error.message}`);
    }
};

/**
 * Send policy document to customer
 * @param {Object} emailData 
 * @param {string} emailData.email 
 * @param {string} emailData.name
 * @param {string} emailData.policyName
 * @param {string} emailData.pdfPath - Path to the PDF attachment
 */
export const sendPolicyDocumentEmail = async (emailData) => {
    try {
        const { email, name, policyName, pdfPath } = emailData;
        const transporter = createTransporter();
        const appName = "Insurance CRM";

        const mailOptions = {
            from: `"${appName}" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `Policy Document - ${policyName} - ${appName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1>${appName}</h1>
                    </div>
                    <div style="padding: 20px;">
                        <h2>Hello ${name},</h2>
                        <p>Thank you for purchasing <strong>${policyName}</strong>.</p>
                        <p>Please find your policy document attached to this email. We recommend keeping a copy for your records.</p>
                        <br>
                        <p>If you have any questions, please contact our support team.</p>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #64748b; margin-top: 20px;">
                        <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: `Policy-${policyName.replace(/\s+/g, '-')}.pdf`,
                    path: pdfPath
                }
            ]
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Policy document email sent to ${email} (Message ID: ${info.messageId})`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("❌ Email sending error:", error.message);
        // Don't throw here to avoid failing the whole request if email fails, 
        // just log it. The policy is still bought.
        return { success: false, error: error.message };
    }
};



/**
 * Send payment reminder email
 * @param {Object} emailData
 */
export const sendPaymentReminderEmail = async (emailData) => {
    try {
        const { email, name, policyName, amount, dueDate, policyId } = emailData;
        const transporter = createTransporter();
        const appName = "Insurance CRM";
        
        // Link to the policies page
        const paymentLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/customer/policies?highlight=${policyId}`;

        const mailOptions = {
            from: `"${appName}" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `Payment Reminder - ${policyName} Premium Due`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1>${appName}</h1>
                    </div>
                    <div style="padding: 20px;">
                        <h2>Hello ${name},</h2>
                        <p>This is a reminder that the premium payment for your policy <strong>${policyName}</strong> is due in 7 days.</p>
                        
                        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>Policy:</strong> ${policyName}</p>
                            <p><strong>Amount Due:</strong> $${amount}</p>
                            <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
                        </div>

                        <p>Please ensure timely payment to keep your policy active and enjoy uninterrupted benefits.</p>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${paymentLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                Pay Premium Now
                            </a>
                        </div>
                        
                        <p>If you have already made this payment, please ignore this email.</p>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #64748b; margin-top: 20px;">
                        <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Payment reminder sent to ${email} (Message ID: ${info.messageId})`);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error("❌ Email sending error:", error.message);
        return { success: false, error: error.message };
    }
};


/**
 * Send payment receipt email
 * @param {Object} emailData
 */
export const sendPaymentReceiptEmail = async (emailData) => {
    try {
        const { email, name, policyName, amount, receiptPath } = emailData;
        const transporter = createTransporter();
        const appName = "Insurance CRM";

        const mailOptions = {
            from: `"${appName}" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `Payment Receipt - ${policyName} Premium Payment - ${appName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div style="background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1>${appName}</h1>
                    </div>
                    <div style="padding: 20px;">
                        <h2>Hello ${name},</h2>
                        <p>We are pleased to inform you that your premium payment for <strong>${policyName}</strong> has been successfully processed.</p>
                        
                        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                            <p><strong>Policy:</strong> ${policyName}</p>
                            <p><strong>Amount Paid:</strong> INR ${amount}</p>
                            <p><strong>Status:</strong> Success</p>
                        </div>
                        
                        <p>Please find the payment receipt attached to this email.</p>
                        <br>
                        <p>Thank you for choosing ${appName}. We appreciate your business!</p>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #64748b; margin-top: 20px;">
                        <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: `Receipt-${policyName.replace(/\s+/g, '-')}.pdf`,
                    path: receiptPath
                }
            ]
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Payment receipt email sent to ${email} (Message ID: ${info.messageId})`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("❌ Email sending error:", error.message);
        return { success: false, error: error.message };
    }
};

/**

 * Generate HTML email template
 * @param {Object} data - Template data
 * @returns {string} HTML email content
 */
const generateEmailTemplate = (data) => {
    const { appName, name, role, email, tempPassword, loginUrl } = data;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${appName}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .credentials { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2563eb; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${appName}</h1>
                <p>Welcome to your ${role} account</p>
            </div>
            
            <div class="content">
                <h2>Hello ${name || 'User'},</h2>
                
                <p>Your ${role} account has been successfully created in ${appName}. You can now access your dashboard using the credentials below.</p>
                
                <div class="credentials">
                    <h3>🔐 Your Login Credentials</h3>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Temporary Password:</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${tempPassword}</code></p>
                    <p><strong>Role:</strong> ${role}</p>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Important Security Notice:</strong>
                    <ul>
                        <li>This is a temporary password generated for your account</li>
                        <li>Keep these credentials secure and do not share them</li>
                        <li>You can log in immediately using these credentials</li>
                    </ul>
                </div>
                
                <div style="text-align: center;">
                    <a href="${loginUrl}" class="button">Login to ${appName}</a>
                </div>
                
                <p>If you have any questions or need assistance, please contact your administrator.</p>
                
                <div class="footer">
                    <p>This email was sent automatically by ${appName}.<br>
                    Please do not reply to this email.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
};