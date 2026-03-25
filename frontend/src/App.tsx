import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Fetch branches from API on app load
    fetchBranches();

    // Refetch branches every 30 seconds to catch any updates
    const interval = setInterval(() => {
      fetchBranches();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
