Readyverse Showrooms SDK (Unreal Engine)

A lightweight Unreal Engine plugin to consume the Readyverse showroom public API from games.

Features
- GameInstance subsystem `URV_ShowroomsSubsystem` with configurable `ApiBaseUrl`
- List published games/showrooms
- Fetch details for a single showroom by id
- Blueprint delegates for completion/error

Setup
1. Copy `RV_ShowroomsSDK` folder to your project's `Plugins/` or to the Engine `Plugins/`.
2. Enable the plugin in your Unreal project.
3. In your GameInstance (or at runtime), set `ApiBaseUrl`, e.g. `https://rv-developer-portal-prototype.onrender.com`.

Blueprint Usage
- Get Subsystem: `Get Game Instance Subsystem -> RV_ShowroomsSubsystem`.
- Set `ApiBaseUrl` once.
- Bind to `OnListShowroomsCompleted` and call `ListShowrooms`.
- Bind to `OnGetShowroomCompleted` and call `GetShowroomById`.

Notes
- This SDK expects camelCase JSON as provided by the backend.
- No authentication is required for public showroom endpoints.


