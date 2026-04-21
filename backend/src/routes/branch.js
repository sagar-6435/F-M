import express from 'express';
import { globalDb, branchDbs, branchPricingDbs, createBranchPricingDb } from '../config/constants.js';
import * as catalogController from '../controllers/catalogController.js';
import { saveBranchPricingData } from '../controllers/catalogController.js';
import { verifyAdmin } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const branches = [];
    const branchIds = Object.keys(branchDbs); // Get all branch IDs
    
    for (const bId of branchIds) {
      const catalog = await catalogController.getCatalogForBranch(bId);
      if (catalog) {
        branches.push({
          id: bId,
          name: catalog.name || (globalDb.branches.find(b => b.id === bId)?.name) || bId,
          address: catalog.address || (globalDb.branches.find(b => b.id === bId)?.address) || '',
          phone: catalog.phone || (globalDb.branches.find(b => b.id === bId)?.phone) || '',
          mapLink: catalog.mapLink || (globalDb.branches.find(b => b.id === bId)?.mapLink) || ''
        });
      }
    }
    
    res.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
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

router.put('/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, address, phone, mapLink } = req.body;
  
  try {
    const catalog = await catalogController.getCatalogForBranch(id);
    if (!catalog) return res.status(404).json({ error: 'Branch catalog not found' });
    
    if (name) catalog.name = name;
    if (address) catalog.address = address;
    if (phone) catalog.phone = phone;
    if (mapLink !== undefined) catalog.mapLink = mapLink;
    
    await catalogController.saveCatalogForBranch(id, catalog);
    
    // Also update globalDb in memory for legacy support
    const branchIndex = globalDb.branches.findIndex(b => b.id === id);
    if (branchIndex !== -1) {
      Object.assign(globalDb.branches[branchIndex], { name, address, phone, mapLink });
    }
    
    res.json({ id, name, address, phone, mapLink });
  } catch (error) {
    console.error('Error updating branch:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
