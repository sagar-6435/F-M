import { Phone, Mail, MapPin, Instagram, MessageCircle, Loader } from "lucide-react";
import { useState, useEffect } from "react";
import { api, type Branch } from "@/lib/api";

const ContactPage = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [socials, setSocials] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bData = await api.getBranches();
        setBranches(bData);
        
        const socialPromises = bData.map(async (b) => {
          const s = await api.getSocialLinks(b.id);
          return { id: b.id, ...s };
        });
        
        const sData = await Promise.all(socialPromises);
        const socialMap = sData.reduce((acc, s) => ({ ...acc, [s.id]: s }), {});
        setSocials(socialMap);
      } catch (error) {
        console.error("Failed to fetch contact data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center pt-24 text-muted-foreground animate-pulse">
      <Loader className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading Branch Details...
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto max-w-4xl px-4">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.3em] text-primary font-body">Get in Touch</p>
        <h1 className="mb-12 text-center font-display text-4xl font-bold text-foreground md:text-5xl">
          Contact <span className="text-gradient-gold">Us</span>
        </h1>
        <div className="grid gap-8 md:grid-cols-2">
          {branches.map((branch) => (
            <div key={branch.id} className="rounded-2xl border border-border bg-card p-10 transition-all hover:border-primary/50 hover:glow-gold">
              <h3 className="mb-6 font-display text-2xl font-bold text-foreground text-gradient-gold">{branch.name}</h3>
              <div className="space-y-6 text-sm text-muted-foreground font-body">
                <div className="space-y-4">
                  <p className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="leading-relaxed">{branch.address}</span>
                  </p>
                  <a href={`tel:${branch.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                    <Phone className="h-5 w-5 text-primary" />
                    <span>{branch.phone}</span>
                  </a>
                  <p className="flex items-center gap-3 hover:text-primary transition-colors">
                    <Mail className="h-5 w-5 text-primary" />
                    <span>info@friendsandmemories.in</span>
                  </p>
                </div>

                <div className="pt-6 border-t border-border/50">
                  <p className="text-xs font-bold uppercase tracking-widest text-foreground mb-4">Connect With Branch</p>
                  <div className="flex gap-4">
                    {socials[branch.id]?.instagram && (
                      <a href={socials[branch.id].instagram} target="_blank" rel="noopener noreferrer" className="p-3 rounded-full border border-border transition-all hover:border-primary hover:text-primary hover:glow-gold">
                        <Instagram className="h-5 w-5" />
                      </a>
                    )}
                    <a 
                      href={`https://wa.me/91${(socials[branch.id]?.whatsapp || branch.phone).replace(/\+/g, "").replace(/\s/g, "")}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-3 rounded-full border border-border transition-all hover:border-[#25D366] hover:text-[#25D366] hover:glow-gold"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
