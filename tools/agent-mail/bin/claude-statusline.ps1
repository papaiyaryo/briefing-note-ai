# Claude Code status line: records the plan usage windows for watch-rate-limits.ps1
# and shows them, e.g. "5h:42% 7d:13%".
$ErrorActionPreference = 'SilentlyContinue'
$raw = [Console]::In.ReadToEnd()
$data = $raw | ConvertFrom-Json
$limits = $data.rate_limits
if (-not $limits) { return }

$baseDir = Split-Path -Parent $PSScriptRoot  # ~/.agent-mail, from the installed location
New-Item -ItemType Directory -Force -Path $baseDir | Out-Null
[pscustomobject]@{ observed_at = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds(); rate_limits = $limits } |
    ConvertTo-Json -Depth 5 | Set-Content -Encoding utf8 -Path (Join-Path $baseDir 'claude-rate-limits.json')

$parts = @()
if ($null -ne $limits.five_hour.used_percentage) { $parts += "5h:$([math]::Round($limits.five_hour.used_percentage))%" }
if ($null -ne $limits.seven_day.used_percentage) { $parts += "7d:$([math]::Round($limits.seven_day.used_percentage))%" }
Write-Output ($parts -join ' ')
