import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://friendsandmemories.vercel.app',
      'https://f-m-8146.onrender.com'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins for now
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint (before other routes)
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// MongoDB Connections for each branch
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
    mongoConnections['branch-1'] = false;
  });
  conn1.on('disconnected', () => {
    console.log('MongoDB disconnected for Branch 1');
    mongoConnections['branch-1'] = false;
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
      mongoConnections['branch-2'] = false;
    });
}

// MongoDB Schemas
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

// Global shared data
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
  cakes: [
    { id: 'cake-1', name: 'Classic Chocolate Truffle', price: 799, description: 'Rich dark chocolate layers' },
    { id: 'cake-2', name: 'Red Velvet Dream', price: 899, description: 'Cream cheese frosted perfection' },
    { id: 'cake-3', name: 'Butterscotch Crunch', price: 749, description: 'Caramel & crunchy butterscotch' },
    { id: 'cake-4', name: 'Fresh Fruit Delight', price: 999, description: 'Seasonal fruits with cream' },
    { id: 'cake-5', name: 'Black Forest Premium', price: 849, description: 'Cherry-filled chocolate classic' },
  ],
  decorations: [
    { id: 'extra-1', name: 'Balloon Bouquet Setup', price: 1500, description: '100+ premium balloons' },
    { id: 'extra-2', name: 'LED Neon Sign', price: 800, description: 'Custom message neon display' },
    { id: 'extra-3', name: 'Photo Wall / Backdrop', price: 2000, description: 'Instagram-worthy backdrop' },
    { id: 'extra-4', name: 'Fog Machine Effect', price: 500, description: 'Dramatic fog entrance' },
    { id: 'extra-5', name: 'Rose Petal Pathway', price: 1200, description: 'Romantic rose petal setup' },
    { id: 'extra-6', name: 'Confetti Cannon', price: 600, description: 'Party poppers & confetti' },
  ],
  occasions: ['Birthday', 'Anniversary', 'Proposal', 'Baby Shower', 'Farewell', 'Get Together', 'Date Night', 'Other'],
  pricing: {
    'party-hall': { 1: 2999, 2: 4999, 3: 6999 },
    'private-theatre': { 1: 1999, 2: 3499, 3: 4999 },
  },
  decorationPrice: 1500,
};

// Branch-specific databases
const branchDbs = {
  'branch-1': {
    bookings: [],
    timeSlots: [],
  },
  'branch-2': {
    bookings: [],
    timeSlots: [],
  },
};

// Helper function to get branch database
const getBranchDb = (branchId) => {
  return branchDbs[branchId] || null;
};

// Middleware: Auth verification
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Routes: Admin
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, message: 'Login successful' });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

app.post('/api/admin/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Routes: Branches
app.get('/api/branches', (req, res) => {
  res.json(globalDb.branches);
});

app.get('/api/branches/:id', (req, res) => {
  const branch = globalDb.branches.find(b => b.id === req.params.id);
  if (!branch) return res.status(404).json({ error: 'Branch not found' });
  res.json(branch);
});

app.post('/api/branches', verifyAdmin, (req, res) => {
  const { name, address, phone, capacity, amenities } = req.body;
  const branchId = `branch-${uuidv4()}`;
  const branch = {
    id: branchId,
    name,
    address,
    phone,
    capacity,
    amenities,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  globalDb.branches.push(branch);
  
  // Create separate database for new branch
  branchDbs[branchId] = {
    bookings: [],
    timeSlots: [],
  };
  
  res.status(201).json(branch);
});

// Routes: Services
app.get('/api/services', (req, res) => {
  res.json(globalDb.services);
});

// Routes: Pricing
app.get('/api/pricing', (req, res) => {
  res.json(globalDb.pricing);
});

app.put('/api/pricing', verifyAdmin, (req, res) => {
  const { service, duration, price } = req.body;
  
  if (!globalDb.pricing[service]) {
    globalDb.pricing[service] = {};
  }
  
  globalDb.pricing[service][duration] = price;
  res.json(globalDb.pricing);
});

app.get('/api/pricing/:service/:duration', (req, res) => {
  const { service, duration } = req.params;
  const price = globalDb.pricing[service]?.[duration];
  if (price === undefined) return res.status(404).json({ error: 'Pricing not found' });
  res.json({ service, duration, price });
});

app.put('/api/decoration-price', verifyAdmin, (req, res) => {
  const { price } = req.body;
  if (price !== undefined) {
    globalDb.decorationPrice = price;
  }
  res.json({ decorationPrice: globalDb.decorationPrice });
});

app.get('/api/decoration-price', (req, res) => {
  res.json({ decorationPrice: globalDb.decorationPrice });
});

// Routes: Cakes
app.get('/api/cakes', (req, res) => {
  res.json(globalDb.cakes);
});

app.put('/api/cakes/:id', verifyAdmin, (req, res) => {
  const { id } = req.params;
  const { name, price, description, image } = req.body;
  
  const cake = globalDb.cakes.find(c => c.id === id);
  if (!cake) return res.status(404).json({ error: 'Cake not found' });
  
  if (name) cake.name = name;
  if (price !== undefined) cake.price = price;
  if (description) cake.description = description;
  if (image) cake.image = image;
  
  res.json(cake);
});

app.post('/api/cakes', verifyAdmin, (req, res) => {
  const { name, price, description, image } = req.body;
  const cake = {
    id: `cake-${uuidv4()}`,
    name,
    price,
    description,
    image,
  };
  globalDb.cakes.push(cake);
  res.status(201).json(cake);
});

app.delete('/api/cakes/:id', verifyAdmin, (req, res) => {
  const { id } = req.params;
  const index = globalDb.cakes.findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Cake not found' });
  
  globalDb.cakes.splice(index, 1);
  res.json({ message: 'Cake deleted' });
});

// Routes: Decorations
app.get('/api/decorations', (req, res) => {
  res.json(globalDb.decorations);
});

app.put('/api/decorations/:id', verifyAdmin, (req, res) => {
  const { id } = req.params;
  const { name, price, description } = req.body;
  
  const decoration = globalDb.decorations.find(d => d.id === id);
  if (!decoration) return res.status(404).json({ error: 'Decoration not found' });
  
  if (name) decoration.name = name;
  if (price !== undefined) decoration.price = price;
  if (description) decoration.description = description;
  
  res.json(decoration);
});

app.post('/api/decorations', verifyAdmin, (req, res) => {
  const { name, price, description } = req.body;
  const decoration = {
    id: `extra-${uuidv4()}`,
    name,
    price,
    description,
  };
  globalDb.decorations.push(decoration);
  res.status(201).json(decoration);
});

app.delete('/api/decorations/:id', verifyAdmin, (req, res) => {
  const { id } = req.params;
  const index = globalDb.decorations.findIndex(d => d.id === id);
  if (index === -1) return res.status(404).json({ error: 'Decoration not found' });
  
  globalDb.decorations.splice(index, 1);
  res.json({ message: 'Decoration deleted' });
});

// Routes: Occasions
app.get('/api/occasions', (req, res) => {
  res.json(globalDb.occasions);
});

// Routes: Availability
app.get('/api/availability/:branchId/:date/:service', async (req, res) => {
  const { branchId, date, service } = req.params;
  const branchDb = getBranchDb(branchId);
  
  if (!branchDb && !mongoConnections[branchId]) return res.status(404).json({ error: 'Branch not found' });
  
  const timeSlots = ['10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM', '8:00 PM'];
  let bookedSlots = [];
  
  try {
    if (mongoConnections[branchId]) {
      // Fetch from MongoDB
      const slots = await TimeSlot.find({ date, service });
      bookedSlots = slots.map(slot => slot.timeSlot);
    } else if (branchDb) {
      // Fetch from in-memory
      bookedSlots = branchDb.timeSlots
        .filter(slot => slot.date === date && slot.service === service)
        .map(slot => slot.timeSlot);
    }
    
    const availableSlots = timeSlots.filter(slot => !bookedSlots.includes(slot));
    res.json({ availableSlots, bookedSlots });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// Routes: Bookings
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
    if (mongoConnections[branch]) {
      // Store in MongoDB
      const newBooking = new Booking(booking);
      await newBooking.save();
      
      // Store time slot in MongoDB
      const timeSlot = {
        id: uuidv4(),
        date: booking.date,
        timeSlot: booking.timeSlot,
        service: booking.service,
        isBooked: true,
        bookingId: booking.id,
        createdAt: new Date(),
      };
      const newTimeSlot = new TimeSlot(timeSlot);
      await newTimeSlot.save();
    } else if (branchDb) {
      // Store in memory for branch without MongoDB
      branchDb.bookings.push(booking);
      branchDb.timeSlots.push({
        id: uuidv4(),
        date: booking.date,
        timeSlot: booking.timeSlot,
        service: booking.service,
        isBooked: true,
        bookingId: booking.id,
        createdAt: new Date(),
      });
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
    // Check MongoDB first
    if (mongoConnections['branch-1'] || mongoConnections['branch-2']) {
      const mongoBooking = await Booking.findOne({ id });
      if (mongoBooking) return res.json(mongoBooking);
    }
    
    // Check in-memory databases
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
      // Fetch from MongoDB
      let query = {};
      if (status) query.paymentStatus = status;
      if (startDate && endDate) {
        query.date = { $gte: startDate, $lte: endDate };
      }
      allBookings = await Booking.find(query);
    } else if (branch) {
      // Fetch from in-memory
      const branchDb = getBranchDb(branch);
      if (branchDb) allBookings = branchDb.bookings;
    } else {
      // Fetch from both sources
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
    if (startDate && endDate) {
      filtered = filtered.filter(b => b.date >= startDate && b.date <= endDate);
    }
    
    res.json(filtered);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

app.put('/api/bookings/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Try MongoDB first
    if (mongoConnections['branch-1'] || mongoConnections['branch-2']) {
      const booking = await Booking.findOneAndUpdate({ id }, req.body, { new: true });
      if (booking) return res.json(booking);
    }
    
    // Try in-memory databases
    for (const branchId in branchDbs) {
      const branchDb = branchDbs[branchId];
      const booking = branchDb.bookings.find(b => b.id === id);
      if (booking) {
        Object.assign(booking, req.body, { updatedAt: new Date() });
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
    // Try MongoDB first
    if (mongoConnections['branch-1'] || mongoConnections['branch-2']) {
      const booking = await Booking.findOneAndDelete({ id });
      if (booking) {
        await TimeSlot.deleteMany({ bookingId: id });
        return res.json({ message: 'Booking cancelled' });
      }
    }
    
    // Try in-memory databases
    for (const branchId in branchDbs) {
      const branchDb = branchDbs[branchId];
      const index = branchDb.bookings.findIndex(b => b.id === id);
      
      if (index !== -1) {
        const booking = branchDb.bookings[index];
        branchDb.bookings.splice(index, 1);
        
        const slotIndex = branchDb.timeSlots.findIndex(s => s.bookingId === booking.id);
        if (slotIndex !== -1) branchDb.timeSlots.splice(slotIndex, 1);
        
        return res.json({ message: 'Booking cancelled' });
      }
    }
    
    res.status(404).json({ error: 'Booking not found' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

// Routes: Payments
app.post('/api/payments/process', async (req, res) => {
  const { bookingId } = req.body;
  
  try {
    // Try MongoDB first
    if (mongoConnections['branch-1'] || mongoConnections['branch-2']) {
      const booking = await Booking.findOneAndUpdate(
        { id: bookingId },
        { paymentStatus: 'paid', updatedAt: new Date() },
        { new: true }
      );
      if (booking) {
        return res.json({ success: true, message: 'Payment processed', booking });
      }
    }
    
    // Try in-memory databases
    for (const branchId in branchDbs) {
      const booking = branchDbs[branchId].bookings.find(b => b.id === bookingId);
      if (booking) {
        booking.paymentStatus = 'paid';
        booking.updatedAt = new Date();
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
  const { bookingId, amount } = req.body;
  
  try {
    // Try MongoDB first
    if (mongoConnections['branch-1'] || mongoConnections['branch-2']) {
      const booking = await Booking.findOneAndUpdate(
        { id: bookingId },
        { paymentStatus: 'paid', updatedAt: new Date() },
        { new: true }
      );
      if (booking) {
        return res.json({ success: true, message: 'Mock payment processed', booking });
      }
    }
    
    // Try in-memory databases
    for (const branchId in branchDbs) {
      const booking = branchDbs[branchId].bookings.find(b => b.id === bookingId);
      if (booking) {
        booking.paymentStatus = 'paid';
        booking.updatedAt = new Date();
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
    // Try MongoDB first
    if (mongoConnections['branch-1'] || mongoConnections['branch-2']) {
      const booking = await Booking.findOne({ id: bookingId });
      if (booking) {
        return res.json({ bookingId: booking.id, paymentStatus: booking.paymentStatus });
      }
    }
    
    // Try in-memory databases
    for (const branchId in branchDbs) {
      const booking = branchDbs[branchId].bookings.find(b => b.id === bookingId);
      if (booking) {
        return res.json({ bookingId: booking.id, paymentStatus: booking.paymentStatus });
      }
    }
    
    res.status(404).json({ error: 'Booking not found' });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
});

// Routes: Admin Dashboard
app.get('/api/admin/dashboard/stats', verifyAdmin, async (req, res) => {
  const { branch } = req.query;
  let allBookings = [];
  
  try {
    if (branch && mongoConnections[branch]) {
      // Fetch from MongoDB
      allBookings = await Booking.find({});
    } else if (branch) {
      // Fetch from in-memory
      const branchDb = getBranchDb(branch);
      if (branchDb) allBookings = branchDb.bookings;
    } else {
      // Fetch from both sources
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
    
    const totalBookings = allBookings.length;
    const paidBookings = allBookings.filter(b => b.paymentStatus === 'paid').length;
    const pendingBookings = allBookings.filter(b => b.paymentStatus === 'pending').length;
    const totalRevenue = allBookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + b.totalPrice, 0);
    
    res.json({ totalBookings, paidBookings, pendingBookings, totalRevenue });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
