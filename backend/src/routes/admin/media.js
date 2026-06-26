// Hero images route
import express from 'express';
import * as catalogController from '../../controllers/catalogController.js';
import { verifyAdmin } from '../../middleware/auth.js';
import { uploadToCloudinary } from '../../utils/cloudinary.js';
import { getRootFolderForBranch } from '../../utils/branchConfig.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const branch = req.query.branch || 'branch-1';
    const catalog = await catalogController.getCatalogForBranch(branch);
    if (!catalog) return res.status(400).json({ error: 'Invalid branch' });
    res.json(catalog.heroImages || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hero images' });
  }
});

router.post('/', verifyAdmin, async (req, res) => {
  const branch = req.query.branch || req.body.branch || 'branch-1';
  const { image } = req.body;
  if (!image) return res.status(400).json({ error: 'Image required' });

  try {
    let imageUrl = image;
    if (image.startsWith('data:image')) {
      imageUrl = await uploadToCloudinary(image, 'hero', getRootFolderForBranch(branch));
    }
    const catalog = await catalogController.getCatalogForBranch(branch);
    if (!catalog) return res.status(400).json({ error: 'Invalid branch' });
    if (!catalog.heroImages) catalog.heroImages = [];
    catalog.heroImages.push(imageUrl);
    await catalogController.saveCatalogForBranch(branch, catalog);
    res.json(catalog.heroImages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload/save hero image' });
  }
});

router.delete('/:index', verifyAdmin, async (req, res) => {
  const branch = req.query.branch || 'branch-1';
  const index = parseInt(req.params.index);

  try {
    const catalog = await catalogController.getCatalogForBranch(branch);
    if (!catalog) return res.status(400).json({ error: 'Invalid branch' });
    if (!catalog.heroImages || index < 0 || index >= catalog.heroImages.length) {
      return res.status(404).json({ error: 'Index out of bounds' });
    }
    catalog.heroImages.splice(index, 1);
    await catalogController.saveCatalogForBranch(branch, catalog);
    res.json(catalog.heroImages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete hero image' });
  }
});

export default router;
