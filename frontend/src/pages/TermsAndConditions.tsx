import React from "react";
import { Scale, CheckCircle } from "lucide-react";

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl font-body">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.3em] text-primary font-body">Legal Information</p>
        <h1 className="mb-12 text-center font-display text-4xl font-bold text-foreground md:text-5xl">
          Terms & <span className="text-gradient-gold">Conditions</span>
        </h1>

        <div className="rounded-2xl border border-border bg-card p-10 space-y-10 animate-fade-in shadow-xl">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground font-display flex items-center gap-3">
              <Scale className="text-primary w-6 h-6" /> 1. Introduction
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms and Conditions (“Terms”) govern your use of the Website and any 
              services provided by <strong>Friends & Memories</strong> (A brand powered by **Varahi Mobiles**). 
              By accessing or using our Website and booking services, you agree to be bound by these Terms. 
              If you disagree with any part, you must not use our platform or services.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground font-display flex items-center gap-3">
               <Scale className="text-primary w-6 h-6" /> 2. Services and Offerings
            </h2>
            <p className="text-muted-foreground leading-relaxed">
               Friends & Memories provides premium private theatres and party hall rentals 
               for celebrations, events, and personal viewing. All offerings, including 
               decorations, cakes, and other add-ons, are subject to availability and specific 
               branch constraints.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground font-display flex items-center gap-3">
               <Scale className="text-primary w-6 h-6" /> 3. Booking and Payments
            </h2>
            <ul className="list-disc pl-5 space-y-3 text-muted-foreground">
              <li>Bookings are confirmed only after the payment of the advance amount or the full amount, as specified during the booking process.</li>
              <li>Fixed advance amounts are required for slot blocking: ₹1,000 for total amounts under ₹2,500 and ₹1,500 for total amounts ₹2,500 and above.</li>
              <li>Payments are processed securely via our payment gateway partners (PhonePe/Razorpay).</li>
              <li>The balance amount must be paid at the venue before the start of the booking.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground font-display flex items-center gap-3">
               <Scale className="text-primary w-6 h-6" /> 4. User Responsibilities
            </h2>
            <ul className="list-disc pl-5 space-y-3 text-muted-foreground">
              <li>Users are responsible for ensuring all booking details (date, time, number of guests) are correct before proceeding to payment.</li>
              <li>Prohibited activities include smoking, consumption of alcohol, or any illegal activities within the premises of Friends & Memories.</li>
              <li>Any damage caused to the property or equipment (theatre system, furniture, decor) will be the sole responsibility of the booking user and must be compensated at actual costs.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground font-display flex items-center gap-3">
               <Scale className="text-primary w-6 h-6" /> 5. Cancellation and Rescheduling
            </h2>
            <p className="text-muted-foreground leading-relaxed">
               Please refer to our Refund & Cancellation Policy for details on cancellations. 
               Rescheduling is subject to availability and may incur additional charges depending on the time of request.
            </p>
          </div>

          <div className="space-y-4 pt-10 border-t border-border">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-4">
              <CheckCircle className="text-primary h-6 w-6 shrink-0" />
              <p className="text-sm text-foreground italic">
                Friends & Memories reserves the right to modify these terms at any time. Continued use of 
                services after such changes constitutes acceptance of the new terms.
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

export default TermsAndConditions;
