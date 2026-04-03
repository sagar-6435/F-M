import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BRANCHES } from "@/lib/booking-data";
import { api } from "@/lib/api";
import { Eye, Clock, CheckCircle, Phone, Mail, MapPin, Calendar, LogIn, Filter, Settings, Loader, Plus, Download } from "lucide-react";

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
  createdAt?: string;
  updatedAt?: string;
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

const formatServiceName = (serviceId: string) =>
  serviceId
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

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
  const [dateFilter, setDateFilter] = useState<"today" | "yesterday" | "specific" | "all">("all");
  const [customDate, setCustomDate] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"bookings" | "manual" | "pricing" | "gallery" | "settings">("bookings");
  const [manualBooking, setManualBooking] = useState<ManualBookingForm>({
    branch: "branch-1",
    service: "party-hall",
    date: "",
    timeSlot: "",
    duration: 1,
    name: "",
    phone: "",
    email: "",
    occasion: "Birthday",
    totalPrice: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [pricingTab, setPricingTab] = useState<"services" | "cakes" | "decorations">("services");
  const [pricing, setPricing] = useState<Record<string, Record<number, number>>>({});
  const [cakes, setCakes] = useState<any[]>([]);
  const [decorations, setDecorations] = useState<any[]>([]);
  const [decorationPrice, setDecorationPrice] = useState(1500);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);
  const [newService, setNewService] = useState({ name: "", oneHour: 0, twoHours: 0, threeHours: 0 });
  const [newCake, setNewCake] = useState({ name: "", description: "", price: 0, image: "" });
  const [newDecoration, setNewDecoration] = useState({ name: "", description: "", price: 0, image: "" });
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [newTestimonialTitle, setNewTestimonialTitle] = useState("");
  const [uploadingTestimonial, setUploadingTestimonial] = useState(false);
  const [manualAvailableSlots, setManualAvailableSlots] = useState<string[]>([]);
  const [manualBookedSlots, setManualBookedSlots] = useState<string[]>([]);
  const [branchEditData, setBranchEditData] = useState({ name: "", address: "", phone: "", mapLink: "" });
  const [savingBranch, setSavingBranch] = useState(false);
  const [branchList, setBranchList] = useState<any[]>([]);

  // Sync manual booking branch with selected branch
  useEffect(() => {
    setManualBooking(prev => ({ ...prev, branch: selectedBranch }));
  }, [selectedBranch]);

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
      
      const bData = await api.getBranches();
      setBranchList(bData);
    } catch (err) {
      setError("Invalid password");
      console.error("Login error:", err);
    }
  };

  // Fetch bookings and stats when logged in or branch/filter changes
  useEffect(() => {
    if (isLoggedIn && token) {
      fetchData();
    }
  }, [isLoggedIn, token, selectedBranch, filter, dateFilter, customDate]);

  useEffect(() => {
    setManualBooking(prev => ({ ...prev, branch: selectedBranch }));
  }, [selectedBranch]);

  // Check availability for manual booking
  useEffect(() => {
    if (manualBooking.date && manualBooking.branch && manualBooking.duration && manualBooking.service) {
      checkManualAvailability();
    }
  }, [manualBooking.date, manualBooking.branch, manualBooking.duration, manualBooking.service]);

  const checkManualAvailability = async () => {
    try {
      const data = await api.getAvailableSlots(
        manualBooking.branch,
        manualBooking.date,
        manualBooking.service,
        manualBooking.duration
      );
      setManualAvailableSlots(data.availableSlots);
      setManualBookedSlots(data.bookedSlots);
      
      // If currently selected slot is not available, reset to first available
      if (!data.availableSlots.includes(manualBooking.timeSlot) || data.bookedSlots.includes(manualBooking.timeSlot)) {
        const firstAvailable = data.availableSlots.find(s => !data.bookedSlots.includes(s));
        if (firstAvailable) {
          setManualBooking(prev => ({ ...prev, timeSlot: firstAvailable }));
        }
      }
    } catch (error) {
      console.error("Error checking manual availability:", error);
    }
  };

  const fetchData = async () => {
    if (!token) {
      console.error("No token available");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      
      let startDate: string | undefined;
      let endDate: string | undefined;
      
      const getLocalIDODate = (date: Date) => {
        const offset = date.getTimezoneOffset();
        const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
        return adjustedDate.toISOString().split('T')[0];
      };

      const todayDoc = new Date();
      if (dateFilter === "today") {
        startDate = getLocalIDODate(todayDoc);
        endDate = startDate;
      } else if (dateFilter === "yesterday") {
        const yesterdayDoc = new Date(todayDoc);
        yesterdayDoc.setDate(yesterdayDoc.getDate() - 1);
        startDate = getLocalIDODate(yesterdayDoc);
        endDate = startDate;
      } else if (dateFilter === "specific" && customDate) {
        startDate = customDate;
        endDate = customDate;
      }

      const [bookingsData, statsData] = await Promise.all([
        api.getBookings(token, selectedBranch, filter === "all" ? undefined : filter, startDate, endDate),
        api.getDashboardStats(token, selectedBranch, startDate, endDate),
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
      const [pricingData, cakesData, decorationsData, decorationPriceData] = await Promise.all([
        api.getPricing(selectedBranch),
        api.getCakes(selectedBranch),
        api.getDecorations(selectedBranch),
        api.getDecorationPrice(selectedBranch),
      ]);

      setPricing(pricingData);
      setCakes(cakesData);
      setDecorations(decorationsData);
      setDecorationPrice(decorationPriceData);
      setTestimonials(await api.getTestimonials(selectedBranch));
      
      const bList = await api.getBranches();
      setBranchList(bList);
      const currentBranch = bList.find(b => b.id === selectedBranch);
      if (currentBranch) {
        setBranchEditData({
          name: currentBranch.name,
          address: currentBranch.address,
          phone: currentBranch.phone,
          mapLink: currentBranch.mapLink || ""
        });
      }
    } catch (error) {
      console.error("Error fetching pricing:", error);
    }
  };

  const handleSaveBranchDetails = async () => {
    if (!token) return;
    try {
      setSavingBranch(true);
      await api.updateBranch(token, selectedBranch, branchEditData);
      await fetchPricing(); // Refresh data
      alert("Branch details updated successfully!");
    } catch (error) {
      console.error("Error saving branch details:", error);
      setError("Failed to update branch details");
    } finally {
      setSavingBranch(false);
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

  const handleDownloadExcel = async () => {
    if (!token) return;
    try {
      setDownloadingExcel(true);
      await api.downloadBookingsExcel(token, selectedBranch);
    } catch (error) {
      console.error("Error downloading Excel:", error);
      alert("Failed to download bookings file");
    } finally {
      setDownloadingExcel(false);
    }
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
    } catch (err: any) {
      setError(err?.message || "Failed to create booking");
      console.error("Booking error:", err);
      alert(`Booking failed: ${err?.message || "Internal error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveService = async () => {
    try {
      const response = await fetch(`/api/pricing?branch=${encodeURIComponent(selectedBranch)}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ ...editValues, branch: selectedBranch }),
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
      const baseUrl = editValues.id?.startsWith("cake-") ? `/api/cakes/${editValues.id}` : "/api/cakes";
      const url = `${baseUrl}?branch=${encodeURIComponent(selectedBranch)}`;
      const method = editValues.id?.startsWith("cake-") ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ ...editValues, branch: selectedBranch }),
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
      const baseUrl = editValues.id?.startsWith("extra-") ? `/api/decorations/${editValues.id}` : "/api/decorations";
      const url = `${baseUrl}?branch=${encodeURIComponent(selectedBranch)}`;
      const method = editValues.id?.startsWith("extra-") ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ ...editValues, branch: selectedBranch }),
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
      const response = await fetch(`/api/decoration-price?branch=${encodeURIComponent(selectedBranch)}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ price: decorationPrice, branch: selectedBranch }),
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
        const response = await fetch(`/api/cakes/${id}?branch=${encodeURIComponent(selectedBranch)}`, { 
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });
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
        const response = await fetch(`/api/decorations/${id}?branch=${encodeURIComponent(selectedBranch)}`, { 
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });
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

  const handleGalleryImageUpload = async (type: "cake" | "decoration", id: string, file?: File | null) => {
    if (!file || !token) return;
    try {
      setUploadingImageId(`${type}-${id}`);
      const image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read image"));
        reader.readAsDataURL(file);
      });
      await api.updateGalleryImage(token, selectedBranch, type, id, image);
      await fetchPricing();
    } catch (error) {
      console.error("Error uploading gallery image:", error);
      setError("Failed to upload image");
    } finally {
      setUploadingImageId(null);
    }
  };

  const readFileAsDataUrl = (file?: File | null) =>
    new Promise<string>((resolve, reject) => {
      if (!file) {
        resolve("");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read image"));
      reader.readAsDataURL(file);
    });

  const handleCreateService = async () => {
    if (!token || !newService.name.trim()) return;
    const service = newService.name.trim().toLowerCase().replace(/\s+/g, "-");
    try {
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      };
      const updates = [
        { duration: 1, price: newService.oneHour },
        { duration: 2, price: newService.twoHours },
        { duration: 3, price: newService.threeHours },
      ];
      for (const update of updates) {
        await fetch(`/api/pricing?branch=${encodeURIComponent(selectedBranch)}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ service, duration: update.duration, price: update.price, branch: selectedBranch }),
        });
      }
      setNewService({ name: "", oneHour: 0, twoHours: 0, threeHours: 0 });
      await fetchPricing();
    } catch (error) {
      console.error("Error creating service:", error);
      setError("Failed to create service");
    }
  };

  const handleCreateCake = async () => {
    if (!token || !newCake.name.trim()) return;
    try {
      await fetch(`/api/cakes?branch=${encodeURIComponent(selectedBranch)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ ...newCake, branch: selectedBranch }),
      });
      setNewCake({ name: "", description: "", price: 0, image: "" });
      await fetchPricing();
    } catch (error) {
      console.error("Error creating cake:", error);
      setError("Failed to create cake");
    }
  };

  const handleCreateDecoration = async () => {
    if (!token || !newDecoration.name.trim()) return;
    try {
      await fetch(`/api/decorations?branch=${encodeURIComponent(selectedBranch)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ ...newDecoration, branch: selectedBranch }),
      });
      setNewDecoration({ name: "", description: "", price: 0, image: "" });
      await fetchPricing();
    } catch (error) {
      console.error("Error creating decoration:", error);
      setError("Failed to create decoration");
    }
  };

  const handleUploadTestimonial = async (file?: File | null) => {
    if (!token || !file) return;
    try {
      setUploadingTestimonial(true);
      const image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read image"));
        reader.readAsDataURL(file);
      });
      await api.addTestimonialImage(token, selectedBranch, image, newTestimonialTitle || undefined);
      setNewTestimonialTitle("");
      setTestimonials(await api.getTestimonials(selectedBranch));
    } catch (error) {
      console.error("Error uploading testimonial:", error);
      setError("Failed to upload testimonial image");
    } finally {
      setUploadingTestimonial(false);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!token) return;
    try {
      await api.deleteTestimonialImage(token, selectedBranch, id);
      setTestimonials(await api.getTestimonials(selectedBranch));
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      setError("Failed to delete testimonial image");
    }
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

  const filtered = bookings.filter((b) => 
    b.branch === selectedBranch && (filter === "all" || b.paymentStatus === filter)
  );

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
          <button
            onClick={() => setActiveTab("gallery")}
            className={`px-4 py-3 text-sm font-medium transition-all font-body ${
              activeTab === "gallery"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye className="inline h-4 w-4 mr-2" />
            Gallery
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-3 text-sm font-medium transition-all font-body ${
              activeTab === "settings"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Settings className="inline h-4 w-4 mr-2" />
            Settings
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
            <div className="flex gap-2 mb-8 flex-wrap">
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
              <button
                onClick={handleDownloadExcel}
                disabled={downloadingExcel}
                className="flex items-center gap-1.5 rounded-full border border-primary bg-muted px-4 py-2 text-xs font-medium text-primary transition-all hover:bg-primary/10 disabled:opacity-50 font-body"
              >
                <Download className="h-3 w-3" />
                {downloadingExcel ? "Downloading..." : "Download Excel"}
              </button>
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
            {/* Date Filters */}
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={() => setDateFilter("all")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  dateFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setDateFilter("today")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  dateFilter === "today" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setDateFilter("yesterday")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  dateFilter === "yesterday" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Yesterday
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDateFilter("specific")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    dateFilter === "specific" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  Specific Date
                </button>
                {dateFilter === "specific" && (
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                )}
              </div>
            </div>

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
                      {["ID", "Name", "Service", "Date", "Time", "Duration", "Status", "Amount", "Booked At", ""].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((b) => (
                      <tr key={b.id} className="border-b border-border hover:bg-muted transition-colors">
                        <td className="px-4 py-3 text-foreground font-medium">{b.id}</td>
                        <td className="px-4 py-3 text-foreground">{b.name}</td>
                        <td className="px-4 py-3 text-foreground capitalize">{b.service.replace('-', ' ')}</td>
                        <td className="px-4 py-3 text-muted-foreground">{b.date}</td>
                        <td className="px-4 py-3 text-muted-foreground">{b.timeSlot}</td>
                        <td className="px-4 py-3 text-muted-foreground">{b.duration}h</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
                            b.paymentStatus === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {b.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">₹{b.totalPrice.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {b.createdAt ? new Date(b.createdAt).toLocaleString() : 'N/A'}
                        </td>
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

            {/* Booking Details Modal */}
            {selectedBooking && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="font-display text-2xl font-bold text-foreground">Booking Details</h2>
                    <button
                      onClick={() => setSelectedBooking(null)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Booking Info */}
                    <div className="rounded-xl border border-border bg-muted p-4">
                      <h3 className="mb-4 font-semibold text-foreground">Booking Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Booking ID</p>
                          <p className="font-mono font-semibold text-foreground">{selectedBooking.id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Status</p>
                          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                            selectedBooking.paymentStatus === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {selectedBooking.paymentStatus}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Booked At</p>
                          <p className="text-sm text-foreground">
                            {selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Last Updated</p>
                          <p className="text-sm text-foreground">
                            {selectedBooking.updatedAt ? new Date(selectedBooking.updatedAt).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Slot Info */}
                    <div className="rounded-xl border border-border bg-muted p-4">
                      <h3 className="mb-4 font-semibold text-foreground">Slot Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Service</p>
                          <p className="font-semibold text-foreground capitalize">{selectedBooking.service.replace('-', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Date</p>
                          <p className="font-semibold text-foreground">{selectedBooking.date}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Time Slot</p>
                          <p className="font-semibold text-foreground">{selectedBooking.timeSlot}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Duration</p>
                          <p className="font-semibold text-foreground">{selectedBooking.duration} hour(s)</p>
                        </div>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="rounded-xl border border-border bg-muted p-4">
                      <h3 className="mb-4 font-semibold text-foreground">Customer Information</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Name:</span>
                          <p className="font-semibold text-foreground">{selectedBooking.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm text-foreground">{selectedBooking.phone}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm text-foreground">{selectedBooking.email}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Occasion</p>
                          <p className="text-sm text-foreground">{selectedBooking.occasion}</p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div className="rounded-xl border border-border bg-muted p-4">
                      <h3 className="mb-4 font-semibold text-foreground">Payment Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Amount</p>
                          <p className="text-2xl font-bold text-primary">₹{selectedBooking.totalPrice.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Payment Status</p>
                          <p className={`text-lg font-semibold ${
                            selectedBooking.paymentStatus === "paid" ? "text-green-600" : "text-yellow-600"
                          }`}>
                            {selectedBooking.paymentStatus.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Close Button */}
                    <button
                      onClick={() => setSelectedBooking(null)}
                      className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition-all hover:scale-105"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
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
                  {Object.keys(pricing).map((serviceId) => (
                    <option key={serviceId} value={serviceId}>
                      {formatServiceName(serviceId)}
                    </option>
                  ))}
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
                    {(() => {
                      // Sort by actual time including minutes
                      const parseToMinutes = (timeStr: string) => {
                        const match = timeStr.match(/^(\d+):(\d+)\s+(AM|PM)$/);
                        if (!match) return 0;
                        let h = parseInt(match[1]);
                        const m = parseInt(match[2]);
                        const p = match[3];
                        if (h === 12) h = 0;
                        if (p === "PM") h += 12;
                        return h * 60 + m;
                      };

                      const options = [...new Set([...manualAvailableSlots, ...manualBookedSlots])].sort((a, b) => parseToMinutes(a) - parseToMinutes(b));

                      return options.map((slot) => {
                        const isBooked = manualBookedSlots.includes(slot);
                        const isAvailable = manualAvailableSlots.includes(slot);
                        return (
                          <option key={slot} value={slot} disabled={isBooked || !isAvailable}>
                            {slot} {isBooked ? "(Booked)" : !isAvailable ? "(Unavailable)" : ""}
                          </option>
                        );
                      });
                    })()}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground font-body">Duration (hours)</label>
                  <select
                    value={manualBooking.duration}
                    onChange={(e) => {
                      const newDuration = parseInt(e.target.value);
                      setManualBooking({ ...manualBooking, duration: newDuration });
                    }}
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
                      maxLength={10}
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
                disabled={submitting || !manualBooking.date || !manualBooking.timeSlot}
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
                <div className="border border-border rounded-lg p-6 space-y-3">
                  <h3 className="font-semibold text-lg">Add New Service</h3>
                  <input
                    type="text"
                    placeholder="Service name (e.g. Couple Dining)"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded text-foreground bg-background"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      placeholder="1 Hour Price"
                      value={newService.oneHour}
                      onChange={(e) => setNewService({ ...newService, oneHour: Number(e.target.value) })}
                      className="px-3 py-2 border border-border rounded text-foreground bg-background"
                    />
                    <input
                      type="number"
                      placeholder="2 Hour Price"
                      value={newService.twoHours}
                      onChange={(e) => setNewService({ ...newService, twoHours: Number(e.target.value) })}
                      className="px-3 py-2 border border-border rounded text-foreground bg-background"
                    />
                    <input
                      type="number"
                      placeholder="3 Hour Price"
                      value={newService.threeHours}
                      onChange={(e) => setNewService({ ...newService, threeHours: Number(e.target.value) })}
                      className="px-3 py-2 border border-border rounded text-foreground bg-background"
                    />
                  </div>
                  <button onClick={handleCreateService} className="px-4 py-2 bg-primary text-primary-foreground rounded">
                    Add Service
                  </button>
                </div>
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
                                  className="w-24 px-2 py-1 border border-border rounded bg-background text-foreground caret-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                <div className="border border-border rounded-lg p-6 space-y-3">
                  <h3 className="font-semibold text-lg">Add New Cake</h3>
                  <input
                    type="text"
                    placeholder="Cake name"
                    value={newCake.name}
                    onChange={(e) => setNewCake({ ...newCake, name: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded text-foreground bg-background"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={newCake.description}
                    onChange={(e) => setNewCake({ ...newCake, description: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded text-foreground bg-background"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={newCake.price}
                    onChange={(e) => setNewCake({ ...newCake, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-border rounded text-foreground bg-background"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const image = await readFileAsDataUrl(e.target.files?.[0]);
                      setNewCake({ ...newCake, image });
                    }}
                    className="w-full text-xs text-muted-foreground"
                  />
                  <button onClick={handleCreateCake} className="px-4 py-2 bg-primary text-primary-foreground rounded">
                    Add Cake
                  </button>
                </div>
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
                            className="w-full px-3 py-2 border border-border rounded text-foreground bg-background"
                          />
                          <input
                            type="text"
                            placeholder="Description"
                            value={editValues.description || ""}
                            onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded text-foreground bg-background"
                          />
                          <div className="flex gap-2">
                            <span>₹</span>
                            <input
                              type="number"
                              value={editValues.price}
                              onChange={(e) => setEditValues({ ...editValues, price: Number(e.target.value) })}
                              className="flex-1 px-3 py-2 border border-border rounded text-foreground bg-background"
                            />
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleGalleryImageUpload("cake", cake.id, e.target.files?.[0])}
                            className="w-full text-xs text-muted-foreground"
                          />
                          {uploadingImageId === `cake-${cake.id}` && (
                            <p className="text-xs text-primary">Uploading image...</p>
                          )}
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
                <div className="border border-border rounded-lg p-6 space-y-3">
                  <h3 className="font-semibold text-lg">Add New Decoration</h3>
                  <input
                    type="text"
                    placeholder="Decoration name"
                    value={newDecoration.name}
                    onChange={(e) => setNewDecoration({ ...newDecoration, name: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded text-foreground bg-background"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={newDecoration.description}
                    onChange={(e) => setNewDecoration({ ...newDecoration, description: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded text-foreground bg-background"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={newDecoration.price}
                    onChange={(e) => setNewDecoration({ ...newDecoration, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-border rounded text-foreground bg-background"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const image = await readFileAsDataUrl(e.target.files?.[0]);
                      setNewDecoration({ ...newDecoration, image });
                    }}
                    className="w-full text-xs text-muted-foreground"
                  />
                  <button onClick={handleCreateDecoration} className="px-4 py-2 bg-primary text-primary-foreground rounded">
                    Add Decoration
                  </button>
                </div>
                <div className="border border-border rounded-lg p-6 mb-6">
                  <h3 className="font-semibold text-lg mb-4">Base Decoration Price</h3>
                  {editingId === "decoration-price" ? (
                    <div className="flex gap-2">
                      <span>₹</span>
                      <input
                        type="number"
                        value={decorationPrice}
                        onChange={(e) => setDecorationPrice(Number(e.target.value))}
                        className="flex-1 px-3 py-2 border border-border rounded bg-background text-foreground caret-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                            className="w-full px-3 py-2 border border-border rounded text-foreground bg-background"
                          />
                          <input
                            type="text"
                            placeholder="Description"
                            value={editValues.description || ""}
                            onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded text-foreground bg-background"
                          />
                          <div className="flex gap-2">
                            <span>₹</span>
                            <input
                              type="number"
                              value={editValues.price}
                              onChange={(e) => setEditValues({ ...editValues, price: Number(e.target.value) })}
                              className="flex-1 px-3 py-2 border border-border rounded text-foreground bg-background"
                            />
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleGalleryImageUpload("decoration", decoration.id, e.target.files?.[0])}
                            className="w-full text-xs text-muted-foreground"
                          />
                          {uploadingImageId === `decoration-${decoration.id}` && (
                            <p className="text-xs text-primary">Uploading image...</p>
                          )}
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

        {/* Gallery Tab */}
        {activeTab === "gallery" && (
          <div className="max-w-2xl rounded-2xl border border-border bg-card p-8 space-y-4">
            <h2 className="font-display text-2xl font-bold text-foreground">Gallery Management</h2>
            <p className="text-sm text-muted-foreground font-body">
              Upload testimonial images for this branch. These images are shown on the public gallery page.
            </p>
            <input
              type="text"
              placeholder="Optional title (e.g. Birthday Celebration)"
              value={newTestimonialTitle}
              onChange={(e) => setNewTestimonialTitle(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground placeholder:text-muted-foreground font-body focus:border-primary focus:outline-none"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleUploadTestimonial(e.target.files?.[0])}
              className="w-full text-xs text-muted-foreground"
            />
            {uploadingTestimonial && <p className="text-xs text-primary">Uploading testimonial image...</p>}
            <div className="grid gap-3 md:grid-cols-2">
              {testimonials.map((item) => (
                <div key={item.id} className="rounded-xl border border-border p-3 space-y-2">
                  <img src={item.image} alt={item.title || "Testimonial"} className="h-32 w-full rounded-lg object-cover" />
                  <p className="text-sm font-medium text-foreground">{item.title || "Customer Memory"}</p>
                  <button
                    onClick={() => handleDeleteTestimonial(item.id)}
                    className="px-3 py-1 border border-red-300 text-red-600 rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="max-w-2xl rounded-2xl border border-border bg-card p-8 space-y-6">
            <h2 className="font-display text-2xl font-bold text-foreground">Branch Settings</h2>
            <p className="text-sm text-muted-foreground font-body">
              Update the contact information and address for the selected branch.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Branch Name</label>
                <input
                  type="text"
                  value={branchEditData.name}
                  onChange={(e) => setBranchEditData({ ...branchEditData, name: e.target.value })}
                  className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground font-body focus:border-primary focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={branchEditData.phone}
                  onChange={(e) => setBranchEditData({ ...branchEditData, phone: e.target.value })}
                  className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground font-body focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Physical Address</label>
                <textarea
                  value={branchEditData.address}
                  onChange={(e) => setBranchEditData({ ...branchEditData, address: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground font-body focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Google Maps Link</label>
                <input
                  type="text"
                  value={branchEditData.mapLink}
                  onChange={(e) => setBranchEditData({ ...branchEditData, mapLink: e.target.value })}
                  className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground font-body focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleSaveBranchDetails}
              disabled={savingBranch}
              className="w-full rounded-xl bg-gradient-gold py-4 text-sm font-bold text-primary-foreground transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {savingBranch ? "Saving Changes..." : "Update Branch Details"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
