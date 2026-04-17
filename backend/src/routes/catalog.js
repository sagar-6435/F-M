import express from 'express';
import * as catalogController from '../controllers/catalogController.js';
import { verifyAdmin } from '../middleware/auth.js';
import { globalDb, defaultCakes } from '../config/constants.js';
import { v4 as uuidv4 } from 'uuid';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { getRootFolderForBranch } from '../utils/branchConfig.js';

const router = express.Router();

// Pricing
router.get('/pricing', async (req, res) => {
  const resolved = await catalogController.getCatalogOrSendError(req, res, false);
  if (!resolved) return;
  res.json(resolved.catalog.pricing);
});

router.put('/pricing', verifyAdmin, async (req, res) => {
  const resolved = await catalogController.getCatalogOrSendError(req, res, true);
  if (!resolved) return;
  const { branch, catalog } = resolved;
  const { service, duration, price } = req.body;
  if (!catalog.pricing[service]) catalog.pricing[service] = {};
  catalog.pricing[service][duration] = price;
  await catalogController.saveCatalogForBranch(branch, catalog);
  res.json(catalog.pricing);
});

router.get('/pricing/:service/:duration', async (req, res) => {
  const resolved = await catalogController.getCatalogOrSendError(req, res, false);
  if (!resolved) return;
  const { service, duration } = req.params;
  const price = resolved.catalog.pricing[service]?.[duration];
  if (price === undefined) return res.status(404).json({ error: 'Pricing not found' });
  res.json({ service, duration, price });
});

// Decoration Price
router.get('/decoration-price', async (req, res) => {
  const resolved = await catalogController.getCatalogOrSendError(req, res, false);
  if (!resolved) return;
  res.json({ decorationPrice: resolved.catalog.decorationPrice });
});

router.put('/decoration-price', verifyAdmin, async (req, res) => {
  const resolved = await catalogController.getCatalogOrSendError(req, res, true);
  if (!resolved) return;
  const { branch, catalog } = resolved;
  const { price } = req.body;
  if (price !== undefined) catalog.decorationPrice = price;
  await catalogController.saveCatalogForBranch(branch, catalog);
  res.json({ decorationPrice: catalog.decorationPrice });
});

// Cakes
router.get('/cakes', async (req, res) => {
  const resolved = await catalogController.getCatalogOrSendError(req, res, false);
  if (!resolved) return;
  res.json(resolved.catalog.cakes);
});

router.post('/cakes', verifyAdmin, async (req, res) => {
  const resolved = await catalogController.getCatalogOrSendError(req, res, true);
  if (!resolved) return;
  const { branch, catalog } = resolved;
  const { name, price, description, image } = req.body;
  
  try {
    let imageUrl = image;
    if (image && image.startsWith('data:image')) {
      imageUrl = await uploadToCloudinary(image, 'cakes', getRootFolderForBranch(branch));
    }
    const cake = { id: `cake-${uuidv4()}`, name, price, description, image: imageUrl };
    catalog.cakes.push(cake);
    await catalogController.saveCatalogForBranch(branch, catalog);
    res.status(201).json(cake);
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload/save cake' });
  }
});

router.put('/cakes/:id', verifyAdmin, async (req, res) => {
  const resolved = await catalogController.getCatalogOrSendError(req, res, true);
  if (!resolved) return;
  const { branch, catalog } = resolved;
  const item = catalog.cakes.find(c => c.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Cake not found' });
  
  try {
    const updateData = { ...req.body };
    if (updateData.image && updateData.image.startsWith('data:image')) {
      updateData.image = await uploadToCloudinary(updateData.image, 'cakes', getRootFolderForBranch(branch));
    }
    Object.assign(item, updateData);
    await catalogController.saveCatalogForBranch(branch, catalog);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload/update cake' });
  }
});

router.delete('/cakes/:id', verifyAdmin, async (req, res) => {
  const resolved = await catalogController.getCatalogOrSendError(req, res, true);
  if (!resolved) return;
  const { branch, catalog } = resolved;
  const index = catalog.cakes.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Cake not found' });
  catalog.cakes.splice(index, 1);
  await catalogController.saveCatalogForBranch(branch, catalog);
  res.json({ message: 'Cake deleted' });
});

// Decorations
router.get('/decorations', async (req, res) => {
  const resolved = await catalogController.getCatalogOrSendError(req, res, false);
  if (!resolved) return;
  res.json(resolved.catalog.decorations);
});

router.post('/decorations', verifyAdmin, async (req, res) => {
  const resolved = await catalogController.getCatalogOrSendError(req, res, true);
  if (!resolved) return;
  const { branch, catalog } = resolved;
  const { name, price, description, image } = req.body;
  
  try {
    let imageUrl = image;
    if (image && image.startsWith('data:image')) {
      imageUrl = await uploadToCloudinary(image, 'decorations', getRootFolderForBranch(branch));
    }
    const decoration = { id: `extra-${uuidv4()}`, name, price, description, image: imageUrl };
    catalog.decorations.push(decoration);
    await catalogController.saveCatalogForBranch(branch, catalog);
    res.status(201).json(decoration);
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload/save decoration' });
  }
});

router.put('/decorations/:id', verifyAdmin, async (req, res) => {
  const resolved = await catalogController.getCatalogOrSendError(req, res, true);
  if (!resolved) return;
  const { branch, catalog } = resolved;
  const item = catalog.decorations.find(d => d.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Decoration not found' });
  
  try {
    const updateData = { ...req.body };
    if (updateData.image && updateData.image.startsWith('data:image')) {
      updateData.image = await uploadToCloudinary(updateData.image, 'decorations', getRootFolderForBranch(branch));
    }
    Object.assign(item, updateData);
    await catalogController.saveCatalogForBranch(branch, catalog);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload/update decoration' });
  }
});

router.delete('/decorations/:id', verifyAdmin, async (req, res) => {
  const resolved = await catalogController.getCatalogOrSendError(req, res, true);
  if (!resolved) return;
  const { branch, catalog } = resolved;
  const index = catalog.decorations.findIndex(d => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Decoration not found' });
  catalog.decorations.splice(index, 1);
  await catalogController.saveCatalogForBranch(branch, catalog);
  res.json({ message: 'Decoration deleted' });
});

// Testimonials (Public)
router.get('/testimonials', async (req, res) => {
  const branch = req.query.branch || 'branch-1';
  const catalog = await catalogController.getCatalogForBranch(branch);
  if (!catalog) return res.status(400).json({ error: 'Invalid branch' });
  res.json(catalog.testimonials || []);
});

// Alias for compatibility
router.get('/gallery/testimonials', async (req, res) => {
  const branch = req.query.branch || 'branch-1';
  const catalog = await catalogController.getCatalogForBranch(branch);
  if (!catalog) return res.status(400).json({ error: 'Invalid branch' });
  res.json(catalog.testimonials || []);
});

// Social Links
router.get('/social-links', async (req, res) => {
  const resolved = await catalogController.getCatalogOrSendError(req, res, false);
  if (!resolved) return;
  res.json(resolved.catalog.socialLinks || { instagram: "", facebook: "", whatsapp: "" });
});

router.put('/social-links', verifyAdmin, async (req, res) => {
  const resolved = await catalogController.getCatalogOrSendError(req, res, true);
  if (!resolved) return;
  const { branch, catalog } = resolved;
  const { instagram, facebook, whatsapp } = req.body;
  
  if (!catalog.socialLinks) catalog.socialLinks = {};
  if (instagram !== undefined) catalog.socialLinks.instagram = instagram;
  if (facebook !== undefined) catalog.socialLinks.facebook = facebook;
  if (whatsapp !== undefined) catalog.socialLinks.whatsapp = whatsapp;
  
  await catalogController.saveCatalogForBranch(branch, catalog);
  res.json(catalog.socialLinks);
});

// General info
router.get('/occasions', (req, res) => res.json(globalDb.occasions));
router.get('/services', (req, res) => res.json(globalDb.services));

export default router;
