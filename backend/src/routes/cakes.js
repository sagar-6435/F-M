import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { verifyAdmin } from '../middleware/auth.js';
import * as catalogController from '../controllers/catalogController.js';

const router = express.Router();

// Get all cakes
router.get('/', async (req, res) => {
  const result = await catalogController.getCatalogOrSendError(req, res);
  if (!result) return;
  res.json(result.catalog.cakes);
});

// Create new cake
router.post('/', verifyAdmin, async (req, res) => {
  const result = await catalogController.getCatalogOrSendError(req, res);
  if (!result) return;
  const { branch, catalog } = result;

  const { name, price, description, image, quantity } = req.body;
  const cake = {
    id: `cake-${uuidv4()}`,
    name,
    price,
    description,
    image,
    quantity: quantity || '1kg', // Added quantity field
  };
  catalog.cakes.push(cake);
  await catalogController.saveCatalogForBranch(branch, catalog);
  res.status(201).json(cake);
});

// Update cake
router.put('/:id', verifyAdmin, async (req, res) => {
  const result = await catalogController.getCatalogOrSendError(req, res);
  if (!result) return;
  const { branch, catalog } = result;

  const { id } = req.params;
  const { name, price, description, image, quantity } = req.body;
  
  const cake = catalog.cakes.find(c => c.id === id);
  if (!cake) return res.status(404).json({ error: 'Cake not found' });
  
  if (name) cake.name = name;
  if (price !== undefined) cake.price = price;
  if (description) cake.description = description;
  if (image) cake.image = image;
  if (quantity) cake.quantity = quantity;
  
  await catalogController.saveCatalogForBranch(branch, catalog);
  res.json(cake);
});

// Delete cake
router.delete('/:id', verifyAdmin, async (req, res) => {
  const result = await catalogController.getCatalogOrSendError(req, res);
  if (!result) return;
  const { branch, catalog } = result;

  const { id } = req.params;
  const index = catalog.cakes.findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Cake not found' });
  
  catalog.cakes.splice(index, 1);
  await catalogController.saveCatalogForBranch(branch, catalog);
  res.json({ message: 'Cake deleted' });
});

export default router;
