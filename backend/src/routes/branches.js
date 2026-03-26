import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { verifyAdmin } from '../middleware/auth.js';
import { globalDb, branchDbs } from '../data/globalDb.js';

const router = express.Router();

// Get all branches
router.get('/', (req, res) => {
  res.json(globalDb.branches);
});

// Get branch by ID
router.get('/:id', (req, res) => {
  const branch = globalDb.branches.find(b => b.id === req.params.id);
  if (!branch) return res.status(404).json({ error: 'Branch not found' });
  res.json(branch);
});

// Create new branch
router.post('/', verifyAdmin, (req, res) => {
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
  
  branchDbs[branchId] = {
    bookings: [],
    timeSlots: [],
  };
  
  res.status(201).json(branch);
});

export default router;
