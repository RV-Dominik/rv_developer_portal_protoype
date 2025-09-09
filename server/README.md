# Showroom Backend

A Node.js/Express backend for the low-tier showroom prototype, designed to run on Render with Supabase integration.

## Features

- **Authentication**: Magic link login via Supabase Auth
- **Project Management**: CRUD operations for developer projects
- **Asset Upload**: File upload to Supabase Storage with image processing
- **Public API**: JSON manifest endpoint for Unity clients
- **Developer Portal**: Static web interface for project management

## Quick Start

### 1. Environment Setup

Copy the environment template:
```bash
cp env.example .env
```

Fill in your Supabase credentials:
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_BUCKET=showrooms

# Application Configuration
PUBLIC_BASE_URL=https://your-render-service.onrender.com
ASSET_URL_TTL=3600
SESSION_COOKIE=dev_portal_session

# Service Selection
# Set to "true" for mock service (development)
# Set to "false" for real Supabase (production)
USE_MOCK_SUPABASE=true
```

### Service Selection

The application automatically selects between mock and real Supabase services based on the `USE_MOCK_SUPABASE` environment variable:

- **`USE_MOCK_SUPABASE=true`** - Uses MockSupabaseService (default, for development)
- **`USE_MOCK_SUPABASE=false`** - Uses SupabaseRestService (for production with real Supabase)

No code changes needed to switch between services!

### 2. Database Setup

Run the SQL schema in your Supabase SQL editor:
```sql
-- See db/schema.sql for the complete schema
```

### 3. Storage Setup

Create a storage bucket named `showrooms` in your Supabase dashboard with public access.

### 4. Local Development

```bash
npm install
npm run dev
```

The server will start on `http://localhost:8080`

### 5. Deploy to Render

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Use the `render.yaml` configuration
4. Set the environment variables in the Render dashboard

## API Endpoints

### Authentication
- `POST /api/auth/magic-link` - Request magic link
- `GET /api/auth/session` - Get current session
- `POST /api/auth/logout` - Logout

### Projects
- `POST /api/projects` - Create project
- `GET /api/projects` - List user projects
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Assets
- `POST /api/uploads/:projectId` - Upload asset
- `GET /api/uploads/:projectId` - List project assets
- `DELETE /api/uploads/:projectId/:assetId` - Delete asset

### Public
- `GET /api/manifest/:slug` - Get public manifest for Unity

## Project Structure

```
server/
├── index.ts              # Express app entrypoint
├── routes/               # API route handlers
│   ├── auth.ts          # Authentication routes
│   ├── projects.ts      # Project CRUD routes
│   ├── uploads.ts       # Asset upload routes
│   └── manifest.ts      # Public manifest API
├── db/                  # Database layer
│   ├── schema.sql       # Database schema
│   └── queries.ts       # Database query functions
├── supabase/            # Supabase client
│   └── client.ts        # Supabase configuration
└── web/                 # Static portal files
    ├── index.html       # Portal UI
    ├── styles.css       # Portal styles
    └── portal.js        # Portal JavaScript
```

## Development

### Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 8080) |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_BUCKET` | Storage bucket name | Yes |
| `PUBLIC_BASE_URL` | Public URL for the service | Yes |
| `ASSET_URL_TTL` | Signed URL TTL in seconds | No (default: 3600) |
| `SESSION_COOKIE` | Session cookie name | No (default: dev_portal_session) |

## Troubleshooting

### Common Issues

1. **Magic link not working**: Check that `PUBLIC_BASE_URL` is set correctly
2. **Upload failures**: Verify Supabase storage bucket exists and has correct permissions
3. **Database errors**: Ensure schema is applied and RLS policies are configured
4. **CORS issues**: Check that `PUBLIC_BASE_URL` includes the correct domain

### Logs

Check Render logs for detailed error information:
```bash
# In Render dashboard, go to your service and click "Logs"
```

## Security Notes

- Service role key should only be used server-side
- RLS policies should be configured in Supabase
- File uploads are validated for type and size
- Signed URLs expire after configured TTL
