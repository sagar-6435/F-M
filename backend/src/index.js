import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectToMongo, getBranchModels } from './config/mongo.js';
import { branchDbs, globalDb } from './config/constants.js';
import { loadBookings, loadTimeSlots } from './utils/persistence.js';
import { loadBranchPricingData } from './controllers/catalogController.js';

// Route Imports
import adminRoutes from './routes/admin.js';
import bookingRoutes from './routes/bookings.js';
import catalogRoutes from './routes/catalog.js';
import branchRoutes from './routes/branch.js';
import paymentRoutes from './routes/payment.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
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
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Routes
app.use('/api/branches', branchRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/catalog', catalogRoutes); // consolidated catalog operations

// Unified access to catalog components (pricing, cakes, etc.) under /api/
app.use('/api', catalogRoutes); 

// Legacy compatibility (if needed)
app.use('/api/booking', bookingRoutes);



// Health & Debug
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));
app.get('/api/debug/bookings-count', async (req, res) => {
  const counts = {};
  let total = 0;
  
  for (const branchId in branchDbs) {
    let branchTotal = 0;
    const models = getBranchModels(branchId);
    
    if (models) {
      try {
        branchTotal = await models.Booking.countDocuments();
      } catch (e) {
        console.error(`Error counting Mongo bookings for ${branchId}:`, e.message);
      }
    } else {
      branchTotal = branchDbs[branchId].bookings.length;
    }
    
    counts[branchId] = branchTotal;
    total += branchTotal;
  }
  
  res.json({ counts, total, timestamp: new Date(), storage: Object.keys(counts).map(id => ({ id, type: getBranchModels(id) ? 'MongoDB' : 'File' })) });
});

app.get('/', (req, res) => res.send('Friends & Memories Backend is running 🚀'));

// 404 & Error Handlers
app.use((req, res) => res.status(404).json({ error: 'Route not found', path: req.path }));
app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Payload too large' });
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Startup
(async () => {
  try {
    // Mongo Connections
    await connectToMongo('branch-1', process.env.MONGODB_URI_BRANCH1);
    await connectToMongo('branch-2', process.env.MONGODB_URI_BRANCH2);
    await connectToMongo('reviews', process.env.MONGODB_URI_REVIEWS);

    // Persistence
    await loadBookings(branchDbs);
    await loadTimeSlots(branchDbs);
    await loadBranchPricingData();

    app.listen(PORT, () => console.log(`Server running `));
  } catch (error) {
    console.error('Startup Error:', error);
  }
})();
 
