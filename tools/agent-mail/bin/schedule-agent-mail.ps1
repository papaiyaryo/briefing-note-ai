<#
.SYNOPSIS
  Schedule a one-shot notification mail with Windows Task Scheduler
  (e.g. at the time an AI rate limit resets).

.EXAMPLE
  pwsh -NoProfile -File schedule-agent-mail.ps1 -At "2026-10-23 23:00" -Subject "Codex のレートリミット解除" -Body "続き: Bolt 2 の U3 テスト"

.EXAMPLE
  pwsh -NoProfile -File schedule-agent-mail.ps1 -InMinutes 150 -Subject "Claude のレートリミット解除"

.EXAMPLE
  pwsh -NoProfile -File schedule-agent-mail.ps1 -List
#>
[CmdletBinding(DefaultParameterSetName = 'At')]
param(
    # Local time understood by [datetime]::Parse, or ISO 8601 with offset.
    [Parameter(ParameterSetName = 'At', Mandatory)][string]$At,
    [Parameter(ParameterSetName = 'In', Mandatory)][double]$InMinutes,
    [Parameter(ParameterSetName = 'At', Mandatory)]
    [Parameter(ParameterSetName = 'In', Mandatory)][string]$Subject,
    [Parameter(ParameterSetName = 'At')]
    [Parameter(ParameterSetName = 'In')][string]$Body,
    # Extra minutes after the reset so the limit is really lifted when the mail arrives.
    [Parameter(ParameterSetName = 'At')]
    [Parameter(ParameterSetName = 'In')][int]$BufferMinutes = 2,
    [Parameter(ParameterSetName = 'At')]
    [Parameter(ParameterSetName = 'In')][switch]$DryRun,
    [Parameter(ParameterSetName = 'List', Mandatory)][switch]$List,
    [Parameter(ParameterSetName = 'Cancel', Mandatory)][string]$Cancel
)

$ErrorActionPreference = 'Stop'
$baseDir = Split-Path -Parent $PSScriptRoot  # ~/.agent-mail, from the installed location
$queueDir = Join-Path $baseDir 'queue'
$sender = Join-Path $baseDir 'bin\send-agent-mail.ps1'
$taskPath = '\AgentMail\'

if ($List) {
    Get-ScheduledTask -TaskPath $taskPath -ErrorAction SilentlyContinue |
        ForEach-Object {
            $trigger = $_.Triggers | Select-Object -First 1
            [pscustomobject]@{ TaskName = $_.TaskName; RunAt = $trigger.StartBoundary; State = $_.State }
        } | Format-Table -AutoSize
    return
}

if ($Cancel) {
    Unregister-ScheduledTask -TaskPath $taskPath -TaskName $Cancel -Confirm:$false
    Remove-Item -Force -Path (Join-Path $queueDir "$Cancel.json") -ErrorAction SilentlyContinue
    Write-Output "Cancelled: $Cancel"
    return
}

$runAt = if ($PSCmdlet.ParameterSetName -eq 'In') { (Get-Date).AddMinutes($InMinutes) } else { [datetime]::Parse($At) }
$runAt = $runAt.AddMinutes($BufferMinutes)
if ($runAt -le (Get-Date)) { throw "Run time $runAt is in the past." }
if (-not (Test-Path $sender)) { throw "Sender not installed: $sender (run install.ps1)" }

$id = 'AgentMail-' + $runAt.ToString('yyyyMMdd-HHmm') + '-' + [guid]::NewGuid().ToString('N').Substring(0, 6)
New-Item -ItemType Directory -Force -Path $queueDir | Out-Null
$messageFile = Join-Path $queueDir "$id.json"
[pscustomobject]@{ subject = $Subject; body = $Body; dryRun = [bool]$DryRun } |
    ConvertTo-Json | Set-Content -Encoding utf8 -Path $messageFile

$pwsh = (Get-Command pwsh -ErrorAction SilentlyContinue)?.Source ?? 'powershell.exe'
$arguments = "--headless `"$pwsh`" -NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$sender`" -MessageFile `"$messageFile`" -UnregisterTask `"$id`""
# conhost --headless keeps the console window from flashing.
$action = New-ScheduledTaskAction -Execute 'conhost.exe' -Argument $arguments
$trigger = New-ScheduledTaskTrigger -Once -At $runAt
# Run even on battery and catch up if the PC was asleep at the scheduled time.
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -WakeToRun
Register-ScheduledTask -TaskPath $taskPath -TaskName $id -Action $action -Trigger $trigger -Settings $settings `
    -Description "One-shot agent mail: $Subject" | Out-Null

Write-Output "Scheduled $id at $($runAt.ToString('yyyy-MM-dd HH:mm:ss zzz'))"
