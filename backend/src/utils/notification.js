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
      
      LOCATION:
      ${booking.branch === 'branch-1' ? 'Mulpuri Nageswar Rao St, Eluru, Andhra Pradesh 534006' : '4-Masid St, Narasimhapuram, Kovvada, Bhimavaram, Andhra Pradesh 534202'}
      
      Thank you for choosing Friends & Memories!
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #c9a227; text-align: center;">Booking Confirmed!</h2>
        <p>Hi <strong>${booking.name}</strong>,</p>
        <p>Your booking at <strong>Friends & Memories</strong> is confirmed! We look forward to seeing you.</p>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; font-size: 16px;">Booking Details</h3>
          <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${booking.id}</p>
          <p style="margin: 5px 0;"><strong>Branch:</strong> ${booking.branch === 'branch-1' ? 'Eluru' : 'Bhimavaram'}</p>
          <p style="margin: 5px 0;"><strong>Service:</strong> ${booking.service}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${booking.date}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${booking.timeSlot} (${booking.duration} Hour(s))</p>
          <p style="margin: 5px 0;"><strong>Occasion:</strong> ${booking.occasion}${booking.customOccasion ? ` (${booking.customOccasion})` : ''}</p>
        </div>

        <div style="margin: 20px 0;">
          <h3 style="font-size: 16px;">Items Selected</h3>
          <p style="margin: 5px 0;"><strong>Cake:</strong> ${booking.cakeRequired && booking.selectedCake ? `${booking.selectedCake.name} (₹${booking.selectedCake.price})` : 'None'}</p>
          <p style="margin: 5px 0;"><strong>Extra Decorations:</strong></p>
          <ul style="margin: 5px 0; padding-left: 20px;">
            ${booking.extraDecorations && booking.extraDecorations.length > 0 
              ? booking.extraDecorations.map(d => `<li>${d.name} (₹${d.price})</li>`).join('')
              : '<li>None</li>'}
          </ul>
        </div>

        <div style="border-top: 2px solid #eee; padding-top: 15px; text-align: right;">
          <h3 style="margin: 0; color: #c9a227;">Total Paid: ₹${booking.totalPrice}</h3>
        </div>
        
        <p style="margin-top: 30px; font-size: 12px; color: #777; text-align: center;">
          This is an automated confirmation email. Please do not reply.
        </p>
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

