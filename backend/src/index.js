import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeMongoConnections } from './config/database.js';
import { corsOptions } from './middleware/cors.js';
import adminRoutes from './routes/admin.js';
import branchRoutes from './routes/branches.js';
import serviceRoutes from './routes/services.js';
import pricingRoutes from './routes/pricing.js';
import cakeRoutes from './routes/cakes.js';
import decorationRoutes from './routes/decorations.js';
import decorationPriceRoutes from './routes/decorationPrice.js';
import occasionRoutes from './routes/occasions.js';
import availabilityRoutes from './routes/availability.js';
import bookingRoutes from './routes/bookings.js';
import paymentRoutes from './routes/payments.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Initialize MongoDB connections
initializeMongoConnections();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/cakes', cakeRoutes);
app.use('/api/decorations', decorationRoutes);
app.use('/api/decoration-price', decorationPriceRoutes);
app.use('/api/occasions', occasionRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
