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
        const transactionId = searchParams.get("transactionId");
        
        if (transactionId) {
          // Check PhonePe payment status
          const statusResponse = await api.checkPhonePePaymentStatus(transactionId);
          
          if (statusResponse.success && statusResponse.data?.state === "COMPLETED") {
            // Payment successful, booking is already created
            const bookingId = transactionId.split("-")[0];
            // You can fetch booking details here if needed
          }
        }
        
        // Get booking from location state
        const stateBooking = location.state?.booking;
        if (stateBooking) {
          setBooking(stateBooking);
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
                { label: "Branch", value: BRANCHES.find((b) => b.id === booking.branch)?.name },
                { label: "Service", value: booking.service === "party-hall" ? "Party Hall" : "Private Theatre" },
                { label: "Date", value: booking.date },
                { label: "Time", value: booking.timeSlot },
                { label: "Duration", value: `${booking.duration} hour${booking.duration > 1 ? "s" : ""}` },
                { label: "Occasion", value: booking.occasion },
                { label: "Total Paid", value: `₹${booking.totalPrice?.toLocaleString()}` },
                { label: "Payment Status", value: booking.paymentStatus === "paid" ? "✓ Paid" : "Pending" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between border-b border-border pb-2">
                  <span className="text-sm text-muted-foreground font-body">{item.label}</span>
                  <span className="text-sm font-medium text-foreground font-body">{item.value}</span>
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
