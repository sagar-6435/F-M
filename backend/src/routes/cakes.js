import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { verifyAdmin } from '../middleware/auth.js';
import { globalDb } from '../data/globalDb.js';

const router = express.Router();

// Get all cakes
router.get('/', (req, res) => {
  res.json(globalDb.cakes);
});

// Create new cake
router.post('/', verifyAdmin, (req, res) => {
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

// Update cake
router.put('/:id', verifyAdmin, (req, res) => {
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

// Delete cake
router.delete('/:id', verifyAdmin, (req, res) => {
  const { id } = req.params;
  const index = globalDb.cakes.findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Cake not found' });
  
  globalDb.cakes.splice(index, 1);
  res.json({ message: 'Cake deleted' });
});

export default router;
