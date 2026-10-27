#!/usr/bin/env bash
# Explicit one-time official generation; never called silently at session startup.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
export PATH="$HOME/.local/bin:$PATH"
[[ "$(tr -d '\r\n' < .aidlc-version)" == 2.11.0 ]]
command -v aidlc >/dev/null
command -v jq >/dev/null
[[ -z "$(git status --porcelain)" ]] || { echo "Use a clean dedicated checkout; preserve existing changes." >&2; exit 1; }
aidlc version
preview="$(mktemp)"
trap 'rm -f "$preview"' EXIT
aidlc config --project-dir "$PWD" --harness claude --mcp none --dry-run --json > "$preview"
cat "$preview"
token="$(jq -er '.data.planToken | select(type == "string" and length > 0)' "$preview")"
aidlc config --project-dir "$PWD" --harness claude --mcp none --plan-token "$token" --json
git diff --stat
git diff --check
echo "Review generated .claude/, root integrations and ignores. Never commit trust receipts or local cursors."
