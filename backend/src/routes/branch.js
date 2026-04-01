import express from 'express';
import { globalDb, branchDbs, branchPricingDbs, createBranchPricingDb } from '../config/constants.js';
import { saveBranchPricingData } from '../controllers/catalogController.js';
import { verifyAdmin } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    if (!globalDb || !globalDb.branches) return res.status(500).json({ error: 'Server data configuration error' });
    res.json(globalDb.branches);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', (req, res) => {
  const branch = globalDb.branches.find(b => b.id === req.params.id);
  if (!branch) return res.status(404).json({ error: 'Branch not found' });
  res.json(branch);
});

router.post('/', verifyAdmin, (req, res) => {
  const { name, address, phone, capacity, amenities } = req.body;
  const branchId = `branch-${uuidv4()}`;
  const branch = { id: branchId, name, address, phone, capacity, amenities, createdAt: new Date(), updatedAt: new Date() };
  globalDb.branches.push(branch);
  branchDbs[branchId] = { bookings: [], timeSlots: [] };
  branchPricingDbs[branchId] = createBranchPricingDb();
  saveBranchPricingData();
  res.status(201).json(branch);
});

router.put('/:id', verifyAdmin, (req, res) => {
  const { id } = req.params;
  const { name, address, phone, capacity, amenities } = req.body;
  const branchIndex = globalDb.branches.findIndex(b => b.id === id);
  if (branchIndex === -1) return res.status(404).json({ error: 'Branch not found' });
  
  const branch = globalDb.branches[branchIndex];
  if (name) branch.name = name;
  if (address) branch.address = address;
  if (phone) branch.phone = phone;
  if (capacity !== undefined) branch.capacity = capacity;
  if (amenities) branch.amenities = amenities;
  branch.updatedAt = new Date();
  
  saveBranchPricingData(); // Persist changes
  res.json(branch);
});

export default router;
