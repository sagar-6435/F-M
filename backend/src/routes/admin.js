import express from 'express';
import * as adminController from '../controllers/adminController.js';
import * as catalogController from '../controllers/catalogController.js';
import { verifyAdmin } from '../middleware/auth.js';
import { getAllBookingsFromFiles } from '../utils/migration.js';
import { mongoConnections, getBranchModels } from '../config/mongo.js';
import { branchDbs } from '../config/constants.js';
import { v4 as uuidv4 } from 'uuid';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { getRootFolderForBranch } from '../utils/branchConfig.js';

const router = express.Router();

router.post('/login', adminController.login);
router.post('/logout', (req, res) => res.json({ message: 'Logout successful' }));

router.get('/dashboard/stats', verifyAdmin, adminController.getDashboardStats);
router.post('/migrate-to-mongo', verifyAdmin, adminController.migrateToMongo);
router.post('/migrate-pricing-to-mongo', verifyAdmin, adminController.migratePricingToMongo);
router.post('/clear-bookings', verifyAdmin, adminController.clearBookings);

router.get('/all-bookings', verifyAdmin, async (req, res) => {
  try {
    const allBookings = await getAllBookingsFromFiles();
    res.json({ count: allBookings.length, bookings: allBookings, timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Gallery & Testimonials (Admin)
router.get('/gallery', verifyAdmin, async (req, res) => {
  const branch = req.query.branch || 'branch-1';
  const type = req.query.type;
  const catalog = await catalogController.getCatalogForBranch(branch);
  if (!catalog) return res.status(400).json({ error: 'Invalid branch' });
  const cakes = catalog.cakes.map((item) => ({ ...item, type: 'cake' }));
  const decorations = catalog.decorations.map((item) => ({ ...item, type: 'decoration' }));
  let items = [...cakes, ...decorations];
  if (type === 'cake' || type === 'decoration') {
    items = items.filter((item) => item.type === type);
  }
  res.json(items);
});

router.put('/gallery/:type/:id', verifyAdmin, async (req, res) => {
  const branch = req.query.branch || req.body.branch || 'branch-1';
  const { type, id } = req.params;
  const { image, price, originalPrice, offerPrice, name, description } = req.body;
  if (type !== 'cake' && type !== 'decoration') return res.status(400).json({ error: 'Invalid type' });
  
  try {
    // If it's a data URL (base64 from frontend), upload to Cloudinary
    let imageUrl = image;
    if (image && image.startsWith('data:image')) {
      const rootFolder = getRootFolderForBranch(branch);
      console.log(`☁️ Uploading ${type} image to Cloudinary [${rootFolder}]...`);
      imageUrl = await uploadToCloudinary(image, type + 's', rootFolder);
      console.log(`✅ ${type} image uploaded: ${imageUrl}`);
    }

    const catalog = await catalogController.getCatalogForBranch(branch);
    if (!catalog) return res.status(400).json({ error: 'Invalid branch' });
    const list = type === 'cake' ? catalog.cakes : catalog.decorations;
    const item = list.find((entry) => entry.id === id);
    if (!item) return res.status(404).json({ error: `${type} not found` });
    
    // Update fields
    if (imageUrl) item.image = imageUrl;
    if (price !== undefined) item.price = price;
    if (originalPrice !== undefined) item.originalPrice = originalPrice;
    if (offerPrice !== undefined) item.offerPrice = offerPrice;
    if (name !== undefined) item.name = name;
    if (description !== undefined) item.description = description;
    
    await catalogController.saveCatalogForBranch(branch, catalog);
    res.json(item);
  } catch (err) {
    console.error('Update failed:', err);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

router.post('/gallery/testimonials', verifyAdmin, async (req, res) => {
  const branch = req.query.branch || req.body.branch || 'branch-1';
  const { image, title, date } = req.body;
  if (!image) return res.status(400).json({ error: 'Image required' });
  
  try {
    let imageUrl = image;
    if (image.startsWith('data:image')) {
      const rootFolder = getRootFolderForBranch(branch);
      console.log(`☁️ Uploading testimonial image to Cloudinary [${rootFolder}]...`);
      imageUrl = await uploadToCloudinary(image, 'testimonials', rootFolder);
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
    console.error('Testimonial upload failed:', err);
    res.status(500).json({ error: 'Failed to upload/save testimonial' });
  }
});

router.delete('/gallery/testimonials/:id', verifyAdmin, async (req, res) => {
  const branch = req.query.branch || req.body.branch || 'branch-1';
  const catalog = await catalogController.getCatalogForBranch(branch);
  if (!catalog) return res.status(400).json({ error: 'Invalid branch' });
  const index = catalog.testimonials.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  catalog.testimonials.splice(index, 1);
  await catalogController.saveCatalogForBranch(branch, catalog);
  res.json({ message: 'Deleted' });
});

// Hero Images (Admin)
router.get('/hero-images', async (req, res) => {
  try {
    const branch = req.query.branch || 'branch-1';
    const catalog = await catalogController.getCatalogForBranch(branch);
    if (!catalog) return res.status(400).json({ error: 'Invalid branch' });
    res.json(catalog.heroImages || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hero images' });
  }
});

router.post('/hero-images', verifyAdmin, async (req, res) => {
  const branch = req.query.branch || req.body.branch || 'branch-1';
  const { image } = req.body;
  if (!image) return res.status(400).json({ error: 'Image required' });
  
  try {
    let imageUrl = image;
    if (image.startsWith('data:image')) {
      const rootFolder = getRootFolderForBranch(branch);
      console.log(`☁️ Uploading hero image to Cloudinary [${rootFolder}]...`);
      imageUrl = await uploadToCloudinary(image, 'hero', rootFolder);
    }

    const catalog = await catalogController.getCatalogForBranch(branch);
    if (!catalog) return res.status(400).json({ error: 'Invalid branch' });
    
    if (!catalog.heroImages) catalog.heroImages = [];
    catalog.heroImages.push(imageUrl);
    await catalogController.saveCatalogForBranch(branch, catalog);
    res.json(catalog.heroImages);
  } catch (err) {
    console.error('Hero upload failed:', err);
    res.status(500).json({ error: 'Failed to upload/save hero image' });
  }
});

router.delete('/hero-images/:index', verifyAdmin, async (req, res) => {
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

// Download Bookings Excel
router.get('/bookings/download', verifyAdmin, async (req, res) => {
  try {
    const branch = req.query.branch || 'all';
    let allBookings = [];
    if (branch === 'all') {
      for (const branchId in mongoConnections) {
        const models = getBranchModels(branchId);
        if (models) {
          const mBookings = await models.Booking.find({ branch: branchId });
          allBookings = allBookings.concat(mBookings);
        }
      }
      for (const branchId in branchDbs) {
        if (!mongoConnections[branchId]) {
          allBookings = allBookings.concat(branchDbs[branchId].bookings);
        }
      }
    } else {
      const models = getBranchModels(branch);
      if (models) {
        allBookings = await models.Booking.find({ branch });
      } else {
        const branchDb = branchDbs[branch];
        if (branchDb) allBookings = branchDb.bookings;
      }
    }
    
    const paidBookings = allBookings.filter(booking => booking.paymentStatus === 'paid');
    if (paidBookings.length === 0) return res.status(404).json({ error: 'No paid bookings found' });
    
    const XLSX = (await import('xlsx')).default;
    const bookingRows = paidBookings.map(booking => ({
      'Booking ID': booking.id,
      'Branch': booking.branch,
      'Service': booking.service,
      'Date': booking.date,
      'Time Slot': booking.timeSlot,
      'Duration (hrs)': booking.duration,
      'Customer Name': booking.name,
      'Phone': booking.phone,
      'Occasion': booking.customOccasion || booking.occasion,
      'Decoration Required': booking.decorationRequired ? 'Yes' : 'No',
      'Cake Selected': booking.selectedCake ? `${booking.selectedCake.name} (₹${booking.selectedCake.price})` : 'None',
      'Extra Decorations': booking.extraDecorations?.map((d) => `${d.name} (₹${d.price})`).join('; ') || 'None',
      'Total Price': booking.totalPrice,
      'Payment Status': booking.paymentStatus,
      'Booking Date': new Date(booking.createdAt).toLocaleString(),
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(bookingRows);
    const columnWidths = [
      { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 12 }, { wch: 15 },
      { wch: 14 }, { wch: 18 }, { wch: 15 }, { wch: 20 },
      { wch: 18 }, { wch: 25 }, { wch: 30 }, { wch: 12 }, { wch: 15 }, { wch: 20 }
    ];
    worksheet['!cols'] = columnWidths;
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Paid Bookings');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    const fileName = `bookings_${branch}_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error downloading bookings:', error);
    res.status(500).json({ error: 'Failed to download bookings file' });
  }
});

export default router;
