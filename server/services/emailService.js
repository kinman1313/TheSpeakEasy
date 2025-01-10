const nodemailer = require('nodemailer');

const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        debug: true,
        tls: {
            rejectUnauthorized: false
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000
    });
};

const sendResetPasswordEmail = async (email, resetToken) => {
    try {
        console.log('Creating transporter...');
        const transporter = createTransporter();
        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

        console.log('Verifying SMTP connection...');
        try {
            await transporter.verify();
        } catch (verifyError) {
            console.error('SMTP Verification failed:', verifyError);
            throw new Error(`SMTP Verification failed: ${verifyError.message}`);
        }

        console.log('Preparing email...');
        const mailOptions = {
            from: process.env.FROM_EMAIL,
            to: email,
            subject: 'Password Reset Request',
            html: `
                <h1>Password Reset Request</h1>
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <a href="${resetUrl}">Reset Password</a>
                <p>If you didn't request this, please ignore this email.</p>
                <p>This link will expire in 1 hour.</p>
            `
        };

        console.log('Sending email...');
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.response);
        return info;
    } catch (error) {
        console.error('Email service detailed error:', {
            error: error.message,
            stack: error.stack,
            code: error.code,
            command: error.command
        });
        throw new Error(`Failed to send email: ${error.message}`);
    }
};

module.exports = {
    sendResetPasswordEmail
}; 