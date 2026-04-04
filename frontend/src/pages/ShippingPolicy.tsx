import React from "react";
import { Truck, CheckCircle } from "lucide-react";

const ShippingPolicy = () => {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl font-body">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.3em] text-primary font-body">Delivery Info</p>
        <h1 className="mb-12 text-center font-display text-4xl font-bold text-foreground md:text-5xl">
          Shipping & <span className="text-gradient-gold">Delivery</span>
        </h1>

        <div className="rounded-2xl border border-border bg-card p-10 space-y-10 animate-fade-in shadow-xl">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground font-display flex items-center gap-3">
              <Truck className="text-primary w-6 h-6" /> 1. Service Delivery
            </h2>
            <p className="text-muted-foreground leading-relaxed">
               As <strong>Friends & Memories</strong> (Varahi Mobiles) predominantly 
               offers private theatre and party hall services, "Shipping & Delivery" 
               refer to the fulfillment of booked services at our designated physical 
               locations. There is no physical product shipping for these bookings.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground font-display flex items-center gap-3">
               <Truck className="text-primary w-6 h-6" /> 2. Delivery Timelines
            </h2>
            <ul className="list-disc pl-5 space-y-3 text-muted-foreground">
               <li>The service is delivered immediately at the scheduled time of the booking.</li>
               <li>Additional add-ons like cakes and decorations are prepared and served within the theatre/hall at the time of the event.</li>
               <li>Customers are requested to arrive at the venue at least <strong>15 minutes</strong> before the scheduled time slot for seamless service delivery.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground font-display flex items-center gap-3">
               <Truck className="text-primary w-6 h-6" /> 3. Physical Products (If Any)
            </h2>
            <p className="text-muted-foreground leading-relaxed">
               In the case of physical product sales (like mobile accessories or other goods), 
               delivery timelines typically vary between <strong>3-5 business days</strong> depending 
               on the destination location. Shipping charges, if any, will be clearly 
               specified at the time of checkout.
            </p>
          </div>

          <div className="space-y-4 pt-10 border-t border-border">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-4">
              <CheckCircle className="text-primary h-6 w-6 shrink-0" />
              <p className="text-sm text-foreground italic">
                Our team at Friends & Memories is dedicated to ensuring a hassle-free, 
                premium experience from booking to celebration.
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

export default ShippingPolicy;
