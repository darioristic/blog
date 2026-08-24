#!/usr/bin/env bash
#
# Export the writing: every post's source, byte for byte, plus its date.
#
# This is the part of the site that cannot be regenerated from anywhere. The
# code comes from github.com/rauchg/blog plus this fork's delta; the counters
# come from the Redis backup; the posts exist only here.
#
# Dates live in app/posts.json and nowhere else -- a post file on its own has
# no idea when it was published. So each post is exported with a meta.json
# sidecar carrying its date, which means the export survives losing the index.
# The .mdx files themselves are copied unmodified, so nothing can be lost to a
# parsing bug on the way out.
#
# Usage:  infra/backup/backup-content.sh [destination-root]
#
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEST_ROOT="${1:-${BACKUP_ROOT:-$HOME/Backups/darioristic.com}}"
DEST="$DEST_ROOT/content-$(date +%Y%m%d-%H%M%S)"

cd "$REPO_DIR"
mkdir -p "$DEST/posts" "$DEST/about" "$DEST/assets"

python3 - "$DEST" <<'PY'
import json, os, re, shutil, sys

dest = sys.argv[1]
index = json.load(open("app/posts.json"))["posts"]

# Map slug -> source directory, so a post is found wherever it sits in the tree
# (posts are usually app/(post)/<year>/<slug>, but /ja/ nests one deeper).
found = {}
for root, _dirs, files in os.walk("app/(post)"):
    if "page.mdx" in files:
        found[os.path.basename(root)] = root

missing, exported, files_copied = [], [], 0
for post in index:
    src = found.get(post["id"])
    if src is None:
        missing.append(post["id"])
        continue
    rel = os.path.relpath(src, "app/(post)")
    out = os.path.join(dest, "posts", rel)
    os.makedirs(out, exist_ok=True)
    # Copy every file in the post directory, not just page.mdx -- some posts
    # ship a component next to the prose (ai-platform-engineering has chart.tsx).
    for name in sorted(os.listdir(src)):
        p = os.path.join(src, name)
        if os.path.isfile(p) and not name.startswith("."):
            shutil.copy2(p, os.path.join(out, name))
            files_copied += 1
    json.dump(
        {**post, "path": rel},
        open(os.path.join(out, "meta.json"), "w"),
        indent=2,
    )
    exported.append((post["date"], post["id"], rel))

# Posts present in the tree but absent from the index: upstream leftovers, or
# a draft that was never listed. Either way, say so rather than dropping them.
orphans = sorted(set(found) - {p["id"] for p in index})

shutil.copy2("app/posts.json", os.path.join(dest, "posts.json"))
if os.path.exists("app/about/page.mdx"):
    shutil.copy2("app/about/page.mdx", os.path.join(dest, "about", "page.mdx"))

# Prose can reference images. A backup of the words without the pictures they
# point at does not rebuild -- app/about/page.mdx imports a photo out of
# public/, and a restore onto a bare rauchg/blog clone fails on it.
MEDIA = r"\.(png|jpe?g|gif|svg|webp|avif|mp4|webm|woff2?)"
patterns = [
    re.compile(r'import\s+\w+\s+from\s+["\']([^"\']+' + MEDIA + r')["\']'),
    re.compile(r'src=["\'](/[^"\']+' + MEDIA + r')["\']'),
    re.compile(r'!\[[^\]]*\]\(([^)]+' + MEDIA + r')\)'),
]

sources = []
for root, _dirs, files in os.walk("app"):
    for name in files:
        if name.endswith((".mdx", ".tsx")):
            sources.append(os.path.join(root, name))

assets, dangling = {}, []
for path in sources:
    text = open(path, encoding="utf-8", errors="replace").read()
    for pattern in patterns:
        for match in pattern.finditer(text):
            ref = match.group(1)
            resolved = (
                os.path.normpath(os.path.join(os.path.dirname(path), ref))
                if ref.startswith(".")
                else os.path.normpath("public" + ref)
            )
            if os.path.exists(resolved):
                assets[resolved] = ref
            else:
                dangling.append(f"{path} -> {ref}")

for resolved in sorted(assets):
    out = os.path.join(dest, "assets", resolved)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    shutil.copy2(resolved, out)

json.dump(
    {"assets": sorted(assets), "dangling": sorted(set(dangling))},
    open(os.path.join(dest, "assets", "MANIFEST.json"), "w"),
    indent=2,
)
print(f"  {len(assets)} referenced asset(s)")
if dangling:
    print(f"  {len(set(dangling))} dangling reference(s) -- these already do not resolve in the repo:")
    for d in sorted(set(dangling)):
        print(f"    {d}")

with open(os.path.join(dest, "POSTS.md"), "w") as f:
    f.write("# Posts\n\n")
    f.write(f"{len(exported)} posts exported from app/posts.json.\n\n")
    f.write("| Date | Title | Slug |\n| --- | --- | --- |\n")
    for post in index:
        f.write(f"| {post['date']} | {post['title']} | `{post['id']}` |\n")
    if orphans:
        f.write("\n## Not in the index\n\n")
        f.write("Present in the tree but absent from `posts.json`, so not shown on the site:\n\n")
        for slug in orphans:
            f.write(f"- `{slug}` ({found[slug]})\n")

print(f"  {len(exported)} posts, {files_copied} files")
if orphans:
    print(f"  {len(orphans)} not in the index: {', '.join(orphans)}")
if missing:
    print(f"  MISSING SOURCE for: {', '.join(missing)}", file=sys.stderr)
    sys.exit(1)
PY

cp "$REPO_DIR/infra/backup/restore-content.sh" "$DEST/" 2>/dev/null || true
cp "$REPO_DIR/infra/backup/RESTORE.md" "$DEST/" 2>/dev/null || true
cd "$DEST"
find . -type f ! -name MANIFEST.sha256 -print0 | sort -z | xargs -0 shasum -a 256 > MANIFEST.sha256

# A backup nobody checked is a hope. Verify every indexed post came out with
# prose attached and a date that parses.
python3 - "$DEST" <<'PY'
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

dest = sys.argv[1]
index = json.load(open(os.path.join(dest, "posts.json")))["posts"]
bad = []
for post in index:
    hits = [
        os.path.join(r, "page.mdx")
        for r, _d, fs in os.walk(os.path.join(dest, "posts"))
        if "page.mdx" in fs and json.load(open(os.path.join(r, "meta.json")))["id"] == post["id"]
    ]
    if not hits:
        bad.append(f"{post['id']}: no page.mdx")
        continue
    if os.path.getsize(hits[0]) == 0:
        bad.append(f"{post['id']}: page.mdx is empty")
    try:
        parse_date(post["date"])
    except ValueError:
        bad.append(f"{post['id']}: unparseable date {post['date']!r}")
manifest = json.load(open(os.path.join(dest, "assets", "MANIFEST.json")))
for asset in manifest["assets"]:
    if not os.path.exists(os.path.join(dest, "assets", asset)):
        bad.append(f"asset missing from backup: {asset}")

if bad:
    print("  VERIFICATION FAILED:", file=sys.stderr)
    for b in bad:
        print(f"    {b}", file=sys.stderr)
    sys.exit(1)
total = sum(
    os.path.getsize(os.path.join(r, f))
    for r, _d, fs in os.walk(os.path.join(dest, "posts"))
    for f in fs if f.endswith(".mdx")
)
print(f"  verified: {len(index)} posts, {total // 1024} KB of prose, all dates parse")
PY

ln -sfn "$DEST" "$DEST_ROOT/content-latest"
printf '\nContent backup: %s\n' "$DEST"
