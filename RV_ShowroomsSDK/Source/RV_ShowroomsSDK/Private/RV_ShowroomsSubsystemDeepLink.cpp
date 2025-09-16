#include "RV_ShowroomsSubsystem.h"
#include "HAL/PlatformProcess.h"
#include "Misc/Paths.h"
#include "Misc/FileHelper.h"

bool URV_ShowroomsSubsystem::RegisterDeepLinkProtocol()
{
#if PLATFORM_WINDOWS
	FString ProtocolName = TEXT("rvshowroom");
	FString ProtocolDescription = TEXT("Readyverse Showroom Protocol");
	
	// Get the current executable path
	FString GameExecutablePath = FPlatformProcess::ExecutablePath();
	if (GameExecutablePath.IsEmpty())
	{
		UE_LOG(LogTemp, Error, TEXT("Failed to get executable path"));
		return false;
	}
	
	// Convert to absolute path
	GameExecutablePath = FPaths::ConvertRelativePathToFull(GameExecutablePath);
	
	UE_LOG(LogTemp, Log, TEXT("Registering deep link protocol: %s"), *ProtocolName);
	UE_LOG(LogTemp, Log, TEXT("Game executable: %s"), *GameExecutablePath);
	
	// Create PowerShell script content
	FString PowerShellScript = FString::Printf(TEXT(
		"# Auto-generated script to register rvshowroom:// protocol\n"
		"$ProtocolName = '%s'\n"
		"$ProtocolDescription = '%s'\n"
		"$GameExecutablePath = '%s'\n"
		"\n"
		"try {\n"
		"    # Create the protocol key\n"
		"    $protocolKey = \"HKLM:\\SOFTWARE\\Classes\\$ProtocolName\"\n"
		"    New-Item -Path $protocolKey -Force | Out-Null\n"
		"    Set-ItemProperty -Path $protocolKey -Name \"(Default)\" -Value \"URL:$ProtocolDescription\"\n"
		"    Set-ItemProperty -Path $protocolKey -Name \"URL Protocol\" -Value \"\"\n"
		"\n"
		"    # Create DefaultIcon key\n"
		"    $iconKey = \"$protocolKey\\DefaultIcon\"\n"
		"    New-Item -Path $iconKey -Force | Out-Null\n"
		"    Set-ItemProperty -Path $iconKey -Name \"(Default)\" -Value \"$GameExecutablePath,0\"\n"
		"\n"
		"    # Create shell\\open\\command key\n"
		"    $commandKey = \"$protocolKey\\shell\\open\\command\"\n"
		"    New-Item -Path $commandKey -Force | Out-Null\n"
		"    Set-ItemProperty -Path $commandKey -Name \"(Default)\" -Value \"`\"$GameExecutablePath`\" `\"%%1`\"\"\n"
		"\n"
		"    Write-Host \"Deep link protocol registered successfully!\" -ForegroundColor Green\n"
		"    exit 0\n"
		"} catch {\n"
		"    Write-Error \"Failed to register deep link protocol: $($_.Exception.Message)\"\n"
		"    exit 1\n"
		"}\n"
	), *ProtocolName, *ProtocolDescription, *GameExecutablePath);
	
	// Write PowerShell script to temporary file
	FString TempScriptPath = FPaths::CreateTempFilename(*FPaths::ProjectSavedDir(), TEXT("RegisterDeepLink"), TEXT(".ps1"));
	if (!FFileHelper::SaveStringToFile(PowerShellScript, *TempScriptPath))
	{
		UE_LOG(LogTemp, Error, TEXT("Failed to create temporary PowerShell script"));
		return false;
	}
	
	// Execute PowerShell script as Administrator
	FString PowerShellCommand = FString::Printf(TEXT("Start-Process powershell -ArgumentList \"-ExecutionPolicy Bypass -File \\\"%s\\\"\" -Verb RunAs -Wait"), *TempScriptPath);
	
	FString CommandLine = FString::Printf(TEXT("powershell -Command \"%s\""), *PowerShellCommand);
	
	UE_LOG(LogTemp, Log, TEXT("Executing: %s"), *CommandLine);
	
	int32 ReturnCode = 0;
	FString StdOut, StdErr;
	bool bSuccess = FPlatformProcess::ExecProcess(*CommandLine, &ReturnCode, &StdOut, &StdErr);
	
	// Clean up temporary file
	IFileManager::Get().Delete(*TempScriptPath);
	
	if (bSuccess && ReturnCode == 0)
	{
		UE_LOG(LogTemp, Log, TEXT("Deep link protocol registered successfully"));
		return true;
	}
	else
	{
		UE_LOG(LogTemp, Error, TEXT("Failed to register deep link protocol. Return code: %d"), ReturnCode);
		UE_LOG(LogTemp, Error, TEXT("StdOut: %s"), *StdOut);
		UE_LOG(LogTemp, Error, TEXT("StdErr: %s"), *StdErr);
		return false;
	}
#else
	UE_LOG(LogTemp, Warning, TEXT("Deep link protocol registration is only supported on Windows"));
	return false;
#endif
}

bool URV_ShowroomsSubsystem::UnregisterDeepLinkProtocol()
{
#if PLATFORM_WINDOWS
	FString ProtocolName = TEXT("rvshowroom");
	
	UE_LOG(LogTemp, Log, TEXT("Unregistering deep link protocol: %s"), *ProtocolName);
	
	// Create PowerShell script content
	FString PowerShellScript = FString::Printf(TEXT(
		"# Auto-generated script to unregister rvshowroom:// protocol\n"
		"$ProtocolName = '%s'\n"
		"\n"
		"try {\n"
		"    $protocolKey = \"HKLM:\\SOFTWARE\\Classes\\$ProtocolName\"\n"
		"    if (Test-Path $protocolKey) {\n"
		"        Remove-Item -Path $protocolKey -Recurse -Force\n"
		"        Write-Host \"Deep link protocol unregistered successfully!\" -ForegroundColor Green\n"
		"    } else {\n"
		"        Write-Host \"Protocol not found, nothing to unregister\" -ForegroundColor Yellow\n"
		"    }\n"
		"    exit 0\n"
		"} catch {\n"
		"    Write-Error \"Failed to unregister deep link protocol: $($_.Exception.Message)\"\n"
		"    exit 1\n"
		"}\n"
	), *ProtocolName);
	
	// Write PowerShell script to temporary file
	FString TempScriptPath = FPaths::CreateTempFilename(*FPaths::ProjectSavedDir(), TEXT("UnregisterDeepLink"), TEXT(".ps1"));
	if (!FFileHelper::SaveStringToFile(PowerShellScript, *TempScriptPath))
	{
		UE_LOG(LogTemp, Error, TEXT("Failed to create temporary PowerShell script"));
		return false;
	}
	
	// Execute PowerShell script as Administrator
	FString PowerShellCommand = FString::Printf(TEXT("Start-Process powershell -ArgumentList \"-ExecutionPolicy Bypass -File \\\"%s\\\"\" -Verb RunAs -Wait"), *TempScriptPath);
	
	FString CommandLine = FString::Printf(TEXT("powershell -Command \"%s\""), *PowerShellCommand);
	
	UE_LOG(LogTemp, Log, TEXT("Executing: %s"), *CommandLine);
	
	int32 ReturnCode = 0;
	FString StdOut, StdErr;
	bool bSuccess = FPlatformProcess::ExecProcess(*CommandLine, &ReturnCode, &StdOut, &StdErr);
	
	// Clean up temporary file
	IFileManager::Get().Delete(*TempScriptPath);
	
	if (bSuccess && ReturnCode == 0)
	{
		UE_LOG(LogTemp, Log, TEXT("Deep link protocol unregistered successfully"));
		return true;
	}
	else
	{
		UE_LOG(LogTemp, Error, TEXT("Failed to unregister deep link protocol. Return code: %d"), ReturnCode);
		UE_LOG(LogTemp, Error, TEXT("StdOut: %s"), *StdOut);
		UE_LOG(LogTemp, Error, TEXT("StdErr: %s"), *StdErr);
		return false;
	}
#else
	UE_LOG(LogTemp, Warning, TEXT("Deep link protocol registration is only supported on Windows"));
	return false;
#endif
}

bool URV_ShowroomsSubsystem::IsDeepLinkProtocolRegistered()
{
#if PLATFORM_WINDOWS
	FString ProtocolName = TEXT("rvshowroom");
	
	// Create PowerShell script to check if protocol exists
	FString PowerShellScript = FString::Printf(TEXT(
		"$ProtocolName = '%s'\n"
		"$protocolKey = \"HKLM:\\SOFTWARE\\Classes\\$ProtocolName\"\n"
		"if (Test-Path $protocolKey) {\n"
		"    Write-Host \"true\"\n"
		"    exit 0\n"
		"} else {\n"
		"    Write-Host \"false\"\n"
		"    exit 0\n"
		"}\n"
	), *ProtocolName);
	
	// Write PowerShell script to temporary file
	FString TempScriptPath = FPaths::CreateTempFilename(*FPaths::ProjectSavedDir(), TEXT("CheckDeepLink"), TEXT(".ps1"));
	if (!FFileHelper::SaveStringToFile(PowerShellScript, *TempScriptPath))
	{
		UE_LOG(LogTemp, Error, TEXT("Failed to create temporary PowerShell script"));
		return false;
	}
	
	// Execute PowerShell script
	FString CommandLine = FString::Printf(TEXT("powershell -ExecutionPolicy Bypass -File \"%s\""), *TempScriptPath);
	
	int32 ReturnCode = 0;
	FString StdOut, StdErr;
	bool bSuccess = FPlatformProcess::ExecProcess(*CommandLine, &ReturnCode, &StdOut, &StdErr);
	
	// Clean up temporary file
	IFileManager::Get().Delete(*TempScriptPath);
	
	if (bSuccess && ReturnCode == 0)
	{
		bool bIsRegistered = StdOut.TrimStartAndEnd().ToLower() == TEXT("true");
		UE_LOG(LogTemp, Log, TEXT("Deep link protocol registered: %s"), bIsRegistered ? TEXT("Yes") : TEXT("No"));
		return bIsRegistered;
	}
	else
	{
		UE_LOG(LogTemp, Error, TEXT("Failed to check deep link protocol status. Return code: %d"), ReturnCode);
		return false;
	}
#else
	UE_LOG(LogTemp, Warning, TEXT("Deep link protocol checking is only supported on Windows"));
	return false;
#endif
}
