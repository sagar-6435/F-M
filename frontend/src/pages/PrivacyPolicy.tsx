import React from "react";
import { Shield, CheckCircle } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl font-body">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.3em] text-primary font-body">Privacy & Security</p>
        <h1 className="mb-12 text-center font-display text-4xl font-bold text-foreground md:text-5xl">
          Privacy <span className="text-gradient-gold">Policy</span>
        </h1>

        <div className="rounded-2xl border border-border bg-card p-10 space-y-10 animate-fade-in shadow-xl">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground font-display flex items-center gap-3">
              <Shield className="text-primary w-6 h-6" /> 1. Data Collection
            </h2>
            <p className="text-muted-foreground leading-relaxed">
               We collect only the essential personal information required to facilitate 
               the booking process at <strong>Friends & Memories</strong> (Varahi Mobiles). 
               This includes your name, email address, phone number, and branch preferences 
               during the booking process.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground font-display flex items-center gap-3">
              <Shield className="text-primary w-6 h-6" /> 2. Usage of Data
            </h2>
            <ul className="list-disc pl-5 space-y-3 text-muted-foreground">
              <li>To confirm your booking and keep you informed about any changes.</li>
              <li>To send booking confirmation emails and notifications via SMS/WhatsApp.</li>
              <li>To improve our website services and internal business administration.</li>
              <li>To comply with legal and regulatory obligations.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground font-display flex items-center gap-3">
               <Shield className="text-primary w-6 h-6" /> 3. Data Storage & Security
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures to protect your personal data 
              from unauthorized access, alteration, or disclosure. Your data is stored on 
              secure servers and only accessible to authorized personnel.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground font-display flex items-center gap-3">
               <Shield className="text-primary w-6 h-6" /> 4. Cookies Usage
            </h2>
            <p className="text-muted-foreground leading-relaxed">
               Our website uses cookies to enhance user experience, such as remembering your 
               branch preferences for future visits. You can disable cookies through your 
               browser settings, but this may affect certain features of the website.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground font-display flex items-center gap-3">
               <Shield className="text-primary w-6 h-6" /> 5. Third-Party Sharing
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell or trade your data to third parties. We share data only with 
              essential service providers such as:
              <ul className="list-disc pl-8 space-y-2 mt-4">
                <li><strong>Payment Processors:</strong> We use secure providers like PhonePe 
                and Razorpay for financial transactions. They handle your payment info 
                independently as per their own privacy policies.</li>
                <li><strong>Logistics Partners:</strong> If applicable, for delivery of 
                services or physical products.</li>
              </ul>
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground font-display flex items-center gap-3">
               <Shield className="text-primary w-6 h-6" /> 6. Your Rights
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              You have the right to request access to the personal information we hold 
              about you or ask for corrections or deletions. For any privacy-related 
              queries, please reach out to us at <strong>info@friendsandmemories.in</strong>.
            </p>
          </div>

          <div className="space-y-4 pt-10 border-t border-border">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-4">
              <CheckCircle className="text-primary h-6 w-6 shrink-0" />
              <p className="text-sm text-foreground italic">
                Protecting your privacy is a cornerstone of our service as we help you 
                create your finest memories.
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

export default PrivacyPolicy;
