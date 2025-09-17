# Readyverse Developer Portal

A comprehensive developer portal for creating and managing game showrooms with seamless integration between web portal, Unreal Engine SDK, and Unity client. Built with ASP.NET Core, Supabase, and modern web technologies.

## 🎯 Overview

This project provides a complete solution for developers to create, manage, and showcase game showrooms through multiple channels:

- **Web Portal**: Full-featured onboarding and project management
- **Unreal Engine SDK**: Deep linking and showroom loading capabilities  
- **Backend API**: Secure, scalable ASP.NET Core service
- **Database**: PostgreSQL with Row Level Security via Supabase

## 🏗️ Architecture

### Backend Stack
- **Framework**: ASP.NET Core 8.0
- **Database**: PostgreSQL via Supabase
- **Storage**: Supabase Storage for assets
- **Authentication**: JWT + Magic link via Supabase Auth
- **Deployment**: Docker container on Render.com
- **Security**: Row Level Security, input validation, rate limiting

### Frontend Stack
- **Portal**: Vanilla HTML/CSS/JavaScript
- **UI Framework**: Custom component system
- **Styling**: CSS Grid/Flexbox with custom properties
- **State Management**: Modular JavaScript classes

### Client Integration
- **Unreal Engine**: C++ SDK with Blueprint support
- **Deep Linking**: Custom protocol (`rvshowroom://`)

## ✨ Features

### Developer Portal
- 🔐 **Magic Link Authentication** - Passwordless login system
- 📝 **Multi-Step Onboarding** - Guided project creation process
- 🖼️ **Asset Management** - Upload and manage game assets
- 🎨 **Showroom Customization** - Theme and lighting configuration
- 📱 **Responsive Design** - Works on all device sizes
- 🔒 **Security First** - RLS, input validation, rate limiting

### Backend API
- 🔒 **Secure Authentication** - JWT tokens with HTTP-only cookies
- 📊 **Project CRUD** - Complete project lifecycle management
- 📁 **File Upload** - Secure asset upload with validation
- 🌐 **Public APIs** - Showroom data for client consumption
- ⚡ **Performance** - Caching, optimization, and CDN integration
- 🛡️ **Security Middleware** - SQL injection, XSS, and rate limiting protection

### Unreal Engine SDK
- 🔗 **Deep Linking** - Open showrooms directly from web
- 📥 **Showroom Loading** - Fetch and display showroom data
- 🎨 **Theme Application** - Apply colors and styling
- 📱 **Blueprint Integration** - Full Blueprint support
- 🔄 **Event System** - Delegates and multicast events
- 🪟 **Auto-Registration** - Automatic deep link protocol setup


## 🚀 Quick Start

### Prerequisites
- .NET 8.0 SDK
- Unreal Engine 5.0+ (for Unreal SDK)
- Supabase account
- Render.com account
- Docker (for local development)

### 1. Backend Setup

```bash
cd server
cp env.example .env
# Edit .env with your Supabase credentials
dotnet restore
dotnet run
```

### 2. Database Setup

1. Create a Supabase project
2. Run the SQL migrations in order:
   ```sql
   -- Run in Supabase SQL Editor
   -- 1. server/db/schema.sql
   -- 2. server/db/migrations/003_security_rls_policies.sql
   ```
3. Create a storage bucket named `showrooms`
4. Configure RLS policies (included in migration)

### 3. Deploy to Render

1. Connect your GitHub repository to Render
2. Use the `render.yaml` configuration
3. Set environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ANON_KEY`
   - `JWT_SECRET` (32+ characters)
   - `PUBLIC_BASE_URL`
4. Deploy!

### 4. Unreal Engine Setup

1. Copy `RV_ShowroomsSDK/` to your project's `Plugins/` folder
2. Enable the plugin in your Unreal project
3. Set `ApiBaseUrl` to your backend URL
4. Use Blueprint or C++ to load showrooms

## 📁 Project Structure

```
├── server/                     # ASP.NET Core Backend
│   ├── Controllers/           # API Controllers
│   │   ├── AuthController.cs  # Authentication endpoints
│   │   ├── ProjectsController.cs # Project management
│   │   ├── ShowroomController.cs # Showroom data
│   │   ├── UploadsController.cs  # File uploads
│   │   ├── OrganizationController.cs # Organization management
│   │   └── ManifestController.cs # Public manifest API
│   ├── Services/              # Business logic
│   │   ├── AuthenticationService.cs # JWT + Magic link auth
│   │   └── SupabaseRestService.cs # Database operations
│   ├── Models/                # Data models
│   │   ├── Project.cs         # Project entity
│   │   ├── Organization.cs    # Organization entity
│   │   ├── User.cs           # User entity
│   │   └── DTOs/             # Data transfer objects
│   ├── Middleware/            # Security middleware
│   │   └── SecurityMiddleware.cs # Input validation, rate limiting
│   ├── Constants/             # Application constants
│   │   └── AssetConstants.cs # Asset type definitions
│   ├── db/                    # Database
│   │   ├── schema.sql         # Main schema
│   │   └── migrations/        # Database migrations
│   ├── wwwroot/               # Static web files
│   │   ├── index.html         # Main portal
│   │   ├── js/                # JavaScript modules
│   │   │   ├── core/          # Core functionality
│   │   │   │   ├── PortalCore.js # Main portal class
│   │   │   │   └── AssetConstants.js # Frontend constants
│   │   │   ├── onboarding/    # Onboarding wizard
│   │   │   │   ├── OnboardingWizard.js # Wizard UI and navigation
│   │   │   │   ├── OnboardingSteps.js # Step content and previews
│   │   │   │   ├── OnboardingValidation.js # Client-side validation
│   │   │   │   └── OnboardingData.js # Data collection and API calls
│   │   │   ├── projects/      # Project management
│   │   │   │   └── ProjectManager.js # Project CRUD operations
│   │   │   └── organization/  # Organization features
│   │   │       └── OrganizationManager.js # Organization management
│   │   ├── styles.css         # Main stylesheet
│   │   └── portal-refactored.js # Main application orchestrator
│   ├── Dockerfile             # Container configuration
│   ├── render.yaml            # Render.com deployment
│   ├── Program.cs             # Application entry point
│   └── SECURITY_CONFIG.md     # Security configuration guide
├── RV_ShowroomsSDK/           # Unreal Engine SDK
│   ├── Source/                # C++ source code
│   │   └── RV_ShowroomsSDK/
│   │       ├── Public/        # Header files
│   │       │   ├── RV_ShowroomsSubsystem.h # Main subsystem
│   │       │   ├── Models/RV_ShowroomModels.h # Data models
│   │       │   └── RV_ShowroomsSDK.h # Plugin header
│   │       └── Private/       # Implementation
│   │           ├── RV_ShowroomsSubsystem.cpp # Main implementation
│   │           └── RV_ShowroomsSubsystemDeepLink.cpp # Deep linking
│   ├── README.md              # SDK documentation
│   ├── DEEP_LINKING.md        # Deep linking guide
│   ├── BLUEPRINT_USAGE_EXAMPLE.md # Blueprint examples
│   └── MULTICAST_DELEGATE_EXAMPLE.md # Event system examples
├── docs/                      # Documentation
│   ├── ARCHITECTURE.md        # System design (OUTDATED)
│   ├── API.md                 # API reference
│   └── DEPLOY.md              # Deployment guide
└── README.md                  # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `SUPABASE_URL` | Supabase project URL | Yes | - |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | Yes | - |
| `SUPABASE_ANON_KEY` | Anonymous key | Yes | - |
| `JWT_SECRET` | JWT signing secret (32+ chars) | Yes | - |
| `PUBLIC_BASE_URL` | Public URL for the service | Yes | - |
| `CORS__AllowedOrigins__0` | Allowed CORS origin | No | localhost |
| `ASSET_URL_TTL` | Asset URL expiration (seconds) | No | 3600 |

### Security Configuration

The application includes comprehensive security measures:

- **Row Level Security (RLS)** - Database-level access control
- **Input Validation** - SQL injection and XSS prevention
- **Rate Limiting** - 100 requests/minute per IP
- **Security Headers** - CSP, HSTS, X-Frame-Options, etc.
- **JWT Authentication** - Secure token-based auth
- **CORS Protection** - Restricted cross-origin requests

See `server/SECURITY_CONFIG.md` for detailed security setup.

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/magic-link` - Request magic link
- `POST /api/auth/verify` - Verify magic link
- `GET /api/auth/session` - Get current session
- `POST /api/auth/logout` - Logout

### Project Management
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/{id}` - Get project details
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project
- `POST /api/projects/{id}/onboarding/step` - Save onboarding step
- `POST /api/projects/{id}/onboarding/complete` - Complete onboarding
- `POST /api/projects/{id}/publish` - Publish project
- `POST /api/projects/{id}/unpublish` - Unpublish project

### Showroom Data
- `GET /api/showroom/games` - List published showrooms
- `GET /api/showroom/games/{id}` - Get showroom details
- `GET /api/showroom/{id}` - Get showroom manifest

### File Upload
- `POST /api/uploads/{projectId}` - Upload asset
- `GET /api/uploads/{projectId}/project-urls` - Get asset URLs
- `DELETE /api/uploads/{projectId}` - Delete asset

### Organization Management
- `GET /api/organizations` - List user organizations
- `POST /api/organizations` - Create organization
- `PUT /api/organizations/{id}` - Update organization
- `DELETE /api/organizations/{id}` - Delete organization

## 🎮 Usage

### For Developers

1. **Sign Up**: Visit the portal and request a magic link
2. **Create Project**: Complete the multi-step onboarding
3. **Upload Assets**: Add logo, hero image, screenshots, trailer
4. **Configure Showroom**: Set theme, lighting, and tier
5. **Publish**: Make your showroom available to clients

### For Unreal Engine Integration

1. **Install SDK**: Copy to Plugins folder and enable
2. **Configure**: Set `ApiBaseUrl` to your backend
3. **Deep Linking**: Register protocol for web integration
4. **Load Showrooms**: Use Blueprint or C++ functions
5. **Handle Events**: Bind to completion delegates


## 🔒 Security Features

### Database Security
- **Row Level Security (RLS)** - Users can only access their own data
- **Secure Functions** - Database functions with proper search_path
- **Data Validation** - Input sanitization and type checking

### API Security
- **JWT Authentication** - Secure token-based authentication
- **Rate Limiting** - Prevents abuse and DoS attacks
- **Input Validation** - SQL injection and XSS prevention
- **CORS Protection** - Restricted cross-origin requests

### Client Security
- **Deep Link Validation** - Secure protocol handling
- **Asset Validation** - File type and size checking
- **HTTPS Enforcement** - Secure communication only

## 🚀 Deployment

### Render.com (Backend)
- **Automatic Deployments** - GitHub integration
- **Environment Management** - Secure variable storage
- **Monitoring** - Built-in logs and metrics
- **Scaling** - Auto-scaling based on demand

### Supabase (Database & Storage)
- **Managed PostgreSQL** - High availability database
- **CDN Storage** - Global asset delivery
- **Built-in Auth** - User management and security
- **Real-time** - Live data updates (future feature)

### Docker (Containerization)
- **Multi-stage Build** - Optimized container size
- **Security Scanning** - Vulnerability detection
- **Portable** - Run anywhere Docker is supported

## 📊 Performance

### Backend Optimizations
- **Caching** - Response caching for static data
- **CDN Integration** - Supabase CDN for assets
- **Database Indexing** - Optimized queries
- **Compression** - Gzip compression for responses

### Frontend Optimizations
- **Lazy Loading** - Assets load on demand
- **Image Optimization** - Automatic resizing and compression
- **Minification** - Compressed JavaScript and CSS
- **Caching** - Browser caching for static assets

## 🔮 Future Enhancements

### Backend
- **Real-time Updates** - WebSocket integration
- **Advanced Analytics** - Usage tracking and metrics
- **Video Processing** - Automatic transcoding
- **API Versioning** - Backward compatibility

### Frontend
- **Real-time Preview** - Live showroom updates
- **Advanced Editor** - Drag-and-drop interface
- **Collaboration** - Multi-user editing
- **Mobile App** - Native mobile experience

### SDK Features
- **3D Environments** - Immersive showroom spaces
- **Interactive Elements** - Clickable objects and UI
- **Social Features** - Sharing and collaboration
- **Asset Streaming** - Progressive loading

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Backend development
cd server
dotnet restore
dotnet run

# Frontend development
# Edit files in server/wwwroot/
# Changes are reflected immediately

# Database development
# Use Supabase SQL Editor for schema changes
# Create migrations in server/db/migrations/
```

## 📄 License

This project is provided as-is for demonstration purposes. Modify as needed for your project.

## 🆘 Support

- **Documentation**: Check the [docs/](docs/) folder
- **Security**: See [server/SECURITY_CONFIG.md](server/SECURITY_CONFIG.md)
- **API Reference**: [docs/API.md](docs/API.md)
- **Deployment**: [docs/DEPLOY.md](docs/DEPLOY.md)
- **Issues**: Open an issue for bugs or feature requests

## 🏆 Recent Updates

### Security Enhancements
- ✅ Row Level Security (RLS) enabled
- ✅ Input validation and sanitization
- ✅ Rate limiting and security headers
- ✅ JWT authentication with secure cookies

### Unreal Engine SDK
- ✅ Deep linking support (`rvshowroom://`)
- ✅ Automatic protocol registration
- ✅ Multicast delegate system
- ✅ Blueprint integration

### Portal Improvements
- ✅ Multi-step onboarding wizard
- ✅ Asset upload and management
- ✅ Showroom customization
- ✅ Responsive design

---

**Built with ❤️ for the Readyverse developer community**