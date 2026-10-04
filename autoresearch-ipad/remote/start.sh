#!/usr/bin/env bash
# Start (or reattach to) the autoresearch agent in a tmux (or screen) session,
# so it keeps running after you close Termius. Run setup.sh once before this.
#
#   bash ~/mikevw2/autoresearch-ipad/remote/start.sh
#
# Detach: Ctrl-b then d (tmux) or Ctrl-a then d (screen).
# Stop the agent: reattach and press Esc, then type /exit.

set -euo pipefail

PROJECT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SESSION="${SESSION:-autoresearch}"
PROMPT="${PROMPT:-Have a look at program.md and let's kick off a new experiment! Let's do the setup first.}"

# On macOS, keep the Mac awake while the agent runs (idle and, on power, system sleep).
KEEPAWAKE=""
[ "$(uname -s)" = "Darwin" ] && KEEPAWAKE="caffeinate -is"

# Venv first on PATH (so `python3` has NumPy), then Claude Code; edits to train.py
# are auto-accepted and the allowed commands are listed in .claude/settings.json.
CMD="export PATH=\"$PROJECT/.venv/bin:\$HOME/.local/bin:\$PATH\"; cd \"$PROJECT\"; \
$KEEPAWAKE claude --permission-mode acceptEdits \"$PROMPT\"; \
echo; echo 'Claude Code exited. Press Enter to close.'; read"

if command -v tmux >/dev/null 2>&1; then
  tmux has-session -t "$SESSION" 2>/dev/null && exec tmux attach -t "$SESSION"
  [ -x "$PROJECT/.venv/bin/python" ] || { echo "Run remote/setup.sh first."; exit 1; }
  exec tmux new-session -s "$SESSION" -c "$PROJECT" "$CMD"
elif command -v screen >/dev/null 2>&1; then
  screen -list 2>/dev/null | grep -q "[0-9]\.$SESSION[[:space:]]" && exec screen -r "$SESSION"
  [ -x "$PROJECT/.venv/bin/python" ] || { echo "Run remote/setup.sh first."; exit 1; }
  exec screen -S "$SESSION" bash -c "$CMD"
else
  echo "Neither tmux nor screen is installed. Install tmux (macOS: brew install tmux)."
  exit 1
fi
