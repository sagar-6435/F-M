import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import { fetchBranches } from "@/lib/booking-data";
import Index from "./pages/Index";
import BookingPage from "./pages/BookingPage";
import BookingConfirmed from "./pages/BookingConfirmed";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPricing from "./pages/AdminPricing";
import ContactPage from "./pages/ContactPage";
import GalleryPage from "./pages/GalleryPage";
import AboutUs from "./pages/AboutUs";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import ShippingPolicy from "./pages/ShippingPolicy";
import NotFound from "./pages/NotFound";

import Loader from "@/components/Loader";

const queryClient = new QueryClient();

const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch branches from API on app load
    const initApp = async () => {
      try {
        await fetchBranches();
      } catch (error) {
        console.error("Failed to fetch branches", error);
      }
    };

    initApp();

    // Refetch branches every 30 seconds to catch any updates
    const interval = setInterval(() => {
      fetchBranches();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {loading && <Loader onComplete={() => setLoading(false)} />}
        <div className={loading ? "opacity-0" : "opacity-100 transition-opacity duration-1000"}>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Navbar />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/booking" element={<BookingPage />} />
              <Route path="/booking-confirmed" element={<BookingConfirmed />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/pricing" element={<AdminPricing />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/terms" element={<TermsAndConditions />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/refund-cancellation" element={<RefundPolicy />} />
              <Route path="/shipping-delivery" element={<ShippingPolicy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
