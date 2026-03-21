import { Link } from "react-router-dom";
import { ArrowRight, Play, Phone } from "lucide-react";
import heroImage from "@/assets/hero-theatre.jpg";
import servicePrivate from "@/assets/service-private-theatre.jpg";
import serviceExperience from "@/assets/service-theatre-experience.jpg";
import serviceParty from "@/assets/service-party-theatre.jpg";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import ScrollReveal from "@/components/ScrollReveal";

const services = [
  {
    title: "Private Theatre",
    desc: "An intimate screening room for you and your loved ones. Perfect for birthdays, anniversaries, and special occasions.",
    image: servicePrivate,
    price: "Starting ₹1,499",
  },
  {
    title: "Theatre Experience",
    desc: "Full cinematic experience with surround sound, a massive screen, and premium recliner seating.",
    image: serviceExperience,
    price: "Starting ₹1,999",
  },
  {
    title: "Party Theatre",
    desc: "Celebrate in style with decorations, music, cake setup, and a private space for your party.",
    image: serviceParty,
    price: "Starting ₹2,499",
  },
];

const stats = [
  { value: "2,500+", label: "Happy Guests" },
  { value: "350+", label: "Events Hosted" },
  { value: "4.8★", label: "Average Rating" },
];

const HomePage = () => {
  return (
    <main>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Friends and Memories private theatre" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
        </div>

        <div className="relative container mx-auto px-4 pt-24 pb-16">
          <div className="max-w-2xl">
            <div className="animate-reveal-up">
              <span className="inline-block text-sm font-semibold tracking-widest uppercase text-gold mb-4">
                Private Theatre & Party Hall
              </span>
            </div>
            <h1 className="animate-reveal-up delay-100 font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.05] mb-6 text-balance">
              Create Unforgettable Memories
            </h1>
            <p className="animate-reveal-up delay-200 text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 max-w-lg">
              Book your private theatre for birthdays, anniversaries, proposals, or just a night out with friends. Premium experience, zero compromises.
            </p>

            <div className="animate-reveal-up delay-300 flex flex-wrap gap-4">
              <Link
                to="/booking"
                className="gradient-gold text-primary-foreground px-8 py-3.5 rounded-lg font-semibold text-base inline-flex items-center gap-2 hover:opacity-90 active:scale-[0.97] transition-all duration-200 shadow-lg shadow-primary/20"
              >
                Book Now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/services"
                className="border border-border bg-secondary text-foreground px-8 py-3.5 rounded-lg font-semibold text-base inline-flex items-center gap-2 hover:bg-muted active:scale-[0.97] transition-all duration-200"
              >
                <Play className="w-4 h-4" /> View Services
              </Link>
            </div>

            <div className="animate-reveal-up delay-400 mt-8">
              <a
                href="tel:+919912710932"
                className="inline-flex items-center gap-2 text-gold hover:text-gold-light transition-colors text-sm"
              >
                <Phone className="w-4 h-4" /> Call us: +91 99127 10932
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-secondary py-12 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            {stats.map((s, i) => (
              <ScrollReveal key={s.label} delay={i * 100} className="text-center">
                <div className="font-display text-2xl md:text-4xl font-bold text-gold">{s.value}</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">{s.label}</div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <ScrollReveal className="text-center mb-14">
            <span className="text-sm font-semibold tracking-widest uppercase text-gold">What We Offer</span>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mt-3 text-balance">
              Our Experiences
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {services.map((s, i) => (
              <ScrollReveal key={s.title} delay={i * 120}>
                <div className="group bg-card rounded-xl overflow-hidden border border-border hover:border-primary/40 transition-all duration-300 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-primary/5">
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={s.image}
                      alt={s.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute bottom-3 right-3 gradient-gold text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-md">
                      {s.price}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-xl font-bold text-foreground mb-2">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{s.desc}</p>
                    <Link
                      to="/booking"
                      className="text-sm font-semibold text-gold hover:text-gold-light transition-colors inline-flex items-center gap-1"
                    >
                      Book This <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      <section className="py-20 md:py-28 bg-secondary">
        <div className="container mx-auto px-4">
          <ScrollReveal className="text-center mb-14">
            <span className="text-sm font-semibold tracking-widest uppercase text-gold">Captured Moments</span>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mt-3 text-balance">
              Gallery
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-2 gap-4 md:gap-6 max-w-3xl mx-auto">
            {[gallery1, gallery2].map((img, i) => (
              <ScrollReveal key={i} delay={i * 150}>
                <div className="rounded-xl overflow-hidden aspect-[4/3] shadow-lg shadow-black/30">
                  <img src={img} alt={`Gallery moment ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal className="text-center mt-10" delay={300}>
            <Link
              to="/gallery"
              className="inline-flex items-center gap-2 border border-border px-6 py-3 rounded-lg text-sm font-semibold text-foreground hover:bg-muted active:scale-[0.97] transition-all"
            >
              View Full Gallery <ArrowRight className="w-4 h-4" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="gradient-gold rounded-2xl p-10 md:p-16 text-center">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4 text-balance">
                Ready to Make Memories?
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto">
                Book your private theatre today and create moments that last a lifetime.
              </p>
              <Link
                to="/booking"
                className="inline-flex items-center gap-2 bg-background text-foreground px-8 py-3.5 rounded-lg font-semibold hover:bg-secondary active:scale-[0.97] transition-all shadow-lg"
              >
                Book Now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
