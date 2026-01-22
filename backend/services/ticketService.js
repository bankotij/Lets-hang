import nodemailer from 'nodemailer';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Check if email is configured
function isEmailConfigured() {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

// Generate QR code URL
function generateQRCodeUrl(data) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(data)}&bgcolor=ffffff&color=000000`;
}

// Create transporter
function createTransporter() {
  if (!isEmailConfigured()) {
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// Minimalist ticket HTML
function generateTicketHTML(data) {
  const { 
    eventName, 
    eventDate, 
    eventTime, 
    eventLocation, 
    attendeeName, 
    ticketId, 
    qrCodeUrl, 
    eventUrl, 
    ticketCount,
    hostName,
    hostEmail,
    totalPaid,
    eventDescription,
    ticketTierName,
    addOns,
  } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        
        <!-- Container -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #8b5cf6, #a855f7); padding: 32px 32px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px; color: rgba(255,255,255,0.8); font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px;">Event Ticket</p>
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; line-height: 1.3;">${eventName}</h1>
                    ${ticketCount > 1 ? `<span style="display: inline-block; margin-top: 12px; background: rgba(255,255,255,0.2); color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">${ticketCount} Tickets</span>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Event Details -->
          <tr>
            <td style="padding: 28px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom: 16px; border-bottom: 1px solid #f0f0f0;">
                    <p style="margin: 0 0 4px; color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">When</p>
                    <p style="margin: 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">${eventDate} at ${eventTime}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 0; border-bottom: 1px solid #f0f0f0;">
                    <p style="margin: 0 0 4px; color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Where</p>
                    <p style="margin: 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">${eventLocation}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 0; border-bottom: 1px solid #f0f0f0;">
                    <p style="margin: 0 0 4px; color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Attendee</p>
                    <p style="margin: 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">${attendeeName}${ticketCount > 1 ? ` + ${ticketCount - 1} guest${ticketCount > 2 ? 's' : ''}` : ''}</p>
                  </td>
                </tr>
                ${ticketTierName ? `
                <tr>
                  <td style="padding: 16px 0; border-bottom: 1px solid #f0f0f0;">
                    <p style="margin: 0 0 4px; color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Ticket Type</p>
                    <p style="margin: 0; color: #8b5cf6; font-size: 15px; font-weight: 600;">${ticketTierName}</p>
                  </td>
                </tr>
                ` : ''}
                ${addOns && addOns.length > 0 ? `
                <tr>
                  <td style="padding: 16px 0; border-bottom: 1px solid #f0f0f0;">
                    <p style="margin: 0 0 8px; color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Add-ons</p>
                    ${addOns.map(a => `<p style="margin: 0 0 4px; color: #1a1a1a; font-size: 14px;">• ${a.name} ${a.quantity > 1 ? `× ${a.quantity}` : ''}</p>`).join('')}
                  </td>
                </tr>
                ` : ''}
                ${totalPaid > 0 ? `
                <tr>
                  <td style="padding: 16px 0; border-bottom: 1px solid #f0f0f0;">
                    <p style="margin: 0 0 4px; color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Amount Paid</p>
                    <p style="margin: 0; color: #16a34a; font-size: 15px; font-weight: 600;">₹${(totalPaid / 100).toFixed(2)}</p>
                  </td>
                </tr>
                ` : ''}
                ${eventDescription ? `
                <tr>
                  <td style="padding: 16px 0; border-bottom: 1px solid #f0f0f0;">
                    <p style="margin: 0 0 4px; color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">About</p>
                    <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.5;">${eventDescription}</p>
                  </td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>
          
          <!-- QR Code -->
          <tr>
            <td style="padding: 0 32px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #fafafa; border-radius: 12px; padding: 24px;">
                <tr>
                  <td align="center">
                    <img src="${qrCodeUrl}" alt="QR" width="140" height="140" style="display: block; border-radius: 8px;">
                    <p style="margin: 16px 0 0; color: #888; font-size: 11px; font-family: monospace;">${ticketId}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Host Contact -->
          ${hostEmail ? `
          <tr>
            <td style="padding: 0 32px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f5ff; border-radius: 12px; padding: 16px 20px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 4px; color: #8b5cf6; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Host Contact</p>
                    <p style="margin: 0; color: #1a1a1a; font-size: 14px;">
                      ${hostName} • <a href="mailto:${hostEmail}" style="color: #8b5cf6; text-decoration: none;">${hostEmail}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}
          
          <!-- Button -->
          <tr>
            <td style="padding: 0 32px 32px;" align="center">
              <a href="${eventUrl}" style="display: inline-block; background: #1a1a1a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 14px; font-weight: 500;">
                View Event Details
              </a>
            </td>
          </tr>
          
        </table>
        
        <!-- Footer -->
        <p style="margin: 24px 0 0; color: #999; font-size: 12px; text-align: center;">
          Show this ticket at the venue • <a href="${FRONTEND_URL}" style="color: #8b5cf6; text-decoration: none;">let's hang</a>
        </p>
        
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Send ticket email
export async function sendTicketEmail(ticketData) {
  const {
    eventId,
    eventName,
    eventDate,
    eventTime,
    eventLocation,
    eventDescription,
    attendeeName,
    attendeeEmail,
    paymentId,
    amount,
    ticketCount = 1,
    hostName,
    hostEmail,
    ticketTierName,
    addOns,
  } = ticketData;

  const ticketId = `TKT-${eventId.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const eventUrl = `${FRONTEND_URL}/event/${eventId}`;
  const qrCodeUrl = generateQRCodeUrl(eventUrl);

  // If email not configured, log and return success (skip email)
  if (!isEmailConfigured()) {
    console.log(`📧 [EMAIL DISABLED] Would send ticket to ${attendeeEmail}`);
    console.log(`   Ticket ID: ${ticketId}`);
    console.log(`   Event: ${eventName}`);
    return { success: true, ticketId, skipped: true };
  }

  const ticketHTML = generateTicketHTML({
    eventName,
    eventDate,
    eventTime,
    eventLocation,
    eventDescription,
    attendeeName,
    ticketId,
    qrCodeUrl,
    eventUrl,
    ticketCount,
    hostName,
    hostEmail,
    totalPaid: amount || 0,
    ticketTierName,
    addOns,
  });

  try {
    const transporter = createTransporter();
    
    await transporter.sendMail({
      from: `"Let's Hang" <${process.env.SMTP_USER}>`,
      to: attendeeEmail,
      subject: ticketCount > 1 
        ? `Your ${ticketCount} tickets for ${eventName}`
        : `Your ticket for ${eventName}`,
      html: ticketHTML,
    });
    
    console.log(`📧 Ticket sent to ${attendeeEmail}`);
    return { success: true, ticketId };
  } catch (error) {
    console.error('❌ Failed to send ticket:', error);
    return { success: false, error: error.message };
  }
}

// Format helpers
export function formatEventDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatEventTime(dateString) {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
