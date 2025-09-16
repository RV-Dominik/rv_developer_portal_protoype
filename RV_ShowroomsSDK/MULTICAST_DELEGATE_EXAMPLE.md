# Multicast Delegate Usage Example for Showroom Loading

This guide shows how to use the new multicast delegate system for showroom loading events.

## Overview

The SDK now provides a multicast delegate `OnShowroomLoaded` that broadcasts when a showroom is successfully loaded or fails to load. This allows multiple systems to listen for showroom load events without tight coupling.

## Available Events

### OnShowroomLoaded
- **Type**: Multicast Delegate
- **Parameters**: 
  - `bool bSuccess` - Whether the showroom loaded successfully
  - `FRV_ShowroomDetails Showroom` - The loaded showroom data (empty if failed)
  - `FString Error` - Error message if loading failed
- **Usage**: Bind multiple functions to this event

### OnDeepLinkReceived
- **Type**: Multicast Delegate  
- **Parameters**:
  - `FString DeepLinkUrl` - The received deep link URL
- **Usage**: React to deep link events

## Blueprint Usage Examples

### 1. Basic Showroom Load Listener

```
Event BeginPlay
    ↓
Get Readyverse Showrooms Subsystem
    ↓
Bind Event to On Showroom Loaded
    ↓
Custom Event: OnShowroomLoaded
    ├─ Branch (bSuccess?)
    │   ├─ True: Show Success UI + Configure Showroom
    │   └─ False: Show Error UI + Log Error
```

### 2. Multiple Systems Listening

```
System A (UI Manager):
    Bind to OnShowroomLoaded
    → Update UI with showroom data
    → Show loading/success/error states

System B (Audio Manager):
    Bind to OnShowroomLoaded
    → Play appropriate audio
    → Set ambient sounds based on showroom

System C (Lighting Manager):
    Bind to OnShowroomLoaded
    → Apply lighting based on showroom tier
    → Set lighting color from deep link parameters
```

### 3. Deep Link Integration

```
Event BeginPlay
    ↓
Get Readyverse Showrooms Subsystem
    ↓
Bind Event to On Deep Link Received
    ↓
Bind Event to On Showroom Loaded
    ↓
Custom Event: OnDeepLinkReceived
    ↓
Handle Deep Link (with callback)
    ↓
Custom Event: OnShowroomLoaded
    ↓
Apply Deep Link Parameters to Showroom
```

## C++ Usage Examples

### 1. Basic Listener

```cpp
// In your class constructor or BeginPlay
URV_ShowroomsSubsystem* ShowroomSubsystem = GetGameInstance()->GetSubsystem<URV_ShowroomsSubsystem>();
if (ShowroomSubsystem)
{
    // Bind to the multicast delegate
    ShowroomSubsystem->OnShowroomLoaded.AddDynamic(this, &AMyClass::OnShowroomLoaded);
}

// Implementation
void AMyClass::OnShowroomLoaded(bool bSuccess, const FRV_ShowroomDetails& Showroom, const FString& Error)
{
    if (bSuccess)
    {
        UE_LOG(LogTemp, Log, TEXT("Showroom loaded: %s"), *Showroom.name);
        // Configure your showroom with the loaded data
        ConfigureShowroom(Showroom);
    }
    else
    {
        UE_LOG(LogTemp, Error, TEXT("Failed to load showroom: %s"), *Error);
        // Show error UI or handle failure
        ShowErrorUI(Error);
    }
}
```

### 2. Multiple Listeners

```cpp
// UI Manager
void AUIManager::BeginPlay()
{
    Super::BeginPlay();
    
    URV_ShowroomsSubsystem* Subsystem = GetGameInstance()->GetSubsystem<URV_ShowroomsSubsystem>();
    if (Subsystem)
    {
        Subsystem->OnShowroomLoaded.AddDynamic(this, &AUIManager::OnShowroomLoaded);
    }
}

void AUIManager::OnShowroomLoaded(bool bSuccess, const FRV_ShowroomDetails& Showroom, const FString& Error)
{
    if (bSuccess)
    {
        UpdateShowroomUI(Showroom);
        HideLoadingScreen();
    }
    else
    {
        ShowErrorDialog(Error);
    }
}

// Audio Manager
void AAudioManager::BeginPlay()
{
    Super::BeginPlay();
    
    URV_ShowroomsSubsystem* Subsystem = GetGameInstance()->GetSubsystem<URV_ShowroomsSubsystem>();
    if (Subsystem)
    {
        Subsystem->OnShowroomLoaded.AddDynamic(this, &AAudioManager::OnShowroomLoaded);
    }
}

void AAudioManager::OnShowroomLoaded(bool bSuccess, const FRV_ShowroomDetails& Showroom, const FString& Error)
{
    if (bSuccess)
    {
        PlayShowroomMusic(Showroom.genre);
        SetAmbientSounds(Showroom.showroomTier);
    }
}
```

### 3. Deep Link Integration

```cpp
void AShowroomManager::BeginPlay()
{
    Super::BeginPlay();
    
    URV_ShowroomsSubsystem* Subsystem = GetGameInstance()->GetSubsystem<URV_ShowroomsSubsystem>();
    if (Subsystem)
    {
        // Listen for deep links
        Subsystem->OnDeepLinkReceived.AddDynamic(this, &AShowroomManager::OnDeepLinkReceived);
        
        // Listen for showroom loads
        Subsystem->OnShowroomLoaded.AddDynamic(this, &AShowroomManager::OnShowroomLoaded);
    }
}

void AShowroomManager::OnDeepLinkReceived(const FString& DeepLinkUrl)
{
    UE_LOG(LogTemp, Log, TEXT("Deep link received: %s"), *DeepLinkUrl);
    
    // The subsystem will automatically load the showroom
    // and trigger OnShowroomLoaded when complete
}

void AShowroomManager::OnShowroomLoaded(bool bSuccess, const FRV_ShowroomDetails& Showroom, const FString& Error)
{
    if (bSuccess)
    {
        // Apply deep link parameters if available
        ApplyDeepLinkParameters();
        
        // Configure the showroom
        ConfigureShowroom(Showroom);
        
        // Load the showroom level
        LoadShowroomLevel();
    }
    else
    {
        ShowError(Error);
    }
}
```

## Advanced Usage Patterns

### 1. Conditional Binding

```cpp
void AMyClass::BindToShowroomEvents()
{
    URV_ShowroomsSubsystem* Subsystem = GetGameInstance()->GetSubsystem<URV_ShowroomsSubsystem>();
    if (Subsystem)
    {
        // Only bind if not already bound
        if (!OnShowroomLoadedHandle.IsValid())
        {
            OnShowroomLoadedHandle = Subsystem->OnShowroomLoaded.AddDynamic(this, &AMyClass::OnShowroomLoaded);
        }
    }
}

void AMyClass::UnbindFromShowroomEvents()
{
    URV_ShowroomsSubsystem* Subsystem = GetGameInstance()->GetSubsystem<URV_ShowroomsSubsystem>();
    if (Subsystem && OnShowroomLoadedHandle.IsValid())
    {
        Subsystem->OnShowroomLoaded.Remove(OnShowroomLoadedHandle);
        OnShowroomLoadedHandle.Reset();
    }
}
```

### 2. Lambda Bindings

```cpp
void AMyClass::SetupShowroomListener()
{
    URV_ShowroomsSubsystem* Subsystem = GetGameInstance()->GetSubsystem<URV_ShowroomsSubsystem>();
    if (Subsystem)
    {
        // Using lambda for simple handling
        Subsystem->OnShowroomLoaded.AddLambda([this](bool bSuccess, const FRV_ShowroomDetails& Showroom, const FString& Error)
        {
            if (bSuccess)
            {
                UE_LOG(LogTemp, Log, TEXT("Showroom loaded via lambda: %s"), *Showroom.name);
                // Handle success
            }
            else
            {
                UE_LOG(LogTemp, Error, TEXT("Showroom load failed via lambda: %s"), *Error);
                // Handle error
            }
        });
    }
}
```

### 3. Event Chaining

```cpp
void AShowroomController::OnShowroomLoaded(bool bSuccess, const FRV_ShowroomDetails& Showroom, const FString& Error)
{
    if (bSuccess)
    {
        // Chain to other systems
        UIManager->OnShowroomDataReceived(Showroom);
        AudioManager->OnShowroomDataReceived(Showroom);
        LightingManager->OnShowroomDataReceived(Showroom);
        
        // Load the actual showroom level
        LoadShowroomLevel(Showroom);
    }
    else
    {
        // Handle error across all systems
        UIManager->OnShowroomLoadFailed(Error);
        AudioManager->OnShowroomLoadFailed(Error);
        LightingManager->OnShowroomLoadFailed(Error);
    }
}
```

## Best Practices

1. **Always check for null**: Verify the subsystem exists before binding
2. **Unbind when done**: Remove bindings in destructors or when no longer needed
3. **Handle errors gracefully**: Always check the `bSuccess` parameter
4. **Use appropriate scope**: Bind in `BeginPlay` or constructor, unbind in `EndPlay` or destructor
5. **Avoid tight coupling**: Use the multicast delegate instead of direct function calls
6. **Log appropriately**: Use appropriate log levels for success/failure cases

## Troubleshooting

### Common Issues

1. **Delegate not firing**: Check if the subsystem is properly initialized
2. **Multiple bindings**: Ensure you're not binding the same function multiple times
3. **Memory leaks**: Always unbind delegates when objects are destroyed
4. **Timing issues**: Bind delegates before calling functions that might trigger them

### Debug Tips

```cpp
// Add debug logging to see when delegates are bound/unbound
void AMyClass::BindToShowroomEvents()
{
    URV_ShowroomsSubsystem* Subsystem = GetGameInstance()->GetSubsystem<URV_ShowroomsSubsystem>();
    if (Subsystem)
    {
        UE_LOG(LogTemp, Log, TEXT("Binding to OnShowroomLoaded delegate"));
        Subsystem->OnShowroomLoaded.AddDynamic(this, &AMyClass::OnShowroomLoaded);
    }
    else
    {
        UE_LOG(LogTemp, Error, TEXT("Showroom subsystem not found!"));
    }
}
```


