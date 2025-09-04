import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { supabase, supabaseAdmin } from '../supabase/client';
import { DatabaseQueries } from '../db/queries';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'video/quicktime'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  }
});

// Middleware to check authentication
const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    req.user = session.user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Upload asset for a project
router.post('/:projectId', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { kind } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    if (!kind || !['logo', 'header', 'screenshot', 'trailer', 'custom'].includes(kind)) {
      return res.status(400).json({ error: 'Invalid asset kind' });
    }

    // Verify project ownership
    const project = await DatabaseQueries.getProjectById(projectId, req.user.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Generate unique file key
    const fileExtension = file.originalname.split('.').pop() || 'bin';
    const fileKey = `${projectId}/${kind}/${uuidv4()}.${fileExtension}`;

    let processedBuffer = file.buffer;
    let width: number | undefined;
    let height: number | undefined;
    let duration_seconds: number | undefined;

    // Process image files
    if (file.mimetype.startsWith('image/')) {
      try {
        const image = sharp(file.buffer);
        const metadata = await image.metadata();
        
        width = metadata.width;
        height = metadata.height;

        // Resize images based on type
        if (kind === 'logo') {
          processedBuffer = await image.resize(512, 512, { fit: 'contain' }).png().toBuffer();
        } else if (kind === 'header') {
          processedBuffer = await image.resize(1920, 1080, { fit: 'cover' }).jpeg({ quality: 85 }).toBuffer();
        } else if (kind === 'screenshot') {
          processedBuffer = await image.resize(1920, 1080, { fit: 'cover' }).jpeg({ quality: 85 }).toBuffer();
        } else {
          // Keep original for custom assets
          processedBuffer = file.buffer;
        }
      } catch (error) {
        console.error('Image processing error:', error);
        // Continue with original buffer if processing fails
      }
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(process.env.SUPABASE_BUCKET!)
      .upload(fileKey, processedBuffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload file' });
    }

    // Create asset record in database
    const asset = await DatabaseQueries.createAsset({
      project_id: projectId,
      kind: kind as any,
      file_key: fileKey,
      mime: file.mimetype,
      width,
      height,
      duration_seconds
    });

    res.status(201).json(asset);
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload asset' });
  }
});

// Delete asset
router.delete('/:projectId/:assetId', requireAuth, async (req, res) => {
  try {
    const { projectId, assetId } = req.params;

    // Verify project ownership
    const project = await DatabaseQueries.getProjectById(projectId, req.user.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get asset to find file key
    const assets = await DatabaseQueries.getProjectAssets(projectId);
    const asset = assets.find(a => a.id === assetId);
    
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Delete from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from(process.env.SUPABASE_BUCKET!)
      .remove([asset.file_key]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
      // Continue with database deletion even if storage fails
    }

    // Delete from database
    await DatabaseQueries.deleteAsset(assetId, projectId);

    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Delete asset error:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

// Get project assets
router.get('/:projectId', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verify project ownership
    const project = await DatabaseQueries.getProjectById(projectId, req.user.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const assets = await DatabaseQueries.getProjectAssets(projectId);
    res.json(assets);
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({ error: 'Failed to get assets' });
  }
});

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export default router;
