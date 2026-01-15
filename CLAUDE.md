# CLAUDE.md - Project Reference

## Overview

Personal portfolio website built with Next.js 15. Showcases GitHub projects and repositories with an interactive Three.js background.

**Tech Stack:** Next.js 15.5.7, React 19, TypeScript, Tailwind CSS, Three.js (via @react-three/fiber), Framer Motion

## Directory Structure

```
src/
├── api/                              # GitHub data fetching
│   ├── octokit-api.ts               # GraphQL client setup
│   ├── get-repository-data.ts       # Repo query + types
│   └── get-project-data.ts          # Projects query + types
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
│   │   ├── ThreeScene.tsx           # Main canvas
│   │   ├── DynamicThreeScene.tsx    # SSR-safe loader
│   │   ├── constants.ts
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
│   │   │   ├── glass-panel.tsx
│   │   │   ├── error-boundary-wrapper.tsx
│   │   │   └── error-widget.tsx
│   │   └── utils/
│   │       └── use-breakpoints.ts
│   ├── [...catchAll]/               # 404 catch-all
│   ├── layout.tsx                   # Root layout
│   ├── error.tsx
│   ├── not-found.tsx
│   └── globals.css
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
- All GitHub API calls in `src/api/`

### Styling

- Tailwind CSS utilities
- Glass-morphism design (`border border-white/20 bg-gray-500/10`)
- CSS variables for colors in `globals.css`
- No CSS modules

### Three.js Integration

- `DynamicThreeScene` wraps `ThreeScene` with `ssr: false`
- Custom GLSL shaders in `.vert` / `.frag` files
- `raw-loader` + `glslify-loader` for shader imports
- Scroll-linked camera movement

## Important Files

| File                                       | Purpose                                     |
| ------------------------------------------ | ------------------------------------------- |
| `src/api/octokit-api.ts`                   | GraphQL client with auth                    |
| `src/api/get-repository-data.ts`           | Repo query, `RepositoryNode` type           |
| `src/api/get-project-data.ts`              | Projects query, `ProjectNode` type          |
| `src/app/layout.tsx`                       | Root layout, fonts, 3D background           |
| `src/app/_3d/ThreeScene.tsx`               | Main Three.js scene composition             |
| `src/app/_3d/PostEffect/PostEffect.tsx`    | Screen effects (noise, scanlines, vignette) |
| `src/app/_navbar/headers.ts`               | Route headers with rarity system            |
| `src/app/_shared/utils/use-breakpoints.ts` | `isMdScreen`, `isLgScreen` hook             |
| `next.config.ts`                           | Turbopack/Webpack shader loader config      |
| `tailwind.config.ts`                       | Custom fonts, CSS variable colors           |

## Types

### GitHub Data (src/api/)

```typescript
// get-repository-data.ts
type RepositoryNode = {
  name: string;
  description: string | null;
  homepageUrl: string | null;
  url: string;
  owner: { login: string };
  defaultBranchRef: { target: { history: { edges: CommitNode[] } } };
  issues: { nodes: IssueNode[] };
};

// get-project-data.ts
type ProjectNode = {
  id: string;
  title: string;
  url: string;
  shortDescription: string | null;
  readme: string | null;
  closed: boolean;
  repositories: { nodes: { homepageUrl; url }[] };
  items: { nodes: ProjectItemNode[] };
};
```

## Environment Variables

```env
GITHUB_AUTH_TOKEN   # GitHub PAT (required)
OWNER               # GitHub username (required)
```

## Build Commands

```bash
pnpm dev      # Dev with Turbopack
pnpm build    # Production build
pnpm lint     # ESLint
pnpm format   # Prettier
```

Set `ANALYZE=true` for bundle analysis.

## Responsive Breakpoints

| Breakpoint | Width   | Notes                             |
| ---------- | ------- | --------------------------------- |
| mobile     | <768px  | No navbar, simplified backgrounds |
| md         | 768px+  | Navbar visible                    |
| lg         | 1024px+ | Full layouts                      |

## Animation

- **Framer Motion** - List stagger animations with `UL_VARIANTS` / `LI_VARIANTS`
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

- **Rarity system** in navbar headers (Common/Uncommon/Rare with weighted random)
- **Post-processing** shader with CRT-style scanlines, noise, vignette
- **Error boundaries** wrap data-fetching components
- **Catch-all route** for custom 404
