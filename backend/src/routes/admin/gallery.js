// Gallery routes — testimonials + gallery item images
import express from 'express';
import * as catalogController from '../../controllers/catalogController.js';
import { verifyAdmin } from '../../middleware/auth.js';
import { uploadToCloudinary } from '../../utils/cloudinary.js';
import { getRootFolderForBranch } from '../../utils/branchConfig.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// ── Gallery items (cake/decoration images) ──────────────────────────────────
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const branch = req.query.branch || 'branch-1';
    const type = req.query.type;
    const catalog = await catalogController.getCatalogForBranch(branch);
    if (!catalog) return res.status(400).json({ error: 'Invalid branch' });
    const cakes = catalog.cakes.map(item => ({ ...item, type: 'cake' }));
    const decorations = catalog.decorations.map(item => ({ ...item, type: 'decoration' }));
    let items = [...cakes, ...decorations];
    if (type === 'cake' || type === 'decoration') items = items.filter(i => i.type === type);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:type/:id', verifyAdmin, async (req, res) => {
  const branch = req.query.branch || req.body.branch || 'branch-1';
  const { type, id } = req.params;
  const { image, price, originalPrice, offerPrice, name, description } = req.body;
  if (type !== 'cake' && type !== 'decoration') return res.status(400).json({ error: 'Invalid type' });

  try {
    let imageUrl = image;
    if (image && image.startsWith('data:image')) {
      imageUrl = await uploadToCloudinary(image, type + 's', getRootFolderForBranch(branch));
    }
    const catalog = await catalogController.getCatalogForBranch(branch);
    if (!catalog) return res.status(400).json({ error: 'Invalid branch' });
    const list = type === 'cake' ? catalog.cakes : catalog.decorations;
    const item = list.find(e => e.id === id);
    if (!item) return res.status(404).json({ error: `${type} not found` });
    if (imageUrl) item.image = imageUrl;
    if (price !== undefined) item.price = price;
    if (originalPrice !== undefined) item.originalPrice = originalPrice;
    if (offerPrice !== undefined) item.offerPrice = offerPrice;
    if (name !== undefined) item.name = name;
    if (description !== undefined) item.description = description;
    await catalogController.saveCatalogForBranch(branch, catalog);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// ── Testimonials ─────────────────────────────────────────────────────────────
router.get('/testimonials', async (req, res) => {
  try {
    const branch = req.query.branch || 'branch-1';
    const catalog = await catalogController.getCatalogForBranch(branch);
    if (!catalog) return res.status(400).json({ error: 'Invalid branch' });
    res.json(catalog.testimonials || []);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/testimonials', verifyAdmin, async (req, res) => {
  const branch = req.query.branch || req.body.branch || 'branch-1';
  const { image, title, date } = req.body;
  if (!image) return res.status(400).json({ error: 'Image required' });

  try {
    let imageUrl = image;
    if (image.startsWith('data:image')) {
      imageUrl = await uploadToCloudinary(image, 'testimonials', getRootFolderForBranch(branch));
    }
    const catalog = await catalogController.getCatalogForBranch(branch);
    if (!catalog) return res.status(400).json({ error: 'Invalid branch' });
    const testimonial = {
      id: `testimonial-${uuidv4()}`,
      image: imageUrl,
      title: title || 'Customer Memory',
      date: date || new Date().toLocaleDateString(),
    };
    catalog.testimonials.push(testimonial);
    await catalogController.saveCatalogForBranch(branch, catalog);
    res.status(201).json(testimonial);
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload/save testimonial' });
  }
});

router.put('/testimonials/:id', verifyAdmin, async (req, res) => {
  const branch = req.query.branch || req.body.branch || 'branch-1';
  const { title, image } = req.body;
  try {
    const catalog = await catalogController.getCatalogForBranch(branch);
    if (!catalog) return res.status(400).json({ error: 'Invalid branch' });
    const item = catalog.testimonials.find(t => t.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (title !== undefined) item.title = title;
    if (image) {
      let imageUrl = image;
      if (image.startsWith('data:image')) {
        imageUrl = await uploadToCloudinary(image, 'testimonials', getRootFolderForBranch(branch));
      }
      item.image = imageUrl;
    }
    await catalogController.saveCatalogForBranch(branch, catalog);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update testimonial' });
  }
});

router.delete('/testimonials/:id', verifyAdmin, async (req, res) => {
  const branch = req.query.branch || req.body.branch || 'branch-1';
  try {
    const catalog = await catalogController.getCatalogForBranch(branch);
    if (!catalog) return res.status(400).json({ error: 'Invalid branch' });
    const index = catalog.testimonials.findIndex(t => t.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Not found' });
    catalog.testimonials.splice(index, 1);
    await catalogController.saveCatalogForBranch(branch, catalog);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete testimonial' });
  }
});

// ── Gallery Videos (kept for backward compat, currently unused in UI) ────────
router.get('/videos', async (req, res) => {
  try {
    const branch = req.query.branch || 'branch-1';
    const catalog = await catalogController.getCatalogForBranch(branch);
    if (!catalog) return res.status(400).json({ error: 'Invalid branch' });
    res.json(catalog.galleryVideos || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch gallery videos' });
  }
});

export default router;
