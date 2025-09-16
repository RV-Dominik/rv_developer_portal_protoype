# Deep Linking for Readyverse Showrooms SDK

This document explains how to implement and use deep linking to open showrooms directly from web browsers or other applications.

## Overview

Deep linking allows users to click a link in a web browser and have it automatically open the Unreal Engine game client with specific showroom parameters. This creates a seamless experience between the web portal and the game client.

## Deep Link URL Format

```
rvshowroom://open?projectId={id}&action=open_showroom&tier={tier}&lightingColor={color}&gameName={name}&genre={genre}&buildStatus={status}
```

### Parameters

- `projectId` (required): The unique identifier of the project/showroom
- `action` (required): The action to perform (currently only "open_showroom" is supported)
- `tier` (optional): Showroom tier ("standard" or "bespoke")
- `lightingColor` (optional): Hex color code for showroom lighting (e.g., "#4A90E2")
- `gameName` (optional): Display name of the game
- `genre` (optional): Game genre
- `buildStatus` (optional): Build status of the game

### Example URLs

```
rvshowroom://open?projectId=abc123&action=open_showroom&tier=standard&lightingColor=%234A90E2&gameName=My%20Awesome%20Game&genre=Action&buildStatus=Production-Ready
```

## Implementation

### 1. Automatic Protocol Registration

The Unreal SDK automatically registers the deep link protocol when the subsystem initializes. This happens transparently when the game starts, ensuring deep links work immediately without any manual setup.

**Configuration Options:**
- `bAutoRegisterDeepLink` (default: `true`) - Controls whether to auto-register on startup
- Can be disabled in Blueprint or C++ if manual control is preferred

### 2. Web Portal Integration

The web portal automatically generates deep links when users click "Open in Readyverse" buttons. The links include all relevant project data:

```javascript
// Example from OnboardingSteps.js
const params = new URLSearchParams({
    projectId: projectId,
    action: 'open_showroom',
    tier: project.showroomTier || 'standard',
    lightingColor: project.showroomLightingColor || '#4A90E2',
    gameName: encodeURIComponent(project.name || ''),
    genre: project.genre || '',
    buildStatus: project.buildStatus || ''
});

const url = `rvshowroom://open?${params.toString()}`;
```

### 2. Unreal Engine SDK Integration

The SDK provides several Blueprint-callable functions for handling deep links:

#### Blueprint Functions

- `HandleDeepLink(DeepLinkUrl, OnComplete)`: Processes a deep link URL
- `OpenShowroomFromDeepLink(ProjectId, Tier, LightingColor, GameName, Genre, BuildStatus)`: Opens a showroom with specific parameters

#### Events

- `OnDeepLinkReceived`: Multicast delegate that fires when a deep link is received
- `OnShowroomLoaded`: Multicast delegate that fires when a showroom is successfully loaded or fails to load

#### Example Blueprint Usage

1. **Listen for Deep Links**: Bind to the `OnDeepLinkReceived` event
2. **Listen for Showroom Loads**: Bind to the `OnShowroomLoaded` event
3. **Handle Deep Links**: Call `HandleDeepLink` when a deep link is received
4. **Open Showroom**: Use `OpenShowroomFromDeepLink` to configure and open the showroom
5. **React to Load Events**: Use `OnShowroomLoaded` to react when showroom data is available

### 3. Protocol Registration

**Automatic Registration (Default):**
The deep link protocol is automatically registered when the game starts. No manual setup required!

**Manual Registration (Optional):**
If you prefer manual control, you can disable auto-registration and use these methods:

#### Option 1: PowerShell Script

```powershell
# Run as Administrator
.\register-deeplink.ps1 -GameExecutablePath "C:\Path\To\Your\Game.exe"
```

#### Option 2: Registry File

1. Edit `DeepLink_Registry_Example.reg`
2. Update the paths to point to your game executable
3. Run the registry file as Administrator

#### Option 3: Manual Registry Entry

1. Open Registry Editor as Administrator
2. Navigate to `HKEY_CLASSES_ROOT`
3. Create a new key named `rvshowroom`
4. Set the following values:
   - `(Default)`: "URL:Readyverse Showroom Protocol"
   - `URL Protocol`: (empty string)
5. Create subkeys:
   - `DefaultIcon` → `(Default)`: "C:\Path\To\Your\Game.exe,0"
   - `shell\open\command` → `(Default)`: "C:\Path\To\Your\Game.exe" "%1"

## Usage Examples

### From Web Portal

When a user clicks "Open in Readyverse" in the web portal:

1. The portal generates a deep link with project parameters
2. The browser attempts to open the deep link
3. Windows launches the registered game executable
4. The game receives the deep link parameters
5. The SDK processes the parameters and opens the appropriate showroom

### From External Applications

You can generate deep links from any application:

```csharp
// C# example
string deepLink = $"rvshowroom://open?projectId={projectId}&action=open_showroom&tier=standard&lightingColor=%234A90E2";
Process.Start(deepLink);
```

```javascript
// JavaScript example
const deepLink = `rvshowroom://open?projectId=${projectId}&action=open_showroom&tier=standard&lightingColor=%234A90E2`;
window.open(deepLink);
```

## Testing

### Test Deep Link Registration

1. Open Command Prompt or PowerShell
2. Run: `start rvshowroom://open?projectId=test123&action=open_showroom`
3. Verify that your game launches and receives the parameters

### Debug Deep Links

The SDK logs all deep link activity to the Unreal Engine output log:

```
LogTemp: Log: Handling deep link: rvshowroom://open?projectId=test123&action=open_showroom&tier=standard
LogTemp: Log: Opening showroom from deep link:
LogTemp: Log:   ProjectId: test123
LogTemp: Log:   Tier: standard
LogTemp: Log:   LightingColor: #4A90E2
```

## Troubleshooting

### Deep Link Not Working

1. **Check Protocol Registration**: Verify the protocol is registered in the registry
2. **Check Game Path**: Ensure the registered path points to the correct executable
3. **Run as Administrator**: Protocol registration requires administrator privileges
4. **Check URL Encoding**: Ensure special characters are properly URL-encoded

### Game Not Receiving Parameters

1. **Check Command Line**: The game should receive the deep link URL as a command line argument
2. **Check SDK Initialization**: Ensure the SDK is properly initialized
3. **Check Event Binding**: Verify that deep link events are properly bound

### Browser Security

Some browsers may block deep links for security reasons. Consider:

1. **User Interaction**: Deep links work best when triggered by user interaction
2. **HTTPS**: Use HTTPS for the web portal
3. **Fallback**: Provide a fallback mechanism if deep linking fails

## Security Considerations

- **URL Validation**: Always validate deep link parameters before processing
- **Path Traversal**: Be careful with file paths in parameters
- **Input Sanitization**: Sanitize all user input from deep links
- **Protocol Whitelisting**: Only allow specific actions and parameters

## Future Enhancements

Potential future improvements:

- **Authentication**: Include user authentication in deep links
- **Session Management**: Handle deep links for different user sessions
- **Multiple Actions**: Support additional actions beyond "open_showroom"
- **Cross-Platform**: Extend deep linking to other platforms (macOS, Linux)
- **Mobile Support**: Add support for mobile deep linking
