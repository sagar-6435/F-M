import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { verifyAdmin } from '../middleware/auth.js';
import * as catalogController from '../controllers/catalogController.js';

const router = express.Router();

// Get all decorations
router.get('/', async (req, res) => {
  const result = await catalogController.getCatalogOrSendError(req, res);
  if (!result) return;
  res.json(result.catalog.decorations);
});

// Create new decoration
router.post('/', verifyAdmin, async (req, res) => {
  const result = await catalogController.getCatalogOrSendError(req, res);
  if (!result) return;
  const { branch, catalog } = result;

  const { name, price, description, image } = req.body;
  const decoration = {
    id: `extra-${uuidv4()}`,
    name,
    price,
    description,
    image,
  };
  catalog.decorations.push(decoration);
  await catalogController.saveCatalogForBranch(branch, catalog);
  res.status(201).json(decoration);
});

// Update decoration
router.put('/:id', verifyAdmin, async (req, res) => {
  const result = await catalogController.getCatalogOrSendError(req, res);
  if (!result) return;
  const { branch, catalog } = result;

  const { id } = req.params;
  const { name, price, description, image } = req.body;
  
  const decoration = catalog.decorations.find(d => d.id === id);
  if (!decoration) return res.status(404).json({ error: 'Decoration not found' });
  
  if (name) decoration.name = name;
  if (price !== undefined) decoration.price = price;
  if (description) decoration.description = description;
  if (image) decoration.image = image;
  
  await catalogController.saveCatalogForBranch(branch, catalog);
  res.json(decoration);
});

// Delete decoration
router.delete('/:id', verifyAdmin, async (req, res) => {
  const result = await catalogController.getCatalogOrSendError(req, res);
  if (!result) return;
  const { branch, catalog } = result;

  const { id } = req.params;
  const index = catalog.decorations.findIndex(d => d.id === id);
  if (index === -1) return res.status(404).json({ error: 'Decoration not found' });
  
  catalog.decorations.splice(index, 1);
  await catalogController.saveCatalogForBranch(branch, catalog);
  res.json({ message: 'Decoration deleted' });
});

export default router;
