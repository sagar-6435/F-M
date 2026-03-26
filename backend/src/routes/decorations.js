import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { verifyAdmin } from '../middleware/auth.js';
import { globalDb } from '../data/globalDb.js';

const router = express.Router();

// Get all decorations
router.get('/', (req, res) => {
  res.json(globalDb.decorations);
});

// Create new decoration
router.post('/', verifyAdmin, (req, res) => {
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

// Update decoration
router.put('/:id', verifyAdmin, (req, res) => {
  const { id } = req.params;
  const { name, price, description } = req.body;
  
  const decoration = globalDb.decorations.find(d => d.id === id);
  if (!decoration) return res.status(404).json({ error: 'Decoration not found' });
  
  if (name) decoration.name = name;
  if (price !== undefined) decoration.price = price;
  if (description) decoration.description = description;
  
  res.json(decoration);
});

// Delete decoration
router.delete('/:id', verifyAdmin, (req, res) => {
  const { id } = req.params;
  const index = globalDb.decorations.findIndex(d => d.id === id);
  if (index === -1) return res.status(404).json({ error: 'Decoration not found' });
  
  globalDb.decorations.splice(index, 1);
  res.json({ message: 'Decoration deleted' });
});

export default router;
