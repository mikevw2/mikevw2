#!/usr/bin/env bash
# Start (or reattach to) the autoresearch agent in a tmux session, so it keeps
# running after you close Termius. Run setup.sh once before this.
#
#   bash ~/mikevw2/autoresearch-ipad/remote/start.sh
#
# Detach: Ctrl-b then d.   Stop the agent: reattach and press Esc, or
# `tmux kill-session -t autoresearch`.

set -euo pipefail

PROJECT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SESSION="${SESSION:-autoresearch}"
PROMPT="${PROMPT:-Have a look at program.md and let's kick off a new experiment! Let's do the setup first.}"

if tmux has-session -t "$SESSION" 2>/dev/null; then
  exec tmux attach -t "$SESSION"
fi

[ -x "$PROJECT/.venv/bin/python" ] || { echo "Run remote/setup.sh first."; exit 1; }

# Inside tmux: venv first on PATH (so `python3` has NumPy), Claude Code on PATH,
# edits to train.py auto-accepted; the allowed commands are in .claude/settings.json.
tmux new-session -s "$SESSION" -c "$PROJECT" \
  "export PATH=\"$PROJECT/.venv/bin:\$HOME/.local/bin:\$PATH\"; \
   claude --permission-mode acceptEdits \"$PROMPT\"; \
   echo; echo 'Claude Code exited. Press Enter to close.'; read"
