import express from 'express';
import { supabase } from '../supabase/client';
import { DatabaseQueries } from '../db/queries';

const router = express.Router();

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

// Create new project
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, slug } = req.body;

    if (!title || !slug) {
      return res.status(400).json({ error: 'Title and slug are required' });
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({ 
        error: 'Slug must contain only lowercase letters, numbers, and hyphens' 
      });
    }

    const project = await DatabaseQueries.createProject({
      owner_id: req.user.id,
      slug,
      title,
      short_desc: req.body.short_desc || '',
      long_desc: req.body.long_desc || '',
      theme: req.body.theme || { primary: '#141414', accent: '#59c1ff' }
    });

    res.status(201).json(project);
  } catch (error: any) {
    console.error('Create project error:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({ error: 'Project slug already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Get user's projects
router.get('/', requireAuth, async (req, res) => {
  try {
    const projects = await DatabaseQueries.getUserProjects(req.user.id);
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

// Get specific project
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const project = await DatabaseQueries.getProjectById(req.params.id, req.user.id);
    res.json(project);
  } catch (error: any) {
    console.error('Get project error:', error);
    
    if (error.code === 'PGRST116') { // Not found
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.status(500).json({ error: 'Failed to get project' });
  }
});

// Update project
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const updates: any = {};
    
    if (req.body.title) updates.title = req.body.title;
    if (req.body.short_desc !== undefined) updates.short_desc = req.body.short_desc;
    if (req.body.long_desc !== undefined) updates.long_desc = req.body.long_desc;
    if (req.body.theme) updates.theme = req.body.theme;

    const project = await DatabaseQueries.updateProject(req.params.id, updates, req.user.id);
    res.json(project);
  } catch (error: any) {
    console.error('Update project error:', error);
    
    if (error.code === 'PGRST116') { // Not found
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await DatabaseQueries.deleteProject(req.params.id, req.user.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('Delete project error:', error);
    
    if (error.code === 'PGRST116') { // Not found
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.status(500).json({ error: 'Failed to delete project' });
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
