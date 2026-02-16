const nodemailer = require('nodemailer')
const dotenv = require('dotenv')
dotenv.config();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS 
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000
})

transporter.verify((error, success) => {
    if(error) {
        console.error('Email services failed')
    }else {
        console.log('Gmail configured properly and ready to send email')
    }
});

const sendOtpToEmail = async(email, otp) => {
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
            from: `Hi there, < ${process.env.EMAIL_USER}` ,
            to: email,
            subject: 'your app verification code',
            html,
        })
        console.log(`OTP sent successfully to ${email}`);
    } catch (error) {
        console.error('Error sending OTP email:', error);
        throw new Error(`Email service failed: ${error.message}`);
    }
}

module.exports = sendOtpToEmail;