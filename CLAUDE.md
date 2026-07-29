# CLAUDE.md - Project Reference

## Overview

Personal portfolio website built with Next.js 16. Showcases GitHub projects and repositories with an interactive Three.js background.

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
│   │   ├── ThreeScene.tsx           # Main canvas, camera controller
│   │   ├── DynamicThreeScene.tsx    # SSR-safe loader
│   │   ├── utils.ts                 # getSceneTime (wrapped scene clock)
│   │   ├── Box/                     # Rotating wireframe boxes
│   │   ├── Plane/                   # Wavy background plane
│   │   ├── Barbelith/               # Rotating sphere
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
- Skipped entirely for `prefers-reduced-motion`; DPR capped to 1 below `md`
- Shader uniforms are declared via a memoized `uniforms` prop and mutated through `materialRef` in `useFrame`
- The repo's compiler-grade react-hooks lint forbids render-phase impurity (`Math.random`, ref reads, setState-in-effect) — randomness goes in event handlers, frame callbacks, or key-based remounts

## Important Files

| File                                       | Purpose                                     |
| ------------------------------------------ | ------------------------------------------- |
| `src/api/octokit-api.ts`                   | GraphQL client with auth + env validation   |
| `src/api/get-repository-data.ts`           | Repo query, `RepositoryNode` type           |
| `src/api/get-project-data.ts`              | Projects query, `ProjectNode` type          |
| `src/api/repository-utils.ts`              | `getLatestCommitTime` (client-safe)         |
| `src/app/layout.tsx`                       | Root layout, fonts, 3D background           |
| `src/app/_3d/ThreeScene.tsx`               | Main Three.js scene composition             |
| `src/app/_3d/PostEffect/PostEffect.tsx`    | Screen effects (noise, scanlines, vignette) |
| `src/app/_navbar/headers.ts`               | Route headers with rarity system            |
| `src/app/_shared/utils/use-breakpoints.ts` | `isMdScreen`, `isLgScreen` hook             |
| `next.config.ts`                           | Turbopack/Webpack shader loader config      |

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

## Responsive Breakpoints

| Breakpoint | Width   | Notes                             |
| ---------- | ------- | --------------------------------- |
| mobile     | <768px  | No navbar, DPR-capped 3D scene    |
| md         | 768px+  | Navbar visible                    |
| lg         | 1024px+ | Full layouts                      |

## Animation

- **CSS** - List stagger animations via `animate-fade-in` + per-item `animationDelay`
- **Typed.js** - Navbar header typing effect
- **Three.js** - Continuous shader animations via `useFrame`

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
- **Post-processing** shader with CRT-style scanlines, noise, vignette; render target sized to CSS size × DPR
- **Error boundaries** wrap data-fetching components; retry uses `router.refresh()`; `global-error.tsx` covers the root layout
- **Catch-all route** for custom 404
- **ISR**: `/projects` and `/repositories` revalidate hourly; per-route `metadata` titles use the root template
