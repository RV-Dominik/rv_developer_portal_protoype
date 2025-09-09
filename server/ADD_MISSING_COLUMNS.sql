-- Add missing columns to projects table for enhanced onboarding
-- Run this in Supabase SQL Editor

-- Add new columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS target_platforms TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pass_sso_integration_status TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS readyverse_sdk_integration_status TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS requires_launcher BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS https_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS build_format TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS age_rating TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS rating_board TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS legal_requirements_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS privacy_policy_provided BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS content_guidelines_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS distribution_rights_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS support_email TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS onboarding_step TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN projects.target_platforms IS 'JSON array of target platforms: PC, Mac, Linux, Web';
COMMENT ON COLUMN projects.pass_sso_integration_status IS 'Pass SSO integration status: Not Started, In Progress, Complete';
COMMENT ON COLUMN projects.readyverse_sdk_integration_status IS 'Readyverse SDK integration status: Not Started, In Progress, Complete';
COMMENT ON COLUMN projects.requires_launcher IS 'Whether the game requires Readyverse Launcher to run';
COMMENT ON COLUMN projects.https_enabled IS 'Whether HTTPS/TLS is enabled (required for Self Hosted)';
COMMENT ON COLUMN projects.build_format IS 'Build format: Unreal Engine, Unity, Custom Engine, WebGL, Native';
COMMENT ON COLUMN projects.age_rating IS 'Age rating: E, E10+, T, M, AO';
COMMENT ON COLUMN projects.rating_board IS 'Rating board: ESRB, PEGI, CERO, ACB, Other';
COMMENT ON COLUMN projects.legal_requirements_completed IS 'Whether legal requirements are completed';
COMMENT ON COLUMN projects.privacy_policy_provided IS 'Whether privacy policy is provided';
COMMENT ON COLUMN projects.terms_accepted IS 'Whether terms of service are accepted';
COMMENT ON COLUMN projects.content_guidelines_accepted IS 'Whether content guidelines compliance is confirmed';
COMMENT ON COLUMN projects.distribution_rights_confirmed IS 'Whether distribution rights are confirmed';
COMMENT ON COLUMN projects.support_email IS 'Support contact email address';
COMMENT ON COLUMN projects.onboarding_step IS 'Current onboarding step: basics, assets, integration, compliance, review, done';
COMMENT ON COLUMN projects.onboarding_completed_at IS 'When onboarding was completed';

-- Update existing projects to have default values
UPDATE projects SET 
    requires_launcher = FALSE,
    https_enabled = FALSE,
    legal_requirements_completed = FALSE,
    privacy_policy_provided = FALSE,
    terms_accepted = FALSE,
    content_guidelines_accepted = FALSE,
    distribution_rights_confirmed = FALSE
WHERE requires_launcher IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN (
    'target_platforms', 'pass_sso_integration_status', 'readyverse_sdk_integration_status',
    'requires_launcher', 'https_enabled', 'build_format', 'age_rating', 'rating_board',
    'legal_requirements_completed', 'privacy_policy_provided', 'terms_accepted',
    'content_guidelines_accepted', 'distribution_rights_confirmed', 'support_email',
    'onboarding_step', 'onboarding_completed_at'
)
ORDER BY column_name;
