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

export interface BookingData {
  branch: string;
  service: "party-hall" | "private-theatre" | "";
  date: string;
  duration: number;
  timeSlot: string;
  name: string;
  phone: string;
  email: string;
  decorationRequired: boolean;
  occasion: string;
  customOccasion?: string;
  cakeRequired: boolean;
  selectedCake: CakeOption | null;
  extraDecorations: ExtraDecoration[];
  totalPrice: number;
  paymentStatus: "pending" | "paid";
}

// Default branches - will be overridden by API data
export let BRANCHES: Branch[] = [
  {
    id: "branch-1",
    name: "Friends & Memories - Eluru",
    address: "Mulpuri Nageswar Rao St, Eluru, Andhra Pradesh 534006",
    phone: "+91 99127 10932",
    mapLink: "https://maps.app.goo.gl/DqNPcNmWZH4KC9dd7",
  },
  {
    id: "branch-2",
    name: "Friends & Memories - Bhimavaram",
    address: "Masid St, Narasimhapuram, Kovvada, Bhimavaram, Andhra Pradesh 534202",
    phone: "+91 99127 10933",
    mapLink: "https://maps.app.goo.gl/hc31fqJaDx6Veqkv7",
  },
];

let branchesLastFetched = 0;
const BRANCH_CACHE_DURATION = 30000; // 30 seconds

// Function to fetch branches from API with cache busting
export const fetchBranches = async (forceRefresh = false): Promise<Branch[]> => {
  const now = Date.now();
  
  // Return cached data if fresh enough and not forced refresh
  if (!forceRefresh && branchesLastFetched && now - branchesLastFetched < BRANCH_CACHE_DURATION) {
    return BRANCHES;
  }
  
  try {
    // Add timestamp to bypass cache
    const response = await fetch(`/api/branches?t=${now}`);
    if (response.ok) {
      const branches = await response.json();
      BRANCHES = branches;
      branchesLastFetched = now;
      return branches;
    }
  } catch (error) {
    console.error('Failed to fetch branches:', error);
  }
  return BRANCHES;
};

export const OCCASIONS = [
  "Birthday",
  "Anniversary",
  "Proposal",
  "Baby Shower",
  "Farewell",
  "Get Together",
  "Date Night",
  "Other",
];

export const CAKE_OPTIONS: CakeOption[] = [
  { id: "cake-1", name: "Classic Chocolate Truffle", price: 799, description: "Rich dark chocolate layers", image: "/placeholder.svg" },
  { id: "cake-2", name: "Red Velvet Dream", price: 899, description: "Cream cheese frosted perfection", image: "/placeholder.svg" },
  { id: "cake-3", name: "Butterscotch Crunch", price: 749, description: "Caramel & crunchy butterscotch", image: "/placeholder.svg" },
  { id: "cake-4", name: "Fresh Fruit Delight", price: 999, description: "Seasonal fruits with cream", image: "/placeholder.svg" },
  { id: "cake-5", name: "Black Forest Premium", price: 849, description: "Cherry-filled chocolate classic", image: "/placeholder.svg" },
];

export const EXTRA_DECORATIONS: ExtraDecoration[] = [
  { id: "extra-1", name: "Balloon Bouquet Setup", price: 1500, description: "100+ premium balloons" },
  { id: "extra-2", name: "LED Neon Sign", price: 800, description: "Custom message neon display" },
  { id: "extra-3", name: "Photo Wall / Backdrop", price: 2000, description: "Instagram-worthy backdrop" },
  { id: "extra-4", name: "Fog Machine Effect", price: 500, description: "Dramatic fog entrance" },
  { id: "extra-5", name: "Rose Petal Pathway", price: 1200, description: "Romantic rose petal setup" },
  { id: "extra-6", name: "Confetti Cannon", price: 600, description: "Party poppers & confetti" },
];

export interface TimeSlot {
  id: string;
  start: string;
  end: string;
  display: string;
}

export const TIME_SLOTS: Record<number, TimeSlot[]> = {
  1: [
    { id: "slot-1", start: "10:00 AM", end: "11:00 AM", display: "10:00 AM - 11:00 AM" },
    { id: "slot-2", start: "11:00 AM", end: "12:00 PM", display: "11:00 AM - 12:00 PM" },
    { id: "slot-3", start: "12:00 PM", end: "1:00 PM", display: "12:00 PM - 1:00 PM" },
    { id: "slot-4", start: "1:00 PM", end: "2:00 PM", display: "1:00 PM - 2:00 PM" },
    { id: "slot-5", start: "2:00 PM", end: "3:00 PM", display: "2:00 PM - 3:00 PM" },
    { id: "slot-6", start: "3:00 PM", end: "4:00 PM", display: "3:00 PM - 4:00 PM" },
    { id: "slot-7", start: "4:00 PM", end: "5:00 PM", display: "4:00 PM - 5:00 PM" },
    { id: "slot-8", start: "5:00 PM", end: "6:00 PM", display: "5:00 PM - 6:00 PM" },
    { id: "slot-9", start: "6:00 PM", end: "7:00 PM", display: "6:00 PM - 7:00 PM" },
    { id: "slot-10", start: "7:00 PM", end: "8:00 PM", display: "7:00 PM - 8:00 PM" },
    { id: "slot-11", start: "8:00 PM", end: "9:00 PM", display: "8:00 PM - 9:00 PM" },
    { id: "slot-12", start: "9:00 PM", end: "10:00 PM", display: "9:00 PM - 10:00 PM" },
  ],
  2: [
    { id: "slot-1", start: "10:00 AM", end: "12:00 PM", display: "10:00 AM - 12:00 PM" },
    { id: "slot-2", start: "12:00 PM", end: "2:00 PM", display: "12:00 PM - 2:00 PM" },
    { id: "slot-3", start: "2:00 PM", end: "4:00 PM", display: "2:00 PM - 4:00 PM" },
    { id: "slot-4", start: "4:00 PM", end: "6:00 PM", display: "4:00 PM - 6:00 PM" },
    { id: "slot-5", start: "6:00 PM", end: "8:00 PM", display: "6:00 PM - 8:00 PM" },
    { id: "slot-6", start: "8:00 PM", end: "10:00 PM", display: "8:00 PM - 10:00 PM" },
  ],
  3: [
    { id: "slot-1", start: "10:00 AM", end: "1:00 PM", display: "10:00 AM - 1:00 PM" },
    { id: "slot-2", start: "1:00 PM", end: "4:00 PM", display: "1:00 PM - 4:00 PM" },
    { id: "slot-3", start: "4:00 PM", end: "7:00 PM", display: "4:00 PM - 7:00 PM" },
    { id: "slot-4", start: "7:00 PM", end: "10:00 PM", display: "7:00 PM - 10:00 PM" },
  ],
};

export const BASE_PRICES: Record<string, Record<number, number>> = {
  "party-hall": { 1: 2999, 2: 4999, 3: 6999 },
  "private-theatre": { 1: 1999, 2: 3499, 3: 4999 },
};

export const DECORATION_PRICE = 1500;

export const INITIAL_BOOKING: BookingData = {
  branch: "",
  service: "",
  date: "",
  duration: 0,
  timeSlot: "",
  name: "",
  phone: "",
  email: "",
  decorationRequired: false,
  occasion: "",
  cakeRequired: false,
  selectedCake: null,
  extraDecorations: [],
  totalPrice: 0,
  paymentStatus: "pending",
};
