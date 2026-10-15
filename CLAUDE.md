# CLAUDE.md - Project Reference

## Overview

Personal portfolio website built with Next.js 16. Showcases GitHub projects and repositories over a procedurally generated neon city (Three.js): parallax skyline layers with flickering windows, neon signs and billboards with real text, a rooftop searchlight, food stalls, fog, a reflective river, toggleable rain, and a CRT post-effect. Inspired by nanodrops.org; the build plan lives in the untracked `.tasks/neon-city-scene.md`.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Three.js (via @react-three/fiber), Typed.js

## Directory Structure

```
src/
├── api/                              # GitHub data fetching
│   ├── octokit-api.ts               # GraphQL client setup + env validation
│   ├── get-repository-data.ts       # Repo query + types (server-only)
│   ├── get-project-data.ts          # Projects query + types (server-only)
│   └── repository-utils.ts          # Client-safe helpers (no octokit import)
├── app/
│   ├── (routes)/                    # Route group
│   │   ├── (home)/                  # Home page (/)
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (sub-routes)/            # Pages with navbar
│   │   │   ├── projects/            # /projects
│   │   │   │   ├── page.tsx
│   │   │   │   ├── project-data.tsx
│   │   │   │   ├── project-data-container.tsx
│   │   │   │   ├── project-filter.tsx
│   │   │   │   ├── project-list.tsx
│   │   │   │   └── project-card.tsx
│   │   │   ├── repositories/        # /repositories
│   │   │   │   ├── page.tsx
│   │   │   │   ├── repository-data.tsx
│   │   │   │   ├── repository-data-container.tsx
│   │   │   │   ├── repository-filter.tsx
│   │   │   │   ├── repository-list.tsx
│   │   │   │   └── repository-card.tsx
│   │   │   ├── about/               # /about
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   └── layout.tsx
│   ├── _3d/                         # Three.js scene
│   │   ├── ThreeScene.tsx           # Main canvas, camera controller, route camera states
│   │   ├── DynamicThreeScene.tsx    # SSR-safe loader
│   │   ├── utils.ts                 # getSceneTime (wrapped scene clock), mulberry32 seeded PRNG
│   │   ├── City/                    # Neon city scene (plan: .tasks/neon-city-scene.md, gitignored)
│   │   │   ├── City.tsx             # Generates the layout per viewport aspect, mounts the layers
│   │   │   ├── config.ts            # Camera constants, layer table, palette-independent sizing
│   │   │   ├── generate.ts          # Pure seeded layout generator (no three.js imports)
│   │   │   ├── Buildings/           # One instanced draw per depth layer; windows and roof boxes in one shader
│   │   │   ├── Billboards/          # Rooftop neon-framed boards, instanced quads
│   │   │   ├── Beacons/             # Blinking antenna lights, one Points draw
│   │   │   ├── signage.ts           # EDIT HERE to change sign/billboard text: FRAME_SIGNS (6 big blade signs) + pools
│   │   │   ├── text-atlas.ts        # Character atlas (CanvasTexture, 3 variants) built from the layout's texts after fonts load
│   │   │   ├── Signs/               # Neon text signs: blade (beside an edge, bracketed) or facade (over a windowless band)
│   │   │   ├── Beacon/              # Rooftop searchlight: lamp, additive beam, hovering logo badge
│   │   │   ├── Stalls/              # Street level: painted stall sprite sheet on instanced quads, pavement, smoke Points
│   │   │   ├── Fog/                 # Scrolling fog planes between layers (CanvasTexture tile)
│   │   │   ├── River/               # Water plane; mirrored-camera reflection pass (priority 0.5) into a half-res target
│   │   │   └── Sky/                 # Night sky gradient plane; `.abstract-bg` in globals.css mirrors it as the fallback
│   │   ├── Rain/                    # Rain overlay: shader-driven drops, ripple pool, persisted on/off preference
│   │   ├── quality/                 # Tiers (full / reduced / static / off), frame-time probe, context, ?debug=1 overlay
│   │   ├── legacy/                  # DEPRECATED original scene (Box, Plane, Barbelith) — unmounted, pending removal
│   │   └── PostEffect/              # Screen post-processing
│   ├── _navbar/                     # Sidebar navigation
│   │   ├── navbar.tsx
│   │   ├── navbar-container.tsx
│   │   ├── headers.ts               # Dynamic route headers
│   │   └── utils.ts
│   ├── _icons/
│   │   └── logo.tsx
│   ├── _shared/
│   │   ├── ui/
│   │   │   ├── card-base.tsx
│   │   │   ├── data-page-layout.tsx # Suspense + error boundary wrapper for data pages
│   │   │   ├── empty-state.tsx
│   │   │   ├── error-boundary-wrapper.tsx
│   │   │   ├── error-widget.tsx
│   │   │   ├── glass-panel.tsx
│   │   │   ├── rain-toggle.tsx      # Fixed top-right rain switch (hidden under reduced motion)
│   │   │   └── search-input.tsx
│   │   └── utils/
│   │       ├── use-breakpoints.ts
│   │       └── use-prefers-reduced-motion.ts
│   ├── [...catchAll]/               # 404 catch-all
│   ├── layout.tsx                   # Root layout
│   ├── error.tsx
│   ├── global-error.tsx             # Catches root layout errors
│   ├── not-found.tsx
│   └── globals.css                  # Tailwind v4 CSS-first config (@theme)
└── public/
    └── logo.svg
```

## Key Patterns

### Folder Naming

- `_prefix` - Non-route folders (components, utilities)
- `(group)` - Route groups (no URL segment)
- Standard `page.tsx` / `layout.tsx` for routes

### Data Fetching

- **Server Components** fetch data (e.g., `project-data.tsx`, `repository-data.tsx`)
- **Client Components** handle interactivity (filtering, animations)
- GitHub API calls in `src/api/`; `octokit-api.ts` must never be imported from client components — client-safe helpers live in `repository-utils.ts`
- Filtering/sorting is computed during render (`useMemo` + `useDeferredValue`) in the `*-data-container` components; list components are memoized

### Styling

- Tailwind CSS v4 — CSS-first config in `globals.css` (`@theme`), no tailwind.config file
- Glass-morphism design (`border border-white/20 bg-gray-500/10`)
- No CSS modules

### Three.js Integration

- `DynamicThreeScene` wraps `ThreeScene` with `ssr: false`
- Custom GLSL shaders in `.vert` / `.frag` files
- `raw-loader` + `glslify-loader` for shader imports
- Scroll-linked camera movement
- Skipped entirely for `prefers-reduced-motion`; quality tier starts at `reduced` below `md` (DPR 1) and `full` above (DPR ≤ 2), then a frame-time probe steps down while the 75th-percentile frame exceeds the tier's budget; `?quality=<tier>` forces one, `?debug=1` shows frame ms and draw calls
- Shader uniforms are declared via a memoized `uniforms` prop and mutated through `materialRef` in `useFrame`
- City scene: `generate.ts` is pure and seeded (`mulberry32`), so layouts can be built in `useMemo`; the whole city group is remounted by key when the quantized viewport aspect changes
- City shaders are GLSL ES 3.0 (`glslVersion={GLSL3}`, `in`/`out`, `flat` per-instance varyings) and box-filter procedural detail against `fwidth` so thin patterns don't alias
- DOM-backed textures (e.g. the fog tile canvas) are created in `useState` initializers and disposed in effect cleanups
- Frame order: `useFrame` priorities are 0 (uniform updates), 0.5 (river reflection render), 1 (`PostEffect`, which renders the main scene and the CRT quad); new passes slot in between
- Additive light (beam, badge) uses `AdditiveBlending` with alpha 1 in the shader: three's additive mode is `src * alpha + dst`, so alpha 0 adds nothing
- Dynamic `BufferAttribute`s are written through the attribute's own `.array` inside `useFrame`; writing into the memoized source array trips `react-hooks/immutability`
- Signage text is real words from `City/signage.ts`; Latin uses the site's condensed face via the `--font-barlow-condensed` CSS variable, CJK falls back to system fonts. The atlas is built in an effect after `document.fonts.ready`, so signs and billboards mount a beat after the buildings
- The post-effect keeps scene alpha; with the sky plane the frame is opaque, and the CSS `.abstract-bg` night-sky gradient is the fallback for loading, fade-in, reduced motion and no-WebGL states
- The repo's compiler-grade react-hooks lint forbids render-phase impurity (`Math.random`, ref reads, setState-in-effect) — randomness goes in event handlers, frame callbacks, or key-based remounts

## Important Files

| File                                       | Purpose                                       |
| ------------------------------------------ | --------------------------------------------- |
| `src/api/octokit-api.ts`                   | GraphQL client with auth + env validation     |
| `src/api/get-repository-data.ts`           | Repo query, `RepositoryNode` type             |
| `src/api/get-project-data.ts`              | Projects query, `ProjectNode` type            |
| `src/api/repository-utils.ts`              | `getLatestCommitTime` (client-safe)           |
| `src/app/layout.tsx`                       | Root layout, fonts, 3D background             |
| `src/app/_3d/ThreeScene.tsx`               | Main Three.js scene composition               |
| `src/app/_3d/City/generate.ts`             | Seeded city layout, `Building` / `CityLayer`  |
| `src/app/_3d/City/config.ts`               | `CAMERA`, `LAYERS`, `GROUND_Y`, depth helpers |
| `src/app/_3d/City/signage.ts`              | All sign and billboard text (customize here)  |
| `src/app/_3d/quality/tiers.ts`             | Quality tier knobs and frame budgets          |
| `src/app/_3d/Rain/use-rain-preference.ts`  | Persisted rain on/off (`klamath:rain`)        |
| `src/app/_3d/PostEffect/PostEffect.tsx`    | Screen effects (noise, scanlines, vignette)   |
| `src/app/_navbar/headers.ts`               | Route headers with rarity system              |
| `src/app/_shared/utils/use-breakpoints.ts` | `isMdScreen`, `isLgScreen` hook               |
| `next.config.ts`                           | Turbopack/Webpack shader loader config        |

## Types

### GitHub Data (src/api/)

```typescript
// get-repository-data.ts — public, owned, non-fork, non-archived repos (filtered server-side, pre-sorted by latest commit desc)
type RepositoryNode = {
  name: string;
  homepageUrl: string | null;
  url: string;
  defaultBranchRef: { target: { history: { edges: CommitNode[] } } } | null;
};

// get-project-data.ts
type ProjectNode = {
  id: string;
  title: string;
  shortDescription: string | null;
  closed: boolean;
  repositories: { nodes: { homepageUrl; url }[] };
  items: { nodes: ProjectItemNode[] };
};
```

## Environment Variables

```env
GITHUB_AUTH_TOKEN   # GitHub PAT (required, validated at startup)
OWNER               # GitHub username (required, validated at startup)
```

Set in `.env.local`.

## Build Commands

```bash
pnpm dev      # Dev server (Turbopack is the Next 16 default)
pnpm build    # Production build
pnpm lint     # ESLint (includes next/core-web-vitals + compiler-grade react-hooks rules)
pnpm format   # Prettier
pnpm analyze  # Bundle analysis (webpack build — @next/bundle-analyzer is webpack-only)
```

Bundle reference (Turbopack production build, gzipped): the three + R3F + city chunk is ~259 KB, of which the city itself is ~22 KB; total client JS ~455 KB. No runtime dependencies were added for the city.

## Commit Messages

Format: `<gitmoji> <subject>` — a single line, no body, no scope prefix, no trailers.

- Start with one [gitmoji](https://gitmoji.dev) followed by a space
- Subject is lowercase, imperative, and short (under ~60 characters)
- One logical change per commit; no `Co-Authored-By` or other attribution lines

Common emoji in this repo:

| Emoji | Use                  |
| ----- | -------------------- |
| ✨    | new feature          |
| 🐛    | bug fix              |
| 💄    | UI / styling         |
| ♻️    | refactor             |
| ⚡️    | performance          |
| ⬆️    | dependency upgrade   |
| 🔧    | config files         |
| 🚨    | lint fixes           |
| 📝    | docs                 |
| 🔥    | remove code or files |
| ⚰️    | remove dead code     |

Examples: `⬆️ upgrade dependencies`, `🐛 fix several bugs`, `🚨 update eslint.config and fix lint errors`

## Responsive Breakpoints

| Breakpoint | Width   | Notes                             |
| ---------- | ------- | --------------------------------- |
| mobile     | <768px  | No navbar, `reduced` tier (DPR 1) |
| md         | 768px+  | Navbar visible                    |
| lg         | 1024px+ | Full layouts                      |

## Animation

- **CSS** - List stagger animations via `animate-fade-in` + per-item `animationDelay`
- **Typed.js** - Navbar header typing effect
- **Three.js** - City animation is mostly shader-side from `getSceneTime()`: window toggling (hashed periods), beacon blinks, fog scroll, river wobble, rain drops. CPU-side per frame: sign flicker state (`advanceDriver`), ripple spawns, smoke particles, badge bob. All of it is gated by the quality tier

## Layout Hierarchy

```
RootLayout (fonts, 3D background, analytics)
└── KnownRoutesLayout
    ├── Navbar (fixed sidebar, md+ only)
    └── PageLayout (content area)
        ├── Home (/)
        ├── Projects (/projects)
        ├── Repositories (/repositories)
        └── About (/about)
```

## Special Features

- **Rarity system** in navbar headers (Common/Uncommon/Rare with weighted random); header picking happens in state initializers / click handlers, keyed by pathname
- **Neon city** is fully procedural and seeded: no assets besides `public/logo.svg` (used for the beacon badge). Text, palette and layer tables are the tuning surface (`signage.ts`, `config.ts`, shader constants)
- **Legacy scene** (`_3d/legacy/`): `Box`, `Plane`, `Barbelith` are deprecated and unmounted, kept until the city is approved, then removed in an isolated commit. They tree-shake out of the bundle
- **Post-processing** shader with CRT-style scanlines, noise, vignette; render target sized to CSS size × DPR
- **Quality tiers**: `useQuality()` exposes the knobs (`animate`, `signFlicker`, `smoke`, `fogPlanes`, `reflectionScale`, `rainDrops`, `renderOnDemand`); `static` renders on demand (`frameloop="demand"`, invalidated by camera moves, scroll and the fade-in); the verified tier is kept in `sessionStorage` (`klamath:quality`)
- **Rain toggle**: `useRainPreference` (localStorage `klamath:rain` + a window event) defaults to on unless `prefers-reduced-motion`; `City` mounts `Rain` and `Ripples` only while enabled
- **Error boundaries** wrap data-fetching components; retry uses `router.refresh()`; `global-error.tsx` covers the root layout
- **Catch-all route** for custom 404
- **ISR**: `/projects` and `/repositories` revalidate hourly; per-route `metadata` titles use the root template
