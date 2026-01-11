const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS, // Use Gmail App Password
        },
    });

    return transporter.sendMail({
        from: `"Manpower Support" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    });
};

module.exports = sendEmail;