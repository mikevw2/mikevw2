#!/usr/bin/env bash
# One-time setup of an autoresearch host (macOS or Ubuntu/Debian) that you
# drive from an iPad over SSH (e.g. Termius). Safe to re-run.
#
#   curl -fsSL https://raw.githubusercontent.com/mikevw2/mikevw2/claude/karpathy-auto-loops-khzzst/autoresearch-ipad/remote/setup.sh | bash
#
# Installs git, tmux, Python + NumPy (in a venv) and Claude Code, clones the
# repo, and downloads the training data. Then run remote/start.sh.

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/mikevw2/mikevw2.git}"
BRANCH="${BRANCH:-claude/karpathy-auto-loops-khzzst}"
DEST="${DEST:-$HOME/mikevw2}"
PROJECT="$DEST/autoresearch-ipad"

say() { printf '\n==> %s\n' "$*"; }

# --- system packages ---------------------------------------------------------
case "$(uname -s)" in
  Darwin)
    say "macOS detected"
    if ! xcode-select -p >/dev/null 2>&1; then
      echo "Command line tools (git, python3) are missing. Run: xcode-select --install"
      echo "then re-run this script."
      exit 1
    fi
    if ! command -v tmux >/dev/null 2>&1; then
      if command -v brew >/dev/null 2>&1; then
        brew install tmux
      else
        echo "tmux is missing. Install Homebrew (https://brew.sh), then: brew install tmux"
        exit 1
      fi
    fi
    ;;
  Linux)
    say "Linux detected: installing git, tmux, curl, python3-venv"
    SUDO=""; [ "$(id -u)" -ne 0 ] && SUDO="sudo"
    $SUDO apt-get update -qq
    $SUDO apt-get install -y -qq git tmux curl python3 python3-venv >/dev/null
    ;;
  *)
    echo "Unsupported OS: $(uname -s)"; exit 1 ;;
esac

# --- repo --------------------------------------------------------------------
if [ -d "$DEST/.git" ]; then
  say "Repo already at $DEST (leaving your branch and changes alone)"
else
  say "Cloning $REPO_URL ($BRANCH) into $DEST"
  git clone --branch "$BRANCH" "$REPO_URL" "$DEST"
fi
git -C "$DEST" config user.name >/dev/null 2>&1 || git -C "$DEST" config user.name "autoresearch"
git -C "$DEST" config user.email >/dev/null 2>&1 || git -C "$DEST" config user.email "autoresearch@localhost"

# --- python ------------------------------------------------------------------
say "Creating Python venv with NumPy"
python3 -m venv "$PROJECT/.venv"
"$PROJECT/.venv/bin/pip" install -q --upgrade pip numpy

say "Downloading training data"
(cd "$PROJECT" && .venv/bin/python prepare.py)

# --- Claude Code -------------------------------------------------------------
export PATH="$HOME/.local/bin:$PATH"
if command -v claude >/dev/null 2>&1; then
  say "Claude Code already installed: $(claude --version 2>/dev/null || echo unknown version)"
else
  say "Installing Claude Code"
  curl -fsSL https://claude.ai/install.sh | bash
fi

say "Done. Next:"
cat <<EOF
  1. Run:  bash $PROJECT/remote/start.sh
  2. The first time, Claude Code asks you to log in: open the URL it prints
     in Safari on your iPad, approve, and paste the code back into Termius.
  3. Detach and leave it running with Ctrl-b then d. Reconnect later with
     the same start.sh command.
EOF
