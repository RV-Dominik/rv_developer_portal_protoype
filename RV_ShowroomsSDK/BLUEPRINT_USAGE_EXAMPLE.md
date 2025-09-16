# Blueprint Usage Example for Deep Link Protocol Registration

This guide shows how to use the deep link protocol registration functions in Blueprint.

## Automatic Registration (Default)

The deep link protocol is **automatically registered** when the game starts. No Blueprint setup required! The subsystem will:

1. **Auto-register** the `rvshowroom://` protocol on startup
2. **Handle deep links** automatically when received
3. **Log status** to the output log

## Manual Control (Optional)

If you want manual control over protocol registration:

1. **Get the Showrooms Subsystem**: Use "Get Readyverse Showrooms Subsystem" node
2. **Check if Protocol is Registered**: Call "Is Deep Link Protocol Registered"
3. **Register if Needed**: If not registered, call "Register Deep Link Protocol"

## Example Blueprint Flow

### 1. Game Startup Check

```
Event BeginPlay
    ↓
Get Readyverse Showrooms Subsystem
    ↓
Is Deep Link Protocol Registered
    ↓
Branch (Is Registered?)
    ├─ True: Show "Protocol Ready" Message
    └─ False: Register Deep Link Protocol
                ↓
            Branch (Registration Success?)
                ├─ True: Show "Protocol Registered" Message
                └─ False: Show "Registration Failed" Message
```

### 2. Settings Menu Integration

```
Settings Button Clicked
    ↓
Get Readyverse Showrooms Subsystem
    ↓
Is Deep Link Protocol Registered
    ↓
Branch (Is Registered?)
    ├─ True: Show "Unregister Protocol" Button
    └─ False: Show "Register Protocol" Button
```

### 3. Protocol Management

#### Register Protocol
```
Register Button Clicked
    ↓
Get Readyverse Showrooms Subsystem
    ↓
Register Deep Link Protocol
    ↓
Branch (Success?)
    ├─ True: Show Success Message + Refresh UI
    └─ False: Show Error Message
```

#### Unregister Protocol
```
Unregister Button Clicked
    ↓
Get Readyverse Showrooms Subsystem
    ↓
Unregister Deep Link Protocol
    ↓
Branch (Success?)
    ├─ True: Show Success Message + Refresh UI
    └─ False: Show Error Message
```

## Blueprint Node Details

### Register Deep Link Protocol
- **Input**: None
- **Output**: Boolean (Success)
- **Description**: Registers the `rvshowroom://` protocol with Windows
- **Requires**: Administrator privileges (handled automatically)

### Unregister Deep Link Protocol
- **Input**: None
- **Output**: Boolean (Success)
- **Description**: Removes the `rvshowroom://` protocol from Windows
- **Requires**: Administrator privileges (handled automatically)

### Is Deep Link Protocol Registered
- **Input**: None
- **Output**: Boolean (Is Registered)
- **Description**: Checks if the protocol is currently registered
- **No privileges required**

## Error Handling

The functions will log detailed error messages to the Unreal Engine output log. Common issues:

1. **Permission Denied**: User needs to run as Administrator
2. **Path Not Found**: Game executable path is invalid
3. **PowerShell Execution**: PowerShell execution policy blocks the script

## Testing

After registration, test the deep link:

1. Open Command Prompt
2. Run: `start rvshowroom://open?projectId=test123&action=open_showroom`
3. Verify the game launches and receives the parameters

## UI Integration Example

### Settings Widget Blueprint

```
Widget Blueprint: DeepLinkSettings
├─ Text: "Deep Link Protocol Status"
├─ Text: "Status: [Dynamic]"
├─ Button: "Register Protocol" (Visible when not registered)
├─ Button: "Unregister Protocol" (Visible when registered)
└─ Button: "Test Deep Link" (Always visible)
```

### Dynamic Status Update

```
Event Construct
    ↓
Get Readyverse Showrooms Subsystem
    ↓
Is Deep Link Protocol Registered
    ↓
Branch (Is Registered?)
    ├─ True: Set Status Text "Registered" + Show Unregister Button
    └─ False: Set Status Text "Not Registered" + Show Register Button
```

## Advanced Usage

### Auto-Registration on First Launch

```
Event BeginPlay
    ↓
Get Readyverse Showrooms Subsystem
    ↓
Is Deep Link Protocol Registered
    ↓
Branch (Is Registered?)
    ├─ True: Continue Normal Startup
    └─ False: Show Registration Dialog
                ↓
            User Clicks "Register"
                ↓
            Register Deep Link Protocol
                ↓
            Branch (Success?)
                ├─ True: Continue Normal Startup
                └─ False: Show Error + Continue Anyway
```

### Periodic Status Check

```
Timer (Every 30 seconds)
    ↓
Get Readyverse Showrooms Subsystem
    ↓
Is Deep Link Protocol Registered
    ↓
Update UI Status
```

## Troubleshooting

### Common Issues

1. **"Failed to register deep link protocol"**
   - Solution: Run the game as Administrator
   - Check Windows Event Viewer for detailed errors

2. **"Protocol not found" when checking status**
   - Solution: Protocol was never registered or was unregistered
   - Use "Register Deep Link Protocol" to fix

3. **"PowerShell execution policy" error**
   - Solution: The system blocks PowerShell scripts
   - User needs to change execution policy or run as Administrator

### Debug Information

All operations log detailed information to the Unreal Engine output log:

```
LogTemp: Log: Registering deep link protocol: rvshowroom
LogTemp: Log: Game executable: C:\Path\To\Your\Game.exe
LogTemp: Log: Deep link protocol registered successfully
```

## Best Practices

1. **Check Before Registering**: Always check if protocol is already registered
2. **Handle Errors Gracefully**: Show user-friendly error messages
3. **Provide Fallback**: Allow game to work even if protocol registration fails
4. **User Choice**: Let users decide whether to register the protocol
5. **Clear Instructions**: Explain what the protocol does and why it's needed
