import express from 'express';
import { verifyAdmin } from '../middleware/auth.js';
import { globalDb } from '../data/globalDb.js';

const router = express.Router();

// Get decoration price
router.get('/', (req, res) => {
  res.json({ decorationPrice: globalDb.decorationPrice });
});

// Update decoration price
router.put('/', verifyAdmin, (req, res) => {
  const { price } = req.body;
  if (price !== undefined) {
    globalDb.decorationPrice = price;
  }
  res.json({ decorationPrice: globalDb.decorationPrice });
});

export default router;
