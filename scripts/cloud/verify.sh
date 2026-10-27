#!/usr/bin/env bash
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
export PATH="$HOME/.local/bin:$PATH"
failed=0
for check in "aidlc version" "aidlc doctor" "npm ci" "npm run lint" "npm run typecheck" "npm test" "npm run build"; do
  echo ">>> $check"
  bash -c "$check" || failed=1
done
exit "$failed"
