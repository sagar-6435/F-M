import express from 'express';
import { globalDb } from '../data/globalDb.js';

const router = express.Router();

// Get all services
router.get('/', (req, res) => {
  res.json(globalDb.services);
});

export default router;
