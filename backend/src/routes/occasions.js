import express from 'express';
import { globalDb } from '../data/globalDb.js';

const router = express.Router();

// Get all occasions
router.get('/', (req, res) => {
  res.json(globalDb.occasions);
});

export default router;
