# 🚀 Quick Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in:
   - **Project Name**: `readyverse-developer-portal`
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to your users
4. Click **"Create new project"** (takes 2-3 minutes)

## Step 2: Get Your Credentials

1. Go to **Settings → API**
2. Copy these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: `eyJ...` (starts with eyJ)
   - **service_role key**: `eyJ...` (starts with eyJ)

## Step 3: Update Render.com Environment

1. Go to your Render.com dashboard
2. Click on **`showroom-backend`** service
3. Go to **Environment** tab
4. Set these values:
   - `SUPABASE_URL` = Your Project URL
   - `SUPABASE_ANON_KEY` = Your anon public key  
   - `SUPABASE_SERVICE_ROLE_KEY` = Your service_role key
   - `PUBLIC_BASE_URL` = Your Render.com URL

## Step 4: Run Database Schema

1. Go to your Supabase project dashboard
2. Click **"SQL Editor"**
3. Click **"New Query"**
4. Copy and paste this complete SQL script:

```sql
-- Projects table (Readyverse Partner Intake Form)
CREATE TABLE projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    
    -- Company Information
    company_name TEXT,
    company_logo_url TEXT,
    primary_contact_name TEXT,
    primary_contact_email TEXT,
    primary_contact_phone TEXT,
    company_website TEXT,
    company_socials TEXT, -- JSON string for multiple social links
    
    -- Game Information
    short_description TEXT,
    full_description TEXT,
    genre TEXT, -- Action, RPG, Strategy, Simulation, Other
    publishing_track TEXT, -- Platform Games, Self Hosted, Readyverse Hosted
    platform_type TEXT, -- PC Client, Web-Based
    distribution_method TEXT, -- Epic Games Store, Steam, Self-Hosted, Readyverse Hosted
    game_url TEXT,
    build_status TEXT, -- In Development, Beta, Production-Ready
    
    -- Technical Integration
    pass_sso_integration_status TEXT, -- Not Started, In Progress, Complete
    readyverse_sdk_integration_status TEXT, -- Not Started, In Progress, Complete
    requires_launcher BOOLEAN DEFAULT false,
    
    -- Publishing Track Requirements
    -- Platform Games Requirements
    is_listed_on_platform BOOLEAN DEFAULT false,
    platform_listing_url TEXT,
    
    -- Self Hosted Requirements
    has_stable_url BOOLEAN DEFAULT false,
    has_https_support BOOLEAN DEFAULT false,
    has_uptime_monitoring BOOLEAN DEFAULT false,
    has_support_commitment BOOLEAN DEFAULT false,
    
    -- Readyverse Hosted Requirements
    has_distribution_rights BOOLEAN DEFAULT false,
    build_format TEXT, -- Unreal/Unity build, .exe installer, WebGL bundle
    meets_performance_guidelines BOOLEAN DEFAULT false,
    has_install_instructions BOOLEAN DEFAULT false,
    has_patch_commitment BOOLEAN DEFAULT false,
    
    -- Compliance & Security
    age_rating TEXT, -- ESRB, PEGI, etc.
    has_ssl_tls BOOLEAN DEFAULT false,
    has_no_test_endpoints BOOLEAN DEFAULT false,
    has_digicert BOOLEAN DEFAULT false,
    
    -- Assets
    game_logo_url TEXT,
    cover_art_url TEXT,
    trailer_url TEXT,
    
    -- Optional Add-Ons
    showroom_interest TEXT, -- Yes with assistance, Yes in-house, No
    wants_surreal_estate BOOLEAN DEFAULT false,
    
    -- Submission Process Tracking
    submission_status TEXT, -- Intake, Technical Integration, Compliance Review, Game Submission, Approved, Rejected
    intake_submitted_at TIMESTAMP WITH TIME ZONE,
    technical_integration_submitted_at TIMESTAMP WITH TIME ZONE,
    compliance_review_submitted_at TIMESTAMP WITH TIME ZONE,
    game_submission_submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    readyverse_tech_team_notes TEXT,
    readyverse_ops_notes TEXT,
    
    -- System fields
    is_public BOOLEAN DEFAULT false,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assets table (Readyverse Partner Assets)
CREATE TABLE assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    file_key TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size BIGINT,
    kind TEXT NOT NULL, -- game_logo, cover_art, screenshot, trailer, build
    duration_seconds INTEGER, -- For videos
    width INTEGER, -- For images/videos
    height INTEGER, -- For images/videos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Storage bucket (only create if it doesn't exist)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('showrooms', 'showrooms', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.uid()::text = user_id);

CREATE POLICY "Anyone can view public projects" ON projects
    FOR SELECT USING (is_public = true);

-- Assets policies
CREATE POLICY "Users can view assets of their projects" ON assets
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert assets to their projects" ON assets
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can update assets of their projects" ON assets
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete assets of their projects" ON assets
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY "Anyone can view assets of public projects" ON assets
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE is_public = true
        )
    );
```

5. Click **"Run"** to execute the script

## Step 5: Test the Integration

1. **Redeploy your Render.com service** (it will pick up the new environment variables)
2. **Visit your portal** and try to create a project
3. **Check Supabase** → Table Editor → `projects` table to see if data appears

## Step 6: Verify Everything Works

✅ **Check these endpoints:**
- `GET /api/projects` - Should return empty array (no projects yet)
- `POST /api/projects` - Should create a real project in Supabase
- `GET /api/projects/{id}` - Should return the created project

✅ **Check Supabase Dashboard:**
- Go to Table Editor → `projects`
- You should see any projects you create through the portal

## 🎉 Success!

Once this is working, you'll have:
- ✅ Real database persistence
- ✅ Data survives server restarts
- ✅ Multiple users can create projects
- ✅ Projects are properly isolated per user
- ✅ Public projects are visible to everyone

## 🔧 Troubleshooting

**If you get errors:**
1. Check that all environment variables are set correctly in Render.com
2. Verify the SQL script ran without errors
3. Check the Render.com logs for any connection issues
4. Make sure your Supabase project is fully initialized (not still setting up)

**Need help?** Check the logs in Render.com or Supabase for specific error messages.
