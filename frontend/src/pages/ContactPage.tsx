import { Phone, Mail, MapPin } from "lucide-react";
import { BRANCHES } from "@/lib/booking-data";

const ContactPage = () => {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto max-w-3xl px-4">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.3em] text-primary font-body">Get in Touch</p>
        <h1 className="mb-12 text-center font-display text-4xl font-bold text-foreground">
          Contact <span className="text-gradient-gold">Us</span>
        </h1>
        <div className="grid gap-8 md:grid-cols-2">
          {BRANCHES.map((branch) => (
            <div key={branch.id} className="rounded-2xl border border-border bg-card p-8">
              <h3 className="mb-4 font-display text-lg font-bold text-foreground">{branch.name}</h3>
              <div className="space-y-3 text-sm text-muted-foreground font-body">
                <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{branch.address}</p>
                <a href={`tel:${branch.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-primary transition-colors"><Phone className="h-4 w-4 text-primary" />{branch.phone}</a>
                <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" />info@friendsandmemories.in</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
