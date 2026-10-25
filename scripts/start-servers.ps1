# backend(8080) と frontend(5173) を既定ポートで起動する。
# ポートが占有されていれば占有プロセスを停止してから起動する。別ポートでの起動はしない。
param(
    [ValidateSet('all', 'backend', 'frontend')]
    [string]$Only = 'all'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $root 'scripts\logs'
New-Item -ItemType Directory -Force $logDir | Out-Null

function Wait-Listening([string]$name, [int]$port, [int]$timeoutSec) {
    for ($i = 0; $i -lt $timeoutSec; $i++) {
        if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) { return }
        Start-Sleep -Seconds 1
    }
    throw "[$name] did not listen on port $port within ${timeoutSec}s. See scripts\logs\$name.log"
}

function Start-Server([string]$name, [int]$port, [string]$dir, [string]$file, [string]$arguments, [int]$timeoutSec) {
    & "$PSScriptRoot\stop-servers.ps1" -Only $name
    $log = Join-Path $logDir "$name.log"
    Start-Process -FilePath $file -ArgumentList $arguments -WorkingDirectory (Join-Path $root $dir) `
        -WindowStyle Hidden -RedirectStandardOutput $log -RedirectStandardError "$log.err" | Out-Null
    Wait-Listening $name $port $timeoutSec
    Write-Host "[$name] started on port $port"
}

if ($Only -eq 'all' -or $Only -eq 'backend') {
    Start-Server 'backend' 8080 'backend' 'cmd.exe' '/c .\gradlew.bat bootRun --args=--spring.profiles.active=dev' 180
    $health = Invoke-WebRequest -UseBasicParsing http://localhost:8080/api/health
    if ($health.StatusCode -ne 200) { throw '[backend] /api/health did not return 200' }
}
if ($Only -eq 'all' -or $Only -eq 'frontend') {
    # vite.config.ts の strictPort により、5173 を取れなければ起動失敗する（退避しない）
    Start-Server 'frontend' 5173 'frontend' 'cmd.exe' '/c npm run dev' 60
}

Write-Host 'backend : http://localhost:8080'
Write-Host 'frontend: http://localhost:5173'
