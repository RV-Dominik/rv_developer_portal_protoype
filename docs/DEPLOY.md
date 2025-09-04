# Deployment Guide

This guide covers deploying the showroom prototype to production using Render and Supabase.

## Prerequisites

- GitHub repository with the code
- Supabase account and project
- Render account
- Domain name (optional)

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and API keys

### 1.2 Database Setup

1. Go to the SQL Editor in your Supabase dashboard
2. Run the schema from `server/db/schema.sql`:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    short_desc TEXT,
    long_desc TEXT,
    theme JSONB DEFAULT '{"primary": "#141414", "accent": "#59c1ff"}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assets table
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('logo', 'header', 'screenshot', 'trailer', 'custom')),
    file_key TEXT NOT NULL,
    mime TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    duration_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_assets_project_id ON assets(project_id);
CREATE INDEX idx_assets_kind ON assets(kind);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### 1.3 Storage Setup

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `showrooms`
3. Set the bucket to public
4. Configure CORS if needed

### 1.4 Authentication Setup

1. Go to Authentication > Settings
2. Configure your site URL (will be your Render URL)
3. Add redirect URLs for magic links
4. Enable email authentication

### 1.5 Row Level Security (RLS)

Enable RLS and create policies:

```sql
-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (auth.uid() = owner_id);

-- Assets policies
CREATE POLICY "Users can view project assets" ON assets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = assets.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert project assets" ON assets
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = assets.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete project assets" ON assets
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = assets.project_id 
            AND projects.owner_id = auth.uid()
        )
    );
```

## Step 2: Render Setup

### 2.1 Connect Repository

1. Go to [render.com](https://render.com)
2. Connect your GitHub repository
3. Select the repository with your code

### 2.2 Create Web Service

1. Click "New" > "Web Service"
2. Connect your repository
3. Use these settings:
   - **Name**: `showroom-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for better performance)

### 2.3 Environment Variables

Set these environment variables in Render:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `8080` | Server port |
| `SUPABASE_URL` | `https://your-project.supabase.co` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `your-service-role-key` | Supabase service role key |
| `SUPABASE_ANON_KEY` | `your-anon-key` | Supabase anonymous key |
| `SUPABASE_BUCKET` | `showrooms` | Storage bucket name |
| `PUBLIC_BASE_URL` | `https://your-service.onrender.com` | Your Render service URL |
| `ASSET_URL_TTL` | `3600` | Signed URL TTL in seconds |
| `SESSION_COOKIE` | `dev_portal_session` | Session cookie name |

### 2.4 Deploy

1. Click "Create Web Service"
2. Wait for the build to complete
3. Note your service URL

## Step 3: Update Configuration

### 3.1 Update Supabase Settings

1. Go back to Supabase Authentication settings
2. Update Site URL to your Render service URL
3. Add redirect URL: `https://your-service.onrender.com/web?auth=success`

### 3.2 Update Unity Client

1. Open your Unity project
2. Update the `ManifestUrl` in ShowroomLoader to your Render service URL
3. Test with a sample project slug

## Step 4: Testing

### 4.1 Test the API

```bash
# Test health endpoint
curl https://your-service.onrender.com/health

# Test manifest endpoint (should work without auth)
curl https://your-service.onrender.com/api/manifest/your-slug
```

### 4.2 Test the Portal

1. Go to `https://your-service.onrender.com`
2. Try logging in with magic link
3. Create a test project
4. Upload some assets
5. Check the manifest endpoint

### 4.3 Test Unity Client

1. Update the manifest URL in Unity
2. Build and run the Unity client
3. Verify it loads the showroom data

## Step 5: Custom Domain (Optional)

### 5.1 Add Custom Domain in Render

1. Go to your service settings
2. Add your custom domain
3. Follow the DNS configuration instructions

### 5.2 Update Configuration

1. Update `PUBLIC_BASE_URL` to your custom domain
2. Update Supabase redirect URLs
3. Update Unity client manifest URL

## Monitoring and Maintenance

### 5.1 Render Monitoring

- Check service logs regularly
- Monitor resource usage
- Set up alerts for downtime

### 5.2 Supabase Monitoring

- Monitor database performance
- Check storage usage
- Review authentication logs

### 5.3 Performance Optimization

- Enable CDN for static assets
- Optimize database queries
- Implement caching strategies

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json
   - Check build logs for specific errors

2. **Authentication Issues**
   - Verify Supabase URL and keys
   - Check redirect URL configuration
   - Ensure RLS policies are correct

3. **Upload Failures**
   - Verify storage bucket exists and is public
   - Check file size limits
   - Verify CORS settings

4. **CORS Errors**
   - Update CORS configuration in Express
   - Check domain configuration
   - Verify environment variables

### Debug Commands

```bash
# Check service status
curl -I https://your-service.onrender.com/health

# Test authentication
curl -H "Authorization: Bearer your-token" https://your-service.onrender.com/api/auth/session

# Test manifest
curl https://your-service.onrender.com/api/manifest/test-slug
```

## Security Checklist

- [ ] RLS policies enabled and configured
- [ ] Service role key kept secure
- [ ] CORS properly configured
- [ ] File upload validation working
- [ ] Signed URLs have appropriate TTL
- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] Regular security updates

## Scaling Considerations

### Free Tier Limits

- **Render**: 750 hours/month, sleeps after 15 minutes
- **Supabase**: 500MB database, 1GB storage, 50MB file uploads

### Paid Tier Benefits

- **Render**: Always-on service, more resources
- **Supabase**: More storage, higher limits, better performance

### Optimization Tips

- Use image compression
- Implement caching
- Optimize database queries
- Use CDN for assets
- Monitor resource usage
