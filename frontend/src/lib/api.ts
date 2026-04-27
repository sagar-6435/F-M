// Determine API base URL - use env var if available, otherwise use production URL
const API_URL = import.meta.env.VITE_API_URL || 'https://f-m-xk1e.onrender.com/api';
export const API_BASE = API_URL;

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  mapLink?: string;
}

export interface CakeOption {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  offerPrice?: number;
  description: string;
  image?: string;
  quantity?: string;
}

export interface ExtraDecoration {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  offerPrice?: number;
  description: string;
  image?: string;
}

export interface TestimonialImage {
  id: string;
  image: string;
  title?: string;
  date?: string;
}

export const api = {
  async getBranches(): Promise<Branch[]> {
    const res = await fetch(`${API_BASE}/branches?t=${Date.now()}`);
    if (!res.ok) throw new Error("Failed to fetch branches");
    return res.json();
  },

  async getOccasions(): Promise<string[]> {
    const res = await fetch(`${API_BASE}/occasions`);
    if (!res.ok) throw new Error("Failed to fetch occasions");
    return res.json();
  },

  async getBookingInit(branchId: string): Promise<any> {
    const timestamp = Date.now();
    const res = await fetch(`${API_BASE}/bookings/init/${branchId}?t=${timestamp}`);
    if (!res.ok) throw new Error("Failed to fetch booking init data");
    return res.json();
  },

  async getCakes(branch?: string): Promise<CakeOption[]> {
    const query = new URLSearchParams();
    if (branch) query.append("branch", branch);
    query.append("t", Date.now().toString());
    const res = await fetch(`${API_BASE}/cakes?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch cakes");
    return res.json();
  },

  async getDecorations(branch?: string): Promise<ExtraDecoration[]> {
    const query = new URLSearchParams();
    if (branch) query.append("branch", branch);
    query.append("t", Date.now().toString());
    const res = await fetch(`${API_BASE}/decorations?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch decorations");
    return res.json();
  },

  async getPricing(branch?: string): Promise<Record<string, Record<number, any>>> {
    const query = new URLSearchParams();
    if (branch) query.append("branch", branch);
    query.append("t", Date.now().toString());
    const res = await fetch(`${API_BASE}/pricing?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch pricing");
    return res.json();
  },

  async getDecorationPrice(branch?: string): Promise<number> {
    const query = new URLSearchParams();
    if (branch) query.append("branch", branch);
    query.append("t", Date.now().toString());
    const res = await fetch(`${API_BASE}/decoration-price?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch decoration price");
    const data = await res.json();
    return data.decorationPrice;
  },

  async getAdminGallery(token: string, branch: string, type?: "cake" | "decoration"): Promise<any[]> {
    const params = new URLSearchParams({ branch });
    if (type) params.append("type", type);
    const res = await fetch(`${API_BASE}/admin/gallery?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch gallery");
    return res.json();
  },

  async updateGalleryImage(
    token: string,
    branch: string,
    type: "cake" | "decoration",
    id: string,
    image: string
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/gallery/${type}/${id}?branch=${encodeURIComponent(branch)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ image, branch }),
    });
    if (!res.ok) throw new Error("Failed to update gallery image");
    return res.json();
  },

  async getTestimonials(branch?: string): Promise<TestimonialImage[]> {
    const query = branch ? `?branch=${encodeURIComponent(branch)}` : "";
    const res = await fetch(`${API_BASE}/gallery/testimonials${query}`);
    if (!res.ok) throw new Error("Failed to fetch testimonials");
    return res.json();
  },

  async addTestimonialImage(
    token: string,
    branch: string,
    image: string,
    title?: string,
    date?: string
  ): Promise<TestimonialImage> {
    const res = await fetch(`${API_BASE}/admin/gallery/testimonials?branch=${encodeURIComponent(branch)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ branch, image, title, date }),
    });
    if (!res.ok) throw new Error("Failed to add testimonial image");
    return res.json();
  },

  async deleteTestimonialImage(token: string, branch: string, id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/gallery/testimonials/${id}?branch=${encodeURIComponent(branch)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to delete testimonial image");
  },

  async getHeroImages(branch: string): Promise<string[]> {
    const res = await fetch(`${API_BASE}/admin/hero-images?branch=${encodeURIComponent(branch)}`);
    if (!res.ok) throw new Error("Failed to fetch hero images");
    return res.json();
  },

  async addHeroImage(token: string, branch: string, image: string): Promise<string[]> {
    const res = await fetch(`${API_BASE}/admin/hero-images?branch=${encodeURIComponent(branch)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ image }),
    });
    if (!res.ok) throw new Error("Failed to add hero image");
    return res.json();
  },

  async deleteHeroImage(token: string, branch: string, index: number): Promise<string[]> {
    const res = await fetch(`${API_BASE}/admin/hero-images/${index}?branch=${encodeURIComponent(branch)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to delete hero image");
    return res.json();
  },

  async getBookingById(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/bookings/${id}`);
    if (!res.ok) throw new Error("Failed to fetch booking details");
    return res.json();
  },

  async createBooking(booking: any) {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(booking),
    });
    if (!res.ok) throw new Error("Failed to create booking");
    return res.json();
  },

  async getAvailableSlots(branchId: string, date: string, service: string, duration: number): Promise<{ availableSlots: string[], bookedSlots: string[] }> {
    const res = await fetch(`${API_BASE}/bookings/availability/${branchId}/${date}/${service}?duration=${duration}`);
    if (!res.ok) throw new Error("Failed to fetch available slots");
    const data = await res.json();
    return { availableSlots: data.availableSlots, bookedSlots: data.bookedSlots };
  },

  async adminLogin(password: string): Promise<{ token: string; branch: string }> {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) throw new Error("Invalid password");
    return res.json();
  },

  async getBookings(token: string, branch?: string, status?: string, startDate?: string, endDate?: string): Promise<any[]> {
    let url = `${API_BASE}/bookings`;
    const params = new URLSearchParams();
    if (branch) params.append("branch", branch);
    if (status) params.append("status", status);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch bookings");
    return res.json();
  },

  async getDashboardStats(token: string, branch?: string, startDate?: string, endDate?: string): Promise<any> {
    let url = `${API_BASE}/admin/dashboard/stats`;
    const params = new URLSearchParams();
    if (branch) params.append("branch", branch);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch statistics");
    return res.json();
  },

  async getSocialLinks(branch: string): Promise<any> {
    const res = await fetch(`${API_BASE}/catalog/social-links?branch=${encodeURIComponent(branch)}&t=${Date.now()}`);
    if (!res.ok) throw new Error("Failed to fetch social links");
    return res.json();
  },

  async updateSocialLinks(token: string, branch: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/catalog/social-links?branch=${encodeURIComponent(branch)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const dataRes = await res.json();
    if (!res.ok) {
      console.error("Server Error updating social links:", dataRes);
      throw new Error(dataRes.message || "Failed to update social links");
    }
    return dataRes;
  },

  async getBranchDetails(branch: string): Promise<any> {
    const res = await fetch(`${API_BASE}/catalog/branch-details?branch=${encodeURIComponent(branch)}&t=${Date.now()}`);
    if (!res.ok) throw new Error("Failed to fetch branch details");
    return res.json();
  },

  async updateBranch(token: string, branch: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/catalog/branch-details?branch=${encodeURIComponent(branch)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const dataRes = await res.json();
    if (!res.ok) {
      console.error("Server Error updating branch details:", dataRes);
      throw new Error(dataRes.message || "Failed to update branch details");
    }
    return dataRes;
  },

  async updateBooking(token: string, bookingId: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update booking");
    return res.json();
  },

  async deleteBooking(token: string, bookingId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to delete booking");
    return res.json();
  },

  async deleteMultipleBookings(token: string, ids: string[], code: string): Promise<any> {
    const res = await fetch(`${API_BASE}/bookings/delete-multiple`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ids, code }),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to delete bookings");
    }
    return res.json();
  },

  async initiateRazorpayPayment(bookingId: string, amount: number, phone: string, paymentType: string = 'full', bookingDetails: any = {}): Promise<any> {
    const res = await fetch(`${API_BASE}/payments/razorpay/initiate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        bookingId, 
        amount, 
        phone, 
        paymentType, 
        amountPaid: amount,
        bookingDetails // Include complete booking details for Razorpay notes
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('Razorpay API Error:', data);
      throw new Error(data.message || "Failed to initiate Razorpay payment");
    }
    return data;
  },

  async checkRazorpayPaymentStatus(orderId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/payments/razorpay/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    if (!res.ok) throw new Error("Failed to check payment status");
    return res.json();
  },

  async processMockPayment(bookingId: string, amount: number, paymentType: string = 'full'): Promise<any> {
    const res = await fetch(`${API_BASE}/payments/mock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, amountPaid: amount, paymentType }),
    });
    if (!res.ok) throw new Error("Failed to process mock payment");
    return res.json();
  },

  async downloadBookingsExcel(token: string, branch?: string): Promise<void> {
    let url = `${API_BASE}/admin/bookings/download`;
    if (branch) url += `?branch=${branch}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to download bookings file");

    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `bookings_${branch || 'all'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },

  async getReviews(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/reviews`);
    if (!res.ok) throw new Error("Failed to fetch reviews");
    return res.json();
  },

  async addReview(name: string, rating: number, comment: string, branch?: string): Promise<any> {
    const query = branch ? `?branch=${encodeURIComponent(branch)}` : "";
    const res = await fetch(`${API_BASE}/reviews${query}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, rating, comment }),
    });
    if (!res.ok) throw new Error("Failed to add review");
    return res.json();
  },
};
