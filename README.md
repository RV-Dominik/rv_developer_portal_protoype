# Low-Tier Showroom Prototype

A complete prototype for a low-tier showroom template where developers can create and manage game showrooms with a simple web portal and Unity client integration.

## 🎯 Overview

This prototype provides an **easy onboarding path** for developers to create showrooms with an upsell path to custom/bespoke solutions. It's built with modern web technologies and designed to scale from prototype to production.

## 🏗️ Architecture

- **Backend**: Node.js/Express on Render
- **Database**: PostgreSQL via Supabase
- **Storage**: Supabase Storage for assets
- **Authentication**: Magic link login via Supabase Auth
- **Frontend**: Vanilla HTML/CSS/JS portal
- **Client**: Unity showroom loader

## ✨ Features

### Developer Portal
- 🔐 Magic link authentication
- 📝 Project creation and management
- 🖼️ Asset upload (logo, header, screenshots, trailer)
- 🎨 Theme customization
- 📱 Responsive design

### Backend API
- 🔒 Secure authentication
- 📊 Project CRUD operations
- 📁 File upload with processing
- 🌐 Public manifest API for Unity
- ⚡ Image optimization and resizing

### Unity Client
- 📥 Automatic manifest loading
- 🖼️ Asset downloading and display
- 🎬 Video trailer support
- 🎨 Theme application
- 📱 Responsive UI layout

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Unity 2022.3 LTS+
- Supabase account
- Render account

### 1. Backend Setup

```bash
cd server
npm install
cp env.example .env
# Edit .env with your Supabase credentials
npm run dev
```

### 2. Database Setup

1. Create a Supabase project
2. Run the SQL schema from `server/db/schema.sql`
3. Create a storage bucket named `showrooms`

### 3. Deploy to Render

1. Connect your GitHub repository to Render
2. Use the `render.yaml` configuration
3. Set environment variables
4. Deploy!

### 4. Unity Setup

1. Import the Unity sample from `unity-sample/`
2. Configure the `ShowroomLoader` component
3. Set your backend URL and project slug
4. Build and run!

## 📁 Project Structure

```
├── server/                 # Node.js backend
│   ├── routes/            # API endpoints
│   ├── db/               # Database layer
│   ├── supabase/         # Supabase client
│   └── web/              # Static portal files
├── unity-sample/         # Unity client
│   ├── Scripts/          # C# scripts
│   └── UI/               # UI prefabs
├── docs/                 # Documentation
│   ├── ARCHITECTURE.md   # System design
│   ├── API.md           # API documentation
│   └── DEPLOY.md        # Deployment guide
└── README.md            # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | Yes |
| `SUPABASE_ANON_KEY` | Anonymous key | Yes |
| `SUPABASE_BUCKET` | Storage bucket name | Yes |
| `PUBLIC_BASE_URL` | Public URL for the service | Yes |

### Unity Configuration

1. Set `ManifestUrl` to your backend URL
2. Set `Slug` to your project slug
3. Configure UI references in the inspector

## 📚 Documentation

- **[Architecture](docs/ARCHITECTURE.md)** - System design and components
- **[API Reference](docs/API.md)** - Complete API documentation
- **[Deployment Guide](docs/DEPLOY.md)** - Production deployment steps
- **[Server README](server/README.md)** - Backend setup and development
- **[Unity README](unity-sample/README.md)** - Unity client setup

## 🎮 Usage

### For Developers

1. **Sign Up**: Visit the portal and request a magic link
2. **Create Project**: Add title, description, and theme
3. **Upload Assets**: Add logo, header, screenshots, and trailer
4. **Get Manifest**: Use the public manifest URL in Unity

### For Unity Integration

1. **Load Manifest**: Use `ShowroomLoader.LoadShowroom(slug)`
2. **Display Content**: Assets are automatically loaded and displayed
3. **Apply Theme**: Colors are applied to UI elements
4. **Play Trailer**: Video player is configured automatically

## 🔒 Security

- **Authentication**: Magic link login (no passwords)
- **Authorization**: Row-level security in Supabase
- **File Upload**: Type validation and size limits
- **Public Access**: Only manifest endpoint is public
- **CORS**: Configured for specific domains

## 🚀 Deployment

### Render (Backend)
- Automatic deployments from GitHub
- Environment variable management
- Built-in monitoring and logs

### Supabase (Database & Storage)
- Managed PostgreSQL database
- CDN-backed storage
- Built-in authentication

### Unity (Client)
- Build for target platforms
- Asset bundles for optimization
- Platform-specific configurations

## 📊 Performance

- **Image Processing**: Automatic resizing and compression
- **Caching**: Manifest responses cached for 5 minutes
- **CDN**: Supabase CDN for asset delivery
- **Optimization**: Lazy loading and efficient queries

## 🔮 Future Enhancements

### Backend
- Real-time updates via WebSockets
- Advanced image processing
- Video transcoding
- Analytics and metrics

### Frontend
- Real-time preview
- Drag-and-drop interface
- Advanced theming
- Mobile app

### Unity Client
- 3D showroom environments
- Interactive elements
- Social features
- Asset streaming

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is provided as-is for demonstration purposes. Modify as needed for your project.

## 🆘 Support

- Check the [documentation](docs/) for detailed guides
- Review [troubleshooting](docs/DEPLOY.md#troubleshooting) for common issues
- Open an issue for bugs or feature requests

---

**Built with ❤️ for the Readyverse developer community**
