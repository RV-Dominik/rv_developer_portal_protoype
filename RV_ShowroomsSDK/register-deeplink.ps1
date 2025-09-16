# PowerShell script to register the rvshowroom:// deep link protocol
# Run as Administrator

param(
    [Parameter(Mandatory=$true)]
    [string]$GameExecutablePath,
    
    [string]$ProtocolName = "rvshowroom",
    [string]$ProtocolDescription = "Readyverse Showroom Protocol"
)

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "This script must be run as Administrator to modify the registry."
    exit 1
}

# Validate game executable path
if (-not (Test-Path $GameExecutablePath)) {
    Write-Error "Game executable not found at: $GameExecutablePath"
    exit 1
}

Write-Host "Registering deep link protocol: $ProtocolName" -ForegroundColor Green
Write-Host "Game executable: $GameExecutablePath" -ForegroundColor Yellow

try {
    # Create the protocol key
    $protocolKey = "HKLM:\SOFTWARE\Classes\$ProtocolName"
    New-Item -Path $protocolKey -Force | Out-Null
    Set-ItemProperty -Path $protocolKey -Name "(Default)" -Value "URL:$ProtocolDescription"
    Set-ItemProperty -Path $protocolKey -Name "URL Protocol" -Value ""

    # Create DefaultIcon key
    $iconKey = "$protocolKey\DefaultIcon"
    New-Item -Path $iconKey -Force | Out-Null
    Set-ItemProperty -Path $iconKey -Name "(Default)" -Value "$GameExecutablePath,0"

    # Create shell\open\command key
    $commandKey = "$protocolKey\shell\open\command"
    New-Item -Path $commandKey -Force | Out-Null
    Set-ItemProperty -Path $commandKey -Name "(Default)" -Value "`"$GameExecutablePath`" `"%1`""

    Write-Host "Deep link protocol registered successfully!" -ForegroundColor Green
    Write-Host "You can now use URLs like: $ProtocolName://open?projectId=123&action=open_showroom" -ForegroundColor Cyan
    
    # Test the registration
    Write-Host "`nTesting deep link registration..." -ForegroundColor Yellow
    $testUrl = "$ProtocolName://open?projectId=test123&action=open_showroom&tier=standard&lightingColor=%234A90E2"
    Write-Host "Test URL: $testUrl" -ForegroundColor Gray
    
} catch {
    Write-Error "Failed to register deep link protocol: $($_.Exception.Message)"
    exit 1
}

Write-Host "`nTo unregister the protocol, run:" -ForegroundColor Yellow
Write-Host "Remove-Item -Path '$protocolKey' -Recurse -Force" -ForegroundColor Gray
