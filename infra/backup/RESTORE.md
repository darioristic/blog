# Restoring darioristic.com

The site is a fork of [rauchg/blog](https://github.com/rauchg/blog) deployed on
Vercel, with its view counters in a Redis on a Hetzner box
(`116.203.149.70`) reached over HTTPS through a small proxy.

Most of it is reproducible. Ranked by how hard it is to get back:

| | Where it lives | If lost |
| --- | --- | --- |
| **The posts** | `app/(post)/**/page.mdx` | **Gone forever.** 23 posts, ~370 KB of writing. |
| **The dates** | `app/posts.json`, and nowhere else | **Gone forever.** A post file does not know its own date. |
| **View counters** | `views` hash in the origin Redis | **Gone forever.** |
| Server plumbing | nginx vhosts, pm2, `/opt/redis-http` | Rebuildable from this backup in ~15 min |
| Vercel wiring | DNS, domains, env vars, region | Rebuildable from `vercel/` in ~10 min |
| The code | GitHub (`origin`), plus `code/repo.bundle` here | Three independent copies |

The writing is the thing. Everything else is either reproducible from
rauchg/blog plus this fork's delta, or a number that can be re-earned.

Because the dates live only in the index, the content backup writes a
`meta.json` next to every post carrying its own date. Lose `posts.json` and
the dates still survive, one per post.

## Scenario 0 — the posts

Two scripts, no server access needed, no secrets involved:

```bash
infra/backup/backup-content.sh                      # export
<backup>/restore-content.sh <target-repo> --prune   # put it back
```

Restoring onto a bare clone of the upstream this blog forked from:

```bash
git clone https://github.com/rauchg/blog.git site
~/Backups/darioristic.com/content-latest/restore-content.sh site --prune
cd site && pnpm install && pnpm build
```

`--prune` deletes the posts that came with the clone. Without it you keep
rauchg's 16 alongside yours, and two of them (`books-people-reread`,
`next-for-vercel`) fetch from Notion during the build and fail with a 403.

Three things this restore has actually been run against, and what they cost:

- **The upstream pins Next 16.1.1, which panics on this content.** `mdxRs`
  hits a `swc_common` char-boundary bug on the en-dash in
  `what-is-the-zone-of-genius`. `pnpm add next@16.1.3` fixes it. Turning
  `mdxRs` off instead does not work on a bare clone — that path needs
  `@mdx-js/loader`, which this fork carries and upstream does not.
- **Fonts are a postinstall step.** If a later `pnpm add` skips it, the build
  dies on a missing `fonts/geist-regular.ttf`. Run `node ./fonts/init.mjs`.
- **`app/about/page.mdx` imports a photo out of `public/`.** The backup
  collects whatever the prose references and puts it back at the same
  repo-relative path; a content backup without it does not build.

Verified on 2026-08-24: 23/23 posts built on a fresh upstream clone, every
file byte-identical to the source.

## What is in a snapshot

```
code/
  repo.bundle            entire git history; `git clone repo.bundle site`
  upstream-delta.patch   diff from rauchg/blog main to this fork's HEAD
  upstream-base.txt      the upstream commit that delta applies to
  head.txt               the fork commit the snapshot was taken at
data/
  views.json             the counters, {post-id: count}
  views-restore.redis    the same as HSET commands
  views.flat.txt         raw redis-cli output
vercel/
  dns-records.txt        every DNS record on the domain
  domains.json           which domains point at the project, and redirects
  project.json           project settings
server/
  nginx/*.conf           the vhosts
  redis-http/            the proxy source
  pm2-dump.json          what runs on the box
  redis-config.txt       persistence settings, so a rebuild matches
secrets/                 mode 600 -- tokens and env values, see below
scripts/restore-views.sh
MANIFEST.sha256
```

## Scenario A — the counters are wrong or gone

The common case: the Redis was wiped, replaced, or drifted.

```bash
scripts/restore-views.sh data/views.json --target ssh://root@116.203.149.70
```

It snapshots the current state before writing, then prints the result. Use
`--mode add` instead of the default `--mode set` when you are *merging* two
stores rather than replacing one — that is what the Upstash history merge did
on 2026-08-24, and `set` in that situation would have thrown away everything
accumulated since.

Counters keep climbing after a restore, so a slightly stale backup only loses
the views between the snapshot and the incident.

## Scenario B — rebuilding the origin server

The box holds three things the site depends on: Redis, the `redis-http`
proxy, and Umami.

1. **Redis.** Install, then match `server/redis-config.txt` — specifically
   `appendonly yes` and `maxmemory-policy noeviction`. Without those it will
   quietly lose counters again.
2. **Proxy.** Copy `server/redis-http/` to `/opt/redis-http`, restore
   `secrets/redis-http.env` as `/opt/redis-http/.env` (mode 600), then:
   ```bash
   cd /opt/redis-http && npm install --omit=dev
   pm2 start server.mjs --name redis-http --node-args="--env-file=/opt/redis-http/.env" --time
   pm2 save
   ```
3. **nginx.** The vhosts in `server/nginx/` are CloudPanel-generated. Rather
   than copying them in, recreate the sites so CloudPanel owns them:
   ```bash
   clpctl site:add:reverse-proxy --domainName=redis.darioristic.com \
     --reverseProxyUrl='http://127.0.0.1:8079' --siteUser=redisproxy --siteUserPassword='...'
   clpctl lets-encrypt:install:certificate --domainName=redis.darioristic.com
   ```
   Same shape for `umami.darioristic.com` → `http://127.0.0.1:3002`.
4. **Counters.** Scenario A.

Verify: `curl -s https://redis.darioristic.com/health` → `{"ok":true}`.

## Scenario C — rebuilding the site from scratch

From this backup:

```bash
git clone code/repo.bundle darioristic.com
cd darioristic.com && git checkout main
```

Or from upstream, if you want to see exactly what this fork adds:

```bash
git clone https://github.com/rauchg/blog.git darioristic.com
cd darioristic.com
git checkout "$(cat ../code/upstream-base.txt)"
git apply ../code/upstream-delta.patch
```

The patch is a flat diff, not history — it reproduces the working tree, not
the 300-odd commits. Use the bundle when you want the history.

Then on Vercel:

```bash
vercel link            # to the dario-ristic-blog project
vercel env add UPSTASH_REDIS_REST_URL production      # https://redis.darioristic.com
vercel env add UPSTASH_REDIS_REST_TOKEN production    # secrets/redis-http.env, SRH_TOKEN
vercel deploy --prod
```

Values for every environment are in `secrets/vercel-production.env`.

Two settings that are easy to miss and both bite hard:

- **Region must be `fra1`.** It is pinned in `vercel.json`. The Vercel default
  is `iad1`, which puts the Atlantic between every function and the Redis.
- **The dashboard Build Command is a bare `bun`,** left over from an old
  setup. It prints help text and produces no `.next`. `vercel.json` overrides
  it; if you ever remove that override, the build fails.

DNS, from `vercel/dns-records.txt`. The apex and `www` must have **no** A
records — they resolve through Vercel's default ALIAS. These subdomains must
have explicit A records to `116.203.149.70`, otherwise the wildcard ALIAS
sends them to Vercel:

```
redis    A  116.203.149.70
umami    A  116.203.149.70
caltext  A  116.203.149.70
api.caltext A 116.203.149.70
```

Domain redirects, from `vercel/domains.json`: apex serves, `www` redirects to
apex with 308. The reverse is Vercel's default and contradicts every canonical
URL in the code.

## Verifying a restore

```bash
curl -s https://redis.darioristic.com/health
curl -s https://darioristic.com/api/posts | python3 -c 'import sys,json;d=json.load(sys.stdin);print(len(d),"posts,",sum(int(p["views"]) for p in d),"views")'
curl -sI https://darioristic.com/ | grep -i 'x-vercel-cache'   # expect HIT
curl -sI https://www.darioristic.com/ | grep -i location        # expect the apex
curl -s https://darioristic.com/ | grep -o 'umami.darioristic.com'
```

An increment should land in the origin Redis:

```bash
ssh root@116.203.149.70 'redis-cli hget views the-ultimate-guide-to-devops'
curl -s 'https://darioristic.com/api/view?incr=1&id=the-ultimate-guide-to-devops' >/dev/null
ssh root@116.203.149.70 'redis-cli hget views the-ultimate-guide-to-devops'
```

## Secrets

`secrets/` holds live credentials at mode 600. Keep the directory off shared
storage and out of git.

| File | What |
| --- | --- |
| `redis-http.env` | `SRH_TOKEN` — the bearer token Vercel uses against the proxy |
| `vercel-production.env` | the same token as Vercel sees it, plus the REST URL |

Rotating the token is three steps: edit `/opt/redis-http/.env`,
`pm2 restart redis-http`, then update `UPSTASH_REDIS_REST_TOKEN` on Vercel and
redeploy. Do it if a snapshot ever leaves your control.

## Taking a fresh snapshot

```bash
infra/backup/backup.sh
```

Writes a dated directory under `~/Backups/darioristic.com` and updates the
`latest` symlink. It needs SSH access to the box and a logged-in Vercel CLI.
