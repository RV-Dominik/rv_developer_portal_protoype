# Showroom Backend (ASP.NET Core)

An ASP.NET Core 8.0 backend running in Docker on Render, with Supabase for Auth, Database, and Storage, and a static web portal served from `wwwroot`.

## Tasks / TODOs

- [x] Implement real Supabase magic link authentication
- [x] Add proper JWT session management (HTTP-only cookie `auth_token`)
- [x] Update frontend to handle real authentication flow (hash + query tokens)
- [x] Fix auth flicker (landing page stays until user clicks Get Started)
- [x] Relocate "What you can do" guide to dashboard (post-login)
- [ ] Test complete authentication flow end-to-end
- [ ] Deploy Swagger fixes to Render.com
- [ ] Optional: Make dashboard guide collapsible/dismissible on first login

### Required configuration checklist (Render + Supabase)

- **Render Environment Variables**
  - `SUPABASE_URL` = your Supabase project URL
  - `SUPABASE_SERVICE_ROLE_KEY` = service role key
  - `SUPABASE_ANON_KEY` = anon key
  - `SUPABASE_BUCKET` = `showrooms`
  - `PUBLIC_BASE_URL` = deployed app URL (e.g. `https://<your-service>.onrender.com`)
  - `JWT_SECRET` = a strong, random string (64+ chars)
  - (deprecated) `USE_MOCK_SUPABASE` — no longer used

- **Supabase → Authentication → URL Configuration**
  - Site URL: `https://<your-service>.onrender.com`
  - Redirect URLs: `https://<your-service>.onrender.com/?auth=callback`
  - Remove localhost URLs in production

- **Email Templates** (Supabase → Authentication → Templates)
  - If the email looks broken, reset to default or ensure links respect the configured Site URL

After configuring the above, request a magic link from the landing page, click the email link, and you should be redirected back to your domain, the app will verify tokens, set the session cookie, and show the dashboard.

## Features

- **Authentication**: Real magic link login via Supabase Auth (JWT session cookie)
- **Project Management**: CRUD for developer projects (Readyverse intake fields)
- **Asset Upload**: Upload to Supabase Storage with signed URLs
- **Public API**: JSON manifest endpoint for Unity/Unreal clients
- **Developer Portal**: Static web app (HTML/CSS/JS) in `wwwroot`

## Quick Start

### 1) Prerequisites
- .NET SDK 8.0+
- Docker (optional, for containerized runs)

### 2) Environment variables
Set these in your environment or in Render (recommended for production):

Required:
- `SUPABASE_URL` — your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — service role key
- `SUPABASE_ANON_KEY` — anon key
- `SUPABASE_BUCKET` — e.g., `showrooms`
- `PUBLIC_BASE_URL` — your deployed URL, e.g., `https://<service>.onrender.com`
- `JWT_SECRET` — strong random string (64+ chars)

Optional:
- `ASSET_URL_TTL` — signed URL TTL in seconds (default: `3600`)
- `SESSION_COOKIE` — cookie name (default: `dev_portal_session`)
  (deprecated) `USE_MOCK_SUPABASE` — no longer used

### Service Selection

The backend now always uses the REST service (`SupabaseRestService`). Mock services have been removed.

### 3) Supabase Setup
- Follow `SUPABASE_SETUP.md` (schema, storage bucket, RLS policies)
- Ensure a bucket named `showrooms` exists (the script is idempotent)

### 4) Local development

PowerShell (Windows):
```powershell
setx ASPNETCORE_ENVIRONMENT Development
$env:ASPNETCORE_URLS = "http://localhost:8080"
dotnet restore
dotnet run
```

Or with Docker:
```powershell
docker compose up --build
```

### 5) Deploy to Render
1. Connect the repo to Render
2. Create a Web Service using `render.yaml` (env: docker)
3. Set environment variables in Render dashboard
4. Deploy; app listens on port 8080 inside container

## API Endpoints

### Authentication
- `POST /api/auth/magic-link` — Request magic link
- `POST /api/auth/verify` — Verify access/refresh tokens (sets `auth_token` cookie)
- `GET /api/auth/session` — Get session (requires JWT cookie)
- `POST /api/auth/logout` — Logout (clears cookie)

### Projects
- `POST /api/projects`
- `GET /api/projects`
- `GET /api/projects/:id`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`

### Assets
- `POST /api/uploads/:projectId`
- `GET /api/uploads/:projectId`
- `DELETE /api/uploads/:projectId/:assetId`

### Public
- `GET /api/manifest/:slug` — Public manifest for clients

## Project Structure

```
server/
├── Controllers/             # ASP.NET Core API controllers
│   ├── AuthController.cs
│   ├── ProjectsController.cs
│   ├── UploadsController.cs
│   └── ManifestController.cs
├── Models/                  # C# models and DTOs
│   ├── Project.cs, Asset.cs, User.cs
│   └── DTOs/
├── Services/                # Supabase services (REST)
│   ├── ISupabaseService.cs
│   ├── SupabaseRestService.cs
│   └── AuthenticationService.cs
├── wwwroot/                 # Static portal (served)
│   ├── index.html
│   ├── styles.css
│   └── portal.js
├── Program.cs               # App startup
├── ShowroomBackend.csproj   # Project file (.NET 8)
├── Dockerfile               # Multi-stage Docker build
├── render.yaml              # Render.com config (env: docker)
├── SUPABASE_SETUP.md        # Supabase schema & setup
└── SUPABASE_QUICK_SETUP.md  # Quick setup guide
```

## Development

### Commands
- `dotnet restore` — restore packages
- `dotnet build` — build
- `dotnet run` — run

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_BUCKET` | Storage bucket name | Yes |
| `PUBLIC_BASE_URL` | Public URL for the service | Yes |
| `JWT_SECRET` | Secret for signing app JWTs | Yes |
| `ASSET_URL_TTL` | Signed URL TTL (seconds) | No (3600) |
| `SESSION_COOKIE` | Session cookie name | No (dev_portal_session) |
| `USE_MOCK_SUPABASE` | Toggle mock vs real Supabase | No (false) |

## Troubleshooting

### Common Issues
1. Magic link redirects to localhost: set Supabase Site URL and Redirect URLs to your Render domain; update `PUBLIC_BASE_URL`.
2. Email template looks broken: reset Supabase email templates or ensure links use configured Site URL.
3. Swagger not visible: ensure it's enabled in production (configured in `Program.cs`) and reachable at `/swagger`.
4. CSP violations: headers are configured in `Program.cs`; adjust if adding new external assets.
5. Storage/Uploads: ensure `showrooms` bucket exists and RLS/permissions follow `SUPABASE_SETUP.md`.

### Logs
Check Render logs in the service dashboard (Logs tab).

## Security Notes

- Keep secrets out of source control; use Render env vars
- `JWT_SECRET` must be strong and private
- Service role key is server-only
- RLS policies must be applied in Supabase
- Signed URLs expire per `ASSET_URL_TTL`
