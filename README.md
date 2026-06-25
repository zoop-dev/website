# zoop

my fun lil website — live at [zachy.cc](https://zachy.cc).

interactive, real-time, slightly overcomplicated. lots of shaders. probably lags your pc (sorry).

## stack

- **three.js** — glass hero
- **gsap + lenis** — motion n smooth scroll
- **vite** — build
- **cloudflare pages** — hosting, with functions + KV for an editable site config

the ink playground is [pavel dobryakov's webgl fluid simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation) (MIT), vendored at `public/fluid.js`.

## routes

| path | what |
|------|------|
| `/` | the site |
| `/projects` | everything i've made |
| `/changelog` | what i've added |
| `/github` | my repos, pulled live |
| `/admin` | password-gated editor (writes the config to KV) |

## running it

```bash
npm install
npm run dev      # vite dev server
npm run build    # build to dist/
```

deploy goes to cloudflare pages (`wrangler pages deploy dist`).
