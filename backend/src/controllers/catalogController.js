import path from 'path';
import { fileURLToPath } from 'url';
import { getBranchModels } from '../config/mongo.js';
import { cloneBranchPricingDb, branchPricingDbs, createBranchPricingDb } from '../config/constants.js';
import { promises as fs } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pricingDataFilePath = path.join(__dirname, '../data', 'branchPricingData.json');

export const saveBranchPricingData = async () => {
  try {
    await fs.mkdir(path.dirname(pricingDataFilePath), { recursive: true });
    await fs.writeFile(
      pricingDataFilePath,
      JSON.stringify(branchPricingDbs, null, 2),
      'utf-8'
    );
  } catch (error) {
    console.error('Failed to persist branch pricing data:', error);
  }
};

export const loadBranchPricingData = async () => {
  try {
    const raw = await fs.readFile(pricingDataFilePath, 'utf-8');
    const parsed = JSON.parse(raw);
    for (const branchId of Object.keys(parsed)) {
      branchPricingDbs[branchId] = {
        ...createBranchPricingDb(),
        ...parsed[branchId],
      };
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Failed to load branch pricing data:', error);
    }
  }
};

export const getCatalogForBranch = async (branchId = 'branch-1') => {
  const models = getBranchModels(branchId);
  if (models) {
    const defaultData = createBranchPricingDb();
    const doc = await models.BranchCatalog.findOneAndUpdate(
      { branch: branchId },
      { $setOnInsert: { branch: branchId, ...defaultData } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return cloneBranchPricingDb(doc.toObject());
  }

  const memoryCatalog = branchPricingDbs[branchId];
  return memoryCatalog ? cloneBranchPricingDb(memoryCatalog) : null;
};

export const saveCatalogForBranch = async (branchId, catalog) => {
  const models = getBranchModels(branchId);
  if (models) {
    await models.BranchCatalog.findOneAndUpdate(
      { branch: branchId },
      {
        branch: branchId,
        pricing: catalog.pricing,
        cakes: catalog.cakes,
        decorations: catalog.decorations,
        decorationPrice: catalog.decorationPrice,
        testimonials: catalog.testimonials,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return;
  }

  branchPricingDbs[branchId] = cloneBranchPricingDb(catalog);
  await saveBranchPricingData();
};

export const getBranchFromRequest = (req, includeBody = true) =>
  req.query.branch || (includeBody ? req.body.branch : undefined) || 'branch-1';

export const getCatalogOrSendError = async (req, res, includeBody = true) => {
  const branch = getBranchFromRequest(req, includeBody);
  const catalog = await getCatalogForBranch(branch);
  if (!catalog) {
    res.status(400).json({ error: 'Invalid branch' });
    return null;
  }
  return { branch, catalog };
};
