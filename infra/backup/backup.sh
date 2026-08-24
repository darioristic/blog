#!/usr/bin/env bash
#
# Snapshot everything needed to rebuild darioristic.com on a fresh machine.
#
# The site is a fork of github.com/rauchg/blog, so the code can always be
# recovered from upstream plus the delta this repo carries. What upstream
# cannot give back is the view counters, the origin-server plumbing, and the
# Vercel project wiring -- so those are what this captures.
#
# Usage:  infra/backup/backup.sh [destination-root]
# Default destination root: ~/Backups/darioristic.com
#
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEST_ROOT="${1:-${BACKUP_ROOT:-$HOME/Backups/darioristic.com}}"
STAMP="$(date +%Y%m%d-%H%M%S)"
DEST="$DEST_ROOT/$STAMP"

SERVER="${BACKUP_SERVER:-root@116.203.149.70}"
SITE_USER="${BACKUP_SITE_USER:-darioristic}"
VERCEL_PROJECT="${BACKUP_VERCEL_PROJECT:-dario-ristic-blog}"
DOMAIN="${BACKUP_DOMAIN:-darioristic.com}"
VERCEL="${VERCEL_BIN:-npx -y vercel@latest}"

# sshd on the origin rate-limits rapid connection setup; without multiplexing
# individual fetches fail silently and the snapshot comes out incomplete.
mkdir -p "$HOME/.ssh"
export SSH_OPTS="${SSH_OPTS:--o ControlMaster=auto -o ControlPath=$HOME/.ssh/cm-backup-%r@%h-%p -o ControlPersist=120}"
# ssh exits 255 for its own failures, anything else is the remote command's
# verdict. Only the former is worth retrying, and this host refuses a
# connection often enough that a single attempt loses backups.
# `command <name>` bypasses the shell function of the same name. Resolving the
# binary with `command -v` instead would return the function name and recurse.
_retry() {
  local tool="$1"; shift
  local attempt=1 rc
  while :; do
    # `|| rc=$?` matters: under `set -e` an unguarded failure exits the script
    # before the next line can read $?, so the retry below never runs.
    rc=0
    # shellcheck disable=SC2086
    case "$tool" in
      ssh) command ssh $SSH_OPTS "$@" || rc=$? ;;
      scp) command scp $SSH_OPTS "$@" || rc=$? ;;
    esac
    [ $rc -ne 255 ] && return $rc
    [ $attempt -ge 4 ] && return $rc
    sleep $((attempt * 3))
    attempt=$((attempt + 1))
  done
}
# shellcheck disable=SC2032
ssh() { _retry ssh "$@"; }
scp() { _retry scp "$@"; }

say() { printf '  %s\n' "$*"; }
section() { printf '\n== %s\n' "$*"; }

mkdir -p "$DEST"/{code,data,vercel,server/nginx,server/redis-http,secrets,scripts}
chmod 700 "$DEST" "$DEST/secrets"

# --- code ------------------------------------------------------------------
# A bundle is a single file holding the entire history, clonable with
# `git clone <file>`. The patch is the same content expressed as a delta from
# upstream, for the case where you start from a fresh rauchg/blog clone.
section "code"
cd "$REPO_DIR"
git bundle create "$DEST/code/repo.bundle" --all 2>/dev/null
say "repo.bundle ($(du -h "$DEST/code/repo.bundle" | cut -f1))"

if git rev-parse --verify upstream/main >/dev/null 2>&1; then
  git diff upstream/main HEAD > "$DEST/code/upstream-delta.patch"
  git diff --stat upstream/main HEAD > "$DEST/code/upstream-delta.stat"
  git rev-parse upstream/main > "$DEST/code/upstream-base.txt"
  say "upstream-delta.patch ($(wc -l < "$DEST/code/upstream-delta.patch") lines)"
else
  say "upstream remote missing -- skipping delta (git remote add upstream https://github.com/rauchg/blog.git)"
fi
git rev-parse HEAD > "$DEST/code/head.txt"
git log --oneline -20 > "$DEST/code/recent-commits.txt"

# --- data: the only genuinely irreplaceable part ---------------------------
section "data"
ssh -o ConnectTimeout=15 "$SERVER" 'redis-cli --no-raw hgetall views' > "$DEST/data/views.raw.txt"
ssh -o ConnectTimeout=15 "$SERVER" 'redis-cli hgetall views' > "$DEST/data/views.flat.txt"
python3 - "$DEST/data/views.flat.txt" "$DEST/data/views.json" "$DEST/data/views-restore.redis" <<'PY'
import json, sys
lines = [l.rstrip("\n") for l in open(sys.argv[1]) if l.strip()]
views = dict(zip(lines[0::2], lines[1::2]))
json.dump(views, open(sys.argv[2], "w"), indent=2, sort_keys=True)
with open(sys.argv[3], "w") as f:
    for k, v in sorted(views.items()):
        f.write(f"HSET views {k} {v}\n")
print(f"  {len(views)} posts, {sum(int(v) for v in views.values())} views total")
PY

# The Upstash database from the first Vercel era is still live and still holds
# the pre-merge history. Keep a copy while it exists.
if [ -f "$REPO_DIR/.env.local" ] && grep -q upstash.io "$REPO_DIR/.env.local" 2>/dev/null; then
  say "legacy Upstash still referenced in .env.local -- see secrets/ for credentials"
fi

# --- vercel ----------------------------------------------------------------
section "vercel"
cd "$REPO_DIR"
$VERCEL dns ls "$DOMAIN" > "$DEST/vercel/dns-records.txt" 2>/dev/null || say "dns ls failed"
$VERCEL project inspect "$VERCEL_PROJECT" > "$DEST/vercel/project.txt" 2>/dev/null || say "project inspect failed"

TOKEN_FILE="$HOME/Library/Application Support/com.vercel.cli/auth.json"
[ -f "$TOKEN_FILE" ] || TOKEN_FILE="$HOME/.local/share/com.vercel.cli/auth.json"
if [ -f "$TOKEN_FILE" ]; then
  TOK="$(python3 -c "import json,sys;print(json.load(open(sys.argv[1]))['token'])" "$TOKEN_FILE")"
  curl -fsS -H "Authorization: Bearer $TOK" \
    "https://api.vercel.com/v9/projects/$VERCEL_PROJECT/domains" \
    > "$DEST/vercel/domains.json" 2>/dev/null || say "domains API failed"
  curl -fsS -H "Authorization: Bearer $TOK" \
    "https://api.vercel.com/v9/projects/$VERCEL_PROJECT" \
    > "$DEST/vercel/project.json" 2>/dev/null || say "project API failed"
  unset TOK
fi

# Values, not just names -- a restore needs them.
$VERCEL env pull "$DEST/secrets/vercel-production.env" --environment=production --yes >/dev/null 2>&1 \
  && say "vercel-production.env captured" || say "vercel env pull failed"

# --- server ----------------------------------------------------------------
section "server"
# One connection, one tar. Per-file scp opens a connection each time and sshd
# rate-limits them, which silently drops files from the backup.
ssh -o ConnectTimeout=15 "$SERVER" \
  "cd /etc/nginx/sites-enabled && tar -c \$(ls | grep -E '^(www\\.)?$DOMAIN\\.conf$|^(redis|umami)\\.$DOMAIN\\.conf$')" \
  2>/dev/null | tar -x -C "$DEST/server/nginx" 2>/dev/null || say "nginx fetch failed"
for f in "$DEST/server/nginx"/*.conf; do [ -e "$f" ] && say "nginx/$(basename "$f")"; done

ssh -o ConnectTimeout=15 "$SERVER" 'cd /opt/redis-http && tar -c server.mjs package.json README.md .env 2>/dev/null' \
  | tar -x -C "$DEST/server/redis-http" 2>/dev/null || true
[ -s "$DEST/server/redis-http/server.mjs" ] || say "redis-http fetch failed"
if [ -f "$DEST/server/redis-http/.env" ]; then
  mv "$DEST/server/redis-http/.env" "$DEST/secrets/redis-http.env"
  say "redis-http.env captured"
else
  say "redis-http.env missing"
fi

ssh -o ConnectTimeout=15 "$SERVER" "sudo -u $SITE_USER cat /home/$SITE_USER/.pm2/dump.pm2" \
  > "$DEST/server/pm2-dump.json" 2>/dev/null || say "pm2 dump failed"
ssh -o ConnectTimeout=15 "$SERVER" \
  'redis-cli config get appendonly; redis-cli config get save; redis-cli config get dir; redis-cli config get maxmemory-policy' \
  > "$DEST/server/redis-config.txt" 2>/dev/null || true
ssh -o ConnectTimeout=15 "$SERVER" 'ls /opt/redis-http/views-backup-* 2>/dev/null' \
  > "$DEST/server/views-backup-list.txt" 2>/dev/null || true

# --- integrity -------------------------------------------------------------
section "manifest"
chmod -R go-rwx "$DEST/secrets"
cd "$DEST"
find . -type f ! -name MANIFEST.sha256 -print0 | sort -z | xargs -0 shasum -a 256 > MANIFEST.sha256
say "$(wc -l < MANIFEST.sha256) files, $(du -sh "$DEST" | cut -f1) total"

section "verify"
MISSING=0
for required in \
  code/repo.bundle code/upstream-delta.patch code/head.txt \
  data/views.json data/views-restore.redis \
  vercel/dns-records.txt vercel/domains.json vercel/project.json \
  server/nginx/$DOMAIN.conf "server/nginx/redis.$DOMAIN.conf" "server/nginx/umami.$DOMAIN.conf" \
  server/redis-http/server.mjs server/pm2-dump.json \
  secrets/redis-http.env secrets/vercel-production.env
do
  if [ ! -s "$DEST/$required" ]; then
    printf '  MISSING: %s\n' "$required" >&2
    MISSING=$((MISSING + 1))
  fi
done
if [ "$MISSING" -gt 0 ]; then
  printf '\n%s required file(s) missing -- this snapshot is incomplete.\n' "$MISSING" >&2
  exit 1
fi
say "all required files present"

# The counters are the point of the exercise; refuse an empty one.
VIEW_TOTAL="$(python3 -c "import json,sys;print(sum(int(v) for v in json.load(open(sys.argv[1])).values()))" "$DEST/data/views.json")"
if [ "$VIEW_TOTAL" -eq 0 ]; then
  echo "  view total is 0 -- refusing to call this a backup" >&2
  exit 1
fi
say "counters: $VIEW_TOTAL views"

cp "$REPO_DIR/infra/backup/RESTORE.md" "$DEST/RESTORE.md" 2>/dev/null || true
cp "$REPO_DIR/infra/backup/restore-views.sh" "$DEST/scripts/" 2>/dev/null || true
ln -sfn "$DEST" "$DEST_ROOT/latest"

printf '\nBackup written to %s\n' "$DEST"
printf 'Secrets are in %s/secrets (mode 600) -- keep this directory off shared storage.\n' "$DEST"
