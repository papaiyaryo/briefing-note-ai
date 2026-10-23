<#
.SYNOPSIS
  Schedule a mail at the reset time of each Claude Code / Codex usage window
  whose usage has reached the threshold. Run every few minutes by the
  \AgentMail\AgentMail-RateLimitWatcher task (see install.ps1).

  Sources:
    Codex       rate_limits in the newest ~/.codex/sessions/**/*.jsonl
    Claude Code ~/.agent-mail/claude-rate-limits.json written by claude-statusline.ps1

  Threshold: rateLimitThreshold in ~/.agent-mail/config.json (default 80 [%]).
#>
[CmdletBinding()]
param([switch]$DryRun)

$ErrorActionPreference = 'Stop'
$userHome = [Environment]::GetFolderPath('UserProfile')
$baseDir = Join-Path $userHome '.agent-mail'
$configPath = Join-Path $baseDir 'config.json'
$statePath = Join-Path $baseDir 'rate-limit-state.json'
$scheduler = Join-Path $baseDir 'bin\schedule-agent-mail.ps1'

$config = if (Test-Path $configPath) { Get-Content -Raw -Encoding utf8 -Path $configPath | ConvertFrom-Json } else { $null }
$threshold = if ($config.rateLimitThreshold) { [double]$config.rateLimitThreshold } else { 80 }

$windows = [System.Collections.Generic.List[object]]::new()
function Add-Window([string]$tool, [string]$name, [double]$used, [long]$resetsAt) {
    $windows.Add([pscustomobject]@{ Tool = $tool; Name = $name; Used = $used; ResetsAt = $resetsAt })
}

# Codex: last rate_limits record in the most recently written session logs.
$codexSessions = Join-Path $userHome '.codex\sessions'
if (Test-Path $codexSessions) {
    $files = Get-ChildItem -Recurse -File -Filter *.jsonl -Path $codexSessions |
        Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-8) } |
        Sort-Object LastWriteTime -Descending | Select-Object -First 5
    foreach ($file in $files) {
        $line = Get-Content -Tail 400 -Encoding utf8 -Path $file.FullName |
            Where-Object { $_ -like '*"rate_limits"*' } | Select-Object -Last 1
        if (-not $line) { continue }
        foreach ($slot in 'primary', 'secondary') {
            if ($line -match ('"' + $slot + '":\{"used_percent":([\d.]+),"window_minutes":(\d+),"resets_at":(\d+)')) {
                $name = if ([int]$Matches[2] -le 300) { '5時間枠' } else { '週の枠' }
                Add-Window 'Codex' $name ([double]$Matches[1]) ([long]$Matches[3])
            }
        }
        break
    }
}

# Claude Code: snapshot from the status line.
$claudeSnapshot = Join-Path $baseDir 'claude-rate-limits.json'
if (Test-Path $claudeSnapshot) {
    $snap = Get-Content -Raw -Encoding utf8 -Path $claudeSnapshot | ConvertFrom-Json
    foreach ($pair in @(@('five_hour', '5時間枠'), @('seven_day', '週の枠'))) {
        $w = $snap.rate_limits.($pair[0])
        if ($w -and $null -ne $w.used_percentage -and $w.resets_at) {
            Add-Window 'Claude Code' $pair[1] ([double]$w.used_percentage) ([long]$w.resets_at)
        }
    }
}

$state = if (Test-Path $statePath) { @(Get-Content -Raw -Encoding utf8 -Path $statePath | ConvertFrom-Json) } else { @() }
$now = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
# Forget windows that reset more than a day ago.
$state = @($state | Where-Object { [long]($_ -split ':')[-1] -gt $now - 86400 })

foreach ($w in $windows) {
    Write-Verbose ("{0} {1}: {2}% resets {3}" -f $w.Tool, $w.Name, $w.Used, [DateTimeOffset]::FromUnixTimeSeconds($w.ResetsAt).LocalDateTime)
    $key = "$($w.Tool):$($w.Name):$($w.ResetsAt)"
    if ($w.Used -lt $threshold -or $w.ResetsAt -le $now -or $state -contains $key) { continue }

    $resetLocal = [DateTimeOffset]::FromUnixTimeSeconds($w.ResetsAt).LocalDateTime
    $subject = "$($w.Tool) の$($w.Name)が更新されました（使用率 $([math]::Round($w.Used))%）"
    $body = "$($w.Tool) の$($w.Name)は $($resetLocal.ToString('M/d HH:mm')) に更新されました。`n" +
        "予約時点の使用率: $([math]::Round($w.Used))%（通知しきい値 $threshold%）`n作業を再開できます。"
    $scheduleArgs = @{ At = $resetLocal.ToString('yyyy-MM-dd HH:mm:ss'); Subject = $subject; Body = $body }
    if ($DryRun) { $scheduleArgs.DryRun = $true }
    & $scheduler @scheduleArgs
    $state += $key
}

New-Item -ItemType Directory -Force -Path $baseDir | Out-Null
ConvertTo-Json -InputObject @($state) | Set-Content -Encoding utf8 -Path $statePath
