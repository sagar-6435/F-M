import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Phone } from "lucide-react";

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
      <div className="container 3xl:max-w-[1800px] 4xl:max-w-[2400px] mx-auto flex items-center justify-between px-4 py-4 3xl:py-8">
        <Link to="/" className="font-display text-lg md:text-2xl 3xl:text-4xl italic text-primary shrink-0 transition-opacity hover:opacity-80">
          <span className="hidden sm:inline">Friends & Memories</span>
          <span className="sm:hidden">F&M</span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-2 lg:gap-6 3xl:gap-12 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`rounded-full px-2 lg:px-5 py-2 text-xs lg:text-sm 3xl:text-xl font-medium transition-all ${link.highlight
                  ? "bg-gradient-gold text-primary-foreground glow-gold"
                  : location.pathname === link.href
                    ? "text-primary"
                    : "text-foreground hover:text-primary"
                }`}
            >
              {link.label}
            </Link>
          ))}
          <a href="tel:+919912710932" className="flex items-center gap-1 lg:gap-2 3xl:gap-4 text-xs lg:text-sm 3xl:text-xl text-foreground hover:text-primary transition-colors whitespace-nowrap">
            <Phone className="h-3 w-3 lg:h-4 lg:w-4 3xl:h-6 3xl:w-6" />
            +91 99127 10932
          </a>
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
              className={`block py-3 text-sm font-medium ${link.highlight ? "text-primary" : "text-foreground"
                }`}
            >
              {link.label}
            </Link>
          ))}
          <a href="tel:+919912710932" className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            +91 99127 10932
          </a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
