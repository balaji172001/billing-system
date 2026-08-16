import nodemailer from 'nodemailer';

let transporter;

export async function initEmailTransporter() {
  if (transporter) return transporter;

  // Check if custom SMTP is defined in env
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Generate Ethereal Email test credentials for development
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log('--------------------------------------------------');
      console.log('Email Service initialized with Ethereal SMTP:');
      console.log(`User: ${testAccount.user}`);
      console.log('--------------------------------------------------');
    } catch (err) {
      console.error('Failed to create Ethereal Email test account:', err);
    }
  }
  return transporter;
}

/**
 * Sends an email with optional attachments.
 * @param {Object} options
 * @param {string} options.to Recipient email
 * @param {string} options.subject Email subject
 * @param {string} options.html Email HTML content
 * @param {Array} options.attachments Array of attachment objects
 */
export async function sendInvoiceEmail({ to, subject, html, attachments }) {
  const mailTransporter = await initEmailTransporter();
  if (!mailTransporter) {
    console.warn('Mail transporter not available. E-mail not sent.');
    return { success: false, message: 'Mail transporter not configured' };
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Billing System" <billing@example.com>',
    to,
    subject,
    html,
    attachments
  };

  const info = await mailTransporter.sendMail(mailOptions);
  console.log(`Email sent: ${info.messageId}`);
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`Preview URL: ${previewUrl}`);
  }
  return { success: true, messageId: info.messageId, previewUrl };
}
