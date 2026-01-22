import nodemailer from 'nodemailer';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Minimalist email wrapper
function emailWrapper(content) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 48px 20px;">
    <tr>
      <td align="center">
        
        <!-- Logo -->
        <p style="margin: 0 0 32px; font-size: 20px; font-weight: 700; font-style: italic; color: #8b5cf6;">let's hang</p>
        
        <!-- Container -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 440px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
          ${content}
        </table>
        
        <!-- Footer -->
        <p style="margin: 32px 0 0; color: #999; font-size: 12px;">
          © ${new Date().getFullYear()} Let's Hang
        </p>
        
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Email templates
const templates = {
  
  // Welcome email
  welcome: (name) => ({
    subject: `Welcome to Let's Hang, ${name}!`,
    html: emailWrapper(`
      <tr>
        <td style="padding: 48px 40px; text-align: center;">
          <div style="width: 64px; height: 64px; margin: 0 auto 24px; background: linear-gradient(135deg, #8b5cf6, #a855f7); border-radius: 50%; line-height: 64px; font-size: 28px;">🎉</div>
          <h1 style="margin: 0 0 12px; color: #1a1a1a; font-size: 24px; font-weight: 600;">Welcome aboard!</h1>
          <p style="margin: 0 0 32px; color: #666; font-size: 15px; line-height: 1.6;">
            Hey ${name}, you're all set to discover and host amazing events.
          </p>
          <a href="${FRONTEND_URL}/search" style="display: inline-block; background: #1a1a1a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 500;">
            Explore Events
          </a>
        </td>
      </tr>
    `),
    text: `Welcome to Let's Hang, ${name}! Start exploring at ${FRONTEND_URL}/search`,
  }),

  // OTP email
  otp: (name, otp) => ({
    subject: `${otp} is your verification code`,
    html: emailWrapper(`
      <tr>
        <td style="padding: 48px 40px; text-align: center;">
          <h1 style="margin: 0 0 12px; color: #1a1a1a; font-size: 22px; font-weight: 600;">Verify your email</h1>
          <p style="margin: 0 0 28px; color: #666; font-size: 15px;">
            Hi ${name}, enter this code to continue:
          </p>
          <div style="background: #f8f5ff; border-radius: 12px; padding: 24px; margin-bottom: 28px;">
            <span style="font-size: 32px; font-weight: 700; color: #8b5cf6; letter-spacing: 8px; font-family: monospace;">${otp}</span>
          </div>
          <p style="margin: 0; color: #999; font-size: 13px;">
            This code expires in 10 minutes
          </p>
        </td>
      </tr>
    `),
    text: `Hi ${name}, your verification code is ${otp}. Valid for 10 minutes.`,
  }),

  // Cancellation email
  cancellation: (data) => ({
    subject: `Booking cancelled - ${data.eventName}`,
    html: emailWrapper(`
      <tr>
        <td style="padding: 40px;">
          <div style="text-align: center; margin-bottom: 28px;">
            <div style="width: 56px; height: 56px; margin: 0 auto 16px; background: #fef2f2; border-radius: 50%; line-height: 56px; font-size: 24px;">✕</div>
            <h1 style="margin: 0; color: #1a1a1a; font-size: 20px; font-weight: 600;">Booking Cancelled</h1>
          </div>
          
          <div style="background: #fafafa; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 16px; font-weight: 600;">${data.eventName}</h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
              <tr>
                <td style="color: #888; padding: 4px 0;">Date</td>
                <td style="color: #1a1a1a; text-align: right; padding: 4px 0;">${data.eventDate}</td>
              </tr>
              <tr>
                <td style="color: #888; padding: 4px 0;">Location</td>
                <td style="color: #1a1a1a; text-align: right; padding: 4px 0;">${data.eventLocation}</td>
              </tr>
              ${data.ticketCount > 1 ? `
              <tr>
                <td style="color: #888; padding: 4px 0;">Tickets</td>
                <td style="color: #1a1a1a; text-align: right; padding: 4px 0;">${data.ticketCount}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          ${data.refundAmount > 0 ? `
          <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 12px; color: #16a34a; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Refund Details</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
              <tr>
                <td style="color: #666; padding: 4px 0;">Original</td>
                <td style="color: #1a1a1a; text-align: right; padding: 4px 0;">₹${(data.originalAmount / 100).toFixed(2)}</td>
              </tr>
              <tr>
                <td style="color: #666; padding: 4px 0;">Cancellation fee (${data.cancellationFeePercent}%)</td>
                <td style="color: #ef4444; text-align: right; padding: 4px 0;">-₹${(data.cancellationFee / 100).toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top: 12px; border-top: 1px solid #dcfce7;">
                  <table width="100%"><tr>
                    <td style="color: #16a34a; font-weight: 600;">Refund</td>
                    <td style="color: #16a34a; font-weight: 700; font-size: 16px; text-align: right;">₹${(data.refundAmount / 100).toFixed(2)}</td>
                  </tr></table>
                </td>
              </tr>
            </table>
            <p style="margin: 12px 0 0; color: #888; font-size: 12px;">Refund in 5-7 business days</p>
          </div>
          ` : ''}
          
          <div style="text-align: center;">
            <a href="${FRONTEND_URL}/search" style="display: inline-block; background: #1a1a1a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500;">
              Browse Events
            </a>
          </div>
        </td>
      </tr>
    `),
    text: `Booking cancelled for ${data.eventName}. ${data.refundAmount > 0 ? `Refund: ₹${(data.refundAmount / 100).toFixed(2)}` : ''}`,
  }),
};

// Send template email
export async function sendTemplateEmail(to, template, data) {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    
    let emailContent;
    switch (template) {
      case 'welcome':
        emailContent = templates.welcome(data.name);
        break;
      case 'otp':
        emailContent = templates.otp(data.name, data.otp);
        break;
      case 'cancellation':
        emailContent = templates.cancellation(data);
        break;
      default:
        throw new Error(`Unknown template: ${template}`);
    }
    
    const info = await transporter.sendMail({
      from: `"Let's Hang" <${process.env.SMTP_USER}>`,
      to,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });
    
    console.log(`📧 Email sent to ${to}`);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Email failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Send custom email
export async function sendEmail(options) {
  const { to, subject, html, text } = options;
  
  try {
    const transporter = createTransporter();
    await transporter.verify();
    
    const info = await transporter.sendMail({
      from: `"Let's Hang" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text: text || '',
      html,
    });
    
    console.log(`📧 Email sent to ${to}`);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Email failed:', error.message);
    throw error;
  }
}
