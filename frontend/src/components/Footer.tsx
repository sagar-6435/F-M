import { Link } from "react-router-dom";
import { Phone, MapPin, Clock } from "lucide-react";

const Footer = () => (
  <footer className="bg-secondary border-t border-border">
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <h3 className="font-display text-xl font-bold text-gold mb-4">Friends & Memories</h3>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
            Your premier destination for private theatre experiences and unforgettable party celebrations.
          </p>
        </div>

        <div>
          <h4 className="font-display text-lg font-semibold text-foreground mb-4">Quick Links</h4>
          <div className="flex flex-col gap-2">
            {[
              { to: "/", label: "Home" },
              { to: "/services", label: "Services" },
              { to: "/gallery", label: "Gallery" },
              { to: "/booking", label: "Book Now" },
              { to: "/contact", label: "Contact" },
            ].map((l) => (
              <Link key={l.to} to={l.to} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-display text-lg font-semibold text-foreground mb-4">Contact Info</h4>
          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            <a href="tel:+919912710932" className="flex items-center gap-2 hover:text-primary transition-colors">
              <Phone className="w-4 h-4 text-gold" /> +91 99127 10932
            </a>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gold mt-0.5" />
              <span>Friends and Memories, Hyderabad</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold" />
              <span>Open Daily: 10 AM – 11 PM</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 pt-6 border-t border-border text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Friends & Memories. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
