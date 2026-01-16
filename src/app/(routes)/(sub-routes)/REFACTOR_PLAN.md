# Refactor Plan: Projects & Repositories

Analysis of `/projects` and `/repositories` folders identifying bugs, inefficiencies, and duplication.

---

## 1. ~~CRITICAL - Bugs~~ DONE

### ~~1.1 React key using array index~~ FIXED

**File:** `repositories/repository-list.tsx:40`

~~Using array index as key causes React reconciliation issues when the list is filtered/sorted.~~

**Resolution:** Changed to `repositoryNode.name` as key. Also fixed self-closing tag.

### ~~1.2 Unused prop shadows destructured value~~ FIXED

**File:** `projects/project-card.tsx:36-37`

~~The `closed` prop is passed from `ProjectList` but immediately shadowed by destructuring from `projectNode`.~~

**Resolution:** Removed `closed` prop from `ProjectCardProps`, `ProjectListProps`, and the call site in `ProjectDataContainer`.

### ~~1.3 Nullable type not reflected in TypeScript~~ FIXED

**File:** `src/api/get-repository-data.ts:30`

~~`defaultBranchRef` can be `null` for empty repos, but the type doesn't reflect this.~~

**Resolution:** Updated type to `defaultBranchRef: { ... } | null`

---

## 2. ~~HIGH - Type Confusion~~ DONE

### ~~2.1 Duplicate type name with different shapes~~ FIXED

**Files:**
- `src/api/get-project-data.ts:10` - `ProjectItemNode` (has `fieldValueByName`, `content`)
- `src/api/get-repository-data.ts:3` - ~~`ProjectItemNode`~~ `RepositoryProjectItemNode`

**Resolution:** Renamed to `RepositoryProjectItemNode` in `get-repository-data.ts`.

---

## 3. MEDIUM - Exact Duplications

### ~~3.1 Animation variants duplicated verbatim~~ FIXED

**Files:**
- `projects/project-list.tsx`
- `repositories/repository-list.tsx`

**Resolution:** Extracted `UL_VARIANTS` and `LI_VARIANTS` to `src/app/_shared/motion/list-variants.ts`. Both list components now import from there.

### ~~3.2 Search input with clear button duplicated~~ FIXED

**Files:**
- `projects/project-filter.tsx`
- `repositories/repository-filter.tsx`

**Resolution:** Created `src/app/_shared/ui/search-input.tsx` component with `placeholder`, `value`, `onChange`, and `onClear` props. Both filter components now use this shared component.

### ~~3.3 Empty state UI duplicated~~ FIXED

**Files:**
- `projects/project-data-container.tsx`
- `repositories/repository-data-container.tsx`

**Resolution:** Created `src/app/_shared/ui/empty-state.tsx` component with `title` and optional `message` props. Both container components now use this shared component.

### ~~3.4 Page structure duplicated~~ FIXED

**Files:**
- `projects/page.tsx`
- `repositories/page.tsx`

**Resolution:** Created `src/app/_shared/ui/data-page-layout.tsx` component with `title` and `children` props. Wraps content in ErrorBoundaryWrapper and Suspense. Both page components now use this shared layout.

---

## 4. ~~MEDIUM - Inefficiencies~~ DONE

### ~~4.1 No debounce on search input~~ FIXED

**Files:**
- `projects/project-filter.tsx`
- `repositories/repository-filter.tsx`

**Resolution:** Added `useDeferredValue` to defer the search value, with filtering applied via `useEffect` when the deferred value changes. Input stays responsive while filtering is deferred.

### ~~4.2 Missing memoization for computed values~~ FIXED

**File:** `projects/project-data-container.tsx`

**Resolution:** Wrapped `openProjects` and `closedProjects` computations in `useMemo` with `filteredProjects` as dependency.

### ~~4.3 Filter callbacks not memoized~~ FIXED

**Files:**
- `projects/project-filter.tsx`
- `repositories/repository-filter.tsx`

**Resolution:** Wrapped `applyFilters`, `handleSearchChange`, `handleClearSearch`, and `handleSortToggle` in `useCallback` with appropriate dependencies.

---

## 5. ~~LOW - Structural Improvements~~ DONE

### ~~5.1 Owner filtering in wrong layer~~ FIXED

**File:** `src/api/get-repository-data.ts`

**Resolution:** Moved filtering logic into `getRepositoryData()`. Function now returns `RepositoryNode[]` directly instead of the nested `UserRepositories` structure. Filters out org repos and the profile repo (where name === owner).

### ~~5.2 Inconsistent grid breakpoints~~ DOCUMENTED

**Files:**
- `projects/project-list.tsx` - `grid-cols-1 lg:grid-cols-2`
- `repositories/repository-list.tsx` - `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`

**Reasoning:** Project cards have more content (description, issue sections) and are harder to read with 3 columns. Repository cards are more compact (just commit history) and work well with 3 columns on larger screens.

### ~~5.3 Card components share common patterns~~ FIXED

**Files:**
- `projects/project-card.tsx`
- `repositories/repository-card.tsx`

**Resolution:** Created `src/app/_shared/ui/card-base.tsx` with props for `title`, `homepageUrl`, `githubUrl`, `description`, `children`, and `className`. Both card components now use CardBase, reducing duplication.

---

## 6. MINOR - Code Style

### ~~6.1 Inconsistent prop type naming~~ FIXED

- `projects/project-data-container.tsx` - `ProjectDataContainerProps`
- `repositories/repository-data-container.tsx` - `RepositoryDataContainerProps`

**Resolution:** Renamed `FilteredRepositoryContainerProps` to `RepositoryDataContainerProps` for consistency.

### ~~6.2 Unnecessary React import~~ FIXED

**Files:** `project-card.tsx`, `repository-card.tsx`

**Resolution:** Removed as part of 5.3 CardBase refactor.

### ~~6.3 Self-closing tag inconsistency~~ FIXED

**File:** `repositories/repository-list.tsx:41`

**Resolution:** Fixed as part of 1.1 React key fix.

---

## Summary Table

| Priority | Issue | Files Affected | Status |
|----------|-------|----------------|--------|
| Critical | Index as React key | repository-list.tsx | DONE |
| Critical | Unused/shadowed prop | project-card.tsx | DONE |
| Critical | Missing nullable type | get-repository-data.ts | DONE |
| High | Duplicate type name | both API files | DONE |
| Medium | Animation variants duplicate | both list files | DONE |
| Medium | Search input duplicate | both filter files | DONE |
| Medium | Empty state duplicate | both container files | DONE |
| Medium | Page structure duplicate | both page files | DONE |
| Medium | No search debounce | both filter files | DONE |
| Medium | Missing useMemo | project-data-container.tsx | DONE |
| Medium | Missing useCallback | both filter files | DONE |
| Low | Wrong layer for filtering | repository-data.tsx | DONE |
| Low | Inconsistent grid breakpoints | both list files | DONE |
| Low | Card pattern duplication | both card files | DONE |
| Minor | Inconsistent type naming | container files | DONE |
| Minor | Unnecessary React import | both card files | DONE |
| Minor | Self-closing tag | repository-list.tsx | DONE |

---

## Suggested Extraction Structure

```
src/app/_shared/
├── motion/
│   └── list-variants.ts        # UL_VARIANTS, LI_VARIANTS ✓ CREATED
├── ui/
│   ├── search-input.tsx        # Reusable search with clear button ✓ CREATED
│   ├── empty-state.tsx         # "No X found" component ✓ CREATED
│   ├── data-page-layout.tsx    # Page wrapper with breadcrumb + suspense ✓ CREATED
│   └── card-base.tsx           # Shared card structure ✓ CREATED
└── hooks/
    └── use-debounced-value.ts  # Optional: for search debouncing
```
