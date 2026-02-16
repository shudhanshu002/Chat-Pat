require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('Testing Email Service...');
console.log('Email User:', process.env.EMAIL_USER ? 'Set' : 'Not Set');
console.log('Email Pass:', process.env.EMAIL_PASS ? 'Set' : 'Not Set');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('ERROR: EMAIL_USER or EMAIL_PASS is missing in .env');
    process.exit(1);
}

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
    logger: true,
    debug: true
});

const sendTestEmail = async () => {
    try {
        console.log(`Attempting to send mail to ${process.env.EMAIL_USER}...`);
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to self
            subject: 'Test Email from Chat-Pat Debugger',
            text: 'If you see this, your email configuration is working!',
        });
        console.log('Email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('Email failed to send:');
        console.error(error);
        process.exit(1);
    }
};

sendTestEmail().then(() => {
    console.log('Test completed.');
    // Keep alive for a moment to ensure logs are flushed
    setTimeout(() => process.exit(0), 1000);
});
