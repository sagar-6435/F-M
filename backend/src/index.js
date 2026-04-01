import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getBookingsExcelFile } from './utils/excelExport.js';
import { saveBookings, loadBookings, saveTimeSlots, loadTimeSlots } from './utils/persistence.js';
import { clearAllBookings, getAllBookingsFromFiles, migrateBookingsToMongo } from './utils/migration.js';
import { sendBookingNotification } from './utils/notification.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pricingDataFilePath = path.join(__dirname, 'data', 'branchPricingData.json');

const defaultCakes = [
  { id: 'cake-1', name: 'Classic Chocolate Truffle', price: 799, description: 'Rich dark chocolate layers' },
  { id: 'cake-2', name: 'Red Velvet Dream', price: 899, description: 'Cream cheese frosted perfection' },
  { id: 'cake-3', name: 'Butterscotch Crunch', price: 749, description: 'Caramel & crunchy butterscotch' },
  { id: 'cake-4', name: 'Fresh Fruit Delight', price: 999, description: 'Seasonal fruits with cream' },
  { id: 'cake-5', name: 'Black Forest Premium', price: 849, description: 'Cherry-filled chocolate classic' },
];

const defaultDecorations = [
  { id: 'extra-1', name: 'Balloon Bouquet Setup', price: 1500, description: '100+ premium balloons' },
  { id: 'extra-2', name: 'LED Neon Sign', price: 800, description: 'Custom message neon display' },
  { id: 'extra-3', name: 'Photo Wall / Backdrop', price: 2000, description: 'Instagram-worthy backdrop' },
  { id: 'extra-4', name: 'Fog Machine Effect', price: 500, description: 'Dramatic fog entrance' },
  { id: 'extra-5', name: 'Rose Petal Pathway', price: 1200, description: 'Romantic rose petal setup' },
  { id: 'extra-6', name: 'Confetti Cannon', price: 600, description: 'Party poppers & confetti' },
];

const defaultPricing = {
  'party-hall': { 1: 2999, 2: 4999, 3: 6999 },
  'private-theatre': { 1: 1999, 2: 3499, 3: 4999 },
};

const OPENING_TIME_MINUTES = 10 * 60; // 10:00 AM
const CLOSING_TIME_MINUTES = 23 * 60 + 59; // 11:59 PM
const SLOT_STEP_MINUTES = 30; // Internal step for generating all possible start times

const to12HourTime = (minutes) => {
  const period = minutes >= 12 * 60 ? 'PM' : 'AM';
  const hour24 = Math.floor(minutes / 60) % 24;
  const hour12 = hour24 % 12 || 12;
  const mins = minutes % 60;
  return `${hour12}:${String(mins).padStart(2, '0')} ${period}`;
};

const parse12HourTime = (timeString) => {
  if (!timeString || typeof timeString !== 'string') return null;
  const match = timeString.trim().match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();
  if (minutes < 0 || minutes >= 60 || hours < 1 || hours > 12) return null;
  if (hours === 12) hours = 0;
  if (period === 'PM') hours += 12;
  return hours * 60 + minutes;
};

const buildDaySlots = () => {
  const slots = [];
  for (let minute = OPENING_TIME_MINUTES; minute <= CLOSING_TIME_MINUTES; minute += SLOT_STEP_MINUTES) {
    slots.push(to12HourTime(minute));
  }
  return slots;
};

const getBlockedSlotsForBooking = (startTime, durationHours = 1) => {
  const startMinutes = parse12HourTime(startTime);
  if (startMinutes === null) return [];
  const slotsToBlock = Math.max(1, Math.round((Number(durationHours) * 60) / SLOT_STEP_MINUTES));
  const blocked = [];
  for (let i = 0; i < slotsToBlock; i++) {
    blocked.push(to12HourTime(startMinutes + i * SLOT_STEP_MINUTES));
  }
  return blocked;
};

const canFitBookingInOperatingHours = (startTime, durationHours = 1) => {
  const startMinutes = parse12HourTime(startTime);
  if (startMinutes === null) return false;
  const endMinutes = startMinutes + Number(durationHours) * 60;
  // Reject if Start time < 10:00 AM or End time > 11:59 PM
  return startMinutes >= OPENING_TIME_MINUTES && endMinutes <= CLOSING_TIME_MINUTES;
};

// Function to check if a new booking interval overlaps with an existing booking (including 30-min buffer)
const isOverlappingWithBuffer = (newStart, newDuration, existingStartStr, existingDuration) => {
  const newEnd = newStart + Number(newDuration) * 60;
  const existingStart = parse12HourTime(existingStartStr);
  if (existingStart === null) return false;
  const existingEnd = existingStart + Number(existingDuration) * 60;
  
  // CORE CONDITION: Reject if there's less than 30-min gap between intervals
  // Forbidden if (newStart < existingEnd + 30) AND (existingStart < newEnd + 30)
  if (newStart < (existingEnd + 30) && existingStart < (newEnd + 30)) {
    return true;
  }
  return false;
};

// Filter out slots based on bookings
const getAvailableStartSlots = (bookings, requestedDuration = 1) => {
  // Discrete slots based on user requirements for each duration
  const slotsByDuration = {
    1: ['10:00 AM', '11:30 AM', '1:00 PM', '2:30 PM', '4:00 PM', '5:30 PM', '7:00 PM', '8:30 PM', '10:00 PM'],
    2: ['10:00 AM', '12:30 PM', '3:00 PM', '5:30 PM', '8:00 PM'],
    3: ['10:00 AM', '1:30 PM', '5:00 PM', '8:30 PM']
  };
  
  const daySlots = slotsByDuration[requestedDuration] || [];
  const available = [];

  for (const start of daySlots) {
    const startMinutes = parse12HourTime(start);
    if (startMinutes === null) continue;

    const endMinutes = startMinutes + Number(requestedDuration) * 60;
    // Limit check (End time > 11:59 PM)
    if (endMinutes > CLOSING_TIME_MINUTES + 1) continue;

    let hasConflict = false;
    for (const b of bookings) {
      const conflict = isOverlappingWithBuffer(startMinutes, requestedDuration, b.timeSlot, b.duration);
      if (conflict) {
        console.log(`Conflict found for slot ${start} with booking ${b.id} (${b.timeSlot}, ${b.duration}h)`);
        hasConflict = true;
        break;
      }
    }
    
    if (!hasConflict) {
      available.push(start);
    }
  }
  console.log(`Available slots for date:`, available);

  return available;
};

// Get allowed durations based on gap
const getAllowedDurationsForGap = (gapMinutes) => {
  if (gapMinutes >= 3 * 60) {
    // Gap >= 3 hours: allow 1, 2, 3 hour bookings
    return [1, 2, 3];
  } else if (gapMinutes >= 1 * 60) {
    // Gap = 1 hour: allow only 1 hour booking
    return [1];
  }
  return []; // Gap < 1 hour: no bookings allowed
};



const createBranchPricingDb = () => ({
  cakes: JSON.parse(JSON.stringify(defaultCakes)),
  decorations: JSON.parse(JSON.stringify(defaultDecorations)),
  pricing: JSON.parse(JSON.stringify(defaultPricing)),
  decorationPrice: 1500,
  testimonials: [],
});

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080',
      'http://localhost:5000',
      'https://friendsandmemories.vercel.app',
      'https://f-m-8146.onrender.com'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log but still allow for debugging
      console.log(`CORS request from: ${origin}`);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
  maxAge: 86400
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Additional CORS headers middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.header('Access-Control-Expose-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// MongoDB Connections
const mongoConnections = {
  'branch-1': false,
  'branch-2': false,
};

if (process.env.MONGODB_URI_BRANCH1) {
  const conn1 = mongoose.createConnection(process.env.MONGODB_URI_BRANCH1, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  conn1.on('connected', () => {
    mongoConnections['branch-1'] = true;
    console.log('MongoDB connected for Branch 1');
  });
  conn1.on('error', (err) => {
    console.error('MongoDB connection error for Branch 1:', err.message);
  });
}

if (process.env.MONGODB_URI_BRANCH2) {
  mongoose.connect(process.env.MONGODB_URI_BRANCH2, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then(() => {
      mongoConnections['branch-2'] = true;
      console.log('MongoDB connected for Branch 2');
    })
    .catch((err) => {
      console.error('MongoDB connection error for Branch 2:', err.message);
    });
}

// Schemas
const bookingSchema = new mongoose.Schema({
  id: String,
  branch: String,
  service: String,
  date: String,
  duration: Number,
  timeSlot: String,
  name: String,
  phone: String,
  email: String,
  decorationRequired: Boolean,
  occasion: String,
  cakeRequired: Boolean,
  selectedCake: mongoose.Schema.Types.Mixed,
  extraDecorations: [mongoose.Schema.Types.Mixed],
  totalPrice: Number,
  paymentStatus: String,
  createdAt: Date,
  updatedAt: Date,
});

const timeSlotSchema = new mongoose.Schema({
  id: String,
  date: String,
  timeSlot: String,
  service: String,
  isBooked: Boolean,
  bookingId: String,
  createdAt: Date,
});

const Booking = mongoose.model('Booking', bookingSchema);
const TimeSlot = mongoose.model('TimeSlot', timeSlotSchema);
const branchCatalogSchema = new mongoose.Schema(
  {
    branch: { type: String, required: true, unique: true },
    pricing: { type: mongoose.Schema.Types.Mixed, default: () => JSON.parse(JSON.stringify(defaultPricing)) },
    decorationPrice: { type: Number, default: 1500 },
    cakes: { type: [mongoose.Schema.Types.Mixed], default: () => JSON.parse(JSON.stringify(defaultCakes)) },
    decorations: { type: [mongoose.Schema.Types.Mixed], default: () => JSON.parse(JSON.stringify(defaultDecorations)) },
    testimonials: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);
const BranchCatalog = mongoose.model('BranchCatalog', branchCatalogSchema);

// Global Data
const globalDb = {
  branches: [
    {
      id: 'branch-1',
      name: 'Friends & Memories - Eluru',
      address: 'Mulpuri Nageswar Rao St, Eluru, Andhra Pradesh 534006',
      phone: '+91 99127 10932',
      mapLink: 'https://maps.app.goo.gl/DqNPcNmWZH4KC9dd7',
      capacity: 100,
      amenities: ['AC', 'Sound System', 'Projector'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'branch-2',
      name: 'Friends & Memories - Bhimavaram',
      address: '4-Masid St, Narasimhapuram, Kovvada, Bhimavaram, Andhra Pradesh 534202',
      phone: '+91 99127 10933',
      mapLink: 'https://maps.app.goo.gl/hc31fqJaDx6Veqkv7',
      capacity: 80,
      amenities: ['AC', 'Sound System', 'LED Screen'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  services: [
    { id: 'party-hall', name: 'Party Hall', description: 'Spacious party hall for celebrations' },
    { id: 'private-theatre', name: 'Private Theatre', description: 'Private theatre for movie nights' },
  ],
  cakes: defaultCakes,
  decorations: defaultDecorations,
  occasions: ['Birthday', 'Anniversary', 'Proposal', 'Baby Shower', 'Farewell', 'Get Together', 'Date Night', 'Other'],
  pricing: defaultPricing,
  decorationPrice: 1500,
};

const branchDbs = {
  'branch-1': { bookings: [], timeSlots: [] },
  'branch-2': { bookings: [], timeSlots: [] },
};

const branchPricingDbs = {
  'branch-1': createBranchPricingDb(),
  'branch-2': createBranchPricingDb(),
};

const getBranchDb = (branchId) => branchDbs[branchId] || null;
const getBranchPricingDb = (branchId = 'branch-1') => branchPricingDbs[branchId] || null;
const cloneBranchPricingDb = (data = {}) => ({
  cakes: JSON.parse(JSON.stringify(data.cakes || defaultCakes)),
  decorations: JSON.parse(JSON.stringify(data.decorations || defaultDecorations)),
  pricing: JSON.parse(JSON.stringify(data.pricing || defaultPricing)),
  decorationPrice: data.decorationPrice ?? 1500,
  testimonials: JSON.parse(JSON.stringify(data.testimonials || [])),
});

const saveBranchPricingData = async () => {
  try {
    await fs.mkdir(path.dirname(pricingDataFilePath), { recursive: true });
    await fs.writeFile(
      pricingDataFilePath,
      JSON.stringify(branchPricingDbs, null, 2),
      'utf-8'
    );
  } catch (error) {
    console.error('Failed to persist branch pricing data:', error);
  }
};

const loadBranchPricingData = async () => {
  try {
    const raw = await fs.readFile(pricingDataFilePath, 'utf-8');
    const parsed = JSON.parse(raw);
    for (const branchId of Object.keys(parsed)) {
      branchPricingDbs[branchId] = {
        ...createBranchPricingDb(),
        ...parsed[branchId],
      };
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Failed to load branch pricing data:', error);
    }
  }
};

await loadBranchPricingData();

const getCatalogForBranch = async (branchId = 'branch-1') => {
  if (mongoConnections[branchId]) {
    let doc = await BranchCatalog.findOne({ branch: branchId });
    if (!doc) {
      doc = await BranchCatalog.create({
        branch: branchId,
        ...createBranchPricingDb(),
      });
    }
    return cloneBranchPricingDb(doc.toObject());
  }

  const memoryCatalog = getBranchPricingDb(branchId);
  return memoryCatalog ? cloneBranchPricingDb(memoryCatalog) : null;
};

const saveCatalogForBranch = async (branchId, catalog) => {
  if (mongoConnections[branchId]) {
    await BranchCatalog.findOneAndUpdate(
      { branch: branchId },
      {
        branch: branchId,
        pricing: catalog.pricing,
        cakes: catalog.cakes,
        decorations: catalog.decorations,
        decorationPrice: catalog.decorationPrice,
        testimonials: catalog.testimonials,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return;
  }

  branchPricingDbs[branchId] = cloneBranchPricingDb(catalog);
  await saveBranchPricingData();
};

const getBranchFromRequest = (req, includeBody = true) =>
  req.query.branch || (includeBody ? req.body.branch : undefined) || 'branch-1';

const getCatalogOrSendError = async (req, res, includeBody = true) => {
  const branch = getBranchFromRequest(req, includeBody);
  const catalog = await getCatalogForBranch(branch);
  if (!catalog) {
    res.status(400).json({ error: 'Invalid branch' });
    return null;
  }
  return { branch, catalog };
};

const updateCatalogItemById = (items, id, data) => {
  const item = items.find((entry) => entry.id === id);
  if (!item) return null;
  Object.assign(item, data);
  return item;
};

const deleteCatalogItemById = (items, id) => {
  const index = items.findIndex((entry) => entry.id === id);
  if (index === -1) return false;
  items.splice(index, 1);
  return true;
};

// Middleware: Auth
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Debug: Get all bookings count
app.get('/api/debug/bookings-count', (req, res) => {
  const counts = {};
  for (const branchId in branchDbs) {
    counts[branchId] = branchDbs[branchId].bookings.length;
  }
  res.json({ 
    counts,
    total: Object.values(counts).reduce((a, b) => a + b, 0),
    timestamp: new Date()
  });
});

// Admin: Clear all test bookings
app.post('/api/admin/clear-bookings', verifyAdmin, async (req, res) => {
  try {
    // Clear from memory
    for (const branchId in branchDbs) {
      branchDbs[branchId].bookings = [];
      branchDbs[branchId].timeSlots = [];
    }
    
    // Clear from files
    await clearAllBookings();
    
    res.json({ 
      success: true, 
      message: 'All bookings and time slots cleared',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error clearing bookings:', error);
    res.status(500).json({ error: 'Failed to clear bookings' });
  }
});

// Admin: Get all bookings for export/migration
app.get('/api/admin/all-bookings', verifyAdmin, async (req, res) => {
  try {
    const allBookings = await getAllBookingsFromFiles();
    res.json({ 
      count: allBookings.length,
      bookings: allBookings,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Admin: Migrate bookings to MongoDB
app.post('/api/admin/migrate-to-mongo', verifyAdmin, async (req, res) => {
  try {
    if (!mongoConnections['branch-1'] && !mongoConnections['branch-2']) {
      return res.status(400).json({ 
        error: 'MongoDB not connected. Please configure MONGODB_URI_BRANCH1 and/or MONGODB_URI_BRANCH2 in .env' 
      });
    }
    
    const result = await migrateBookingsToMongo(Booking, TimeSlot);
    res.json({ 
      success: true,
      ...result,
      message: 'Bookings migrated to MongoDB successfully',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error migrating bookings:', error);
    res.status(500).json({ error: 'Failed to migrate bookings' });
  }
});

// Admin: Migrate pricing to MongoDB
app.post('/api/admin/migrate-pricing-to-mongo', verifyAdmin, async (req, res) => {
  try {
    if (!mongoConnections['branch-1'] && !mongoConnections['branch-2']) {
      return res.status(400).json({ 
        error: 'MongoDB not connected. Please configure MONGODB_URI_BRANCH1 and/or MONGODB_URI_BRANCH2 in .env' 
      });
    }
    
    let migratedBranches = 0;
    
    // Migrate pricing for each branch
    for (const branchId in branchPricingDbs) {
      try {
        const catalog = branchPricingDbs[branchId];
        await BranchCatalog.findOneAndUpdate(
          { branch: branchId },
          {
            branch: branchId,
            pricing: catalog.pricing,
            cakes: catalog.cakes,
            decorations: catalog.decorations,
            decorationPrice: catalog.decorationPrice,
            testimonials: catalog.testimonials,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        migratedBranches++;
        console.log(`✓ Pricing migrated for ${branchId}`);
      } catch (error) {
        console.error(`Failed to migrate pricing for ${branchId}:`, error);
      }
    }
    
    res.json({ 
      success: true,
      migratedBranches,
      message: `Pricing migrated to MongoDB for ${migratedBranches} branch(es)`,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error migrating pricing:', error);
    res.status(500).json({ error: 'Failed to migrate pricing' });
  }
});

// Admin Routes
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  // Trim whitespace from both sides
  const trimmedPassword = password ? password.trim() : '';
  const trimmedAdminPassword = adminPassword ? adminPassword.trim() : '';
  
  console.log('Login attempt - Password received:', trimmedPassword ? '***' : 'empty');
  console.log('Admin password configured:', trimmedAdminPassword ? 'yes' : 'no');
  
  if (trimmedPassword === trimmedAdminPassword) {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, message: 'Login successful' });
  } else {
    console.log('Password mismatch');
    res.status(401).json({ error: 'Invalid password' });
  }
});

app.post('/api/admin/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

app.get('/api/admin/dashboard/stats', verifyAdmin, async (req, res) => {
  const { branch, startDate, endDate } = req.query;
  let allBookings = [];
  
  try {
    if (branch && mongoConnections[branch]) {
      let query = { branch };
      if (startDate && endDate) query.date = { $gte: startDate, $lte: endDate };
      allBookings = await Booking.find(query);
    } else if (branch) {
      const branchDb = getBranchDb(branch);
      if (branchDb) {
        allBookings = branchDb.bookings;
        if (startDate && endDate) {
          allBookings = allBookings.filter(b => b.date >= startDate && b.date <= endDate);
        }
      }
    } else {
      if (mongoConnections['branch-1']) {
        let query = {};
        if (startDate && endDate) query.date = { $gte: startDate, $lte: endDate };
        const mongoBookings = await Booking.find(query);
        allBookings = allBookings.concat(mongoBookings);
      }
      if (mongoConnections['branch-2']) {
        let query = {};
        if (startDate && endDate) query.date = { $gte: startDate, $lte: endDate };
        const mongoBookings = await Booking.find(query);
        allBookings = allBookings.concat(mongoBookings);
      }
      for (const branchId in branchDbs) {
        let branchBookings = branchDbs[branchId].bookings;
        if (startDate && endDate) {
          branchBookings = branchBookings.filter(b => b.date >= startDate && b.date <= endDate);
        }
        allBookings = allBookings.concat(branchBookings);
      }
    }
    
    const totalBookings = allBookings.length;
    const paidBookings = allBookings.filter(b => b.paymentStatus === 'paid').length;
    const pendingBookings = allBookings.filter(b => b.paymentStatus === 'pending').length;
    const totalRevenue = allBookings.filter(b => b.paymentStatus === 'paid').reduce((sum, b) => sum + b.totalPrice, 0);
    
    res.json({ totalBookings, paidBookings, pendingBookings, totalRevenue });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

app.get('/api/admin/gallery', verifyAdmin, async (req, res) => {
  const branch = req.query.branch || 'branch-1';
  const type = req.query.type;
  const catalog = await getCatalogForBranch(branch);
  if (!catalog) return res.status(400).json({ error: 'Invalid branch' });

  const cakes = catalog.cakes.map((item) => ({ ...item, type: 'cake' }));
  const decorations = catalog.decorations.map((item) => ({ ...item, type: 'decoration' }));
  let items = [...cakes, ...decorations];
  if (type === 'cake' || type === 'decoration') {
    items = items.filter((item) => item.type === type);
  }
  res.json(items);
});

app.put('/api/admin/gallery/:type/:id', verifyAdmin, async (req, res) => {
  const branch = req.query.branch || req.body.branch || 'branch-1';
  const { type, id } = req.params;
  const { image } = req.body;

  if (!image || typeof image !== 'string') {
    return res.status(400).json({ error: 'Image is required' });
  }
  if (type !== 'cake' && type !== 'decoration') {
    return res.status(400).json({ error: 'Invalid gallery type' });
  }

  const catalog = await getCatalogForBranch(branch);
  if (!catalog) return res.status(400).json({ error: 'Invalid branch' });

  const list = type === 'cake' ? catalog.cakes : catalog.decorations;
  const item = list.find((entry) => entry.id === id);
  if (!item) return res.status(404).json({ error: `${type} not found` });

  item.image = image;
  await saveCatalogForBranch(branch, catalog);
  res.json(item);
});

app.post('/api/admin/gallery/testimonials', verifyAdmin, async (req, res) => {
  const branch = req.query.branch || req.body.branch || 'branch-1';
  const { image, title, date } = req.body;
  if (!image || typeof image !== 'string') {
    return res.status(400).json({ error: 'Image is required' });
  }
  const catalog = await getCatalogForBranch(branch);
  if (!catalog) return res.status(400).json({ error: 'Invalid branch' });
  const testimonial = {
    id: `testimonial-${uuidv4()}`,
    image,
    title: title || 'Customer Memory',
    date: date || new Date().toLocaleDateString(),
  };
  catalog.testimonials.push(testimonial);
  await saveCatalogForBranch(branch, catalog);
  res.status(201).json(testimonial);
});

app.delete('/api/admin/gallery/testimonials/:id', verifyAdmin, async (req, res) => {
  const branch = req.query.branch || req.body.branch || 'branch-1';
  const catalog = await getCatalogForBranch(branch);
  if (!catalog) return res.status(400).json({ error: 'Invalid branch' });
  const index = catalog.testimonials.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Testimonial not found' });
  catalog.testimonials.splice(index, 1);
  await saveCatalogForBranch(branch, catalog);
  res.json({ message: 'Testimonial deleted' });
});

app.get('/api/gallery/testimonials', async (req, res) => {
  const branch = req.query.branch || 'branch-1';
  const catalog = await getCatalogForBranch(branch);
  if (!catalog) return res.status(400).json({ error: 'Invalid branch' });
  res.json(catalog.testimonials || []);
});

// Download Bookings Excel File
app.get('/api/admin/bookings/download', verifyAdmin, async (req, res) => {
  try {
    const branch = req.query.branch || 'all';
    
    // Get bookings
    let allBookings = [];
    if (branch === 'all') {
      // Get from MongoDB for all active branches
      for (const branchId in mongoConnections) {
        if (mongoConnections[branchId]) {
          const mBookings = await Booking.find({ branch: branchId });
          allBookings = allBookings.concat(mBookings);
        }
      }
      // Combine with local data
      for (const branchId in branchDbs) {
        allBookings = allBookings.concat(branchDbs[branchId].bookings);
      }
    } else {
      if (mongoConnections[branch]) {
        allBookings = await Booking.find({ branch });
      } else {
        const branchDb = getBranchDb(branch);
        if (branchDb) {
          allBookings = branchDb.bookings;
        }
      }
    }
    
    // Filter to only include paid bookings
    const paidBookings = allBookings.filter(booking => booking.paymentStatus === 'paid');
    
    if (paidBookings.length === 0) {
      return res.status(404).json({ error: 'No paid bookings found for this branch' });
    }
    
    // Create Excel workbook from paid bookings
    const XLSX = (await import('xlsx')).default;
    const bookingRows = paidBookings.map(booking => ({
      'Booking ID': booking.id,
      'Branch': booking.branch,
      'Service': booking.service,
      'Date': booking.date,
      'Time Slot': booking.timeSlot,
      'Duration (hrs)': booking.duration,
      'Customer Name': booking.name,
      'Phone': booking.phone,
      'Email': booking.email,
      'Occasion': booking.customOccasion || booking.occasion,
      'Decoration Required': booking.decorationRequired ? 'Yes' : 'No',
      'Cake Selected': booking.selectedCake ? `${booking.selectedCake.name} (₹${booking.selectedCake.price})` : 'None',
      'Extra Decorations': booking.extraDecorations?.map((d) => `${d.name} (₹${d.price})`).join('; ') || 'None',
      'Total Price': booking.totalPrice,
      'Payment Status': booking.paymentStatus,
      'Booking Date': new Date(booking.createdAt).toLocaleString(),
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(bookingRows);
    const columnWidths = [
      { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 12 }, { wch: 15 },
      { wch: 14 }, { wch: 18 }, { wch: 15 }, { wch: 25 }, { wch: 20 },
      { wch: 18 }, { wch: 25 }, { wch: 30 }, { wch: 12 }, { wch: 15 }, { wch: 20 }
    ];
    worksheet['!cols'] = columnWidths;
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Paid Bookings');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    
    const fileName = `bookings_${branch}_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error downloading bookings file:', error);
    res.status(500).json({ error: 'Failed to download bookings file' });
  }
});

// Branches
app.get('/api/branches', (req, res) => {
  try {
    if (!globalDb || !globalDb.branches) {
      console.error('Critical Error: globalDb or globalDb.branches is missing!');
      return res.status(500).json({ error: 'Server data configuration error' });
    }
    console.log(`✓ Serving ${globalDb.branches.length} branches`);
    res.json(globalDb.branches);
  } catch (error) {
    console.error('Unexpected error in GET /api/branches:', error);
    res.status(500).json({ error: 'Internal server error while fetching branches' });
  }
});

app.get('/api/branches/:id', (req, res) => {
  const branch = globalDb.branches.find(b => b.id === req.params.id);
  if (!branch) return res.status(404).json({ error: 'Branch not found' });
  res.json(branch);
});

app.post('/api/branches', verifyAdmin, (req, res) => {
  const { name, address, phone, capacity, amenities } = req.body;
  const branchId = `branch-${uuidv4()}`;
  const branch = { id: branchId, name, address, phone, capacity, amenities, createdAt: new Date(), updatedAt: new Date() };
  globalDb.branches.push(branch);
  branchDbs[branchId] = { bookings: [], timeSlots: [] };
  branchPricingDbs[branchId] = createBranchPricingDb();
  saveBranchPricingData();
  res.status(201).json(branch);
});

// Services
app.get('/api/services', (req, res) => {
  res.json(globalDb.services);
});

// Pricing
app.get('/api/pricing', async (req, res) => {
  const resolved = await getCatalogOrSendError(req, res, false);
  if (!resolved) return;
  const { catalog } = resolved;
  res.json(catalog.pricing);
});

app.put('/api/pricing', verifyAdmin, async (req, res) => {
  const resolved = await getCatalogOrSendError(req, res, true);
  if (!resolved) return;
  const { branch, catalog } = resolved;
  const { service, duration, price } = req.body;
  if (!catalog.pricing[service]) catalog.pricing[service] = {};
  catalog.pricing[service][duration] = price;
  await saveCatalogForBranch(branch, catalog);
  res.json(catalog.pricing);
});

app.get('/api/pricing/:service/:duration', async (req, res) => {
  const resolved = await getCatalogOrSendError(req, res, false);
  if (!resolved) return;
  const { catalog } = resolved;
  const { service, duration } = req.params;
  const price = catalog.pricing[service]?.[duration];
  if (price === undefined) return res.status(404).json({ error: 'Pricing not found' });
  res.json({ service, duration, price });
});

// Decoration Price
app.get('/api/decoration-price', async (req, res) => {
  const resolved = await getCatalogOrSendError(req, res, false);
  if (!resolved) return;
  const { catalog } = resolved;
  res.json({ decorationPrice: catalog.decorationPrice });
});

app.put('/api/decoration-price', verifyAdmin, async (req, res) => {
  const resolved = await getCatalogOrSendError(req, res, true);
  if (!resolved) return;
  const { branch, catalog } = resolved;
  const { price } = req.body;
  if (price !== undefined) catalog.decorationPrice = price;
  await saveCatalogForBranch(branch, catalog);
  res.json({ decorationPrice: catalog.decorationPrice });
});

// Cakes
app.get('/api/cakes', async (req, res) => {
  const resolved = await getCatalogOrSendError(req, res, false);
  if (!resolved) return;
  const { catalog } = resolved;
  res.json(catalog.cakes);
});

app.post('/api/cakes', verifyAdmin, async (req, res) => {
  const resolved = await getCatalogOrSendError(req, res, true);
  if (!resolved) return;
  const { branch, catalog } = resolved;
  const { name, price, description, image } = req.body;
  const cake = { id: `cake-${uuidv4()}`, name, price, description, image };
  catalog.cakes.push(cake);
  await saveCatalogForBranch(branch, catalog);
  res.status(201).json(cake);
});

app.put('/api/cakes/:id', verifyAdmin, async (req, res) => {
  const resolved = await getCatalogOrSendError(req, res, true);
  if (!resolved) return;
  const { branch, catalog } = resolved;
  const cake = updateCatalogItemById(catalog.cakes, req.params.id, req.body);
  if (!cake) return res.status(404).json({ error: 'Cake not found' });
  await saveCatalogForBranch(branch, catalog);
  res.json(cake);
});

app.delete('/api/cakes/:id', verifyAdmin, async (req, res) => {
  const resolved = await getCatalogOrSendError(req, res, true);
  if (!resolved) return;
  const { branch, catalog } = resolved;
  const deleted = deleteCatalogItemById(catalog.cakes, req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Cake not found' });
  await saveCatalogForBranch(branch, catalog);
  res.json({ message: 'Cake deleted' });
});

// Decorations
app.get('/api/decorations', async (req, res) => {
  const resolved = await getCatalogOrSendError(req, res, false);
  if (!resolved) return;
  const { catalog } = resolved;
  res.json(catalog.decorations);
});

app.post('/api/decorations', verifyAdmin, async (req, res) => {
  const resolved = await getCatalogOrSendError(req, res, true);
  if (!resolved) return;
  const { branch, catalog } = resolved;
  const { name, price, description, image } = req.body;
  const decoration = { id: `extra-${uuidv4()}`, name, price, description, image };
  catalog.decorations.push(decoration);
  await saveCatalogForBranch(branch, catalog);
  res.status(201).json(decoration);
});

app.put('/api/decorations/:id', verifyAdmin, async (req, res) => {
  const resolved = await getCatalogOrSendError(req, res, true);
  if (!resolved) return;
  const { branch, catalog } = resolved;
  const decoration = updateCatalogItemById(catalog.decorations, req.params.id, req.body);
  if (!decoration) return res.status(404).json({ error: 'Decoration not found' });
  await saveCatalogForBranch(branch, catalog);
  res.json(decoration);
});

app.delete('/api/decorations/:id', verifyAdmin, async (req, res) => {
  const resolved = await getCatalogOrSendError(req, res, true);
  if (!resolved) return;
  const { branch, catalog } = resolved;
  const deleted = deleteCatalogItemById(catalog.decorations, req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Decoration not found' });
  await saveCatalogForBranch(branch, catalog);
  res.json({ message: 'Decoration deleted' });
});

// Occasions
app.get('/api/occasions', (req, res) => {
  res.json(globalDb.occasions);
});

// Availability
app.get('/api/availability/:branchId/:date/:service', async (req, res) => {
  const { branchId, date, service } = req.params;
  const duration = Number(req.query.duration || 1);
  const branchDb = getBranchDb(branchId);
  
  if (!branchDb && !mongoConnections[branchId]) return res.status(404).json({ error: 'Branch not found' });
  
  let bookedSlots = [];
  
  try {
    let bookings = [];
    if (mongoConnections[branchId]) {
      bookings = await Booking.find({ branch: branchId, date, service });
    } else if (branchDb) {
      bookings = branchDb.bookings.filter(b => b.date === date && b.service === service);
    }
    
    const availableSlots = getAvailableStartSlots(bookings, duration);
    const bookedSlotsList = bookings.reduce((acc, b) => {
        return acc.concat(getBlockedSlotsForBooking(b.timeSlot, b.duration));
    }, []);
    
    // Filter out past slots if the date is today
    const today = new Date().toISOString().split('T')[0];
    let filteredAvailable = availableSlots;
    if (date === today) {
      const now = new Date();
      const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
      
      filteredAvailable = availableSlots.filter(slot => {
        const slotMinutes = parse12HourTime(slot);
        // Only show slots that start at least 1 hour from now
        return slotMinutes > currentTimeMinutes + 60;
      });
    }
    
    res.json({ availableSlots: filteredAvailable, bookedSlots: bookedSlotsList });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// Consolidate booking initialization data to improve frontend performance
app.get('/api/booking/init/:branchId', async (req, res) => {
  try {
    const { branchId } = req.params;
    const catalog = await getCatalogForBranch(branchId);
    
    if (!catalog && !globalDb.branches.find(b => b.id === branchId)) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    res.json({
      branches: globalDb.branches,
      occasions: globalDb.occasions,
      pricing: catalog?.pricing || defaultPricing,
      cakes: catalog?.cakes || defaultCakes,
      decorations: catalog?.decorations || defaultDecorations,
      decorationPrice: catalog?.decorationPrice ?? 1500
    });
  } catch (error) {
    console.error('Error in booking-init:', error);
    res.status(500).json({ error: 'Failed to initialize booking data' });
  }
});

// Bookings
app.post('/api/bookings', async (req, res) => {
  const { branch } = req.body;
  const branchDb = getBranchDb(branch);
  
  if (!branchDb && !mongoConnections[branch]) return res.status(400).json({ error: 'Invalid branch' });
  
  const booking = {
    id: `B${uuidv4().slice(0, 8).toUpperCase()}`,
    ...req.body,
    paymentStatus: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  try {
    if (!canFitBookingInOperatingHours(booking.timeSlot, booking.duration)) {
      return res.status(400).json({ error: 'Selected time is outside available hours (10:00 AM - 11:59 PM)' });
    }

    const slotsToBlock = getBlockedSlotsForBooking(booking.timeSlot, booking.duration);
    if (!slotsToBlock.length) {
      return res.status(400).json({ error: 'Invalid booking time slot' });
    }

    let existingBookings = [];
    if (mongoConnections[branch]) {
      existingBookings = await Booking.find({ branch, date: booking.date, service: booking.service });
    } else if (branchDb) {
      existingBookings = branchDb.bookings.filter(b => b.date === booking.date && b.service === booking.service);
    }

    const startMinutes = parse12HourTime(booking.timeSlot);
    let conflictFound = false;
    for (const b of existingBookings) {
      if (isOverlappingWithBuffer(startMinutes, booking.duration, b.timeSlot, b.duration)) {
        conflictFound = true;
        break;
      }
    }

    if (conflictFound) {
      return res.status(409).json({
        error: 'Slot not available (overlaps with existing booking or buffer time)',
      });
    }

    if (mongoConnections[branch]) {
      const newBooking = new Booking(booking);
      await newBooking.save();

      await TimeSlot.insertMany(
        slotsToBlock.map((slotTime) => ({
          id: uuidv4(),
          date: booking.date,
          timeSlot: slotTime,
          service: booking.service,
          isBooked: true,
          bookingId: booking.id,
          createdAt: new Date(),
        }))
      );
    } else if (branchDb) {
      branchDb.bookings.push(booking);
      slotsToBlock.forEach((slotTime) => {
        branchDb.timeSlots.push({
          id: uuidv4(),
          date: booking.date,
          timeSlot: slotTime,
          service: booking.service,
          isBooked: true,
          bookingId: booking.id,
          createdAt: new Date(),
        });
      });
      
      // Save bookings and time slots to file immediately
      try {
        await saveBookings(branchDbs);
        await saveTimeSlots(branchDbs);
        console.log(`✓ Booking ${booking.id} created and saved for ${branch} on ${booking.date}`);
      } catch (saveError) {
        console.error('Failed to save booking data:', saveError);
        // Still return success to user, but log the error
      }
    }
    
    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

app.get('/api/bookings/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (mongoConnections['branch-1'] || mongoConnections['branch-2']) {
      const mongoBooking = await Booking.findOne({ id });
      if (mongoBooking) return res.json(mongoBooking);
    }
    for (const branchId in branchDbs) {
      const booking = branchDbs[branchId].bookings.find(b => b.id === id);
      if (booking) return res.json(booking);
    }
    res.status(404).json({ error: 'Booking not found' });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

app.get('/api/bookings', verifyAdmin, async (req, res) => {
  const { status, branch, startDate, endDate } = req.query;
  let allBookings = [];
  
  try {
    if (branch && mongoConnections[branch]) {
      let query = { branch };
      if (status) query.paymentStatus = status;
      if (startDate && endDate) query.date = { $gte: startDate, $lte: endDate };
      allBookings = await Booking.find(query);
    } else if (branch) {
      const branchDb = getBranchDb(branch);
      if (branchDb) allBookings = branchDb.bookings;
    } else {
      if (mongoConnections['branch-1']) {
        const mongoBookings = await Booking.find({});
        allBookings = allBookings.concat(mongoBookings);
      }
      if (mongoConnections['branch-2']) {
        const mongoBookings = await Booking.find({});
        allBookings = allBookings.concat(mongoBookings);
      }
      for (const branchId in branchDbs) {
        allBookings = allBookings.concat(branchDbs[branchId].bookings);
      }
    }
    
    let filtered = allBookings;
    if (status) filtered = filtered.filter(b => b.paymentStatus === status);
    if (startDate && endDate) filtered = filtered.filter(b => b.date >= startDate && b.date <= endDate);
    
    // Sort datewise (ascending)
    filtered.sort((a, b) => {
      // Primary sort: Date
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      // Secondary sort: Time Slot
      const timeA = parse12HourTime(a.timeSlot) || 0;
      const timeB = parse12HourTime(b.timeSlot) || 0;
      return timeA - timeB;
    });
    
    res.json(filtered);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

app.put('/api/bookings/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    if (mongoConnections['branch-1'] || mongoConnections['branch-2']) {
      const booking = await Booking.findOneAndUpdate({ id }, req.body, { new: true });
      if (booking) return res.json(booking);
    }
    for (const branchId in branchDbs) {
      const booking = branchDbs[branchId].bookings.find(b => b.id === id);
      if (booking) {
        Object.assign(booking, req.body, { updatedAt: new Date() });
        // Save to disk
        try {
          await saveBookings(branchDbs);
        } catch (saveError) {
          console.error('Failed to save booking data:', saveError);
        }
        return res.json(booking);
      }
    }
    res.status(404).json({ error: 'Booking not found' });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

app.delete('/api/bookings/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    if (mongoConnections['branch-1'] || mongoConnections['branch-2']) {
      const booking = await Booking.findOneAndDelete({ id });
      if (booking) {
        await TimeSlot.deleteMany({ bookingId: id });
        return res.json({ message: 'Booking cancelled' });
      }
    }
    for (const branchId in branchDbs) {
      const branchDb = branchDbs[branchId];
      const index = branchDb.bookings.findIndex(b => b.id === id);
      if (index !== -1) {
        const booking = branchDb.bookings[index];
        branchDb.bookings.splice(index, 1);
        const slotIndex = branchDb.timeSlots.findIndex(s => s.bookingId === booking.id);
        if (slotIndex !== -1) branchDb.timeSlots.splice(slotIndex, 1);
        
        // Save changes to file
        try {
          await saveBookings(branchDbs);
          await saveTimeSlots(branchDbs);
        } catch (saveError) {
          console.error('Failed to save booking data:', saveError);
        }
        
        return res.json({ message: 'Booking cancelled' });
      }
    }
    res.status(404).json({ error: 'Booking not found' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

// Payments
app.post('/api/payments/process', async (req, res) => {
  const { bookingId } = req.body;
  try {
    if (mongoConnections['branch-1'] || mongoConnections['branch-2']) {
      const booking = await Booking.findOneAndUpdate({ id: bookingId }, { paymentStatus: 'paid', updatedAt: new Date() }, { new: true });
      if (booking) return res.json({ success: true, message: 'Payment processed', booking });
    }
    for (const branchId in branchDbs) {
      const booking = branchDbs[branchId].bookings.find(b => b.id === bookingId);
      if (booking) {
        booking.paymentStatus = 'paid';
        booking.updatedAt = new Date();
        // Save to disk
        try {
          await saveBookings(branchDbs);
        } catch (saveError) {
          console.error('Failed to save booking data:', saveError);
        }
        
        // Send notification
        try {
          await sendBookingNotification(booking);
        } catch (notifyError) {
          console.error('Failed to send notification:', notifyError);
        }
        
        return res.json({ success: true, message: 'Payment processed', booking });
      }
    }
    res.status(404).json({ error: 'Booking not found' });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

app.post('/api/payments/mock', async (req, res) => {
  const { bookingId } = req.body;
  try {
    if (mongoConnections['branch-1'] || mongoConnections['branch-2']) {
      const booking = await Booking.findOneAndUpdate({ id: bookingId }, { paymentStatus: 'paid', updatedAt: new Date() }, { new: true });
      if (booking) return res.json({ success: true, message: 'Mock payment processed', booking });
    }
    for (const branchId in branchDbs) {
      const booking = branchDbs[branchId].bookings.find(b => b.id === bookingId);
      if (booking) {
        booking.paymentStatus = 'paid';
        booking.updatedAt = new Date();
        // Save to disk
        try {
          await saveBookings(branchDbs);
        } catch (saveError) {
          console.error('Failed to save booking data:', saveError);
        }
        return res.json({ success: true, message: 'Mock payment processed', booking });
      }
    }
    res.status(404).json({ error: 'Booking not found' });
  } catch (error) {
    console.error('Error processing mock payment:', error);
    res.status(500).json({ error: 'Failed to process mock payment' });
  }
});

app.get('/api/payments/:bookingId', async (req, res) => {
  const { bookingId } = req.params;
  try {
    if (mongoConnections['branch-1'] || mongoConnections['branch-2']) {
      const booking = await Booking.findOne({ id: bookingId });
      if (booking) return res.json({ bookingId: booking.id, paymentStatus: booking.paymentStatus });
    }
    for (const branchId in branchDbs) {
      const booking = branchDbs[branchId].bookings.find(b => b.id === bookingId);
      if (booking) return res.json({ bookingId: booking.id, paymentStatus: booking.paymentStatus });
    }
    res.status(404).json({ error: 'Booking not found' });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('Friends & Memories Backend is running 🚀');
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// Error Handler
app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Payload too large',
      message: 'Uploaded image is too large. Please use a smaller/compressed image.',
    });
  }
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Load persisted data on startup and start server
(async () => {
  try {
    await loadBookings(branchDbs);
    await loadTimeSlots(branchDbs);
  } catch (error) {
    console.error('Error loading persisted data:', error);
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})();
