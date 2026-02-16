const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

// We use manual configuration instead of 'service: gmail' to have full control
// over timeouts and IP versions.
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465, // Use Port 465 (SSL) which is less likely to be blocked by cloud firewalls
    secure: true, // true for 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS 
    },
    // Force IPv4. Many cloud providers (like Render/AWS) fail with IPv6 (default).
    family: 4, 
    // Drastically increased timeouts for production environments
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000,   // 30 seconds
    socketTimeout: 60000      // 60 seconds
});

transporter.verify((error, success) => {
    if(error) {
        console.error('Email service verification failed:', error);
    } else {
        console.log('Gmail configured properly and ready to send email');
    }
});

const sendOtpToEmail = async(email, otp) => {
    // Basic validation
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error("Email credentials missing in environment variables");
    }

    const html = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h2 style="color: #075e54;">🔐 Chat Pat Web Verification</h2>
      
      <p>Hi there,</p>
      
      <p>Your one-time password (OTP) to verify your WhatsApp Web account is:</p>
      
      <h1 style="background: #e0f7fa; color: #000; padding: 10px 20px; display: inline-block; border-radius: 5px; letter-spacing: 2px;">
        ${otp}
      </h1>

      <p><strong>This OTP is valid for the next 5 minutes.</strong> Please do not share this code with anyone.</p>

      <p>If you didn’t request this OTP, please ignore this email.</p>

      <p style="margin-top: 20px;">Thanks & Regards,<br/>WhatsApp Web Security Team</p>

      <hr style="margin: 30px 0;" />

      <small style="color: #777;">This is an automated message. Please do not reply.</small>
    </div>
  `;

    try {
        await transporter.sendMail({
            from: `"Chat App Security" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your App Verification Code',
            html,
        });
        console.log(`OTP sent successfully to ${email}`);
    } catch (error) {
        console.error('Error sending OTP email:', error);
        throw new Error(`Email service failed: ${error.message}`);
    }
}

module.exports = sendOtpToEmail;