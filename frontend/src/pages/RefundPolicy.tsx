import React from "react";
import { RefreshCcw, Info } from "lucide-react";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl font-body">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.3em] text-primary font-body">Customer Support</p>
        <h1 className="mb-12 text-center font-display text-4xl font-bold text-foreground md:text-5xl">
          Refund & <span className="text-gradient-gold">Cancellation</span>
        </h1>

        <div className="rounded-2xl border border-border bg-card p-10 space-y-10 animate-fade-in shadow-xl">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground font-display flex items-center gap-3">
              <RefreshCcw className="text-primary w-6 h-6" /> 1. Overview
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              At <strong>Friends & Memories</strong> (Varahi Mobiles), we aim to provide 
              a smooth experience. However, since we block slots specifically for 
              your booking, we have a fixed refund and cancellation policy in place.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground font-display flex items-center gap-3">
               <RefreshCcw className="text-primary w-6 h-6" /> 2. Refund Eligibility
            </h2>
            <ul className="list-disc pl-5 space-y-3 text-muted-foreground">
              <li>Refunds are eligible only for bookings cancelled at least <strong>48 hours</strong> before the scheduled time slot slot.</li>
              <li>Requests for refunds must be made manually by contacting our customer support.</li>
              <li>A processing fee of ₹100 may apply to each cancelation and refund request.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground font-display flex items-center gap-3">
               <RefreshCcw className="text-primary w-6 h-6" /> 3. Non-Refundable Cases
            </h2>
            <ul className="list-disc pl-5 space-y-3 text-muted-foreground">
              <li>Bookings cancelled within <strong>48 hours</strong> of the scheduled time slot are strictly non-refundable.</li>
              <li>The advance payment paid for blocking the slot is generally non-refundable if the slot is not cancelled within the deadline.</li>
              <li>"Add-on" services like cakes and specific custom decorations are non-refundable if the request has already been processed with our vendors.</li>
              <li>No-shows at the venue on the day of the booking will not be eligible for any refund.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground font-display flex items-center gap-3">
               <RefreshCcw className="text-primary w-6 h-6" /> 4. Refund Processing Time
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Upon approval, refunds are processed back to the original payment method 
              within <strong>5-7 business days</strong>. The time taken for the amount 
              to reflect in your account depends on your bank/payment provider.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground font-display flex items-center gap-3">
               <RefreshCcw className="text-primary w-6 h-6" /> 5. Cancellation Conditions
            </h2>
            <p className="text-muted-foreground leading-relaxed">
               Friends & Memories reserves the right to cancel any booking due to 
               unforeseen technical issues or maintenance. In such cases, a full 
               refund will be issued to the customer or an alternative slot will 
               be offered.
            </p>
          </div>

          <div className="space-y-4 pt-10 border-t border-border">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-4">
              <Info className="text-primary h-6 w-6 shrink-0" />
              <p className="text-sm text-foreground italic">
                For any cancellation requests, please call us at <strong>+91 99127 10932</strong> 
                as soon as possible.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
           <p className="text-xs text-muted-foreground font-body">Last Updated: April 2026</p>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
