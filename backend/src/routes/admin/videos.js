// Branch Videos routes — signed upload + CRUD
import express from 'express';
import * as catalogController from '../../controllers/catalogController.js';
import { verifyAdmin } from '../../middleware/auth.js';
import cloudinary from '../../utils/cloudinary.js';
import { getRootFolderForBranch } from '../../utils/branchConfig.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// ── Helpers ──────────────────────────────────────────────────────────────────
const getAdminBranch = req =>
  req.admin?.branch || req.query.branch || req.body.branch || 'branch-1';

const getCloudinaryVideoPublicId = (url = '') => {
  try {
    const parsed = new URL(url);
    const uploadIndex = parsed.pathname.indexOf('/video/upload/');
    if (uploadIndex === -1) return '';
    const pathAfterUpload = parsed.pathname.slice(uploadIndex + '/video/upload/'.length);
    const parts = pathAfterUpload.split('/').filter(Boolean);
    const versionIndex = parts.findIndex(p => /^v\d+$/.test(p));
    const publicIdParts = parts.slice(versionIndex >= 0 ? versionIndex + 1 : 0);
    return decodeURIComponent(publicIdParts.join('/').replace(/\.[^/.]+$/, ''));
  } catch { return ''; }
};

const normalizeBranchVideos = (videos = []) =>
  (Array.isArray(videos) ? videos : [])
    .map((video, index) => {
      if (typeof video === 'string') {
        return { id: `video-${index}`, url: video, title: '', publicId: getCloudinaryVideoPublicId(video) };
      }
      if (!video || typeof video !== 'object') return null;
      return {
        id: video.id || `video-${index}`,
        url: video.url || video.secure_url || video.videoUrl || '',
        title: video.title || video.name || '',
        publicId: video.publicId || getCloudinaryVideoPublicId(video.url || ''),
      };
    })
    .filter(v => v && v.url);

const filterConfirmedExistingVideos = async videos => {
  const checks = await Promise.all(videos.map(async video => {
    if (!video.publicId || !video.url.includes('res.cloudinary.com')) return video;
    try {
      await cloudinary.api.resource(video.publicId, { resource_type: 'video' });
      return video;
    } catch (error) {
      if (error?.http_code === 404) return null;
      return video;
    }
  }));
  return checks.filter(Boolean);
};

const fetchCloudinaryBranchVideos = async branch => {
  const rootFolder = getRootFolderForBranch(branch);
  const prefix = `Home/${rootFolder}/videos`;
  const response = await cloudinary.api.resources({
    type: 'upload', resource_type: 'video', prefix, max_results: 30, context: true,
  });
  return (response?.resources || [])
    .map((resource, index) => ({
      id: `cloudinary-${resource.public_id || index}`,
      url: resource.secure_url || '',
      title: resource?.context?.custom?.caption || resource.filename || 'Branch Video',
      publicId: resource.public_id || '',
    }))
    .filter(v => v.url);
};

const reconcileBranchVideosWithCloudinary = (savedVideos, cloudinaryVideos) => {
  const savedByPublicId = new Map(savedVideos.filter(v => v.publicId).map(v => [v.publicId, v]));
  const savedByUrl = new Map(savedVideos.map(v => [v.url, v]));

  const reconciled = cloudinaryVideos.map(video => {
    const saved = savedByPublicId.get(video.publicId) || savedByUrl.get(video.url);
    return { id: saved?.id || video.id, url: video.url, title: saved?.title || video.title || '', publicId: video.publicId || saved?.publicId || '' };
  });

  const reconciledIds = new Set(reconciled.map(v => v.id));
  const reconciledPublicIds = new Set(reconciled.map(v => v.publicId).filter(Boolean));
  const reconciledUrls = new Set(reconciled.map(v => v.url));

  const remaining = savedVideos.filter(v => {
    if (reconciledIds.has(v.id)) return false;
    if (v.publicId && reconciledPublicIds.has(v.publicId)) return false;
    return !reconciledUrls.has(v.url);
  });

  return [...remaining, ...reconciled];
};

// ── Routes ───────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const branch = req.query.branch || 'branch-1';
    const catalog = await catalogController.getCatalogForBranch(branch);
    if (!catalog) return res.status(400).json({ error: 'Invalid branch' });

    const normalizedSaved = normalizeBranchVideos(catalog.branchVideos || []);
    const verifiedSaved = await filterConfirmedExistingVideos(normalizedSaved);

    try {
      const cloudinaryVideos = await fetchCloudinaryBranchVideos(branch);
      const reconciled = reconcileBranchVideosWithCloudinary(verifiedSaved, cloudinaryVideos);

      if (JSON.stringify(normalizedSaved) !== JSON.stringify(reconciled)) {
        catalog.branchVideos = reconciled;
        await catalogController.saveCatalogForBranch(branch, catalog);
      }
      return res.json(reconciled);
    } catch (cloudinaryError) {
      console.warn(`Cloudinary branch videos fetch failed for ${branch}:`, cloudinaryError.message);
      if (JSON.stringify(normalizedSaved) !== JSON.stringify(verifiedSaved)) {
        catalog.branchVideos = verifiedSaved;
        await catalogController.saveCatalogForBranch(branch, catalog);
      }
      return res.json(verifiedSaved);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch branch videos' });
  }
});

router.post('/sign', verifyAdmin, async (req, res) => {
  try {
    const branch = getAdminBranch(req);
    const rootFolder = getRootFolderForBranch(branch);
    const folder = `Home/${rootFolder}/videos`;
    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { folder, timestamp },
      process.env.CLOUDINARY_API_SECRET
    );
    res.json({ signature, timestamp, folder, cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate upload signature' });
  }
});

router.post('/', verifyAdmin, async (req, res) => {
  const branch = getAdminBranch(req);
  const { url, title } = req.body;
  if (!url) return res.status(400).json({ error: 'Video URL required' });

  try {
    const expectedFolder = `Home/${getRootFolderForBranch(branch)}/videos/`;
    const publicId = getCloudinaryVideoPublicId(url);
    if (publicId && !publicId.startsWith(expectedFolder)) {
      return res.status(400).json({ error: `Video must be uploaded to ${expectedFolder}` });
    }
    const catalog = await catalogController.getCatalogForBranch(branch);
    if (!catalog) return res.status(400).json({ error: 'Invalid branch' });
    if (!catalog.branchVideos) catalog.branchVideos = [];
    catalog.branchVideos.push({ id: `video-${uuidv4()}`, url, title: title || '', publicId });
    await catalogController.saveCatalogForBranch(branch, catalog);
    res.json(catalog.branchVideos);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save branch video' });
  }
});

router.put('/:id', verifyAdmin, async (req, res) => {
  const branch = getAdminBranch(req);
  const { title } = req.body;
  try {
    const catalog = await catalogController.getCatalogForBranch(branch);
    if (!catalog) return res.status(400).json({ error: 'Invalid branch' });
    const videos = normalizeBranchVideos(catalog.branchVideos || []);
    const index = videos.findIndex(v => v.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Video not found' });
    videos[index] = { ...videos[index], title: title || '' };
    catalog.branchVideos = videos;
    await catalogController.saveCatalogForBranch(branch, catalog);
    res.json(catalog.branchVideos);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update branch video' });
  }
});

router.delete('/:id', verifyAdmin, async (req, res) => {
  const branch = getAdminBranch(req);
  try {
    const catalog = await catalogController.getCatalogForBranch(branch);
    if (!catalog) return res.status(400).json({ error: 'Invalid branch' });
    const videos = normalizeBranchVideos(catalog.branchVideos || []);
    const index = videos.findIndex(v => v.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Video not found' });
    videos.splice(index, 1);
    catalog.branchVideos = videos;
    await catalogController.saveCatalogForBranch(branch, catalog);
    res.json(catalog.branchVideos);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete branch video' });
  }
});

export default router;
