import express from 'express';
import { supabase } from '../supabase/client';

const router = express.Router();

// Request magic link
router.post('/magic-link', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.PUBLIC_BASE_URL}/web?auth=success`
      }
    });

    if (error) {
      console.error('Magic link error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Magic link sent to your email' });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Failed to send magic link' });
  }
});

// Get current session
router.get('/session', async (req, res) => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Session error:', error);
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    res.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        created_at: session.user.created_at
      }
    });
  } catch (error) {
    console.error('Session error:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

export default router;
