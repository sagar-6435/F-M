import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  MapPin, Clock, PartyPopper, Cake, Sparkles, Check, 
  CreditCard, ArrowLeft, ArrowRight, Film, User, Calendar
} from "lucide-react";
import { api, API_BASE, Branch, CakeOption, ExtraDecoration } from "../lib/api";
import { BookingData, INITIAL_BOOKING, DECORATION_PRICE } from "../lib/booking-data";
import { getEffectivePrice, getOriginalPrice, hasOffer } from "../lib/utils";

const formatServiceName = (serviceId: string) => {
  if (serviceId === "private-theatre-party-hall") return "Private Theatre + Party Hall";
  return serviceId
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

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

const STEPS = [
  "Select Branch & Service",
  "Date, Time & Details",
  "Occasion",
  "Cake Selection",
  "Extra Decorations",
  "Summary",
  "Payment",
];

const STEP_ICONS = [MapPin, Clock, PartyPopper, Cake, Sparkles, Check, CreditCard];

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
  const [lastFetchedBranch, setLastFetchedBranch] = useState<string>("");

  // Load booking state from localStorage on mount
  useEffect(() => {
    const savedBooking = localStorage.getItem('bookingState');
    const savedStep = localStorage.getItem('bookingStep');
    
    if (savedBooking) {
      try {
        const parsedBooking = JSON.parse(savedBooking);
        setBooking(parsedBooking);
      } catch (error) {
        console.error('Failed to restore booking state:', error);
      }
    }
    
    if (savedStep) {
      try {
        const parsedStep = parseInt(savedStep, 10);
        setStep(parsedStep);
      } catch (error) {
        console.error('Failed to restore booking step:', error);
      }
    }
  }, []);

  // Save booking state and step to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('bookingState', JSON.stringify(booking));
  }, [booking]);

  useEffect(() => {
    localStorage.setItem('bookingStep', String(step));
  }, [step]);

  useEffect(() => {
    const initBooking = async () => {
      try {
        const initialBranch = booking.branch || "branch-1";
        const data = await api.getBookingInit(initialBranch);
        
        setBranches(data.branches);
        setOccasions(data.occasions);
        setPricing(data.pricing);
        setCakes(data.cakes);
        setDecorations(data.decorations);
        setDecorationPrice(data.decorationPrice);
        setLastFetchedBranch(initialBranch);
        
        // Auto-select first service if only one
        const services = Object.keys(data.pricing);
        if (services.length === 1 && !booking.service) {
           setBooking(prev => ({ ...prev, service: services[0] as any, branch: initialBranch }));
        }
      } catch (error) {
        console.error("Failed to initialize booking data:", error);
      } finally {
        setLoading(false);
      }
    };
    initBooking();
  }, []);

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
          
          const services = Object.keys(data.pricing);
          const isBhimavaram = booking.branch === "branch-2" || data.branches.find(b => b.id === booking.branch)?.name.toLowerCase().includes("bhimavaram");
          
          if (services.length === 1) {
            setBooking(prev => ({ 
              ...prev, 
              service: services[0] as any,
              membersCount: (isBhimavaram && prev.membersCount > 10) ? 10 : prev.membersCount
            }));
          } else if (isBhimavaram) {
            setBooking(prev => {
              if (prev.membersCount > 10) return { ...prev, membersCount: 10 };
              return prev;
            });
          }
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
    if (booking.selectedCake) total += getEffectivePrice(booking.selectedCake);
    booking.extraDecorations.forEach((d) => (total += getEffectivePrice(d)));
    
    // Extra person charge for Branch 1
    let extraCharge = 0;
    if (booking.branch === "branch-1" && booking.membersCount > 10) {
      extraCharge = (booking.membersCount - 10) * 150;
    }
    total += extraCharge;
    return total;
  }, [booking, pricing, decorationPrice]);
  
  const advanceAmount = useMemo(() => totalPrice < 2500 ? 1000 : 1500, [totalPrice]);
  const balanceAmount = useMemo(() => totalPrice - advanceAmount, [totalPrice, advanceAmount]);


  const canNext = (): boolean => {
    switch (step) {
      case 0: return !!booking.branch && !!booking.service;
      case 1: 
        const isBhimavaram = booking.branch === "branch-2" || branches.find(b => b.id === booking.branch)?.name.toLowerCase().includes("bhimavaram");
        const isCountOk = isBhimavaram ? booking.membersCount <= 10 : true;
        return !!booking.date && !!booking.duration && !!booking.timeSlot && !!booking.name && !!booking.phone && !!booking.email && booking.membersCount > 0 && isCountOk;
      case 2: return !!booking.occasion;
      default: return true;
    }
  };

  const [paymentType, setPaymentType] = useState<'full' | 'advance'>('advance');

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (paymentMethod: 'razorpay' | 'mock' = 'razorpay') => {
    try {
      setPaymentLoading(true);
      
      const extraCharge = (booking.branch === "branch-1" && booking.membersCount > 10) ? (booking.membersCount - 10) * 150 : 0;
      const amountToPay = paymentType === 'full' ? totalPrice : advanceAmount;

      const bookingData = { 
        ...booking, 
        totalPrice, 
        extraPersonsCharge: extraCharge,
        paymentStatus: "pending",
        paymentType,
        amountPaid: 0,
        balanceAmount: paymentType === 'full' ? 0 : balanceAmount,
        phone: `+91 ${booking.phone}`
      };
      
      const createdBooking = await api.createBooking(bookingData);
      
      if (paymentMethod === 'mock') {
        const paymentResponse = await api.processMockPayment(
          createdBooking.id,
          amountToPay,
          paymentType
        );
        
        if (paymentResponse.success) {
          // Clear booking state from localStorage on successful completion
          localStorage.removeItem('bookingState');
          localStorage.removeItem('bookingStep');
          navigate("/booking-confirmed", { state: { booking: paymentResponse.booking } });
        }
      } else {
        // Load Razorpay script
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error("Failed to load Razorpay script");
        }

        const paymentResponse = await api.initiateRazorpayPayment(
          createdBooking.id,
          amountToPay,
          `91${booking.phone}`,
          paymentType,
          createdBooking // Pass complete booking details for Razorpay receipt
        );

        if (!paymentResponse.orderId) {
          throw new Error("Failed to create payment order");
        }

        // Open Razorpay checkout with UPI Intent Flow (not deprecated Collect Flow)
        const options: any = {
          key: paymentResponse.keyId,
          order_id: paymentResponse.orderId,
          amount: paymentResponse.amount,
          currency: paymentResponse.currency,
          name: "F&M Cakes & Desserts",
          description: "Cake Booking Payment",
          image: "https://razorpay.com/i/logo.png",
          notes: {
            bookingId: createdBooking.id,
            paymentType: paymentType
          },
          // Use Intent flow (recommended) - not deprecated Collect flow
          // Razorpay will show all enabled payment methods on dashboard
          timeout: 600,
          handler: (response: any) => {
            console.log("✅ Payment successful via Razorpay!", response);
            
            // Immediately clear localStorage and prepare redirect
            localStorage.removeItem('bookingState');
            localStorage.removeItem('bookingStep');
            
            // Update booking payment status in background (non-blocking)
            Promise.resolve()
              .then(() => {
                console.log("📤 Sending payment confirmation to backend...");
                return api.processMockPayment(
                  createdBooking.id,
                  amountToPay,
                  paymentType
                );
              })
              .then(() => {
                console.log("✅ Backend payment processed");
              })
              .catch((processError) => {
                console.error("⚠️ Backend processing failed (non-blocking):", processError);
              });

            // Verify payment signature with backend (non-blocking)
            Promise.resolve()
              .then(() => {
                console.log("🔐 Verifying payment signature...");
                return fetch(`${API_BASE}/payments/razorpay/callback`, {
                  method: 'POST',
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature
                  })
                });
              })
              .then((verifyRes) => {
                if (!verifyRes.ok) {
                  console.warn("⚠️ Payment verification returned status:", verifyRes.status);
                } else {
                  console.log("✅ Payment verified successfully");
                }
              })
              .catch((verifyError) => {
                console.error("⚠️ Payment verification failed (non-blocking):", verifyError);
              });

            // IMMEDIATE redirect - do not wait for verification
            console.log("🚀 Initiating redirect to booking-confirmed...");
            setPaymentLoading(false);
            
            // Use setTimeout with 0ms to ensure React state update, then navigate
            setTimeout(() => {
              try {
                console.log("📍 Executing navigate...");
                navigate("/booking-confirmed", { 
                  state: { 
                    booking: createdBooking, 
                    orderId: response.razorpay_order_id,
                    paymentId: response.razorpay_payment_id
                  },
                  replace: true
                });
              } catch (navError) {
                console.error("❌ Navigation failed:", navError);
                // Fallback: Use window.location if react-router fails
                window.location.href = "/booking-confirmed";
              }
            }, 0);
          },
          prefill: {
            name: booking.name,
            email: booking.email,
            contact: booking.phone
          },
          theme: {
            color: "#FFD700",
            backdrop_color: "rgba(0, 0, 0, 0.1)"
          },
          retry: {
            enabled: true,
            max_count: 3
          }
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.on('payment.failed', (response: any) => {
          console.error("Payment failed:", response.error);
          alert(`Payment failed: ${response.error.description}`);
          setPaymentLoading(false);
        });
        razorpay.open();
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
              {step < 5 && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-body">Total Estimation</p>
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
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-3 block text-sm font-medium text-foreground font-body">Service</label>
                <div className="grid gap-3 md:grid-cols-1">
                  {Object.keys(pricing)
                    .filter(id => id === 'private-theatre-party-hall')
                    .map((serviceId) => (
                    <button
                      key={serviceId}
                      onClick={() => update({ service: serviceId as any })}
                      className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${
                        booking.service === serviceId ? "border-primary glow-gold bg-muted" : "border-border hover:border-primary"
                      }`}
                    >
                      <Film className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <span className="font-semibold text-foreground text-sm font-body">{formatServiceName(serviceId)}</span>
                        <p className="text-[10px] text-muted-foreground font-body">Best combined experience</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Date, Time & Details (Merged) */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
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
                  <label className="mb-2 block text-sm font-medium text-foreground font-body">Members Count</label>
                  <input
                    type="number"
                    min="1"
                    max={(booking.branch === "branch-2" || branches.find(b => b.id === booking.branch)?.name.toLowerCase().includes("bhimavaram")) ? 10 : undefined}
                    value={booking.membersCount || ""}
                    onChange={(e) => {
                      let val = parseInt(e.target.value) || 0;
                      const isBhimavaram = booking.branch === "branch-2" || branches.find(b => b.id === booking.branch)?.name.toLowerCase().includes("bhimavaram");
                      if (isBhimavaram && val > 10) val = 10;
                      update({ membersCount: val });
                    }}
                    className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground font-body focus:border-primary focus:outline-none"
                  />
                  {booking.branch === "branch-1" && booking.membersCount > 10 && (
                    <p className="mt-1 text-[10px] text-primary font-body animate-pulse">
                      * Extra {(booking.membersCount - 10)} persons: +₹{(booking.membersCount - 10) * 150}
                    </p>
                  )}
                  {(booking.branch === "branch-2" || branches.find(b => b.id === booking.branch)?.name.toLowerCase().includes("bhimavaram")) && (
                    <p className="mt-1 text-[10px] text-red-500 font-bold font-body animate-bounce">
                      * Maximum 10 persons allowed for Bhimavaram branch.
                    </p>
                  )}
                </div>
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
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {availableSlots.length > 0 ? (
                      availableSlots.map((slot) => {
                        const isBooked = bookedSlots.includes(slot);
                        const displayRange = formatSlotRange(slot, booking.duration);
                        return (
                          <button
                            key={slot}
                            disabled={isBooked}
                            onClick={() => update({ timeSlot: slot })}
                            className={`rounded-xl border p-3 text-center transition-all ${
                              booking.timeSlot === slot
                                ? "border-primary bg-primary/10 text-primary glow-gold shadow-sm"
                                : isBooked
                                ? "cursor-not-allowed border-border bg-muted/50 text-muted-foreground line-through opacity-50"
                                : "border-border text-foreground hover:border-primary/50 hover:bg-muted"
                            }`}
                          >
                            <span className="block text-[10px] font-bold md:text-sm font-body">{displayRange}</span>
                          </button>
                        );
                      })
                    ) : (
                      <p className="col-span-full py-2 text-center text-xs text-muted-foreground font-body">
                        No slots available.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <h4 className="mb-4 text-sm font-semibold text-foreground font-body">Your Information</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="mb-1 text-xs text-muted-foreground font-body">Full Name</label>
                    <input
                      type="text"
                      value={booking.name}
                      onChange={(e) => update({ name: e.target.value })}
                      className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm font-body focus:border-primary focus:outline-none"
                      placeholder="Name"
                    />
                  </div>
                  <div>
                    <label className="mb-1 text-xs text-muted-foreground font-body">Phone</label>
                    <div className="flex items-center rounded-xl border border-border bg-muted overflow-hidden">
                      <span className="pl-3 pr-1 text-sm text-foreground">+91</span>
                      <input
                        type="tel"
                        value={booking.phone}
                        onChange={(e) => update({ phone: e.target.value })}
                        className="w-full bg-transparent px-2 py-2.5 text-sm font-body focus:outline-none"
                        maxLength={10}
                        placeholder="Number"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 text-xs text-muted-foreground font-body">Email</label>
                    <input
                      type="email"
                      value={booking.email}
                      onChange={(e) => update({ email: e.target.value })}
                      className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm font-body focus:border-primary focus:outline-none"
                      placeholder="Email"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Occasion */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="rounded-xl bg-primary/5 p-4 border border-primary/20">
                <p className="text-xs text-primary font-body font-semibold flex items-center gap-2">
                   <Sparkles className="h-3 w-3" /> Decoration is mandatory and included (₹{decorationPrice})
                </p>
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
                    <input
                      type="text"
                      placeholder="Please specify your occasion"
                      value={booking.customOccasion || ""}
                      onChange={(e) => update({ customOccasion: e.target.value })}
                      className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground font-body focus:border-primary focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Cake */}
          {step === 3 && (
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
                      className={`rounded-xl border overflow-hidden transition-all text-left ${
                        booking.selectedCake?.id === cake.id ? "border-primary bg-muted shadow-md" : "border-border hover:border-primary"
                      }`}
                    >
                      <div className="aspect-video bg-muted overflow-hidden relative">
                        {cake.image ? (
                          <img src={cake.image} alt={cake.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground font-body">No image</div>
                        )}
                        <div className="absolute top-2 right-2 bg-primary/90 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                           {cake.quantity || '1kg'}
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="font-bold text-foreground text-sm font-body">{cake.name}</p>
                        <p className="text-[10px] text-muted-foreground font-body line-clamp-1">{cake.description}</p>
                        <div className="flex justify-between items-center mt-2">
                          {hasOffer(cake) ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-green-500 font-body">₹{getEffectivePrice(cake)}</span>
                              <span className="text-[10px] line-through text-muted-foreground font-body">₹{getOriginalPrice(cake)}</span>
                            </div>
                          ) : (
                            <span className="text-sm font-bold text-primary font-body">₹{cake.price}</span>
                          )}
                          {booking.selectedCake?.id === cake.id && <Check className="h-4 w-4 text-primary" />}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Extra Decorations */}
          {step === 4 && (
            <div className="space-y-3">
              <p className="mb-2 text-xs text-muted-foreground font-body">Select any extras (with images):</p>
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
                    className={`w-full rounded-xl border p-3 text-left transition-all ${
                      selected ? "border-primary bg-muted" : "border-border hover:border-primary"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {item.image && (
                           <img src={item.image} alt={item.name} className="h-10 w-10 rounded-lg object-cover border border-border" />
                        )}
                        <div className={`flex h-4 w-4 items-center justify-center rounded border ${selected ? "border-primary bg-primary" : "border-border"}`}>
                          {selected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-xs font-body">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground font-body">{item.description}</p>
                        </div>
                      </div>
                      {hasOffer(item) ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-green-500 font-body">₹{getEffectivePrice(item)}</span>
                          <span className="text-[10px] line-through text-muted-foreground font-body">₹{getOriginalPrice(item)}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-primary font-body">₹{item.price}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 5: Summary */}
          {step === 5 && (
            <div className="space-y-4">
              {[
                { label: "Branch", value: branches.find((b) => b.id === booking.branch)?.name },
                { label: "Service", value: formatServiceName(booking.service || "") },
                { label: "Date", value: booking.date },
                { label: "Time", value: `${booking.timeSlot} (${booking.duration}hr)` },
                { label: "Members", value: `${booking.membersCount} Persons` },
                { label: "Name", value: booking.name },
                { label: "Occasion", value: booking.occasion === "Other" ? booking.customOccasion || "Other" : booking.occasion },
                { label: "Decoration", value: `Mandatory (+₹${decorationPrice})` },
                { 
                  label: "Cake", 
                  value: booking.selectedCake 
                    ? hasOffer(booking.selectedCake)
                      ? `${booking.selectedCake.name} (₹${getEffectivePrice(booking.selectedCake)})`
                      : `${booking.selectedCake.name} (₹${booking.selectedCake.price})`
                    : "None" 
                },
              ].map((item) => (
                <div key={item.label} className="flex justify-between border-b border-border pb-2">
                  <span className="text-xs text-muted-foreground font-body">{item.label}</span>
                  <span className="text-xs font-medium text-foreground font-body">{item.value}</span>
                </div>
              ))}
              
              {booking.branch === "branch-1" && booking.membersCount > 10 && (
                 <div className="flex justify-between border-b border-border pb-2">
                   <span className="text-xs text-primary font-bold font-body">Extra Persons (&gt;10)</span>
                   <span className="text-xs font-bold text-primary font-body">₹{(booking.membersCount - 10) * 150}</span>
                 </div>
              )}

              {booking.extraDecorations.length > 0 && (
                <div className="border-b border-border pb-2">
                  <span className="text-xs text-muted-foreground font-body">Extras</span>
                  <div className="mt-1 space-y-1">
                    {booking.extraDecorations.map((d) => (
                      <div key={d.id} className="flex justify-between">
                        <span className="text-[10px] text-foreground font-body">{d.name}</span>
                        <span className="text-[10px] text-primary font-body">
                          ₹{getEffectivePrice(d)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
                </div>
              )}
              <div className="flex justify-between pt-2">
                <span className="text-lg font-bold text-foreground font-display">Grand Total</span>
                <span className="text-lg font-bold text-primary font-display">₹{totalPrice.toLocaleString()}</span>
              </div>
              <button
                onClick={() => setStep(6)}
                className="w-full mt-6 rounded-xl bg-gradient-gold py-4 text-sm font-bold text-primary-foreground transition-all hover:scale-[1.02] glow-gold font-body"
              >
                Proceed to Payment
              </button>
              <button
                onClick={() => setStep(4)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-foreground transition-colors hover:border-primary font-body"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            </div>
          )}

          {/* Step 6: Payment Choice */}
          {step === 6 && (
             <div className="space-y-6">
               <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-primary glow-gold">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold">Secure Payment</h3>
                <p className="text-xs text-muted-foreground">Select your preferred payment plan</p>
              </div>

              <div className="grid gap-3">
                <button
                  onClick={() => setPaymentType('advance')}
                  className={`flex items-center justify-between rounded-xl border p-5 transition-all ${
                    paymentType === 'advance' ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="text-left">
                    <p className="font-bold text-sm text-foreground">Fixed Advance</p>
                    <p className="text-[10px] text-muted-foreground">Confirm your booking now</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">₹{advanceAmount.toLocaleString()}</p>
                    <p className="text-[8px] text-muted-foreground uppercase">Bal: ₹{balanceAmount.toLocaleString()}</p>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentType('full')}
                  className={`flex items-center justify-between rounded-xl border p-5 transition-all ${
                    paymentType === 'full' ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="text-left">
                    <p className="font-bold text-sm text-foreground">100% Full Payment</p>
                    <p className="text-[10px] text-muted-foreground">No balance to pay later</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">₹{totalPrice.toLocaleString()}</p>
                  </div>
                </button>
              </div>
              
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => handlePayment('razorpay')}
                  disabled={paymentLoading}
                  className="w-full rounded-xl bg-gradient-gold py-4 text-sm font-bold text-primary-foreground transition-all hover:scale-[1.02] disabled:opacity-50 font-body"
                >
                  {paymentLoading ? "Connecting..." : `Pay ₹${(paymentType === 'full' ? totalPrice : advanceAmount).toLocaleString()} Now`}
                </button>
                
                {!import.meta.env.PROD && (
                  <button
                    onClick={() => handlePayment('mock')}
                    disabled={paymentLoading}
                    className="w-full rounded-xl border border-border py-2 text-xs font-bold text-foreground transition-all hover:scale-[1.02] disabled:opacity-50 font-body"
                  >
                     (Dev Mode) Test Payment
                  </button>
                )}

                <button
                  onClick={() => {
                    setStep(5);
                    setPaymentLoading(false);
                  }}
                  disabled={paymentLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-foreground transition-colors hover:border-primary disabled:opacity-30 font-body"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              </div>
             </div>
          )}

          {/* Navigation */}
          {step < 5 && (
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary disabled:opacity-30 font-body"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={() => setStep(Math.min(6, step + 1))}
                disabled={!canNext()}
                className="flex items-center gap-2 rounded-xl bg-gradient-gold px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 font-body"
              >
                Next <ArrowRight className="h-4 w-4" />
              </button>
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
