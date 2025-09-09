# Supabase REST API Setup Guide

## 🚀 **How to Switch to Real Supabase**

### **Step 1: Set Environment Variables**

Add these to your Render.com environment variables:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### **Step 2: Set Environment Variable**

Add this environment variable to switch between mock and real Supabase:

```bash
# For development (mock service):
USE_MOCK_SUPABASE=true

# For production (real Supabase):
USE_MOCK_SUPABASE=false
```

**No code changes needed!** The service is automatically selected based on the environment variable.

### **Step 3: Database Schema**

Make sure your Supabase database has these tables:

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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Onboarding
    onboarding_step TEXT NULL,
    onboarding_completed_at TIMESTAMP WITH TIME ZONE NULL
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
```

### **Step 4: Row Level Security (RLS)**

Enable RLS and set policies:

```sql
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

## 🔧 **Current Status**

- ✅ **MockSupabaseService** - Working (default)
- ✅ **SupabaseRestService** - Ready to use
- ✅ **Interface-based** - Easy to switch between services
- ✅ **REST API calls** - No SDK dependency issues

## 🎯 **Benefits of REST Approach**

1. **No SDK issues** - Direct HTTP calls to Supabase
2. **Full control** - You control the exact API calls
3. **Better error handling** - See exactly what's happening
4. **Easier debugging** - Log the actual HTTP requests/responses
5. **Version independent** - Works with any Supabase version

## 🚀 **Next Steps**

1. Set up your Supabase project
2. Add the environment variables
3. Run the database schema
4. Switch the service in Program.cs
5. Deploy and test!

The REST service handles all the same functionality as the mock service, but with real Supabase integration.
