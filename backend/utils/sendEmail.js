const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Check if using placeholder credentials
    if (process.env.EMAIL_USER === 'your_mailtrap_user' || !process.env.EMAIL_USER) {
        console.log('--- DEVELOPMENT MODE: MOCK EMAIL ---');
        console.log(`To: ${options.email}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Message: ${options.message}`);
        console.log('------------------------------------');
        return; // Skip actual sending to prevent 500 error
    }

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const message = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html, // Added HTML support
        attachments: options.attachments, // Added attachments support
    };

    const info = await transporter.sendMail(message);

    console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;
