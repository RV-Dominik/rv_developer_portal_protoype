# Unity Showroom Sample

A Unity sample project that demonstrates how to load and display showroom data from the backend API.

## Features

- Load showroom manifest from backend API
- Display project information (title, description)
- Load and display assets (logo, header, screenshots)
- Play trailer videos
- Apply custom themes
- Responsive UI layout

## Setup

### 1. Import the Sample

1. Create a new Unity project (2022.3 LTS or later)
2. Copy the `Assets/ShowroomSample` folder to your project
3. Open the `DefaultShowroom` scene

### 2. Configure the ShowroomLoader

1. Select the GameObject with the `ShowroomLoader` component
2. In the Inspector, set the following:
   - **Manifest Url**: Your backend URL (e.g., `https://your-render-service.onrender.com/api/manifest`)
   - **Slug**: The project slug to load (e.g., `my-space-shooter`)

### 3. Setup UI References

Drag and drop the following UI elements to the ShowroomLoader component:

- **Logo Image**: RawImage component for the project logo
- **Header Image**: RawImage component for the header image
- **Title Text**: Text component for the project title
- **Short Desc Text**: Text component for short description
- **Long Desc Text**: Text component for long description
- **Trailer Player**: VideoPlayer component for trailer video
- **Screenshots Container**: Transform for screenshot layout
- **Screenshot Prefab**: Prefab for individual screenshots

### 4. Create UI Layout

Create a UI layout similar to this structure:

```
Canvas
├── ShowroomLoader (with script)
├── UI Panel
│   ├── Header Image
│   ├── Title Text
│   ├── Short Desc Text
│   ├── Long Desc Text
│   ├── Logo Image
│   ├── Screenshots Container
│   │   └── ScreenshotPrefab (prefab)
│   └── Trailer Player
└── Loading Panel
    └── Loading Text
```

## Usage

### Basic Usage

The showroom will automatically load when the scene starts. The `ShowroomLoader` component will:

1. Fetch the manifest from the backend
2. Apply the theme colors
3. Update text content
4. Load and display all assets

### Dynamic Loading

You can load different showrooms at runtime:

```csharp
ShowroomLoader loader = FindObjectOfType<ShowroomLoader>();
loader.LoadShowroom("different-project-slug");
```

### Trailer Control

```csharp
ShowroomLoader loader = FindObjectOfType<ShowroomLoader>();
loader.PlayTrailer();  // Start playing
loader.StopTrailer();  // Stop playing
```

## Manifest Format

The showroom expects a JSON manifest with this structure:

```json
{
  "slug": "my-space-shooter",
  "title": "My Space Shooter",
  "shortDescription": "Fast arcade fun.",
  "longDescription": "A longer description...",
  "theme": {
    "primary": "#141414",
    "accent": "#59c1ff"
  },
  "assets": {
    "logo": "https://supabase.../logo.png",
    "header": "https://supabase.../header.jpg",
    "screenshots": [
      "https://supabase.../s1.jpg",
      "https://supabase.../s2.jpg"
    ],
    "trailer": {
      "type": "url",
      "src": "https://supabase.../trailer.mp4",
      "duration": 120
    }
  },
  "updatedAt": "2025-01-04T00:00:00Z"
}
```

## Customization

### Theme Colors

The loader automatically applies theme colors:
- **Primary**: Used for background elements
- **Accent**: Used for text and UI highlights

### Asset Types

Supported asset types:
- **Logo**: Small square image (512x512 recommended)
- **Header**: Wide banner image (1920x1080 recommended)
- **Screenshots**: Array of game screenshots
- **Trailer**: Video file (MP4 recommended)

### UI Layout

The sample uses a basic layout, but you can customize:
- Screenshot grid layout
- Text positioning and styling
- Video player controls
- Loading indicators

## Troubleshooting

### Common Issues

1. **Manifest not loading**: Check the manifest URL and slug
2. **Images not displaying**: Verify image URLs are accessible
3. **Video not playing**: Check video format and URL
4. **CORS errors**: Ensure backend allows Unity requests

### Debug Information

Enable debug logging in the ShowroomLoader:
- Check Unity Console for detailed logs
- Verify network requests in browser dev tools
- Test manifest URL directly in browser

### Performance Tips

- Use compressed images for better loading
- Implement image caching for repeated loads
- Use video streaming for large trailers
- Consider LOD for different screen sizes

## Dependencies

- Unity 2022.3 LTS or later
- Unity Web Request (built-in)
- Unity Video Player (built-in)
- Unity UI (built-in)

## License

This sample is provided as-is for demonstration purposes. Modify as needed for your project.
