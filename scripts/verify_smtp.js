const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env' });

async function verify() {
    console.log('Verifying SMTP Connection...');
    console.log(`Host: ${process.env.SMTP_HOST}`);
    console.log(`Port: ${process.env.SMTP_PORT}`);
    console.log(`User: ${process.env.SMTP_USER}`);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: true, // 465 is secure
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        await transporter.verify();
        console.log('✅ SMTP Connection Successful!');

        // Try sending a test email to self
        console.log('Sending test email to self...');
        const info = await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: process.env.SMTP_USER,
            subject: 'Test Email from Marketing Emailer',
            text: 'This is a test email to verify correct SMTP configuration.',
        });
        console.log(`✅ Test Email Sent: ${info.messageId}`);

    } catch (error) {
        console.error('❌ Verification Failed:', error);
    }
}

verify();
