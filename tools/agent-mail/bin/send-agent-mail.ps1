<#
.SYNOPSIS
  Send a short notification mail from Claude Code / Codex sessions.

.DESCRIPTION
  Settings come from ~/.agent-mail/config.json (written by configure-agent-mail.ps1).
  The SMTP password is read from $env:AGENT_MAIL_SMTP_PASSWORD, or from the
  DPAPI-encrypted ~/.agent-mail/smtp-password.dat (decryptable only by this
  Windows user on this machine).

.EXAMPLE
  pwsh -NoProfile -File send-agent-mail.ps1 -Subject "承認待ち" -Body "npm install の実行承認が必要です"

.EXAMPLE
  pwsh -NoProfile -File send-agent-mail.ps1 -MessageFile ~/.agent-mail/queue/abc.json -UnregisterTask AgentMail-abc
#>
[CmdletBinding()]
param(
    [string]$Subject,
    [string]$Body,
    # JSON file with { subject, body, dryRun } written by schedule-agent-mail.ps1.
    [string]$MessageFile,
    # Scheduled task to remove after sending (used by one-shot scheduled mails).
    [string]$UnregisterTask,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$home_ = [Environment]::GetFolderPath('UserProfile')
$baseDir = Join-Path $home_ '.agent-mail'
$configPath = Join-Path $baseDir 'config.json'
$passwordPath = Join-Path $baseDir 'smtp-password.dat'
$logPath = Join-Path $baseDir 'mail.log'

function Write-AgentMailLog([string]$message) {
    New-Item -ItemType Directory -Force -Path $baseDir | Out-Null
    # Log only metadata, never the body.
    Add-Content -Path $logPath -Value ("{0:yyyy-MM-dd HH:mm:ss} {1}" -f (Get-Date), $message) -Encoding utf8
}

try {
    if ($MessageFile) {
        $msg = Get-Content -Raw -Encoding utf8 -Path $MessageFile | ConvertFrom-Json
        if (-not $Subject) { $Subject = $msg.subject }
        if (-not $Body) { $Body = $msg.body }
        if ($msg.dryRun) { $DryRun = $true }
    }
    if (-not $Subject) { throw 'Subject is required (-Subject or -MessageFile).' }
    if (-not $Body) { $Body = $Subject }

    $hostName = [Environment]::MachineName
    $Subject = "[agent] $Subject"
    $Body = "$Body`n`n---`nhost: $hostName`nsent: $((Get-Date).ToString('yyyy-MM-dd HH:mm:ss zzz'))"

    if ($DryRun) {
        Write-AgentMailLog "DRYRUN subject=$Subject"
        Write-Output "DRY RUN`nSubject: $Subject`n`n$Body"
    }
    else {
        if (-not (Test-Path $configPath)) {
            throw "Not configured. Run: pwsh -File `"$baseDir\bin\configure-agent-mail.ps1`""
        }
        $config = Get-Content -Raw -Encoding utf8 -Path $configPath | ConvertFrom-Json

        $password = $env:AGENT_MAIL_SMTP_PASSWORD
        if (-not $password -and (Test-Path $passwordPath)) {
            $secure = Get-Content -Path $passwordPath | ConvertTo-SecureString
            $password = [System.Net.NetworkCredential]::new('', $secure).Password
        }
        if (-not $password) { throw 'SMTP password not found (AGENT_MAIL_SMTP_PASSWORD or smtp-password.dat).' }

        $mail = [System.Net.Mail.MailMessage]::new()
        $mail.From = [System.Net.Mail.MailAddress]::new($config.from)
        foreach ($to in @($config.to)) { $mail.To.Add($to) }
        $mail.Subject = $Subject
        $mail.Body = $Body
        $mail.SubjectEncoding = [System.Text.Encoding]::UTF8
        $mail.BodyEncoding = [System.Text.Encoding]::UTF8

        $smtp = [System.Net.Mail.SmtpClient]::new($config.smtpHost, [int]$config.smtpPort)
        $smtp.EnableSsl = $true
        $smtp.Credentials = [System.Net.NetworkCredential]::new($config.smtpUser, $password)
        try { $smtp.Send($mail) } finally { $mail.Dispose(); $smtp.Dispose() }

        Write-AgentMailLog "SENT subject=$Subject"
        Write-Output "Mail sent: $Subject"
    }

    if ($MessageFile) { Remove-Item -Force -Path $MessageFile -ErrorAction SilentlyContinue }
}
catch {
    Write-AgentMailLog "ERROR $($_.Exception.Message)"
    throw
}
finally {
    if ($UnregisterTask) {
        Get-ScheduledTask -TaskName $UnregisterTask -ErrorAction SilentlyContinue |
            Unregister-ScheduledTask -Confirm:$false -ErrorAction SilentlyContinue
    }
}
