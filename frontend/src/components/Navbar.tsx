import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Phone } from "lucide-react";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/gallery", label: "Gallery" },
  { to: "/booking", label: "Book Now" },
  { to: "/contact", label: "Contact" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 flex items-center justify-between h-16 md:h-20">
        <Link to="/" className="font-display text-xl md:text-2xl font-bold text-gold tracking-tight">
          Friends & Memories
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors duration-200 ${
                location.pathname === link.to
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              } ${link.to === "/booking" ? "gradient-gold text-primary-foreground px-5 py-2 rounded-lg font-semibold hover:opacity-90" : ""}`}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="tel:+919912710932"
            className="flex items-center gap-2 text-sm text-gold hover:text-gold-light transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span className="hidden lg:inline">+91 99127 10932</span>
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-foreground active:scale-95 transition-transform"
          aria-label="Toggle menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-background/95 backdrop-blur-lg border-b border-border animate-fade-in">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={`text-base py-2 transition-colors ${
                  location.pathname === link.to ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <a
              href="tel:+919912710932"
              className="flex items-center gap-2 text-gold py-2"
            >
              <Phone className="w-4 h-4" />
              +91 99127 10932
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
