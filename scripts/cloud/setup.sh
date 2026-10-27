#!/usr/bin/env bash
# Run from any directory as the same non-root user as the agent.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
harness="${1:-}"
case "$harness" in codex|claude) ;; *) echo "Usage: bash scripts/cloud/setup.sh codex|claude" >&2; exit 2;; esac
version="$(tr -d '\r\n' < .aidlc-version)"
[[ "$version" == 2.11.0 ]] || { echo "Expected AI-DLC pin 2.11.0" >&2; exit 1; }
node -e 'if (Number(process.versions.node.split(".")[0]) !== 22) { console.error("Select Node.js 22 before setup"); process.exit(1); }'
export PATH="$HOME/.local/bin:$PATH"
if ! command -v aidlc >/dev/null; then
  [[ "$(id -u)" != 0 ]] || { echo "Official Unix installer refuses root. Prepare AI-DLC as the non-root agent user; do not bypass the installer." >&2; exit 1; }
  download_dir="$(mktemp -d)"
  trap 'rm -rf "$download_dir"' EXIT
  curl --fail --show-error --location --retry 2 \
    "https://github.com/awslabs/aidlc-workflows/releases/download/v$version/install.sh" \
    -o "$download_dir/install.sh"
  # Official installer verifies release metadata, binary and runtime checksums.
  sh "$download_dir/install.sh" --version "$version" --yes
fi
runtime_version="$(aidlc version)"
printf '%s\n' "$runtime_version"
[[ "$runtime_version" =~ (^|[^0-9])2\.11\.0([^0-9.]|$) ]] || { echo "Install runtime 2.11.0 with the versioned official installer; refusing another version." >&2; exit 1; }
# Version output is intentionally visible; doctor validates project/runtime integrity.
# Do not regenerate an existing harness during routine startup.
if [[ "$harness" == claude && ! -f .claude/CLAUDE.md ]]; then
  echo "Claude harness missing: run bash scripts/cloud/configure-claude.sh, review/commit generated diff, then start a NEW session." >&2
  exit 1
fi
npm ci
aidlc doctor
echo "Setup commands completed. Session hooks/trust and provider access still require a real session check."
