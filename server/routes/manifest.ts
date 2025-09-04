import express from 'express';
import { DatabaseQueries } from '../db/queries';
import { supabaseAdmin } from '../supabase/client';

const router = express.Router();

// Get public manifest for Unity client
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    // Get project with assets
    const project = await DatabaseQueries.getProjectBySlug(slug);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Generate signed URLs for assets
    const assetUrls: any = {};
    const screenshots: string[] = [];

    for (const asset of project.assets) {
      try {
        const { data: signedUrl } = await supabaseAdmin.storage
          .from(process.env.SUPABASE_BUCKET!)
          .createSignedUrl(asset.file_key, parseInt(process.env.ASSET_URL_TTL!) || 3600);

        if (signedUrl) {
          if (asset.kind === 'screenshot') {
            screenshots.push(signedUrl.signedUrl);
          } else if (asset.kind === 'trailer') {
            assetUrls.trailer = {
              type: asset.mime.startsWith('video/') ? 'file' : 'url',
              src: signedUrl.signedUrl,
              duration: asset.duration_seconds
            };
          } else {
            assetUrls[asset.kind] = signedUrl.signedUrl;
          }
        }
      } catch (error) {
        console.error(`Failed to generate signed URL for asset ${asset.id}:`, error);
        // Continue with other assets
      }
    }

    // Build manifest response
    const manifest = {
      slug: project.slug,
      title: project.title,
      shortDescription: project.short_desc || '',
      longDescription: project.long_desc || '',
      theme: project.theme || { primary: '#141414', accent: '#59c1ff' },
      assets: {
        logo: assetUrls.logo || null,
        header: assetUrls.header || null,
        screenshots: screenshots,
        trailer: assetUrls.trailer || null
      },
      updatedAt: project.updated_at
    };

    // Set cache headers
    res.set({
      'Cache-Control': 'public, max-age=300', // 5 minutes
      'Content-Type': 'application/json'
    });

    res.json(manifest);
  } catch (error: any) {
    console.error('Manifest error:', error);
    
    if (error.code === 'PGRST116') { // Not found
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.status(500).json({ error: 'Failed to generate manifest' });
  }
});

export default router;
