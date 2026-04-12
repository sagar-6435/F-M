import { CheckCircle, ArrowRight } from "lucide-react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { BRANCHES } from "@/lib/booking-data";
import { api } from "@/lib/api";

const BookingConfirmed = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const orderId = searchParams.get("orderId");
        
        if (orderId) {
          // Check Razorpay payment status
          const statusResponse = await api.checkRazorpayPaymentStatus(orderId);
          // Extract bookingId from orderId (format: order_bookingId_timestamp)
          const parts = orderId.split('_');
          const bookingId = parts.length > 1 ? parts.slice(1, -1).join('_') : null;
          
          if (statusResponse.success && statusResponse.status === "paid") {
            // Finalize on backend (send notification etc)
            const finalizeRes = await api.processMockPayment(
              bookingId, 
              statusResponse.amount / 100 // paise to rupees
            );
            
            if (finalizeRes.success) {
               setBooking(finalizeRes.booking);
               setLoading(false);
               return;
            }
          }
          
          // If we have a bookingId but flow didn't finish, try fetching it
          if (bookingId) {
             const b = await api.getBookingById(bookingId);
             if (b) {
               setBooking(b);
               setLoading(false);
               return;
             }
          }
        }
        
        // Fallback: Get booking from location state
        const stateBooking = location.state?.booking;
        if (stateBooking) {
           // We might want to refresh from DB to get the latest
           try {
             const refreshed = await api.getBookingById(stateBooking.id);
             setBooking(refreshed);
           } catch {
             setBooking(stateBooking);
           }
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkPaymentStatus();
  }, [searchParams, location.state]);

  return (
    <div className="flex min-h-screen items-center justify-center pt-24 pb-16">
      <div className="container mx-auto max-w-lg px-4 text-center">
        <div className="rounded-2xl border border-border bg-card p-10">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 glow-gold">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">Booking Confirmed!</h1>
          <p className="mb-8 text-sm text-muted-foreground font-body">
            Thank you{booking?.name ? `, ${booking.name}` : ""}! Your booking has been confirmed.
          </p>
          {loading ? (
            <p className="text-sm text-muted-foreground font-body">Loading booking details...</p>
          ) : booking ? (
            <div className="mb-8 space-y-3 text-left">
              {[
                { label: "Booking ID", value: booking.id },
                { 
                  label: "Branch/Location", 
                  value: (() => {
                    const b = BRANCHES.find((br) => br.id === booking.branch);
                    return b ? `${b.name} (${b.address})` : booking.branch;
                  })()
                },
                { label: "Service", value: booking.service === "party-hall" ? "Party Hall" : "Private Theatre" },
                { label: "Date", value: booking.date },
                { label: "Time", value: booking.timeSlot },
                { label: "Duration", value: `${booking.duration} hour${booking.duration > 1 ? "s" : ""}` },
                { label: "Occasion", value: booking.occasion === "Other" ? booking.customOccasion || "Other" : booking.occasion },
                { label: "Cake", value: booking.cakeRequired && booking.selectedCake ? `${booking.selectedCake.name} (₹${booking.selectedCake.price})` : "None" },
                { 
                  label: "Extra Decorations", 
                  value: booking.extraDecorations && booking.extraDecorations.length > 0 
                    ? booking.extraDecorations.map((d: any) => d.name).join(", ") 
                    : "None" 
                },
                { label: "Total Price", value: `₹${booking.totalPrice?.toLocaleString()}` },
                { label: "Amount Paid", value: `₹${(booking.amountPaid || 0).toLocaleString()}` },
                { label: "Balance Remaining", value: `₹${(booking.balanceAmount || 0).toLocaleString()}`, highlight: booking.balanceAmount > 0 },
                { label: "Payment Status", value: booking.paymentStatus === "paid" ? "✓ Fully Paid" : "✓ Partially Paid (Slot Confirmed)" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between border-b border-border pb-2">
                  <span className="text-sm text-muted-foreground font-body">{item.label}</span>
                  <span className={`text-sm font-medium font-body ${(item as any).highlight ? "text-primary font-bold" : "text-foreground"}`}>{item.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mb-8 p-4 rounded-xl bg-muted">
              <p className="text-sm text-muted-foreground font-body">No booking details available. Redirecting to home...</p>
            </div>
          )}
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-8 py-3 text-sm font-semibold text-primary-foreground transition-all hover:scale-105 font-body"
          >
            Back to Home <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmed;
