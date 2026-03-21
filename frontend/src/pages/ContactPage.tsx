import { Phone, MapPin, Clock, MessageCircle } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const ContactPage = () => (
  <main className="pt-20">
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <ScrollReveal className="text-center mb-14">
          <span className="text-sm font-semibold tracking-widest uppercase text-gold">Get In Touch</span>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-3 text-balance">
            Contact Us
          </h1>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Info cards */}
          <ScrollReveal>
            <div className="space-y-6">
              <div className="bg-card rounded-xl border border-border p-6 shadow-lg shadow-black/20">
                <h3 className="font-display text-lg font-semibold text-foreground mb-4">Contact Information</h3>
                <div className="space-y-4 text-sm">
                  <a href="tel:+919912710932" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                    <div className="w-10 h-10 rounded-lg gradient-gold flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">Call Us</div>
                      <div>+91 99127 10932</div>
                    </div>
                  </a>

                  <a
                    href="https://wa.me/919912710932?text=Hi!%20I%27d%20like%20to%20book%20a%20slot%20at%20Friends%20and%20Memories."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-muted-foreground hover:text-green-400 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-4 h-4 text-foreground" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">WhatsApp</div>
                      <div>Chat with us instantly</div>
                    </div>
                  </a>

                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-gold" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">Location</div>
                      <div>Friends and Memories, Hyderabad</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-gold" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">Hours</div>
                      <div>Open Daily: 10:00 AM – 11:00 PM</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* WhatsApp CTA */}
              <a
                href="https://wa.me/919912710932?text=Hi!%20I%27d%20like%20to%20book%20a%20slot%20at%20Friends%20and%20Memories."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-foreground py-3.5 rounded-xl font-semibold transition-colors active:scale-[0.97] shadow-lg"
              >
                <MessageCircle className="w-5 h-5" />
                Chat on WhatsApp
              </a>
            </div>
          </ScrollReveal>

          {/* Map */}
          <ScrollReveal delay={150}>
            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-lg shadow-black/20 h-full min-h-[400px]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3807.5!2d78.4!3d17.3!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTfCsDE4JzAwLjAiTiA3OMKwMjQnMDAuMCJF!5e0!3m2!1sen!2sin!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: 400 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Friends and Memories Location"
              />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  </main>
);

export default ContactPage;
