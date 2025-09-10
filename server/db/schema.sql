-- Projects table (Readyverse Partner Intake Form)
CREATE TABLE IF NOT EXISTS projects (
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
    
    -- Asset storage keys (not public URLs)
    game_logo_key TEXT,
    cover_art_key TEXT,
    trailer_key TEXT,
    
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
CREATE TABLE IF NOT EXISTS assets (
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

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    website TEXT,
    primary_contact_name TEXT,
    primary_contact_email TEXT,
    primary_contact_phone TEXT,
    description TEXT,
    industry TEXT,
    company_size TEXT,
    country TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-Organization relationship table
CREATE TABLE IF NOT EXISTS user_organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'owner', -- owner, admin, member
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
);

-- Storage bucket (only create if it doesn't exist)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('showrooms', 'showrooms', true)
ON CONFLICT (id) DO NOTHING;