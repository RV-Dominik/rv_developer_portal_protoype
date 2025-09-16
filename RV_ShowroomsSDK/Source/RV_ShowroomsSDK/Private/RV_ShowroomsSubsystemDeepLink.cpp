#include "RV_ShowroomsSubsystem.h"
#include "HAL/PlatformProcess.h"
#include "Misc/Paths.h"

#if PLATFORM_WINDOWS
#include "Windows/AllowWindowsPlatformTypes.h"
#include "Windows/WindowsHWrapper.h"
#include <winreg.h>
#include "Windows/HideWindowsPlatformTypes.h"
#endif

bool URV_ShowroomsSubsystem::RegisterDeepLinkProtocol()
{
#if PLATFORM_WINDOWS
	FString Protocol = TEXT("rvshowroom");
	FString ExecutablePath = FPaths::ConvertRelativePathToFull(FPlatformProcess::ExecutablePath());
	FString Command = FString::Printf(TEXT("\"%s\" \"%%1\""), *ExecutablePath);

	UE_LOG(LogTemp, Log, TEXT("Registering deep link protocol '%s' to command '%s'"), *Protocol, *Command);

	HKEY hKey;
	LONG lResult;

	// Create HKEY_CLASSES_ROOT\rvshowroom
	lResult = RegCreateKeyEx(HKEY_CLASSES_ROOT, *Protocol, 0, NULL, REG_OPTION_NON_VOLATILE, KEY_ALL_ACCESS, NULL, &hKey, NULL);
	if (lResult != ERROR_SUCCESS)
	{
		UE_LOG(LogTemp, Error, TEXT("Failed to create registry key HKEY_CLASSES_ROOT\\%s. Error: %d"), *Protocol, lResult);
		return false;
	}
	RegSetValueEx(hKey, NULL, 0, REG_SZ, (const BYTE*)TEXT("URL:Readyverse Showroom Protocol"), (Protocol.Len() + 26) * sizeof(TCHAR));
	RegSetValueEx(hKey, TEXT("URL Protocol"), 0, REG_SZ, (const BYTE*)TEXT(""), sizeof(TCHAR)); // Empty string
	RegCloseKey(hKey);

	// Create HKEY_CLASSES_ROOT\rvshowroom\DefaultIcon
	lResult = RegCreateKeyEx(HKEY_CLASSES_ROOT, *(Protocol + TEXT("\\DefaultIcon")), 0, NULL, REG_OPTION_NON_VOLATILE, KEY_ALL_ACCESS, NULL, &hKey, NULL);
	if (lResult != ERROR_SUCCESS)
	{
		UE_LOG(LogTemp, Error, TEXT("Failed to create registry key HKEY_CLASSES_ROOT\\%s\\DefaultIcon. Error: %d"), *Protocol, lResult);
		return false;
	}
	FString DefaultIcon = FString::Printf(TEXT("%s,0"), *ExecutablePath);
	RegSetValueEx(hKey, NULL, 0, REG_SZ, (const BYTE*)*DefaultIcon, (DefaultIcon.Len() + 1) * sizeof(TCHAR));
	RegCloseKey(hKey);

	// Create HKEY_CLASSES_ROOT\rvshowroom\shell\open\command
	lResult = RegCreateKeyEx(HKEY_CLASSES_ROOT, *(Protocol + TEXT("\\shell\\open\\command")), 0, NULL, REG_OPTION_NON_VOLATILE, KEY_ALL_ACCESS, NULL, &hKey, NULL);
	if (lResult != ERROR_SUCCESS)
	{
		UE_LOG(LogTemp, Error, TEXT("Failed to create registry key HKEY_CLASSES_ROOT\\%s\\shell\\open\\command. Error: %d"), *Protocol, lResult);
		return false;
	}
	RegSetValueEx(hKey, NULL, 0, REG_SZ, (const BYTE*)*Command, (Command.Len() + 1) * sizeof(TCHAR));
	RegCloseKey(hKey);

	UE_LOG(LogTemp, Log, TEXT("Deep link protocol '%s' registered successfully."), *Protocol);
	return true;
#else
	UE_LOG(LogTemp, Warning, TEXT("Deep link protocol registration is only supported on Windows."));
	return false;
#endif
}

bool URV_ShowroomsSubsystem::UnregisterDeepLinkProtocol()
{
#if PLATFORM_WINDOWS
	FString Protocol = TEXT("rvshowroom");
	UE_LOG(LogTemp, Log, TEXT("Unregistering deep link protocol '%s'"), *Protocol);

	LONG lResult = RegDeleteTree(HKEY_CLASSES_ROOT, *Protocol);
	if (lResult != ERROR_SUCCESS && lResult != ERROR_FILE_NOT_FOUND)
	{
		UE_LOG(LogTemp, Error, TEXT("Failed to delete registry key HKEY_CLASSES_ROOT\\%s. Error: %d"), *Protocol, lResult);
		return false;
	}

	UE_LOG(LogTemp, Log, TEXT("Deep link protocol '%s' unregistered successfully."), *Protocol);
	return true;
#else
	UE_LOG(LogTemp, Warning, TEXT("Deep link protocol unregistration is only supported on Windows."));
	return false;
#endif
}

bool URV_ShowroomsSubsystem::IsDeepLinkProtocolRegistered()
{
#if PLATFORM_WINDOWS
	FString Protocol = TEXT("rvshowroom");
	HKEY hKey;
	LONG lResult = RegOpenKeyEx(HKEY_CLASSES_ROOT, *Protocol, 0, KEY_READ, &hKey);
	if (lResult == ERROR_SUCCESS)
	{
		RegCloseKey(hKey);
		return true;
	}
	return false;
#else
	return false;
#endif
}