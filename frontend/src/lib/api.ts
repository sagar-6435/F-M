const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
  description: string;
  image?: string;
}

export interface ExtraDecoration {
  id: string;
  name: string;
  price: number;
  description: string;
}

export const api = {
  async getBranches(): Promise<Branch[]> {
    const res = await fetch(`${API_BASE}/branches`);
    if (!res.ok) throw new Error("Failed to fetch branches");
    return res.json();
  },

  async getOccasions(): Promise<string[]> {
    const res = await fetch(`${API_BASE}/occasions`);
    if (!res.ok) throw new Error("Failed to fetch occasions");
    return res.json();
  },

  async getCakes(): Promise<CakeOption[]> {
    const res = await fetch(`${API_BASE}/cakes`);
    if (!res.ok) throw new Error("Failed to fetch cakes");
    return res.json();
  },

  async getDecorations(): Promise<ExtraDecoration[]> {
    const res = await fetch(`${API_BASE}/decorations`);
    if (!res.ok) throw new Error("Failed to fetch decorations");
    return res.json();
  },

  async getPricing(): Promise<Record<string, Record<number, number>>> {
    const res = await fetch(`${API_BASE}/pricing`);
    if (!res.ok) throw new Error("Failed to fetch pricing");
    return res.json();
  },

  async getDecorationPrice(): Promise<number> {
    const res = await fetch(`${API_BASE}/decoration-price`);
    if (!res.ok) throw new Error("Failed to fetch decoration price");
    const data = await res.json();
    return data.decorationPrice;
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

  async getAvailableSlots(branchId: string, date: string, service: string): Promise<string[]> {
    const res = await fetch(`${API_BASE}/availability/${branchId}/${date}/${service}`);
    if (!res.ok) throw new Error("Failed to fetch available slots");
    const data = await res.json();
    return data.availableSlots;
  },

  async adminLogin(password: string): Promise<{ token: string }> {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) throw new Error("Invalid password");
    return res.json();
  },

  async getBookings(token: string, branch?: string, status?: string): Promise<any[]> {
    let url = `${API_BASE}/bookings`;
    const params = new URLSearchParams();
    if (branch) params.append("branch", branch);
    if (status) params.append("status", status);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch bookings");
    return res.json();
  },

  async getDashboardStats(token: string, branch?: string): Promise<any> {
    let url = `${API_BASE}/admin/dashboard/stats`;
    if (branch) url += `?branch=${branch}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch dashboard stats");
    return res.json();
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

  async initiatePhonePePayment(bookingId: string, amount: number, phone: string): Promise<any> {
    const res = await fetch(`${API_BASE}/payments/phonepe/initiate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, amount, phone }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('PhonePe API Error:', data);
      throw new Error(data.message || "Failed to initiate PhonePe payment");
    }
    return data;
  },

  async checkPhonePePaymentStatus(transactionId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/payments/phonepe/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId }),
    });
    if (!res.ok) throw new Error("Failed to check payment status");
    return res.json();
  },

  async processMockPayment(bookingId: string, amount: number): Promise<any> {
    const res = await fetch(`${API_BASE}/payments/mock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, amount }),
    });
    if (!res.ok) throw new Error("Failed to process mock payment");
    return res.json();
  },
};
