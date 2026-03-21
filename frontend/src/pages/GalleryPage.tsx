import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";
import servicePrivate from "@/assets/service-private-theatre.jpg";
import serviceExperience from "@/assets/service-theatre-experience.jpg";
import serviceParty from "@/assets/service-party-theatre.jpg";
import heroImage from "@/assets/hero-theatre.jpg";
import ScrollReveal from "@/components/ScrollReveal";
import { useState } from "react";
import { X } from "lucide-react";

const images = [
  { src: heroImage, alt: "Premium theatre interior" },
  { src: gallery1, alt: "Friends celebrating together" },
  { src: gallery2, alt: "Romantic couple screening" },
  { src: servicePrivate, alt: "Private theatre room" },
  { src: gallery3, alt: "Kids birthday celebration" },
  { src: serviceExperience, alt: "Theatre experience setup" },
  { src: gallery4, alt: "Corporate event" },
  { src: serviceParty, alt: "Party decorations" },
];

const GalleryPage = () => {
  const [lightbox, setLightbox] = useState<number | null>(null);

  return (
    <main className="pt-20">
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <ScrollReveal className="text-center mb-14">
            <span className="text-sm font-semibold tracking-widest uppercase text-gold">Our Gallery</span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-3 text-balance">
              Moments Worth Reliving
            </h1>
          </ScrollReveal>

          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {images.map((img, i) => (
              <ScrollReveal key={i} delay={i * 80}>
                <button
                  onClick={() => setLightbox(i)}
                  className="block w-full rounded-xl overflow-hidden shadow-lg shadow-black/30 hover:shadow-xl transition-shadow active:scale-[0.98] cursor-pointer break-inside-avoid"
                >
                  <img src={img.src} alt={img.alt} className="w-full h-auto hover:scale-105 transition-transform duration-500" loading="lazy" />
                </button>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-6 right-6 text-foreground hover:text-primary transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={images[lightbox].src}
            alt={images[lightbox].alt}
            className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl animate-reveal-up"
          />
        </div>
      )}
    </main>
  );
};

export default GalleryPage;
