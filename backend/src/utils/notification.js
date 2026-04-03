import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendBookingNotification = async (booking) => {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Friends And Memories'}" <${process.env.SMTP_USER}>`,
    to: booking.email,
    subject: `Booking Confirmed - ${booking.id} | Friends & Memories`,
    text: `
      Hi ${booking.name},
      
      Your booking at Friends & Memories is confirmed!
      
      DETAILS:
      Booking ID: ${booking.id}
      Branch: ${booking.branch}
      Service: ${booking.service}
      Date: ${booking.date}
      Time: ${booking.timeSlot}
      Duration: ${booking.duration} Hour(s)
      Occasion: ${booking.occasion}
      ${booking.customOccasion ? `Custom Occasion: ${booking.customOccasion}` : ''}
      
      CAKE:
      ${booking.cakeRequired && booking.selectedCake ? `${booking.selectedCake.name} - ₹${booking.selectedCake.price}` : 'No cake selected'}
      
      EXTRA DECORATIONS:
      ${booking.extraDecorations && booking.extraDecorations.length > 0 
        ? booking.extraDecorations.map(d => `- ${d.name} (₹${d.price})`).join('\n')
        : 'No extra decorations'}
        
      TOTAL PRICE: ₹${booking.totalPrice}
      AMOUNT PAID: ₹${booking.amountPaid || 0}
      BALANCE TO BE PAID: ₹${booking.balanceAmount || 0}
      
      LOCATION:
      ${booking.branch === 'branch-1' 
        ? 'Mulpuri Nageswar Rao St, Eluru, Andhra Pradesh 534006' 
        : '4-Masid St, Narasimhapuram, Kovvada, Bhimavaram, Andhra Pradesh 534202'}
      
      Thank you for choosing Friends & Memories!
    `,
    html: `
        <div style="background: linear-gradient(135deg, #c19b33 0%, #8a6d1a 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px;">Booking Confirmed!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-style: italic;">Thank you for choosing Friends & Memories</p>
        </div>
        
        <div style="padding: 30px; background: #ffffff;">
          <p style="font-size: 16px; color: #333;">Hi <strong>${booking.name}</strong>,</p>
          <p style="color: #666; line-height: 1.6;">Your celebration is all set! We've reserved your slot at our <strong>${booking.branch === 'branch-1' ? 'Eluru' : 'Bhimavaram'}</strong> branch. Here are your booking details:</p>
          
          <div style="background: #fdfaf0; border-left: 4px solid #c19b33; padding: 20px; margin: 25px 0;">
            <h3 style="margin: 0 0 15px; color: #8a6d1a; font-size: 18px; border-bottom: 1px dashed #e5d5a5; padding-bottom: 5px;">Booking Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 4px 0; color: #777;">Booking ID:</td><td style="padding: 4px 0; font-weight: bold; color: #333;">#${booking.id}</td></tr>
              <tr><td style="padding: 4px 0; color: #777;">Service:</td><td style="padding: 4px 0; font-weight: bold; color: #333;">${booking.service === 'party-hall' ? 'Party Hall' : 'Private Theatre'}</td></tr>
              <tr><td style="padding: 4px 0; color: #777;">Date:</td><td style="padding: 4px 0; font-weight: bold; color: #333;">${booking.date}</td></tr>
              <tr><td style="padding: 4px 0; color: #777;">Time:</td><td style="padding: 4px 0; font-weight: bold; color: #c19b33; font-size: 16px;">${booking.startTime} - ${booking.endTime}</td></tr>
              <tr><td style="padding: 4px 0; color: #777;">Duration:</td><td style="padding: 4px 0; font-weight: bold; color: #333;">${booking.duration} Hour(s)</td></tr>
              <tr><td style="padding: 4px 0; color: #777;">Occasion:</td><td style="padding: 4px 0; font-weight: bold; color: #333;">${booking.occasion}${booking.customOccasion ? ` (${booking.customOccasion})` : ''}</td></tr>
            </table>
          </div>

          <div style="margin: 25px 0;">
            <h3 style="color: #8a6d1a; font-size: 16px;">Celebration Add-ons</h3>
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
              <p style="margin: 5px 0;"><strong>Cake:</strong> ${booking.cakeRequired && booking.selectedCake ? `${booking.selectedCake.name}` : '<span style="color:#999;">Not selected</span>'}</p>
              <p style="margin: 10px 0 5px;"><strong>Extra Decorations:</strong></p>
              <div style="padding-left: 10px; color: #555; font-size: 13px;">
                ${booking.extraDecorations && booking.extraDecorations.length > 0 
                  ? booking.extraDecorations.map(d => `<div style="margin-bottom:2px;">• ${d.name}</div>`).join('')
                  : 'No extras selected'}
              </div>
            </div>
          </div>

          <div style="border: 2px solid #f0f0f0; border-radius: 12px; padding: 20px; margin-top: 30px; background: #fafafa;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; color: #666;">Total Amount:</td>
                <td style="padding: 5px 0; text-align: right; color: #333;">₹${booking.totalPrice}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #c19b33;">Amount Paid (Advance):</td>
                <td style="padding: 5px 0; text-align: right; color: #c19b33; font-weight: bold;">- ₹${booking.amountPaid || 0}</td>
              </tr>
              <tr style="border-top: 1px solid #ddd;">
                <td style="padding: 15px 0 5px; font-size: 20px; font-weight: bold; color: #8a6d1a;">Remaining Balance:</td>
                <td style="padding: 15px 0 5px; text-align: right; font-size: 20px; font-weight: bold; color: #8a6d1a;">₹${booking.balanceAmount || 0}</td>
              </tr>
            </table>
            <p style="font-size: 12px; color: #d9534f; margin-top: 10px; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
              <strong>Note:</strong> Balance amount will be collected at the venue before start.
            </p>
          </div>

          <div style="margin: 35px 0; text-align: center;">
            <p style="margin-bottom: 15px; color: #666; font-size: 14px;"><strong>Venue Location:</strong><br>${booking.branch === 'branch-1' ? 'Eluru' : 'Bhimavaram'}</p>
            <a href="${booking.branch === 'branch-1' ? 'https://maps.app.goo.gl/DqNPcNmWZH4KC9dd7' : 'https://maps.app.goo.gl/hc31fqJaDx6Veqkv7'}" 
               style="background: #c19b33; color: white; padding: 12px 25px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(193, 155, 51, 0.3);">
               📍 GET DIRECTIONS
            </a>
            <p style="margin-top: 10px; font-size: 12px; color: #999;">${booking.branch === 'branch-1' ? 'Mulpuri Nageswar Rao St, Eluru' : '4-Masid St, Narasimhapuram, Kovvada'}</p>
          </div>

          <div style="text-align: center; border-top: 1px solid #eee; padding-top: 30px; margin-top: 20px;">
            <p style="font-size: 12px; color: #aaa;">This is an automated receipt. If you have any questions, please contact us on +91 99127 10932.</p>
            <p style="font-size: 14px; color: #8a6d1a; margin-top: 10px; font-weight: bold;">Friends & Memories ❤️</p>
          </div>
        </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Booking notification email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('✗ Failed to send booking notification email:', error);
    throw error;
  }
};

