import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Phone, Settings } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const links = [
    { href: "/", label: "Home" },
    { href: "/gallery", label: "Gallery" },
    { href: "/booking", label: "Book Now", highlight: true },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link to="/" className="font-display text-2xl italic text-primary">
          Friends & Memories
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                link.highlight
                  ? "bg-gradient-gold text-primary-foreground glow-gold"
                  : location.pathname === link.href
                  ? "text-primary"
                  : "text-foreground hover:text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <a href="tel:+919912710932" className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors">
            <Phone className="h-4 w-4" />
            +91 99127 10932
          </a>
          <Link
            to="/admin"
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            title="Admin Dashboard"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setIsOpen(!isOpen)} className="text-foreground md:hidden">
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="border-t border-border bg-background px-4 pb-4 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setIsOpen(false)}
              className={`block py-3 text-sm font-medium ${
                link.highlight ? "text-primary" : "text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <a href="tel:+919912710932" className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            +91 99127 10932
          </a>
          <Link
            to="/admin"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 py-3 text-sm text-muted-foreground hover:text-primary"
          >
            <Settings className="h-4 w-4" />
            Admin Dashboard
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
