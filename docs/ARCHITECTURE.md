# Architecture Overview

This document describes the architecture of the low-tier showroom prototype system.

## System Components

### 1. Supabase (Backend Services)
- **PostgreSQL Database**: Stores project metadata and asset references
- **Storage**: Hosts uploaded assets (images, videos)
- **Auth**: Handles user authentication via magic links
- **Real-time**: Optional real-time updates (not used in this prototype)

### 2. Render (Hosting Platform)
- **Node.js Backend**: Express server handling API requests
- **Static File Serving**: Serves the developer portal web interface
- **Environment Management**: Handles configuration and secrets

### 3. Unity Client (Game Engine)
- **ShowroomLoader**: Main component for loading and displaying showrooms
- **UI Components**: Canvas-based interface for displaying content
- **Asset Loading**: Downloads and displays images/videos from URLs

## Data Flow

### 1. Developer Portal Flow
```
Developer → Web Portal → Express API → Supabase Auth
                ↓
         Project Management → Supabase Database
                ↓
         Asset Upload → Supabase Storage
```

### 2. Unity Client Flow
```
Unity Client → Express API → Supabase Database
                ↓
         Manifest Generation → Signed URLs
                ↓
         Asset Download → Supabase Storage
```

## Database Schema

### Projects Table
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    short_desc TEXT,
    long_desc TEXT,
    theme JSONB,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Assets Table
```sql
CREATE TABLE assets (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    kind TEXT CHECK (kind IN ('logo', 'header', 'screenshot', 'trailer', 'custom')),
    file_key TEXT NOT NULL,
    mime TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    duration_seconds INTEGER,
    created_at TIMESTAMP
);
```

## API Design

### Authentication
- Magic link authentication via Supabase
- Session-based authentication for API calls
- No JWT tokens (handled by Supabase)

### Project Management
- RESTful API for CRUD operations
- Owner-based access control
- Slug-based public access

### Asset Management
- Multipart file uploads
- Image processing and optimization
- Signed URL generation for public access

### Public Manifest
- JSON endpoint for Unity clients
- Cached responses for performance
- Signed URLs with TTL

## Security Considerations

### Authentication
- Magic links expire after use
- Sessions managed by Supabase
- No password storage required

### Authorization
- Row Level Security (RLS) in Supabase
- Owner-based access control
- Public read access for manifests only

### File Security
- File type validation
- Size limits on uploads
- Signed URLs with expiration
- No direct file access

### CORS
- Configured for specific domains
- Credentials allowed for authenticated requests
- Public manifest accessible from anywhere

## Performance Optimizations

### Backend
- Image resizing and compression
- Cached manifest responses
- Efficient database queries
- Connection pooling

### Frontend
- Lazy loading of assets
- Responsive image sizing
- Minimal JavaScript bundle
- CSS-based animations

### Unity Client
- Asynchronous asset loading
- Texture caching
- Efficient UI updates
- Background loading

## Scalability Considerations

### Database
- Indexed queries for performance
- Connection pooling
- Read replicas for public data
- Partitioning by project owner

### Storage
- CDN integration possible
- Image transformation on demand
- Compression and optimization
- Lifecycle policies

### API
- Stateless design
- Horizontal scaling possible
- Caching layers
- Rate limiting

## Deployment Architecture

### Development
```
Local Machine
├── Node.js Backend (localhost:8080)
├── Supabase (cloud)
└── Unity Editor
```

### Production
```
Render Platform
├── Node.js Backend (auto-scaling)
├── Static Files (CDN)
└── Environment Variables

Supabase Cloud
├── PostgreSQL (managed)
├── Storage (managed)
└── Auth (managed)

Unity Client
├── Built Application
└── Asset Bundles (optional)
```

## Monitoring and Logging

### Backend Logging
- Request/response logging
- Error tracking
- Performance metrics
- Asset upload tracking

### Database Monitoring
- Query performance
- Connection usage
- Storage usage
- Error rates

### Client Monitoring
- Asset load times
- Error rates
- User interactions
- Performance metrics

## Future Enhancements

### Backend
- Real-time updates via WebSockets
- Advanced image processing
- Video transcoding
- Analytics and metrics

### Frontend
- Real-time preview
- Drag-and-drop interface
- Advanced theming
- Mobile responsiveness

### Unity Client
- Asset streaming
- 3D showroom environments
- Interactive elements
- Social features

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL (via Supabase)
- **Storage**: Supabase Storage
- **Auth**: Supabase Auth
- **Image Processing**: Sharp
- **Language**: TypeScript

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with flexbox/grid
- **JavaScript**: Vanilla ES6+
- **Icons**: Unicode symbols
- **Fonts**: System fonts

### Unity Client
- **Engine**: Unity 2022.3 LTS+
- **Scripting**: C#
- **Networking**: UnityWebRequest
- **UI**: Unity UI (uGUI)
- **Video**: VideoPlayer component

### Infrastructure
- **Hosting**: Render
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **CDN**: Supabase CDN
- **Monitoring**: Render logs
