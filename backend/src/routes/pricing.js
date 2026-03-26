import express from 'express';
import { verifyAdmin } from '../middleware/auth.js';
import { globalDb } from '../data/globalDb.js';

const router = express.Router();

// Get all pricing
router.get('/', (req, res) => {
  res.json(globalDb.pricing);
});

// Update pricing
router.put('/', verifyAdmin, (req, res) => {
  const { service, duration, price } = req.body;
  
  if (!globalDb.pricing[service]) {
    globalDb.pricing[service] = {};
  }
  
  globalDb.pricing[service][duration] = price;
  res.json(globalDb.pricing);
});

// Get pricing for specific service and duration
router.get('/:service/:duration', (req, res) => {
  const { service, duration } = req.params;
  const price = globalDb.pricing[service]?.[duration];
  if (price === undefined) return res.status(404).json({ error: 'Pricing not found' });
  res.json({ service, duration, price });
});



export default router;
