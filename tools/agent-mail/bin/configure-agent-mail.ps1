<#
.SYNOPSIS
  Interactive one-time setup for agent mail. Run it yourself in a terminal
  (agents must not run it: it asks for the SMTP password).

  Gmail: create an app password at https://myaccount.google.com/apppasswords
  (requires 2-Step Verification) and enter it as the SMTP password.
#>
[CmdletBinding()]
param(
    [string]$SmtpHost = 'smtp.gmail.com',
    [int]$SmtpPort = 587
)

$ErrorActionPreference = 'Stop'
$baseDir = Split-Path -Parent $PSScriptRoot  # ~/.agent-mail, from the installed location
New-Item -ItemType Directory -Force -Path $baseDir | Out-Null

$from = Read-Host 'Sender address (SMTP login, e.g. you@gmail.com)'
$to = Read-Host "Recipient address(es), comma-separated [default: $from]"
if (-not $to) { $to = $from }
$secure = Read-Host 'SMTP password (Gmail app password)' -AsSecureString

[pscustomobject]@{
    from     = $from
    to       = @($to -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    smtpHost = $SmtpHost
    smtpPort = $SmtpPort
    smtpUser = $from
} | ConvertTo-Json | Set-Content -Encoding utf8 -Path (Join-Path $baseDir 'config.json')

# DPAPI: only this Windows user on this machine can decrypt it.
$secure | ConvertFrom-SecureString | Set-Content -Path (Join-Path $baseDir 'smtp-password.dat')

Write-Output "Saved to $baseDir. Sending a test mail..."
& (Join-Path $PSScriptRoot 'send-agent-mail.ps1') -Subject 'agent-mail セットアップ完了' -Body 'Claude Code / Codex からの通知メールのテストです。'
