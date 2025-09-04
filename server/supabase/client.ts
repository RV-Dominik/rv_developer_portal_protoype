import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

// Admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Client for user operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Project {
  id: string;
  owner_id: string;
  slug: string;
  title: string;
  short_desc?: string;
  long_desc?: string;
  theme: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  project_id: string;
  kind: 'logo' | 'header' | 'screenshot' | 'trailer' | 'custom';
  file_key: string;
  mime: string;
  width?: number;
  height?: number;
  duration_seconds?: number;
  created_at: string;
}

export interface ProjectWithAssets extends Project {
  assets: Asset[];
}
