# 既定ポート(backend 8080 / frontend 5173)を占有しているプロセスを停止する。
# ポート番号は固定。引数での変更はできない（DB 5432 などは対象外）。
param(
    [ValidateSet('all', 'backend', 'frontend')]
    [string]$Only = 'all'
)

$ports = @{ backend = 8080; frontend = 5173 }

function Stop-PortOwner([string]$name, [int]$port) {
    $pids = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($procId in $pids) {
        $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
        Write-Host "[$name] port $port is used by PID $procId ($($proc.ProcessName)). Stopping."
        # Gradle/npm 等の子プロセスごと停止する
        & taskkill.exe /PID $procId /T /F | Out-Null
    }
    # 解放待ち（最大15秒）
    for ($i = 0; $i -lt 30; $i++) {
        if (-not (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)) {
            Write-Host "[$name] port $port is free."
            return
        }
        Start-Sleep -Milliseconds 500
    }
    throw "[$name] port $port could not be freed."
}

foreach ($name in $ports.Keys) {
    if ($Only -eq 'all' -or $Only -eq $name) { Stop-PortOwner $name $ports[$name] }
}
