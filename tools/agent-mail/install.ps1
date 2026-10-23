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
param([switch]$SkipGlobalInstructions)

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

if (-not (Test-Path (Join-Path $userHome '.agent-mail\config.json'))) {
    Write-Output ''
    Write-Output "Next: run this yourself to set the mail account (asks for the SMTP password):"
    Write-Output "  pwsh -File `"$binDir\configure-agent-mail.ps1`""
}
