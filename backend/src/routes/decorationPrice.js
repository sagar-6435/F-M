import express from 'express';
import { verifyAdmin } from '../middleware/auth.js';
import * as catalogController from '../controllers/catalogController.js';

const router = express.Router();

// Get decoration price
router.get('/', async (req, res) => {
  const result = await catalogController.getCatalogOrSendError(req, res);
  if (!result) return;
  res.json({ decorationPrice: result.catalog.decorationPrice });
});

// Update decoration price
router.put('/', verifyAdmin, async (req, res) => {
  const result = await catalogController.getCatalogOrSendError(req, res);
  if (!result) return;
  const { branch, catalog } = result;

  const { price } = req.body;
  if (price !== undefined) {
    catalog.decorationPrice = price;
  }
  await catalogController.saveCatalogForBranch(branch, catalog);
  res.json({ decorationPrice: catalog.decorationPrice });
});

export default router;
