import { ArrowRight, Play, Phone, MapPin, Star, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import heroImg from "@/assets/hero-theatre.jpg";
import partyImg from "@/assets/party-hall.jpg";
import theatreImg from "@/assets/private-theatre.jpg";
import { api, type Branch } from "@/lib/api";

const Index = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const data = await api.getBranches();
        setBranches(data);
      } catch (error) {
        console.error("Failed to load branches:", error);
      } finally {
        setLoading(false);
      }
    };
    loadBranches();
  }, []);
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative flex min-h-[90vh] md:min-h-screen items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Premium private theatre" className="h-full w-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
        </div>

        <div className="container relative z-10 mx-auto px-4 pt-32 pb-12 md:pt-24 md:pb-0">
          <p className="mb-4 text-[10px] md:text-xs font-semibold uppercase tracking-[0.3em] text-primary font-body">
            Private Theatre & Party Hall
          </p>
          <h1 className="mb-6 max-w-4xl 3xl:max-w-6xl font-display text-4xl font-bold leading-tight text-foreground md:text-7xl 3xl:text-9xl">
            Create{" "}
            <span className="text-gradient-gold">Unforgettable</span>{" "}
            Memories
          </h1>
          <p className="mb-8 md:mb-10 max-w-xl 3xl:max-w-4xl text-base md:text-lg 3xl:text-3xl leading-relaxed text-muted-foreground font-body">
            Book your private theatre for birthdays, anniversaries, proposals, or just a night out with friends. Premium experience, zero compromises.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/booking"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-8 py-4 text-sm font-semibold text-primary-foreground transition-all hover:scale-105 glow-gold font-body"
            >
              Book Now <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#services"
              className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 text-sm font-medium text-foreground transition-colors hover:border-primary font-body"
            >
              <Play className="h-4 w-4" /> View Services
            </a>
          </div>
          <a href="tel:+919912710932" className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground font-body">
            <Phone className="h-4 w-4 text-primary" /> Call us: +91 99127 10932
          </a>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-24">
        <div className="container mx-auto px-4">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.3em] text-primary font-body">Our Services</p>
          <h2 className="mb-16 text-center font-display text-4xl font-bold text-foreground md:text-5xl">
            Choose Your <span className="text-gradient-gold">Experience</span>
          </h2>
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
            {[
              { id: "party-hall", img: partyImg, title: "Party Hall", desc: "Spacious, elegant halls for up to 50 guests. Perfect for birthdays, anniversaries, and celebrations.", features: ["50+ guest capacity", "Custom decorations", "Sound system included", "Catering available"] },
              { id: "private-theatre", img: theatreImg, title: "Private Theatre", desc: "Intimate cinema experience with recliner seats, Dolby sound, and 4K projection for your group.", features: ["4K projection", "Dolby Atmos sound", "Recliner seating", "Snacks & beverages"] },
            ].map((service) => (
              <div
                key={service.title}
                className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/50 hover:glow-gold"
              >
                <div className="relative h-64 overflow-hidden">
                  <img src={service.img} alt={service.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" width={800} height={600} />
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                </div>
                <div className="p-8">
                  <h3 className="mb-3 font-display text-2xl font-bold text-foreground">{service.title}</h3>
                  <p className="mb-5 text-sm leading-relaxed text-muted-foreground font-body">{service.desc}</p>
                  <ul className="mb-6 space-y-2">
                    {service.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-foreground font-body">
                        <Sparkles className="h-3 w-3 text-primary" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={`/booking?service=${service.id}`}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:scale-105 font-body"
                  >
                    Book Now <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Branches */}
      <section className="border-t border-border py-24">
        <div className="container mx-auto px-4">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.3em] text-primary font-body">Locations</p>
          <h2 className="mb-16 text-center font-display text-4xl font-bold text-foreground md:text-5xl">
            Our <span className="text-gradient-gold">Branches</span>
          </h2>
          {loading ? (
            <div className="text-center text-muted-foreground font-body">Loading branches...</div>
          ) : (
            <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
              {branches.map((branch) => (
                <div key={branch.id} className="rounded-2xl border border-border bg-card p-8 transition-all hover:border-primary">
                  <h3 className="mb-4 font-display text-xl font-bold text-foreground">{branch.name}</h3>
                  <div className="space-y-3 text-sm text-muted-foreground font-body">
                    <p className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {branch.address}
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" /> {branch.phone}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                    <span className="ml-2 text-xs text-muted-foreground font-body">4.9 (200+ reviews)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="font-display text-xl italic text-primary">Friends & Memories</p>
          <p className="mt-2 text-sm text-muted-foreground font-body">© 2026 Friends & Memories. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
