#!/usr/bin/env bash
#
# Restore the view counters from a backup into a Redis.
#
# Usage:
#   restore-views.sh <views.json> [--target local|ssh://user@host] [--mode set|add] [--yes]
#
#   --db N       restore into Redis database N instead of 0, which is how you
#                rehearse a restore without touching the live counters
#   --mode set   overwrite each counter with the backed-up value (default)
#   --mode add   HINCRBY the backed-up value onto whatever is there, for
#                merging two stores rather than replacing one
#
set -euo pipefail

SRC="${1:?usage: restore-views.sh <views.json> [--target ...] [--mode set|add] [--yes]}"
shift
TARGET="local"
MODE="set"
DB=""
ASSUME_YES=0

while [ $# -gt 0 ]; do
  case "$1" in
    --target) TARGET="$2"; shift 2 ;;
    --mode)   MODE="$2";   shift 2 ;;
    --db)     DB="$2";     shift 2 ;;
    --yes|-y) ASSUME_YES=1; shift ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

[ -f "$SRC" ] || { echo "no such file: $SRC" >&2; exit 1; }
case "$MODE" in set|add) ;; *) echo "--mode must be set or add" >&2; exit 2 ;; esac

CMDS="$(python3 - "$SRC" "$MODE" <<'PY'
import json, sys
views = json.load(open(sys.argv[1]))
verb = "HSET" if sys.argv[2] == "set" else "HINCRBY"
for k, v in sorted(views.items()):
    print(f"{verb} views {k} {v}")
PY
)"

COUNT="$(printf '%s\n' "$CMDS" | grep -c .)"
TOTAL="$(python3 -c "import json,sys;print(sum(int(v) for v in json.load(open(sys.argv[1])).values()))" "$SRC")"

echo "source : $SRC"
echo "target : $TARGET${DB:+ (db $DB)}"
echo "mode   : $MODE ($([ "$MODE" = set ] && echo 'overwrite existing counters' || echo 'add on top of existing counters'))"
echo "payload: $COUNT posts, $TOTAL views"

RCLI="redis-cli"
[ -n "$DB" ] && RCLI="redis-cli -n $DB"

# sshd on the origin rate-limits rapid connection setup, so a script that
# opens one per step loses a race it did not know it was in. Multiplex.
mkdir -p "$HOME/.ssh"
SSH_OPTS="${SSH_OPTS:--o ControlMaster=auto -o ControlPath=$HOME/.ssh/cm-restore-%r@%h-%p -o ControlPersist=120 -o ConnectTimeout=15}"
# Takes the payload as an argument rather than on stdin: a retry cannot
# re-read a pipe that the failed attempt already drained.
run() {
  local payload="$1" attempt=1 rc out
  if [ "$TARGET" = "local" ]; then
    printf '%s\n' "$payload" | $RCLI
    return $?
  fi
  while :; do
    # shellcheck disable=SC2086
    out="$(printf '%s\n' "$payload" | command ssh $SSH_OPTS "${TARGET#ssh://}" "$RCLI")"
    rc=$?
    if [ $rc -ne 255 ]; then
      printf '%s\n' "$out"
      return $rc
    fi
    [ $attempt -ge 4 ] && return $rc
    sleep $((attempt * 3))
    attempt=$((attempt + 1))
  done
}

STAMP="$(date +%Y%m%d-%H%M%S)"
BEFORE="views-before-restore-$STAMP.txt"
run "HGETALL views" > "$BEFORE" || true

echo
echo "current state of the target: $(( $(wc -l < "$BEFORE") / 2 )) posts"
head -4 "$BEFORE" | paste - - || true

if [ "$ASSUME_YES" -ne 1 ]; then
  printf '\nProceed? [y/N] '
  read -r reply
  case "$reply" in y|Y|yes) ;; *) echo "aborted"; exit 1 ;; esac
fi

echo "pre-restore snapshot: $BEFORE"

# One connection: write, then read back, so the verification cannot disagree
# with what was actually applied.
AFTER="$(run "$CMDS
HGETALL views" | tail -n +$((COUNT + 1)))"
echo "restored."

echo
echo "result: $(printf '%s\n' "$AFTER" | grep -c .) lines"
printf '%s\n' "$AFTER" | paste - - | head -5
