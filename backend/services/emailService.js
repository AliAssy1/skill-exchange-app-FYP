const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send an email.
 * @param {string} to   - recipient email address
 * @param {string} subject
 * @param {string} text  - plain-text body
 * @param {string} html  - optional HTML body
 */
async function sendEmail({ to, subject, text, html }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email credentials not configured. Add EMAIL_USER and EMAIL_PASS to .env');
  }
  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: `"SkillSwap Platform" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html: html || `<p>${text.replace(/\n/g, '<br>')}</p>`,
  });
  return info;
}

module.exports = { sendEmail };
