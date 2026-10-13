#!/usr/bin/env bash
# SessionStart hook: make the harness runnable in a fresh cloud container.
# Prints a short status line; never fails the session.
set -u
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
if [ ! -d node_modules ]; then
  npm install --no-audit --no-fund --loglevel=error >/dev/null 2>&1 && echo "harness: deps installed" || echo "harness: npm install failed (offline?)"
fi
missing=""
for v in PAPER; do [ -z "${!v:-}" ] && missing="$missing $v"; done
[ -n "$missing" ] && echo "harness: env not set:$missing (PAPER=1 keeps broker calls in paper mode)"
echo "harness: live_enabled=$(grep -E '^live_enabled:' data/risk.yaml | awk '{print $2}')"
exit 0
