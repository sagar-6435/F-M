import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, MapPin, Film, PartyPopper, Calendar, Clock, User, Cake, Sparkles, CreditCard } from "lucide-react";
import {
  BookingData, INITIAL_BOOKING,
  OCCASIONS, CAKE_OPTIONS,
  EXTRA_DECORATIONS, TIME_SLOTS, BASE_PRICES, DECORATION_PRICE,
  type CakeOption, type ExtraDecoration, type TimeSlot,
} from "@/lib/booking-data";
import { api, type Branch } from "@/lib/api";

const STEPS = [
  "Select Branch & Service",
  "Date & Time",
  "Your Details",
  "Occasion",
  "Cake Selection",
  "Extra Decorations",
  "Summary",
  "Payment",
];

const STEP_ICONS = [MapPin, Calendar, User, PartyPopper, Cake, Sparkles, Check, CreditCard];
const formatServiceName = (serviceId: string) =>
  serviceId
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
const parse12HourTime = (timeString: string) => {
  const match = timeString.trim().match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();
  if (hours === 12) hours = 0;
  if (period === "PM") hours += 12;
  return hours * 60 + minutes;
};
const to12HourTime = (minutes: number) => {
  const normalized = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const period = normalized >= 12 * 60 ? "PM" : "AM";
  const hour24 = Math.floor(normalized / 60);
  const hour12 = hour24 % 12 || 12;
  const mins = normalized % 60;
  return `${hour12}:${String(mins).padStart(2, "0")} ${period}`;
};
const formatSlotRange = (startTime: string, durationHours: number) => {
  const startMinutes = parse12HourTime(startTime);
  if (startMinutes === null) return startTime;
  const endMinutes = startMinutes + durationHours * 60;
  return `${startTime} - ${to12HourTime(endMinutes)}`;
};

const BookingPage = () => {
  const [step, setStep] = useState(0);
  const [booking, setBooking] = useState<BookingData>({ ...INITIAL_BOOKING });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [occasions, setOccasions] = useState<string[]>([]);
  const [cakes, setCakes] = useState<CakeOption[]>([]);
  const [decorations, setDecorations] = useState<ExtraDecoration[]>([]);
  const [pricing, setPricing] = useState<Record<string, Record<number, number>>>({});
  const [decorationPrice, setDecorationPrice] = useState(DECORATION_PRICE);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const serviceParam = searchParams.get("service");
    if (serviceParam === "party-hall" || serviceParam === "private-theatre") {
      setBooking((prev) => ({ ...prev, service: serviceParam }));
    }
  }, [searchParams]);



  const [lastFetchedBranch, setLastFetchedBranch] = useState<string>("");

  useEffect(() => {
    const initBooking = async () => {
      try {
        // Use either the branch from existing booking, or default to branch-1
        const initialBranch = booking.branch || "branch-1";
        const data = await api.getBookingInit(initialBranch);
        
        setBranches(data.branches);
        setOccasions(data.occasions);
        setPricing(data.pricing);
        setCakes(data.cakes);
        setDecorations(data.decorations);
        setDecorationPrice(data.decorationPrice);
        setLastFetchedBranch(initialBranch);
      } catch (error) {
        console.error("Failed to initialize booking data:", error);
      } finally {
        setLoading(false);
      }
    };
    initBooking();
  }, []);

  // Update branch-specific data when branch changes (after initial load)
  useEffect(() => {
    if (!loading && booking.branch && booking.branch !== lastFetchedBranch) {
      const loadBranchData = async () => {
        try {
          const data = await api.getBookingInit(booking.branch);
          setPricing(data.pricing);
          setCakes(data.cakes);
          setDecorations(data.decorations);
          setDecorationPrice(data.decorationPrice);
          setLastFetchedBranch(booking.branch);
        } catch (error) {
          console.error("Failed to update branch data:", error);
        }
      };
      loadBranchData();
    }
  }, [booking.branch, loading, lastFetchedBranch]);

  useEffect(() => {
    if (booking.branch && booking.date && booking.service && booking.duration) {
      const loadSlots = async () => {
        try {
          const { availableSlots, bookedSlots } = await api.getAvailableSlots(booking.branch, booking.date, booking.service, booking.duration);
          setAvailableSlots(availableSlots);
          setBookedSlots(bookedSlots);
        } catch (error) {
          console.error("Failed to load available slots:", error);
        }
      };
      loadSlots();
    }
  }, [booking.branch, booking.date, booking.service, booking.duration]);

  const update = (partial: Partial<BookingData>) => setBooking((prev) => ({ ...prev, ...partial }));

  const totalPrice = useMemo(() => {
    let total = 0;
    if (booking.service && booking.duration) {
      total += pricing[booking.service]?.[booking.duration] || 0;
    }
    if (booking.decorationRequired) total += decorationPrice;
    if (booking.selectedCake) total += booking.selectedCake.price;
    booking.extraDecorations.forEach((d) => (total += d.price));
    return total;
  }, [booking, pricing, decorationPrice]);

  const canNext = (): boolean => {
    switch (step) {
      case 0: return !!booking.branch && !!booking.service;
      case 1: return !!booking.date && !!booking.duration && !!booking.timeSlot;
      case 2: return !!booking.name && !!booking.phone && !!booking.email;
      case 3: return !!booking.occasion;
      default: return true;
    }
  };

  const handlePayment = async (paymentMethod: 'phonepe' | 'mock' = 'phonepe') => {
    try {
      setPaymentLoading(true);
      const bookingData = { 
        ...booking, 
        totalPrice, 
        paymentStatus: "pending",
        phone: `+91 ${booking.phone}`
      };
      
      // First create the booking
      const createdBooking = await api.createBooking(bookingData);
      
      if (paymentMethod === 'mock') {
        // Use mock payment for testing
        const paymentResponse = await api.processMockPayment(
          createdBooking.id,
          totalPrice
        );
        
        if (paymentResponse.success) {
          navigate("/booking-confirmed", { state: { booking: { ...createdBooking, paymentStatus: 'paid' } } });
        }
      } else {
        // Try PhonePe payment
        const paymentResponse = await api.initiatePhonePePayment(
          createdBooking.id,
          totalPrice,
          `91${booking.phone}` // PhonePe expects country code without +
        );

        if (paymentResponse.redirectUrl) {
          // Redirect to PhonePe payment page
          window.location.href = paymentResponse.redirectUrl;
        } else {
          throw new Error("Failed to get payment redirect URL");
        }
      }
    } catch (error) {
      console.error("Payment failed:", error);
      alert(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setPaymentLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto max-w-3xl px-4">
        {loading ? (
          <div className="flex items-center justify-center min-h-screen">
            <p className="text-lg text-muted-foreground font-body">Loading booking data...</p>
          </div>
        ) : (
          <>
            {/* Progress */}
            <div className="mb-10 flex items-center justify-between overflow-x-auto pb-2">
              {STEPS.map((s, i) => {
                const Icon = STEP_ICONS[i];
                return (
                  <div key={s} className="flex flex-col items-center gap-1 min-w-[60px]">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm transition-all ${
                        i < step
                          ? "border-primary bg-primary text-primary-foreground"
                          : i === step
                          ? "border-primary text-primary glow-gold"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {i < step ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <span className="hidden text-[10px] text-muted-foreground md:block font-body">{s}</span>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-border bg-card p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold text-foreground">{STEPS[step]}</h2>
              {step < 6 && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-body">Current Total</p>
                  <p className="text-lg font-bold text-primary font-display">₹{totalPrice.toLocaleString()}</p>
                </div>
              )}
            </div>

            {/* Step 0: Branch & Service */}
            {step === 0 && (
            <div className="space-y-6">
              <div>
                <label className="mb-3 block text-sm font-medium text-foreground font-body">Select Branch</label>
                <div className="grid gap-3 md:grid-cols-2">
                  {branches.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => update({ branch: b.id })}
                      className={`rounded-xl border p-4 text-left transition-all ${
                        booking.branch === b.id ? "border-primary glow-gold bg-muted" : "border-border hover:border-primary"
                      }`}
                    >
                      <p className="font-semibold text-foreground text-sm font-body">{b.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground font-body">{b.address}</p>
                      {b.mapLink && (
                        <a
                          href={b.mapLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline font-body"
                        >
                          <MapPin className="h-3 w-3" />
                          View on Maps
                        </a>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-3 block text-sm font-medium text-foreground font-body">Select Service</label>
                <div className="grid gap-3 md:grid-cols-2">
                  {Object.keys(pricing).map((serviceId) => (
                    <button
                      key={serviceId}
                      onClick={() => update({ service: serviceId as any })}
                      className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${
                        booking.service === serviceId ? "border-primary glow-gold bg-muted" : "border-border hover:border-primary"
                      }`}
                    >
                      {serviceId === "party-hall" ? (
                        <PartyPopper className="h-5 w-5 text-primary" />
                      ) : (
                        <Film className="h-5 w-5 text-primary" />
                      )}
                      <span className="font-semibold text-foreground text-sm font-body">{formatServiceName(serviceId)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Date & Time */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground font-body">Select Date</label>
                <input
                  type="date"
                  value={booking.date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => update({ date: e.target.value, timeSlot: "" })}
                  className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground font-body focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground font-body">Duration</label>
                <div className="flex gap-3">
                  {[1, 2, 3].map((d) => (
                    <button
                      key={d}
                      onClick={() => update({ duration: d, timeSlot: "" })}
                      className={`flex-1 rounded-xl border py-3 text-sm font-medium transition-all font-body ${
                        booking.duration === d ? "border-primary bg-muted text-primary" : "border-border text-foreground hover:border-primary/50"
                      }`}
                    >
                      {d} Hour{d > 1 ? "s" : ""}
                    </button>
                  ))}
                </div>
              </div>
              {booking.duration > 0 && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground font-body">Available Time Slots</label>
                  <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
                    {(() => {
                      const slotsByDuration: Record<number, string[]> = {
                        1: ['10:00 AM', '11:30 AM', '1:00 PM', '2:30 PM', '4:00 PM', '5:30 PM', '7:00 PM', '8:30 PM', '10:00 PM'],
                        2: ['10:00 AM', '12:30 PM', '3:00 PM', '5:30 PM', '8:00 PM'],
                        3: ['10:00 AM', '1:30 PM', '5:00 PM', '8:30 PM']
                      };
                      
                      const slotsToDisplay = slotsByDuration[booking.duration] || [];

                      return slotsToDisplay.map((slot) => {
                        const isBooked = bookedSlots.includes(slot);
                        const isAvailable = availableSlots.includes(slot);
                        
                        const startTime = slot;
                        const startMinutes = parse12HourTime(startTime);
                        const endMinutes = startMinutes! + booking.duration * 60;
                        const endTime = to12HourTime(endMinutes);
                        const displaySlot = `${startTime} - ${endTime}`;

                        return (
                          <button
                            key={slot}
                            disabled={!isAvailable || isBooked}
                            onClick={() => update({ timeSlot: slot })}
                            className={`rounded-xl border p-3 text-center transition-all ${
                              booking.timeSlot === slot
                                ? "border-primary bg-primary/10 text-primary glow-gold shadow-sm"
                                : isBooked
                                ? "cursor-not-allowed border-border bg-muted/50 text-muted-foreground line-through opacity-50"
                                : !isAvailable
                                ? "cursor-not-allowed border-dashed border-border bg-muted/30 text-muted-foreground opacity-50"
                                : "border-border text-foreground hover:border-primary/50 hover:bg-muted"
                            }`}
                          >
                            <span className="block text-[10px] font-bold md:text-sm font-body">{displaySlot}</span>
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: User Info */}
          {step === 2 && (
            <div className="space-y-4">
              {[
                { key: "name", label: "Full Name", type: "text", placeholder: "Enter your name" },
                { key: "phone", label: "Phone Number", type: "tel", placeholder: "XXXXX XXXXX" },
                { key: "email", label: "Email", type: "email", placeholder: "you@example.com" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="mb-2 block text-sm font-medium text-foreground font-body">{field.label}</label>
                  {field.key === "phone" ? (
                    <div className="flex items-center rounded-xl border border-border bg-muted overflow-hidden">
                      <span className="px-4 py-3 text-foreground font-body">+91</span>
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        value={(booking as any)[field.key]}
                        onChange={(e) => update({ [field.key]: e.target.value })}
                        className="flex-1 bg-muted px-4 py-3 text-foreground placeholder:text-muted-foreground font-body focus:outline-none"
                        maxLength={10}
                      />
                    </div>
                  ) : (
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={(booking as any)[field.key]}
                      onChange={(e) => update({ [field.key]: e.target.value })}
                      className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground placeholder:text-muted-foreground font-body focus:border-primary focus:outline-none"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Occasion */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground font-body">Need Decoration?</label>
                <div className="flex gap-3">
                  {[true, false].map((val) => (
                    <button
                      key={String(val)}
                      onClick={() => update({ decorationRequired: val })}
                      className={`flex-1 rounded-xl border py-3 text-sm font-medium transition-all font-body ${
                        booking.decorationRequired === val ? "border-primary bg-muted text-primary" : "border-border text-foreground hover:border-primary"
                      }`}
                    >
                      {val ? `Yes (+₹${decorationPrice})` : "No"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-3 block text-sm font-medium text-foreground font-body">Select Occasion</label>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {occasions.map((o) => (
                    <button
                      key={o}
                      onClick={() => update({ occasion: o })}
                      className={`rounded-xl border py-3 text-xs font-medium transition-all font-body ${
                        booking.occasion === o ? "border-primary bg-muted text-primary" : "border-border text-foreground hover:border-primary"
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
                {booking.occasion === "Other" && (
                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-foreground font-body">Please specify your occasion</label>
                    <input
                      type="text"
                      placeholder="Enter your occasion"
                      value={booking.customOccasion || ""}
                      onChange={(e) => update({ customOccasion: e.target.value })}
                      className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground placeholder:text-muted-foreground font-body focus:border-primary focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Cake */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground font-body">Would you like a cake?</label>
                <div className="flex gap-3">
                  {[true, false].map((val) => (
                    <button
                      key={String(val)}
                      onClick={() => update({ cakeRequired: val, selectedCake: val ? booking.selectedCake : null })}
                      className={`flex-1 rounded-xl border py-3 text-sm font-medium transition-all font-body ${
                        booking.cakeRequired === val ? "border-primary bg-muted text-primary" : "border-border text-foreground hover:border-primary/50"
                      }`}
                    >
                      {val ? "Yes" : "No, thanks"}
                    </button>
                  ))}
                </div>
              </div>
              {booking.cakeRequired && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cakes.map((cake) => (
                    <button
                      key={cake.id}
                      onClick={() => update({ selectedCake: cake })}
                      className={`rounded-xl border overflow-hidden transition-all ${
                        booking.selectedCake?.id === cake.id ? "border-primary bg-muted" : "border-border hover:border-primary"
                      }`}
                    >
                      <div className="aspect-square bg-muted overflow-hidden">
                        {cake.image ? (
                          <img
                            src={cake.image}
                            alt={cake.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground font-body">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="font-semibold text-foreground text-sm font-body">{cake.name}</p>
                        <p className="text-xs text-muted-foreground font-body mt-1">{cake.description}</p>
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-sm font-bold text-primary font-body">₹{cake.price}</span>
                          {booking.selectedCake?.id === cake.id && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Extra Decorations */}
          {step === 5 && (
            <div className="space-y-2">
              <p className="mb-4 text-sm text-muted-foreground font-body">Select any extras you'd like to add:</p>
              {decorations.map((item) => {
                const selected = booking.extraDecorations.some((d) => d.id === item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      const extras = selected
                        ? booking.extraDecorations.filter((d) => d.id !== item.id)
                        : [...booking.extraDecorations, item];
                      update({ extraDecorations: extras });
                    }}
                    className={`w-full rounded-xl border p-4 text-left transition-all ${
                      selected ? "border-primary bg-muted" : "border-border hover:border-primary"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="h-12 w-12 rounded-lg object-cover" />
                        ) : null}
                        <div className={`flex h-5 w-5 items-center justify-center rounded border ${selected ? "border-primary bg-primary" : "border-border"}`}>
                          {selected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm font-body">{item.name}</p>
                          <p className="text-xs text-muted-foreground font-body">{item.description}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-primary font-body">₹{item.price}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 6: Summary */}
          {step === 6 && (
            <div className="space-y-4">
              {[
                { label: "Branch", value: branches.find((b) => b.id === booking.branch)?.name },
                { label: "Service", value: formatServiceName(booking.service || "") },
                { label: "Date", value: booking.date },
                { label: "Time", value: `${booking.timeSlot} (${booking.duration}hr)` },
                { label: "Name", value: booking.name },
                { label: "Phone", value: booking.phone },
                { label: "Email", value: booking.email },
                { label: "Occasion", value: booking.occasion === "Other" ? booking.customOccasion || "Other" : booking.occasion },
                { label: "Decoration", value: booking.decorationRequired ? `Yes (+₹${decorationPrice})` : "No" },
                { label: "Cake", value: booking.selectedCake ? `${booking.selectedCake.name} (₹${booking.selectedCake.price})` : "None" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between border-b border-border pb-2">
                  <span className="text-sm text-muted-foreground font-body">{item.label}</span>
                  <span className="text-sm font-medium text-foreground font-body">{item.value}</span>
                </div>
              ))}
              {booking.extraDecorations.length > 0 && (
                <div className="border-b border-border pb-2">
                  <span className="text-sm text-muted-foreground font-body">Extras</span>
                  <div className="mt-1 space-y-1">
                    {booking.extraDecorations.map((d) => (
                      <div key={d.id} className="flex justify-between">
                        <span className="text-xs text-foreground font-body">{d.name}</span>
                        <span className="text-xs text-primary font-body">₹{d.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between pt-2">
                <span className="text-lg font-bold text-foreground font-display">Total</span>
                <span className="text-lg font-bold text-primary font-display">₹{totalPrice.toLocaleString()}</span>
              </div>
              <button
                onClick={() => setStep(7)}
                className="w-full mt-6 rounded-xl bg-gradient-gold py-4 text-sm font-bold text-primary-foreground transition-all hover:scale-[1.02] glow-gold font-body"
              >
                Proceed to Payment
              </button>
            </div>
          )}

          {/* Step 7: Payment */}
          {step === 7 && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-primary glow-gold">
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground font-display">₹{totalPrice.toLocaleString()}</p>
                <p className="mt-1 text-sm text-muted-foreground font-body">Total amount to pay</p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => handlePayment('phonepe')}
                  disabled={paymentLoading}
                  className="w-full rounded-xl bg-gradient-gold py-4 text-sm font-bold text-primary-foreground transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 glow-gold font-body"
                >
                  {paymentLoading ? "Processing..." : `Pay ₹${totalPrice.toLocaleString()} with PhonePe`}
                </button>
                
                <button
                  onClick={() => handlePayment('mock')}
                  disabled={paymentLoading}
                  className="w-full rounded-xl border border-border py-4 text-sm font-bold text-foreground transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 font-body"
                >
                  {paymentLoading ? "Processing..." : "Test Payment (Mock)"}
                </button>
              </div>
              
              <p className="text-xs text-muted-foreground font-body">
                Secure payment powered by PhonePe • Use mock payment for testing
              </p>
            </div>
          )}

          {/* Navigation */}
          {step < 6 && (
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary disabled:opacity-30 font-body"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              {step < 6 && (
                <button
                  onClick={() => setStep(Math.min(7, step + 1))}
                  disabled={!canNext()}
                  className="flex items-center gap-2 rounded-xl bg-gradient-gold px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 font-body"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default BookingPage;
