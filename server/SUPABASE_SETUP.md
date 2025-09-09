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
-- Projects table
CREATE TABLE projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    developer_website TEXT,
    version TEXT,
    unity_version TEXT,
    unreal_version TEXT,
    is_public BOOLEAN DEFAULT false,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assets table
CREATE TABLE assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    file_key TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT,
    kind TEXT NOT NULL,
    duration_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('showrooms', 'showrooms', true);
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
