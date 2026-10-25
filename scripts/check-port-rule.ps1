# PreToolUse hook: 既定ポート(8080/5173)以外を指定してサーバーを起動するコマンドをブロックする。
# stdin に hook の JSON が渡される。exit 2 でブロック（stderr がClaudeに返る）。
$payload = [Console]::In.ReadToEnd() | ConvertFrom-Json
$command = [string]$payload.tool_input.command

$pattern = '(--port\b|\s-p\s+\d|--server\.port|-Dserver\.port|SERVER_PORT|\bPORT\s*=|--strictPort\s+false|--no-strictPort)'
if ($command -match $pattern) {
    [Console]::Error.WriteLine('ポート指定でのサーバー起動は禁止です。backend=8080 / frontend=5173 の既定ポートで起動してください。' +
        '競合時は scripts/stop-servers.ps1 で占有プロセスを停止し、scripts/start-servers.ps1 で起動します（CLAUDE.md 7章）。')
    exit 2
}
exit 0
