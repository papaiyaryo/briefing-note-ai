# agent-mail

Claude Code と Codex の両方から、全プロジェクト共通で使う通知メールのスキルとスクリプト。briefing-note-ai アプリ本体とは関係しない。

| スキル | 用途 |
| --- | --- |
| `approval-mail` | 承認・判断待ちで作業が止まる直前にメールを送る |
| `rate-limit-reset-mail` | レートリミット解除時刻にメールを予約する（Windows タスクスケジューラ） |

## セットアップ（Windows / PowerShell 7）

### A. .env を使う（推奨）

`.env` に次を書き、そのパスを `-EnvFile` で渡す。記録されるのはパスだけで、値は送信のたびに `.env` から読む。

```dotenv
GMAIL_ADDRESS=you@gmail.com
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx
RECEIVER_ADDRESS=you@example.com   # 省略時は GMAIL_ADDRESS。カンマ区切りで複数可
```

```powershell
pwsh -File tools/agent-mail/install.ps1 -EnvFile D:\path\to\.env
```

`.env` は git 管理外にしておく。エージェントには `.env` を読ませない（スキルはスクリプト経由でしか使わない）。

### B. 対話で設定する

```powershell
pwsh -File tools/agent-mail/install.ps1
pwsh -File "$HOME\.agent-mail\bin\configure-agent-mail.ps1"   # 自分で実行。送信元・宛先・パスワードを聞かれ、テストメールを送る
```

Gmail の場合は 2 段階認証を有効にして [アプリパスワード](https://myaccount.google.com/apppasswords) を作り、それを SMTP パスワードとして入力する。パスワードは DPAPI で暗号化され `~/.agent-mail/smtp-password.dat` に保存される（同じ Windows ユーザー・同じ PC でのみ復号可能）。環境変数 `AGENT_MAIL_SMTP_PASSWORD` があればそちらを優先する。

`install.ps1` がすること:

- `~/.agent-mail/bin/` にスクリプトをコピー
- `~/.claude/skills/`（Claude Code）と `~/.agents/skills/`（Codex）にスキルをコピー
- `~/.claude/CLAUDE.md` と `~/.codex/AGENTS.md` に、スキルを使う指示をマーカー付きで追記（再実行時は置き換え。`-SkipGlobalInstructions` で省略）

ソースを編集したら `install.ps1` を再実行する。

## 使用量の自動監視

`install.ps1` は、次の2つも設定する（`-SkipRateLimitWatcher` で省略）。

- タスク `\AgentMail\AgentMail-RateLimitWatcher`: 1時間ごとに `watch-rate-limits.ps1` を実行する。5時間枠・週の枠の使用率がしきい値（既定 80%）以上になったら、その枠の更新時刻に届くメールを1回だけ予約する。
  - Codex: `~/.codex/sessions/**/*.jsonl` の `rate_limits` を読む
  - Claude Code: ステータスライン（`claude-statusline.ps1`）が書く `~/.agent-mail/claude-rate-limits.json` を読む。`~/.claude/settings.json` に別のステータスラインがすでにある場合は上書きしない。
- しきい値の変更: `pwsh -File tools/agent-mail/install.ps1 -RateLimitThreshold 90`

## 手動で使う

```powershell
pwsh -NoProfile -File "$HOME\.agent-mail\bin\send-agent-mail.ps1" -Subject "テスト" -Body "本文" [-DryRun]
pwsh -NoProfile -File "$HOME\.agent-mail\bin\schedule-agent-mail.ps1" -At "2026-10-23 23:00" -Subject "..." -Body "..."
pwsh -NoProfile -File "$HOME\.agent-mail\bin\schedule-agent-mail.ps1" -InMinutes 90 -Subject "..."
pwsh -NoProfile -File "$HOME\.agent-mail\bin\schedule-agent-mail.ps1" -List
pwsh -NoProfile -File "$HOME\.agent-mail\bin\schedule-agent-mail.ps1" -Cancel <TaskName>
```

送信ログ（件名と結果のみ）は `~/.agent-mail/mail.log`。

## 制約

- スキルはエージェントが自分で呼ぶもの。Claude Code のハーネスが出す権限プロンプトなど、エージェントが事前に把握できない承認待ちにはメールが飛ばない。
- Codex のサンドボックスでネットワークやタスク登録が遮断されると、送信・予約コマンド自体に権限昇格の承認が要る。
- PC の電源が切れていると予約メールは送られない（スリープ中なら復帰後に送られる）。
