<#
.SYNOPSIS
  Install agent-mail scripts and skills for every project, for Claude Code and Codex.

  ~/.agent-mail/bin/           mail scripts (shared)
  ~/.claude/skills/<skill>/    Claude Code user skills
  ~/.agents/skills/<skill>/    Codex user skills
  ~/.claude/CLAUDE.md, ~/.codex/AGENTS.md   global instruction block (between markers)

  Re-run after editing the sources; it overwrites the installed copies.
#>
[CmdletBinding()]
param(
    [switch]$SkipGlobalInstructions,
    # .env holding GMAIL_ADDRESS / GMAIL_APP_PASSWORD / RECEIVER_ADDRESS; recorded in ~/.agent-mail/config.json.
    [string]$EnvFile,
    # Mail at a usage window's reset only when its usage reached this percentage.
    [ValidateRange(1, 100)][int]$RateLimitThreshold,
    # Do not register the rate-limit watcher task / Claude Code status line.
    [switch]$SkipRateLimitWatcher
)

$ErrorActionPreference = 'Stop'
$userHome = [Environment]::GetFolderPath('UserProfile')
$src = $PSScriptRoot
$skills = 'approval-mail', 'rate-limit-reset-mail'

$binDir = Join-Path $userHome '.agent-mail\bin'
New-Item -ItemType Directory -Force -Path $binDir | Out-Null
Copy-Item -Force -Path (Join-Path $src 'bin\*.ps1') -Destination $binDir
Write-Output "scripts -> $binDir"

foreach ($root in (Join-Path $userHome '.claude\skills'), (Join-Path $userHome '.agents\skills')) {
    foreach ($skill in $skills) {
        $dest = Join-Path $root $skill
        New-Item -ItemType Directory -Force -Path $dest | Out-Null
        Copy-Item -Force -Recurse -Path (Join-Path $src "skills\$skill\*") -Destination $dest
        Write-Output "skill  -> $dest"
    }
}

if (-not $SkipGlobalInstructions) {
    $begin = '<!-- agent-mail:begin -->'
    $end = '<!-- agent-mail:end -->'
    $block = @"
$begin
## 通知メール（agent-mail）

- 人間の承認や判断を待って作業が止まる直前（承認ゲート、権限昇格、push/PR/deploy/削除などの外部・破壊的操作、要件判断の質問）には、``approval-mail`` スキルでユーザーにメールを送ってから承認を求める。
- レートリミット・使用量上限に達した、またはその解除時刻が分かったときは、``rate-limit-reset-mail`` スキルで解除時刻に通知メールを予約する。
- メールに秘密情報・個人情報・ユーザー文書の中身を書かない。メールは承認の代わりにならない。
$end
"@
    foreach ($file in (Join-Path $userHome '.claude\CLAUDE.md'), (Join-Path $userHome '.codex\AGENTS.md')) {
        $current = if (Test-Path $file) { Get-Content -Raw -Encoding utf8 -Path $file } else { '' }
        if ($null -eq $current) { $current = '' }
        $pattern = [regex]::Escape($begin) + '[\s\S]*?' + [regex]::Escape($end)
        $updated = if ($current -match $pattern) {
            [regex]::Replace($current, $pattern, { $block.TrimEnd() })
        } else {
            ($current.TrimEnd() + "`n`n" + $block).TrimStart()
        }
        Set-Content -Encoding utf8 -NoNewline -Path $file -Value ($updated.TrimEnd() + "`n")
        Write-Output "rules  -> $file"
    }
}

$configPath = Join-Path $userHome '.agent-mail\config.json'
$config = if (Test-Path $configPath) { Get-Content -Raw -Encoding utf8 -Path $configPath | ConvertFrom-Json -AsHashtable } else { @{} }
if ($EnvFile) {
    # Only the path is stored; the .env itself is read at send time.
    $config.envFile = (Resolve-Path $EnvFile).Path
}
if ($RateLimitThreshold) { $config.rateLimitThreshold = $RateLimitThreshold }
if ($EnvFile -or $RateLimitThreshold) {
    $config | ConvertTo-Json | Set-Content -Encoding utf8 -Path $configPath
    Write-Output "config -> $configPath"
}

if (-not $SkipRateLimitWatcher) {
    $pwsh = (Get-Command pwsh).Source
    $watcher = Join-Path $binDir 'watch-rate-limits.ps1'
    # conhost --headless keeps the console window from flashing every run.
    $action = New-ScheduledTaskAction -Execute 'conhost.exe' `
        -Argument "--headless `"$pwsh`" -NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$watcher`""
    $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 10)
    $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
        -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 5)
    Register-ScheduledTask -Force -TaskPath '\AgentMail\' -TaskName 'AgentMail-RateLimitWatcher' `
        -Action $action -Trigger $trigger -Settings $settings `
        -Description 'Schedule agent mails at Claude Code / Codex usage resets above the threshold' | Out-Null
    Write-Output 'task   -> \AgentMail\AgentMail-RateLimitWatcher (every 10 min)'

    # Claude Code exposes plan usage only to the status line; keep any status line the user already has.
    $settingsPath = Join-Path $userHome '.claude\settings.json'
    $claudeSettings = if (Test-Path $settingsPath) { Get-Content -Raw -Encoding utf8 -Path $settingsPath | ConvertFrom-Json -AsHashtable } else { @{} }
    $statusCommand = "pwsh -NoProfile -File `"$(Join-Path $binDir 'claude-statusline.ps1')`""
    if (-not $claudeSettings.statusLine -or $claudeSettings.statusLine.command -like '*claude-statusline.ps1*') {
        $claudeSettings.statusLine = @{ type = 'command'; command = $statusCommand }
        $claudeSettings | ConvertTo-Json -Depth 20 | Set-Content -Encoding utf8 -Path $settingsPath
        Write-Output "status -> $settingsPath"
    }
    else {
        Write-Output "WARN: $settingsPath already has a statusLine; Claude Code usage is not watched."
        Write-Output "      Make it also run: $statusCommand"
    }
}

if (-not $EnvFile -and -not $config.envFile -and -not (Test-Path (Join-Path $userHome '.agent-mail\smtp-password.dat'))) {
    Write-Output ''
    Write-Output "Next: run this yourself to set the mail account (asks for the SMTP password):"
    Write-Output "  pwsh -File `"$binDir\configure-agent-mail.ps1`""
}
