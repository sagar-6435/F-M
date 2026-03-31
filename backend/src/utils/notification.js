import nodemailer from 'nodemailer';

// Mock email service for demonstration
// In production, configure with real SMTP settings
export const sendBookingNotification = async (booking) => {
  console.log('--- SENDING BOOKING NOTIFICATION ---');
  console.log(`To: ${booking.email}`);
  console.log(`Subject: Booking Confirmed - ${booking.id}`);
  console.log(`
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
      ? booking.extraDecorations.map(d => `- ${d.name} (₹${d.price})`).join('\n    ')
      : 'No extra decorations'}
      
    TOTAL PRICE: ₹${booking.totalPrice}
    
    Thank you for choosing Friends & Memories!
  `);
  console.log('--- NOTIFICATION SENT ---');
  
  return true;
};
