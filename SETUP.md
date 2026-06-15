# zoop — setup & deploy

Vanilla **Three.js + Vite** site with a **Cloudflare Pages Functions** backend for a
KV-backed, editable site config and a password-protected `/admin` panel.

## Local development

```bash
npm install
npm run dev        # vite dev server (no Functions / KV; site uses bundled defaults)
```

To run the **Functions + KV + admin** locally (Cloudflare runtime):

```bash
npm run build
npx wrangler pages dev dist --kv CONFIG --binding ADMIN_PASSWORD=dev123
# → http://localhost:8788  (site, /projects, /admin, /api/*)
```

## One-time Cloudflare setup

> You drive the actual Cloudflare account steps. These are the commands.

1. **Create the KV namespace** and copy its id into `wrangler.jsonc` (`kv_namespaces[0].id`):
   ```bash
   npx wrangler kv namespace create CONFIG
   ```

2. **Set the admin password** (a secret — never committed):
   ```bash
   npx wrangler pages secret put ADMIN_PASSWORD
   ```

3. **Bindings in the dashboard** (if deploying via Git instead of `wrangler pages deploy`):
   Pages → your project → Settings → Functions →
   - KV namespace binding: variable `CONFIG` → the namespace from step 1
   - Environment variable / secret: `ADMIN_PASSWORD`

## Deploy

Either connect the Git repo in the Cloudflare Pages dashboard (build command
`npm run build`, output dir `dist`), or push directly:

```bash
npm run build
npx wrangler pages deploy dist
```

## How config works

- `src/config.default.js` — the defaults baked into the build (offline fallback).
- `GET /api/config` — returns the stored config from KV (`{}` if unset).
- The site fetches it on load; the **loader waits** for it, then falls back to
  defaults on offline / error.
- `/admin` — log in with `ADMIN_PASSWORD`, edit everything, **Save** → `PUT /api/config`
  (cookie-authenticated) writes KV. Changes go live within a few seconds
  (KV is eventually consistent + a 30s edge cache on the GET).

## Routes

| Path          | Served by                                   |
|---------------|---------------------------------------------|
| `/`           | `index.html` (the app)                      |
| `/projects`   | `projects.html` (copy of the app, opens the projects view) |
| `/admin`      | `admin/index.html` + `admin/admin.js`       |
| `/api/*`      | Pages Functions (`functions/api/*`)         |
| anything else | `404.html`                                  |

> If you change the schema in `src/config.default.js`, mirror it in
> `public/admin/admin.js` (the `DEFAULTS` object) so the admin pre-fills correctly.
