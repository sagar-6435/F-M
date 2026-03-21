import { useState } from "react";
import { CalendarIcon, Clock, Users, User, Phone, MessageSquare, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import ScrollReveal from "@/components/ScrollReveal";
import { toast } from "sonner";

const timeSlots = [
  "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM",
  "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
  "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM",
];

const serviceOptions = [
  { value: "private", label: "Private Theatre – ₹1,499" },
  { value: "experience", label: "Theatre Experience – ₹1,999" },
  { value: "party", label: "Party Theatre – ₹2,499" },
];

const BookingPage = () => {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [people, setPeople] = useState("");
  const [service, setService] = useState("");
  const [requests, setRequests] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || !name || !phone || !service) {
      toast.error("Please fill all required fields");
      return;
    }
    toast.success("Booking request submitted! We'll confirm shortly via WhatsApp.");
  };

  return (
    <main className="pt-20">
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-2xl">
          <ScrollReveal className="text-center mb-12">
            <span className="text-sm font-semibold tracking-widest uppercase text-gold">Reserve Your Spot</span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-3 text-balance">
              Book Your Experience
            </h1>
            <p className="text-muted-foreground mt-4">
              Select your preferred date, time, and package to get started.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={150}>
            <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 md:p-10 shadow-xl shadow-black/20 space-y-6">
              {/* Service */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Service *</label>
                <select
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select a package</option>
                  {serviceOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Date *</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-left flex items-center gap-2",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="w-4 h-4 text-gold" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(d) => d < new Date()}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Time Slot *</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {timeSlots.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTime(t)}
                      className={cn(
                        "text-xs py-2.5 px-2 rounded-lg border transition-all active:scale-95",
                        time === t
                          ? "gradient-gold text-primary-foreground border-transparent font-semibold"
                          : "bg-secondary border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>

              {/* Number of people */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Number of People</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={people}
                    onChange={(e) => setPeople(e.target.value)}
                    placeholder="How many guests?"
                    className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Special requests */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Special Requests</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <textarea
                    value={requests}
                    onChange={(e) => setRequests(e.target.value)}
                    rows={3}
                    placeholder="Decorations, cake, surprise setup..."
                    className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full gradient-gold text-primary-foreground py-3.5 rounded-lg font-semibold text-base inline-flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.97] transition-all shadow-lg shadow-primary/20"
              >
                Confirm Booking <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-xs text-center text-muted-foreground">
                You'll receive a confirmation via WhatsApp within 15 minutes.
              </p>
            </form>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
};

export default BookingPage;
