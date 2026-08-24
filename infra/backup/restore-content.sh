#!/usr/bin/env bash
#
# Put the posts back into a checkout -- including a bare clone of
# github.com/rauchg/blog, which is what this blog is a fork of.
#
# Usage:  restore-content.sh <target-repo> [--rebuild-index] [--yes]
#
#   --prune          delete posts in the target that are not in this backup.
#                    Restoring onto a rauchg/blog clone leaves his 16 posts
#                    sitting there, two of which fetch from Notion at build
#                    time and fail. Use this when you want only your writing.
#   --rebuild-index  regenerate app/posts.json from the per-post meta.json
#                    sidecars instead of copying the exported index. Use it
#                    only if the index is lost or you are merging posts into
#                    a different site; the exported posts.json preserves the
#                    hand-tuned ordering the home page groups years by, and
#                    a rebuild sorts by date instead.
#
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:?usage: restore-content.sh <target-repo> [--rebuild-index] [--yes]}"
shift
REBUILD=0
PRUNE=0
ASSUME_YES=0
while [ $# -gt 0 ]; do
  case "$1" in
    --rebuild-index) REBUILD=1; shift ;;
    --prune) PRUNE=1; shift ;;
    --yes|-y) ASSUME_YES=1; shift ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

[ -d "$SRC/posts" ] || { echo "no posts/ next to this script -- run it from inside a content backup" >&2; exit 1; }
[ -d "$TARGET/app" ] || { echo "$TARGET does not look like a checkout of the blog (no app/)" >&2; exit 1; }
# Absolute from here on: the copy loop runs with its cwd inside the backup, so
# a relative target would resolve against the backup rather than the checkout.
TARGET="$(cd "$TARGET" && pwd)"

COUNT="$(find "$SRC/posts" -name page.mdx | wc -l | tr -d ' ')"
echo "source : $SRC"
echo "target : $TARGET"
echo "posts  : $COUNT"
echo "index  : $([ "$REBUILD" -eq 1 ] && echo 'rebuilt from meta.json sidecars' || echo 'copied from the backup')"

EXISTING="$(find "$TARGET/app/(post)" -name page.mdx 2>/dev/null | wc -l | tr -d ' ')"
echo "target currently has $EXISTING post(s); they will be overwritten where slugs collide"
[ "$PRUNE" -eq 1 ] && echo "prune  : posts not in this backup will be deleted"

if [ "$ASSUME_YES" -ne 1 ]; then
  printf '\nProceed? [y/N] '
  read -r reply
  case "$reply" in y|Y|yes) ;; *) echo "aborted"; exit 1 ;; esac
fi

mkdir -p "$TARGET/app/(post)"

# Copy the post trees, dropping the meta.json sidecars -- they exist for the
# backup's benefit, not the site's.
COPIED=0
while IFS= read -r -d '' f; do
  f="${f#./}"
  mkdir -p "$TARGET/app/(post)/$(dirname "$f")"
  cp "$SRC/posts/$f" "$TARGET/app/(post)/$f"
  COPIED=$((COPIED + 1))
done < <(cd "$SRC/posts" && find . -type f ! -name meta.json -print0)
echo "  copied $COPIED post file(s)"
[ "$COPIED" -gt 0 ] || { echo "copied nothing -- refusing to continue" >&2; exit 1; }

[ -f "$SRC/about/page.mdx" ] && { mkdir -p "$TARGET/app/about"; cp "$SRC/about/page.mdx" "$TARGET/app/about/page.mdx"; }

# Images the prose imports, back at the repo-relative paths they are imported
# from. Without these a restore onto a bare clone fails at build time.
if [ -d "$SRC/assets" ]; then
  ASSET_COUNT=0
  while IFS= read -r -d '' rel; do
    rel="${rel#./}"
    mkdir -p "$TARGET/$(dirname "$rel")"
    cp "$SRC/assets/$rel" "$TARGET/$rel"
    ASSET_COUNT=$((ASSET_COUNT + 1))
  done < <(cd "$SRC/assets" && find . -type f ! -name MANIFEST.json -print0)
  echo "  restored $ASSET_COUNT asset(s)"
fi

if [ "$PRUNE" -eq 1 ]; then
  python3 - "$SRC" "$TARGET" <<'PY'
import json, os, shutil, sys
src, target = sys.argv[1], sys.argv[2]

keep = set()
for root, _d, files in os.walk(os.path.join(src, "posts")):
    if "meta.json" in files:
        keep.add(json.load(open(os.path.join(root, "meta.json")))["id"])

removed = []
post_root = os.path.join(target, "app/(post)")
for root, _d, files in os.walk(post_root):
    if "page.mdx" in files and os.path.basename(root) not in keep:
        shutil.rmtree(root)
        removed.append(os.path.relpath(root, post_root))

# Clean up the year directories left empty behind them.
for root, dirs, files in os.walk(post_root, topdown=False):
    if root != post_root and not dirs and not files:
        os.rmdir(root)

print(f"  pruned {len(removed)} post(s) not in the backup")
for r in sorted(removed):
    print(f"    {r}")
PY
fi

if [ "$REBUILD" -eq 1 ]; then
  python3 - "$SRC" "$TARGET" <<'PY'
import json, os, sys, datetime

def parse_date(s):
    # posts.json mixes "November 15, 2014" and "Nov 15, 2014"; JS Date parses
    # both identically, so accept both rather than failing a good backup.
    for fmt in ("%B %d, %Y", "%b %d, %Y"):
        try:
            return datetime.datetime.strptime(s, fmt)
        except ValueError:
            pass
    raise ValueError(s)

src, target = sys.argv[1], sys.argv[2]
posts = []
for root, _d, files in os.walk(os.path.join(src, "posts")):
    if "meta.json" in files:
        m = json.load(open(os.path.join(root, "meta.json")))
        posts.append({k: m[k] for k in ("id", "date", "title")})
posts.sort(key=lambda p: parse_date(p["date"]), reverse=True)
json.dump({"posts": posts}, open(os.path.join(target, "app/posts.json"), "w"), indent=2)
print(f"  rebuilt app/posts.json from {len(posts)} sidecars")
PY
else
  cp "$SRC/posts.json" "$TARGET/app/posts.json"
  echo "  copied app/posts.json"
fi

echo
echo "restored. verify with:"
echo "  cd $TARGET && pnpm install && pnpm build"
