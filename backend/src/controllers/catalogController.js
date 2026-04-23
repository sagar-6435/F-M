import path from 'path';
import { fileURLToPath } from 'url';
import { getBranchModels, getReviewModel } from '../config/mongo.js';
import { cloneBranchPricingDb, branchPricingDbs, createBranchPricingDb, defaultPricing, globalDb } from '../config/constants.js';
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
    const defaultData = createBranchPricingDb(branchId);
    let doc = await models.BranchCatalog.findOne({ branch: branchId });
    
    if (!doc) {
      doc = await models.BranchCatalog.create({ branch: branchId, ...defaultData });
    } else {
      // MIGRATION: Merge new services from defaultPricing into existing pricing
      const pricing = doc.pricing || {};
      const mergedPricing = { ...defaultPricing };
      
      // Keep existing service data
      for (const service in pricing) {
        if (service !== 'private-theatre' && service !== 'party-hall') {
          mergedPricing[service] = pricing[service];
        }
      }
      
      // Handle legacy services
      if (pricing['private-theatre'] || pricing['party-hall']) {
        const unifiedPricing = pricing['private-theatre-party-hall'] || defaultPricing['private-theatre-party-hall'];
        mergedPricing['private-theatre-party-hall'] = unifiedPricing;
      }
      
      doc.pricing = mergedPricing;
      if (doc.markModified) doc.markModified('pricing');
      await doc.save();
    }
    
    const catalogObj = doc.toObject();
    
    // Fallback to globalDb for branch info if missing in DB doc
    const branchInfo = globalDb.branches.find(b => b.id === branchId) || {};
    if (!catalogObj.name) catalogObj.name = branchInfo.name;
    if (!catalogObj.address) catalogObj.address = branchInfo.address;
    if (!catalogObj.phone) catalogObj.phone = branchInfo.phone;
    if (!catalogObj.mapLink && branchInfo.mapLink) catalogObj.mapLink = branchInfo.mapLink;

    console.log(`[DB-RETRIEVE] Retrieved catalog for ${branchId}:`, {
      pricingStructure: JSON.stringify(catalogObj.pricing),
      hasOffers: Object.keys(catalogObj.pricing).some(service => 
        Object.values(catalogObj.pricing[service]).some(price => typeof price === 'object' && price.offerPrice)
      )
    });
    
    return cloneBranchPricingDb(catalogObj);
  }

  const memoryCatalog = branchPricingDbs[branchId];
  if (memoryCatalog) {
    console.log(`[MEMORY-RETRIEVE] Using memory catalog for ${branchId}:`, {
      pricingStructure: JSON.stringify(memoryCatalog.pricing)
    });
  }
  return memoryCatalog ? cloneBranchPricingDb(memoryCatalog) : null;
};

export const saveCatalogForBranch = async (branchId, catalog) => {
  console.log(`[CATALOG-SAVE] Initiating save for ${branchId}. Data:`, {
    name: catalog.name,
    address: catalog.address,
    phone: catalog.phone,
    mapLink: catalog.mapLink,
    pricingKeys: catalog.pricing ? Object.keys(catalog.pricing) : []
  });

  // Always update memory cache and persist to file as a secondary backup
  const plainCatalog = (catalog && typeof catalog.toObject === 'function') ? catalog.toObject() : catalog;
  branchPricingDbs[branchId] = cloneBranchPricingDb(plainCatalog);
  await saveBranchPricingData();

  const models = getBranchModels(branchId);
  if (models) {
    try {
      // Use findOne and update to ensure hooks and proper Map handling
      let doc = await models.BranchCatalog.findOne({ branch: branchId });
      
      if (!doc) {
        doc = new models.BranchCatalog({ branch: branchId });
      }

      // Update fields
      if (catalog.name !== undefined) doc.name = catalog.name;
      if (catalog.address !== undefined) doc.address = catalog.address;
      if (catalog.phone !== undefined) doc.phone = catalog.phone;
      if (catalog.mapLink !== undefined) doc.mapLink = catalog.mapLink;
      if (catalog.pricing !== undefined) doc.pricing = catalog.pricing;
      if (catalog.cakes !== undefined) doc.cakes = catalog.cakes;
      if (catalog.decorations !== undefined) doc.decorations = catalog.decorations;
      if (catalog.decorationPrice !== undefined) doc.decorationPrice = catalog.decorationPrice;
      if (catalog.testimonials !== undefined) doc.testimonials = catalog.testimonials;
      if (catalog.heroImages !== undefined) doc.heroImages = catalog.heroImages;
      if (catalog.socialLinks !== undefined) doc.socialLinks = catalog.socialLinks;

      if (doc.markModified) {
        doc.markModified('pricing');
        doc.markModified('cakes');
        doc.markModified('decorations');
        doc.markModified('testimonials');
        doc.markModified('socialLinks');
      }

      await doc.save();
      console.log(`[DB-SAVE] Successfully persisted catalog for ${branchId} to database.`);
    } catch (err) {
      console.error(`[DB-SAVE-ERROR] Failed to save catalog for ${branchId}:`, err);
      throw err;
    }
  }
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
export const getReviews = async () => {
  const Review = getReviewModel();
  if (!Review) {
    console.warn('[REVIEWS] Review model not available - DB might not be connected');
    return [];
  }
  return Review.find().sort({ createdAt: -1 });
};

export const getAllReviews = async () => {
  return getReviews();
};

export const addReview = async (branchId, reviewData) => {
  const Review = getReviewModel();
  if (!Review) throw new Error('Review database not connected');
  return Review.create({ ...reviewData, branch: branchId });
};
