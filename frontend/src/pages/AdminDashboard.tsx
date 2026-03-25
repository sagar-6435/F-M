import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BRANCHES } from "@/lib/booking-data";
import { api } from "@/lib/api";
import { Eye, Clock, CheckCircle, Phone, Mail, MapPin, Calendar, LogIn, Filter, Settings, Loader, Plus } from "lucide-react";

interface Booking {
  id: string;
  branch: string;
  service: string;
  date: string;
  timeSlot: string;
  duration: number;
  name: string;
  phone: string;
  email: string;
  occasion: string;
  totalPrice: number;
  paymentStatus: "pending" | "paid";
}

interface DashboardStats {
  totalBookings: number;
  paidBookings: number;
  pendingBookings: number;
  totalRevenue: number;
}

interface ManualBookingForm {
  branch: string;
  service: string;
  date: string;
  timeSlot: string;
  duration: number;
  name: string;
  phone: string;
  email: string;
  occasion: string;
  totalPrice: number;
}

const AdminDashboard = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<"branch-1" | "branch-2">("branch-1");
  const [filter, setFilter] = useState<"all" | "pending" | "paid">("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"bookings" | "manual" | "pricing">("bookings");
  const [manualBooking, setManualBooking] = useState<ManualBookingForm>({
    branch: "branch-1",
    service: "party-hall",
    date: "",
    timeSlot: "10:00 AM",
    duration: 1,
    name: "",
    phone: "",
    email: "",
    occasion: "Birthday",
    totalPrice: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [pricingTab, setPricingTab] = useState<"services" | "cakes" | "decorations">("services");
  const [pricing, setPricing] = useState<Record<string, Record<number, number>>>({});
  const [cakes, setCakes] = useState<any[]>([]);
  const [decorations, setDecorations] = useState<any[]>([]);
  const [decorationPrice, setDecorationPrice] = useState(1500);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});

  // Check for existing token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("adminToken");
    if (savedToken) {
      setToken(savedToken);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = async () => {
    try {
      setError(null);
      const data = await api.adminLogin(password);
      setToken(data.token);
      setIsLoggedIn(true);
      setPassword("");
      localStorage.setItem("adminToken", data.token);
    } catch (err) {
      setError("Invalid password");
      console.error("Login error:", err);
    }
  };

  // Fetch bookings and stats when logged in or branch changes
  useEffect(() => {
    if (isLoggedIn && token) {
      fetchData();
    }
  }, [isLoggedIn, token, selectedBranch]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [bookingsData, statsData] = await Promise.all([
        api.getBookings(token!, selectedBranch),
        api.getDashboardStats(token!, selectedBranch),
      ]);
      setBookings(bookingsData);
      setStats(statsData);
      
      // Also fetch pricing data
      await fetchPricing();
    } catch (err) {
      setError("Failed to fetch data");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPricing = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [pricingRes, cakesRes, decorationsRes, decorationPriceRes] = await Promise.all([
        fetch("/api/pricing", { headers }),
        fetch("/api/cakes", { headers }),
        fetch("/api/decorations", { headers }),
        fetch("/api/decoration-price", { headers }),
      ]);

      if (pricingRes.ok) setPricing(await pricingRes.json());
      if (cakesRes.ok) setCakes(await cakesRes.json());
      if (decorationsRes.ok) setDecorations(await decorationsRes.json());
      if (decorationPriceRes.ok) {
        const data = await decorationPriceRes.json();
        setDecorationPrice(data.decorationPrice);
      }
    } catch (error) {
      console.error("Error fetching pricing:", error);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPassword("");
    setToken(null);
    setBookings([]);
    setStats(null);
    localStorage.removeItem("adminToken");
  };

  const handleManualBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      const bookingData = {
        ...manualBooking,
        phone: `+91 ${manualBooking.phone}`,
        paymentStatus: "paid", // Cash payment is marked as paid immediately
      };

      await api.createBooking(bookingData);
      
      // Reset form
      setManualBooking({
        branch: selectedBranch,
        service: "party-hall",
        date: "",
        timeSlot: "10:00 AM",
        duration: 1,
        name: "",
        phone: "",
        email: "",
        occasion: "Birthday",
        totalPrice: 0,
      });

      // Refresh bookings
      await fetchData();
      alert("Booking created successfully!");
      setActiveTab("bookings");
    } catch (err) {
      setError("Failed to create booking");
      console.error("Booking error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveService = async () => {
    try {
      const response = await fetch("/api/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues),
      });

      if (response.ok) {
        setPricing(await response.json());
        setEditingId(null);
      }
    } catch (error) {
      console.error("Error saving pricing:", error);
    }
  };

  const handleSaveCake = async () => {
    try {
      const url = editValues.id?.startsWith("cake-") ? `/api/cakes/${editValues.id}` : "/api/cakes";
      const method = editValues.id?.startsWith("cake-") ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues),
      });

      if (response.ok) {
        await fetchPricing();
        setEditingId(null);
      }
    } catch (error) {
      console.error("Error saving cake:", error);
    }
  };

  const handleSaveDecoration = async () => {
    try {
      const url = editValues.id?.startsWith("extra-") ? `/api/decorations/${editValues.id}` : "/api/decorations";
      const method = editValues.id?.startsWith("extra-") ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues),
      });

      if (response.ok) {
        await fetchPricing();
        setEditingId(null);
      }
    } catch (error) {
      console.error("Error saving decoration:", error);
    }
  };

  const handleSaveDecorationPrice = async () => {
    try {
      const response = await fetch("/api/decoration-price", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: decorationPrice }),
      });

      if (response.ok) {
        setEditingId(null);
      }
    } catch (error) {
      console.error("Error saving decoration price:", error);
    }
  };

  const handleDeleteCake = async (id: string) => {
    if (confirm("Are you sure you want to delete this cake?")) {
      try {
        const response = await fetch(`/api/cakes/${id}`, { method: "DELETE" });
        if (response.ok) {
          await fetchPricing();
        }
      } catch (error) {
        console.error("Error deleting cake:", error);
      }
    }
  };

  const handleDeleteDecoration = async (id: string) => {
    if (confirm("Are you sure you want to delete this decoration?")) {
      try {
        const response = await fetch(`/api/decorations/${id}`, { method: "DELETE" });
        if (response.ok) {
          await fetchPricing();
        }
      } catch (error) {
        console.error("Error deleting decoration:", error);
      }
    }
  };

  const handleEditService = (service: string, duration: number, price: number) => {
    setEditingId(`${service}-${duration}`);
    setEditValues({ service, duration, price });
  };

  const handleEditCake = (cake: any) => {
    setEditingId(cake.id || "");
    setEditValues(cake);
  };

  const handleEditDecoration = (decoration: any) => {
    setEditingId(decoration.id || "");
    setEditValues(decoration);
  };

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-24">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-primary glow-gold">
            <LogIn className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mb-6 text-center font-display text-2xl font-bold text-foreground">Admin Login</h2>
          
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleLogin()}
            className="mb-4 w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground placeholder:text-muted-foreground font-body focus:border-primary focus:outline-none"
          />
          {error && <p className="mb-4 text-sm text-red-500 font-body">{error}</p>}
          <button
            onClick={handleLogin}
            className="w-full rounded-xl bg-gradient-gold py-3 text-sm font-bold text-primary-foreground transition-all hover:scale-105 font-body"
          >
            Login
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground font-body">
            Password: admin123
          </p>
        </div>
      </div>
    );
  }

  const filtered = bookings.filter((b) => filter === "all" || b.paymentStatus === filter);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground font-body mt-1">
              {BRANCHES.find((b) => b.id === selectedBranch)?.name}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value as "branch-1" | "branch-2")}
              className="rounded-full border border-border bg-muted px-4 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
            >
              {BRANCHES.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium transition-all font-body hover:border-primary"
            >
              <LogIn className="h-3 w-3" />
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab("bookings")}
            className={`px-4 py-3 text-sm font-medium transition-all font-body ${
              activeTab === "bookings"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar className="inline h-4 w-4 mr-2" />
            Bookings
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`px-4 py-3 text-sm font-medium transition-all font-body ${
              activeTab === "manual"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Plus className="inline h-4 w-4 mr-2" />
            Manual Booking (Cash)
          </button>
          <button
            onClick={() => setActiveTab("pricing")}
            className={`px-4 py-3 text-sm font-medium transition-all font-body ${
              activeTab === "pricing"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Settings className="inline h-4 w-4 mr-2" />
            Pricing
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-100 p-4 text-sm text-red-800 font-body">
            {error}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <>
            <div className="flex gap-2 mb-8">
              {(["all", "pending", "paid"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium capitalize transition-all font-body ${
                    filter === f ? "border-primary bg-muted text-primary" : "border-border text-foreground hover:border-primary"
                  }`}
                >
                  {f === "pending" && <Clock className="h-3 w-3" />}
                  {f === "paid" && <CheckCircle className="h-3 w-3" />}
                  {f === "all" && <Filter className="h-3 w-3" />}
                  {f}
                </button>
              ))}
            </div>

            {/* Stats */}
            {stats && (
              <div className="mb-8 grid gap-4 md:grid-cols-4">
                {[
                  { label: "Total Bookings", value: stats.totalBookings, icon: Calendar },
                  { label: "Paid", value: stats.paidBookings, icon: CheckCircle },
                  { label: "Pending", value: stats.pendingBookings, icon: Clock },
                  { label: "Revenue", value: `₹${stats.totalRevenue.toLocaleString()}`, icon: CheckCircle },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-border bg-card p-6">
                    <div className="flex items-center gap-3">
                      <stat.icon className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground font-body">{stat.label}</p>
                        <p className="text-2xl font-bold text-foreground font-display">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bookings Table */}
            <div className="overflow-x-auto rounded-xl border border-border">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground font-body">
                  No bookings found
                </div>
              ) : (
                <table className="w-full text-sm font-body">
                  <thead className="border-b border-border bg-muted">
                    <tr>
                      {["ID", "Name", "Service", "Date", "Status", "Amount", ""].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((b) => (
                      <tr key={b.id} className="border-b border-border hover:bg-muted transition-colors">
                        <td className="px-4 py-3 text-foreground font-medium">{b.id}</td>
                        <td className="px-4 py-3 text-foreground">{b.name}</td>
                        <td className="px-4 py-3 text-foreground">{b.service}</td>
                        <td className="px-4 py-3 text-muted-foreground">{b.date}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            b.paymentStatus === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {b.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">₹{b.totalPrice.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => setSelectedBooking(b)} className="text-primary hover:text-primary transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* Manual Booking Tab */}
        {activeTab === "manual" && (
          <div className="max-w-2xl rounded-2xl border border-border bg-card p-8">
            <h2 className="mb-6 font-display text-2xl font-bold text-foreground">Create Manual Booking (Cash Payment)</h2>
            
            <form onSubmit={handleManualBookingSubmit} className="space-y-6">
              {/* Branch */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground font-body">Branch</label>
                <select
                  value={manualBooking.branch}
                  onChange={(e) => setManualBooking({ ...manualBooking, branch: e.target.value })}
                  className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground font-body focus:border-primary focus:outline-none"
                >
                  {BRANCHES.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Service */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground font-body">Service</label>
                <select
                  value={manualBooking.service}
                  onChange={(e) => setManualBooking({ ...manualBooking, service: e.target.value })}
                  className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground font-body focus:border-primary focus:outline-none"
                >
                  <option value="party-hall">Party Hall</option>
                  <option value="private-theatre">Private Theatre</option>
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground font-body">Date</label>
                <input
                  type="date"
                  value={manualBooking.date}
                  onChange={(e) => setManualBooking({ ...manualBooking, date: e.target.value })}
                  required
                  className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground font-body focus:border-primary focus:outline-none"
                />
              </div>

              {/* Time Slot & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground font-body">Time Slot</label>
                  <select
                    value={manualBooking.timeSlot}
                    onChange={(e) => setManualBooking({ ...manualBooking, timeSlot: e.target.value })}
                    className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground font-body focus:border-primary focus:outline-none"
                  >
                    {["10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM", "6:00 PM", "8:00 PM"].map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground font-body">Duration (hours)</label>
                  <select
                    value={manualBooking.duration}
                    onChange={(e) => setManualBooking({ ...manualBooking, duration: parseInt(e.target.value) })}
                    className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground font-body focus:border-primary focus:outline-none"
                  >
                    <option value="1">1 Hour</option>
                    <option value="2">2 Hours</option>
                    <option value="3">3 Hours</option>
                  </select>
                </div>
              </div>

              {/* Customer Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground font-body">Name</label>
                  <input
                    type="text"
                    value={manualBooking.name}
                    onChange={(e) => setManualBooking({ ...manualBooking, name: e.target.value })}
                    required
                    className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground placeholder:text-muted-foreground font-body focus:border-primary focus:outline-none"
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground font-body">Phone</label>
                  <div className="flex items-center rounded-xl border border-border bg-muted overflow-hidden">
                    <span className="px-4 py-3 text-foreground font-body">+91</span>
                    <input
                      type="tel"
                      value={manualBooking.phone}
                      onChange={(e) => setManualBooking({ ...manualBooking, phone: e.target.value })}
                      required
                      maxLength="10"
                      className="flex-1 bg-muted px-4 py-3 text-foreground placeholder:text-muted-foreground font-body focus:outline-none"
                      placeholder="10 digit number"
                    />
                  </div>
                </div>
              </div>

              {/* Email & Occasion */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground font-body">Email</label>
                  <input
                    type="email"
                    value={manualBooking.email}
                    onChange={(e) => setManualBooking({ ...manualBooking, email: e.target.value })}
                    required
                    className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground placeholder:text-muted-foreground font-body focus:border-primary focus:outline-none"
                    placeholder="customer@example.com"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground font-body">Occasion</label>
                  <select
                    value={manualBooking.occasion}
                    onChange={(e) => setManualBooking({ ...manualBooking, occasion: e.target.value })}
                    className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground font-body focus:border-primary focus:outline-none"
                  >
                    {["Birthday", "Anniversary", "Proposal", "Baby Shower", "Farewell", "Get Together", "Date Night", "Other"].map((occ) => (
                      <option key={occ} value={occ}>{occ}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Total Price */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground font-body">Total Price (₹)</label>
                <input
                  type="number"
                  value={manualBooking.totalPrice}
                  onChange={(e) => setManualBooking({ ...manualBooking, totalPrice: parseFloat(e.target.value) })}
                  required
                  min="0"
                  className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground placeholder:text-muted-foreground font-body focus:border-primary focus:outline-none"
                  placeholder="Enter total price"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-gold py-4 text-sm font-bold text-primary-foreground transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 glow-gold font-body"
              >
                {submitting ? "Creating Booking..." : "Create Booking (Cash Payment)"}
              </button>
            </form>
          </div>
        )}

        {/* Detail Modal */}
        {/* Pricing Tab */}
        {activeTab === "pricing" && (
          <div className="space-y-6">
            {/* Pricing Sub-tabs */}
            <div className="flex gap-2 border-b border-border">
              {(["services", "cakes", "decorations"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPricingTab(tab)}
                  className={`pb-3 px-4 font-medium transition-colors text-sm ${
                    pricingTab === tab
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Services */}
            {pricingTab === "services" && (
              <div className="space-y-4">
                {Object.entries(pricing).map(([service, durations]) => (
                  <div key={service} className="border border-border rounded-lg p-6">
                    <h3 className="font-semibold text-lg mb-4 capitalize">{service.replace("-", " ")}</h3>
                    <div className="space-y-3">
                      {Object.entries(durations).map(([duration, price]) => {
                        const isEditing = editingId === `${service}-${duration}`;
                        return (
                          <div key={`${service}-${duration}`} className="flex items-center justify-between bg-muted p-3 rounded-lg">
                            <span className="font-medium">{duration} Hour{duration !== "1" ? "s" : ""}</span>
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <span>₹</span>
                                <input
                                  type="number"
                                  value={editValues.price}
                                  onChange={(e) => setEditValues({ ...editValues, price: Number(e.target.value) })}
                                  className="w-24 px-2 py-1 border border-border rounded"
                                />
                                <button
                                  onClick={handleSaveService}
                                  className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="px-3 py-1 border border-border rounded text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-primary">₹{price}</span>
                                <button
                                  onClick={() => handleEditService(service, Number(duration), price)}
                                  className="px-3 py-1 border border-border rounded text-sm"
                                >
                                  Edit
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Cakes */}
            {pricingTab === "cakes" && (
              <div className="space-y-4">
                {cakes.map((cake) => {
                  const isEditing = editingId === cake.id;
                  return (
                    <div key={cake.id} className="border border-border rounded-lg p-6">
                      {isEditing ? (
                        <div className="space-y-4">
                          <input
                            type="text"
                            placeholder="Cake name"
                            value={editValues.name || ""}
                            onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded"
                          />
                          <input
                            type="text"
                            placeholder="Description"
                            value={editValues.description || ""}
                            onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded"
                          />
                          <div className="flex gap-2">
                            <span>₹</span>
                            <input
                              type="number"
                              value={editValues.price}
                              onChange={(e) => setEditValues({ ...editValues, price: Number(e.target.value) })}
                              className="flex-1 px-3 py-2 border border-border rounded"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={handleSaveCake} className="px-4 py-2 bg-primary text-primary-foreground rounded">
                              Save
                            </button>
                            <button onClick={() => setEditingId(null)} className="px-4 py-2 border border-border rounded">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-lg">{cake.name}</h4>
                            <p className="text-sm text-muted-foreground">{cake.description}</p>
                            <p className="font-bold text-primary mt-2">₹{cake.price}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditCake(cake)}
                              className="px-3 py-1 border border-border rounded text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCake(cake.id || "")}
                              className="px-3 py-1 border border-red-300 text-red-600 rounded text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Decorations */}
            {pricingTab === "decorations" && (
              <div className="space-y-4">
                <div className="border border-border rounded-lg p-6 mb-6">
                  <h3 className="font-semibold text-lg mb-4">Base Decoration Price</h3>
                  {editingId === "decoration-price" ? (
                    <div className="flex gap-2">
                      <span>₹</span>
                      <input
                        type="number"
                        value={decorationPrice}
                        onChange={(e) => setDecorationPrice(Number(e.target.value))}
                        className="flex-1 px-3 py-2 border border-border rounded"
                      />
                      <button onClick={handleSaveDecorationPrice} className="px-4 py-2 bg-primary text-primary-foreground rounded">
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="px-4 py-2 border border-border rounded">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-primary text-lg">₹{decorationPrice}</span>
                      <button
                        onClick={() => setEditingId("decoration-price")}
                        className="px-3 py-1 border border-border rounded text-sm"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>

                {decorations.map((decoration) => {
                  const isEditing = editingId === decoration.id;
                  return (
                    <div key={decoration.id} className="border border-border rounded-lg p-6">
                      {isEditing ? (
                        <div className="space-y-4">
                          <input
                            type="text"
                            placeholder="Decoration name"
                            value={editValues.name || ""}
                            onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded"
                          />
                          <input
                            type="text"
                            placeholder="Description"
                            value={editValues.description || ""}
                            onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded"
                          />
                          <div className="flex gap-2">
                            <span>₹</span>
                            <input
                              type="number"
                              value={editValues.price}
                              onChange={(e) => setEditValues({ ...editValues, price: Number(e.target.value) })}
                              className="flex-1 px-3 py-2 border border-border rounded"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={handleSaveDecoration} className="px-4 py-2 bg-primary text-primary-foreground rounded">
                              Save
                            </button>
                            <button onClick={() => setEditingId(null)} className="px-4 py-2 border border-border rounded">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-lg">{decoration.name}</h4>
                            <p className="text-sm text-muted-foreground">{decoration.description}</p>
                            <p className="font-bold text-primary mt-2">₹{decoration.price}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditDecoration(decoration)}
                              className="px-3 py-1 border border-border rounded text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteDecoration(decoration.id || "")}
                              className="px-3 py-1 border border-red-300 text-red-600 rounded text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Detail Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setSelectedBooking(null)}>
            <div className="mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-8" onClick={(e) => e.stopPropagation()}>
              <h3 className="mb-6 font-display text-xl font-bold text-foreground">Booking {selectedBooking.id}</h3>
              <div className="space-y-3">
                {[
                  { icon: <MapPin className="h-4 w-4 text-primary" />, value: BRANCHES.find((b) => b.id === selectedBooking.branch)?.name },
                  { icon: <Calendar className="h-4 w-4 text-primary" />, value: `${selectedBooking.date} at ${selectedBooking.timeSlot} (${selectedBooking.duration}hr)` },
                  { icon: <Phone className="h-4 w-4 text-primary" />, value: selectedBooking.phone },
                  { icon: <Mail className="h-4 w-4 text-primary" />, value: selectedBooking.email },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-foreground font-body">
                    {item.icon}
                    {item.value}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-between border-t border-border pt-4">
                <span className="text-sm text-muted-foreground font-body">Total</span>
                <span className="text-lg font-bold text-primary font-display">₹{selectedBooking.totalPrice.toLocaleString()}</span>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="mt-6 w-full rounded-xl border border-border py-3 text-sm font-medium text-foreground transition-colors hover:border-primary font-body"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
