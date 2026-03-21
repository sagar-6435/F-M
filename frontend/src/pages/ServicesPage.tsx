import { Link } from "react-router-dom";
import { ArrowRight, Users, Clock, Tv, Music, Gift, Star } from "lucide-react";
import servicePrivate from "@/assets/service-private-theatre.jpg";
import serviceExperience from "@/assets/service-theatre-experience.jpg";
import serviceParty from "@/assets/service-party-theatre.jpg";
import ScrollReveal from "@/components/ScrollReveal";

const services = [
  {
    title: "Private Theatre",
    image: servicePrivate,
    price: "₹1,499",
    duration: "3 Hours",
    capacity: "Up to 10 people",
    features: ["4K Projector & Dolby Sound", "Recliner seating", "Complimentary snacks", "Bluetooth connectivity", "Custom lighting"],
    desc: "Perfect for intimate movie nights, birthdays, and anniversary celebrations. Enjoy a fully private cinema experience with your own group.",
  },
  {
    title: "Theatre Experience",
    image: serviceExperience,
    price: "₹1,999",
    duration: "3 Hours",
    capacity: "Up to 20 people",
    features: ["Giant 150\" screen", "7.1 Surround sound", "Premium recliners", "Fog machine effects", "OTT platform access"],
    desc: "The ultimate cinematic experience with professional-grade AV equipment. Ideal for movie premieres, watch parties, and corporate screenings.",
  },
  {
    title: "Party Theatre",
    image: serviceParty,
    price: "₹2,499",
    duration: "4 Hours",
    capacity: "Up to 30 people",
    features: ["Full decoration setup", "DJ & party lights", "Cake table arrangement", "Photo booth corner", "Customizable themes"],
    desc: "Transform our space into your dream party venue. Complete with decorations, music, and everything you need for a spectacular celebration.",
  },
];

const ServicesPage = () => (
  <main className="pt-20">
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <ScrollReveal className="text-center mb-16">
          <span className="text-sm font-semibold tracking-widest uppercase text-gold">Our Services</span>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-3 text-balance">
            Choose Your Experience
          </h1>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            From intimate movie nights to grand celebrations — we have the perfect space for every occasion.
          </p>
        </ScrollReveal>

        <div className="flex flex-col gap-16">
          {services.map((s, i) => (
            <ScrollReveal key={s.title} delay={100}>
              <div className={`flex flex-col ${i % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"} gap-8 bg-card rounded-2xl border border-border overflow-hidden shadow-xl shadow-black/20`}>
                <div className="lg:w-1/2 h-64 lg:h-auto relative overflow-hidden">
                  <img src={s.image} alt={s.title} className="w-full h-full object-cover" />
                  <div className="absolute top-4 left-4 gradient-gold text-primary-foreground text-sm font-bold px-4 py-2 rounded-lg">
                    {s.price}
                  </div>
                </div>
                <div className="lg:w-1/2 p-6 md:p-10 flex flex-col justify-center">
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">{s.title}</h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{s.desc}</p>

                  <div className="flex flex-wrap gap-4 mb-6 text-sm">
                    <span className="flex items-center gap-1.5 text-gold"><Clock className="w-4 h-4" /> {s.duration}</span>
                    <span className="flex items-center gap-1.5 text-gold"><Users className="w-4 h-4" /> {s.capacity}</span>
                  </div>

                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8">
                    {s.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Star className="w-3.5 h-3.5 text-gold flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/booking"
                    className="gradient-gold text-primary-foreground px-6 py-3 rounded-lg font-semibold text-sm inline-flex items-center gap-2 hover:opacity-90 active:scale-[0.97] transition-all self-start shadow-lg shadow-primary/20"
                  >
                    Book Now <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  </main>
);

export default ServicesPage;
