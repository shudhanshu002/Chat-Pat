const { Resend } = require('resend');
const dotenv = require('dotenv');
dotenv.config();

// Initialize Resend with the API Key
// This uses standard HTTPS (Port 443), which is NEVER blocked by Render/Cloud providers.
const resend = new Resend(process.env.RESEND_API_KEY);

const sendOtpToEmail = async(email, otp) => {
    // 1. Validate Configuration
    if (!process.env.RESEND_API_KEY) {
        console.error("❌ MISSING VAR: RESEND_API_KEY is missing in Environment.");
        throw new Error("Server configuration error: Missing email credentials.");
    }

    const html = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h2 style="color: #075e54;">🔐 Chat Pat Web Verification</h2>
      
      <p>Hi there,</p>
      <p>Your one-time password (OTP) to verify your WhatsApp Web account is:</p>
      
      <h1 style="background: #e0f7fa; color: #000; padding: 10px 20px; display: inline-block; border-radius: 5px; letter-spacing: 2px;">
        ${otp}
      </h1>

      <p><strong>This OTP is valid for the next 5 minutes.</strong></p>
      <p style="margin-top: 20px;">Thanks & Regards,<br/>WhatsApp Web Security Team</p>
      <hr style="margin: 30px 0;" />
      <small style="color: #777;">This is an automated message.</small>
    </div>
  `;

    try {
        console.log(`Attempting to send email to ${email} via Resend API...`);
        
        // NOTE: If you haven't verified a custom domain on Resend,
        // you MUST use 'onboarding@resend.dev' as the 'from' address.
        // You can only send TO the email address you signed up with (for testing).
        const data = await resend.emails.send({
            from: 'Chat App Security <onboarding@resend.dev>',
            to: email,
            subject: 'Your App Verification Code',
            html: html,
        });

        if (data.error) {
            console.error("❌ Resend API Error:", data.error);
            throw new Error(data.error.message);
        }
        
        console.log(`✅ OTP sent successfully. ID: ${data.data.id}`);
    } catch (error) {
        console.error('❌ SEND FAILURE:', error);
        throw new Error(`Email service failed: ${error.message}`);
    }
}

module.exports = sendOtpToEmail;