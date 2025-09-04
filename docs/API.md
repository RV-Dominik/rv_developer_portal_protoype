# API Documentation

This document describes the REST API endpoints for the showroom backend.

## Base URL

- **Development**: `http://localhost:8080`
- **Production**: `https://your-render-service.onrender.com`

## Authentication

All API endpoints (except public manifest) require authentication via Supabase magic links.

### Request Magic Link
```http
POST /api/auth/magic-link
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Magic link sent to your email"
}
```

### Get Current Session
```http
GET /api/auth/session
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2025-01-04T00:00:00Z"
  }
}
```

### Logout
```http
POST /api/auth/logout
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

## Projects

### Create Project
```http
POST /api/projects
Content-Type: application/json

{
  "title": "My Awesome Game",
  "slug": "my-awesome-game",
  "short_desc": "Brief description",
  "long_desc": "Detailed description",
  "theme": {
    "primary": "#141414",
    "accent": "#59c1ff"
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "owner_id": "uuid",
  "slug": "my-awesome-game",
  "title": "My Awesome Game",
  "short_desc": "Brief description",
  "long_desc": "Detailed description",
  "theme": {
    "primary": "#141414",
    "accent": "#59c1ff"
  },
  "created_at": "2025-01-04T00:00:00Z",
  "updated_at": "2025-01-04T00:00:00Z"
}
```

### List Projects
```http
GET /api/projects
```

**Response:**
```json
[
  {
    "id": "uuid",
    "owner_id": "uuid",
    "slug": "my-awesome-game",
    "title": "My Awesome Game",
    "short_desc": "Brief description",
    "long_desc": "Detailed description",
    "theme": {
      "primary": "#141414",
      "accent": "#59c1ff"
    },
    "created_at": "2025-01-04T00:00:00Z",
    "updated_at": "2025-01-04T00:00:00Z",
    "assets": []
  }
]
```

### Get Project
```http
GET /api/projects/{id}
```

**Response:**
```json
{
  "id": "uuid",
  "owner_id": "uuid",
  "slug": "my-awesome-game",
  "title": "My Awesome Game",
  "short_desc": "Brief description",
  "long_desc": "Detailed description",
  "theme": {
    "primary": "#141414",
    "accent": "#59c1ff"
  },
  "created_at": "2025-01-04T00:00:00Z",
  "updated_at": "2025-01-04T00:00:00Z",
  "assets": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "kind": "logo",
      "file_key": "project-id/logo/uuid.png",
      "mime": "image/png",
      "width": 512,
      "height": 512,
      "created_at": "2025-01-04T00:00:00Z"
    }
  ]
}
```

### Update Project
```http
PUT /api/projects/{id}
Content-Type: application/json

{
  "title": "Updated Title",
  "short_desc": "Updated description",
  "theme": {
    "primary": "#000000",
    "accent": "#ff0000"
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "owner_id": "uuid",
  "slug": "my-awesome-game",
  "title": "Updated Title",
  "short_desc": "Updated description",
  "long_desc": "Detailed description",
  "theme": {
    "primary": "#000000",
    "accent": "#ff0000"
  },
  "created_at": "2025-01-04T00:00:00Z",
  "updated_at": "2025-01-04T00:00:00Z"
}
```

### Delete Project
```http
DELETE /api/projects/{id}
```

**Response:**
```json
{
  "message": "Project deleted successfully"
}
```

## Assets

### Upload Asset
```http
POST /api/uploads/{projectId}
Content-Type: multipart/form-data

file: [binary data]
kind: "logo" | "header" | "screenshot" | "trailer" | "custom"
```

**Response:**
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "kind": "logo",
  "file_key": "project-id/logo/uuid.png",
  "mime": "image/png",
  "width": 512,
  "height": 512,
  "created_at": "2025-01-04T00:00:00Z"
}
```

### List Project Assets
```http
GET /api/uploads/{projectId}
```

**Response:**
```json
[
  {
    "id": "uuid",
    "project_id": "uuid",
    "kind": "logo",
    "file_key": "project-id/logo/uuid.png",
    "mime": "image/png",
    "width": 512,
    "height": 512,
    "created_at": "2025-01-04T00:00:00Z"
  }
]
```

### Delete Asset
```http
DELETE /api/uploads/{projectId}/{assetId}
```

**Response:**
```json
{
  "message": "Asset deleted successfully"
}
```

## Public Manifest

### Get Manifest
```http
GET /api/manifest/{slug}
```

**Response:**
```json
{
  "slug": "my-awesome-game",
  "title": "My Awesome Game",
  "shortDescription": "Brief description",
  "longDescription": "Detailed description",
  "theme": {
    "primary": "#141414",
    "accent": "#59c1ff"
  },
  "assets": {
    "logo": "https://supabase.../signed-url/logo.png",
    "header": "https://supabase.../signed-url/header.jpg",
    "screenshots": [
      "https://supabase.../signed-url/screenshot1.jpg",
      "https://supabase.../signed-url/screenshot2.jpg"
    ],
    "trailer": {
      "type": "file",
      "src": "https://supabase.../signed-url/trailer.mp4",
      "duration": 120
    }
  },
  "updatedAt": "2025-01-04T00:00:00Z"
}
```

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 409 Conflict
```json
{
  "error": "Project slug already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

- **Magic Link**: 5 requests per minute per IP
- **Uploads**: 10 requests per minute per user
- **API Calls**: 100 requests per minute per user

## File Upload Limits

- **Maximum file size**: 50MB
- **Allowed image types**: JPEG, PNG, WebP, GIF
- **Allowed video types**: MP4, WebM, QuickTime
- **Image processing**: Automatic resizing and compression

## CORS

- **Allowed origins**: Configured via environment variables
- **Credentials**: Supported for authenticated requests
- **Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Headers**: Content-Type, Authorization

## Caching

- **Manifest responses**: 5 minutes
- **Asset URLs**: 1 hour (configurable)
- **Static files**: 1 day

## Webhooks

Currently not implemented, but planned for:
- Project updates
- Asset uploads
- User events
