import express from 'express';
import { verifyAdmin } from '../middleware/auth.js';
import * as catalogController from '../controllers/catalogController.js';

const router = express.Router();

// Get all pricing
router.get('/', async (req, res) => {
  const result = await catalogController.getCatalogOrSendError(req, res);
  if (!result) return;
  console.log(`[PRICING] GET /pricing - returning:`, JSON.stringify(result.catalog.pricing));
  res.json(result.catalog.pricing);
});

// Update pricing
router.put('/', verifyAdmin, async (req, res) => {
  const result = await catalogController.getCatalogOrSendError(req, res);
  if (!result) return;
  const { branch, catalog } = result;

  const { service, duration, price, originalPrice, offerPrice } = req.body;
  console.log(`[PRICING] Updating ${service} ${duration}h: price=${price}, original=${originalPrice}, offer=${offerPrice}`);
  
  if (!catalog.pricing[service]) {
    catalog.pricing[service] = {};
  }
  
  // Support both old format (simple number) and new format (object with prices)
  catalog.pricing[service][duration] = {
    price: price,
    ...(originalPrice !== undefined && { originalPrice }),
    ...(offerPrice !== undefined && { offerPrice })
  };
  
  console.log(`[PRICING] Stored pricing:`, JSON.stringify(catalog.pricing[service][duration]));
  
  await catalogController.saveCatalogForBranch(branch, catalog);
  
  console.log(`[PRICING] After save, full pricing:`, JSON.stringify(catalog.pricing[service]));
  
  res.json(catalog.pricing);
});

// Get pricing for specific service and duration
router.get('/:service/:duration', async (req, res) => {
  const result = await catalogController.getCatalogOrSendError(req, res);
  if (!result) return;
  const { catalog } = result;

  const { service, duration } = req.params;
  const price = catalog.pricing[service]?.[duration];
  if (price === undefined) return res.status(404).json({ error: 'Pricing not found' });
  res.json({ service, duration, price });
});

export default router;
