# Plan: Integrate /posts Route in klamath-next

Pull published posts from the `posts` GitHub repository and render them at `/posts` and `/posts/[slug]`.

## Prerequisites

The klamath-next codebase already has:
- GitHub GraphQL API setup via Octokit (`src/api/octokit-api.ts`)
- Navbar headers for `/posts` defined
- Reusable layout components (`DataPageLayout`, `GlassPanel`, etc.)

## Dependencies to Add

```bash
npm install gray-matter marked @tailwindcss/typography
```

- **gray-matter** — parse YAML front matter from markdown
- **marked** — convert markdown to HTML (lightweight, fast)
- **@tailwindcss/typography** — `prose` classes for styled markdown output

## Tailwind Config Update

```typescript
// tailwind.config.ts
import typography from "@tailwindcss/typography";

export default {
  // ...existing config
  plugins: [typography],
};
```

## GitHub API: Fetch Posts

Create `src/api/get-posts-data.ts`:

```typescript
import { octokit } from "./octokit-api";
import matter from "gray-matter";

const REPO_OWNER = "your-github-username";
const REPO_NAME = "posts";
const POSTS_PATH = "published"; // only fetch published posts

interface PostFrontMatter {
  title: string;
  description: string;
  tags: string[];
  published: boolean;
  published_at?: string;
  cover_image?: string;
}

interface PostSummary {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  published_at?: string;
}

interface PostFull extends PostSummary {
  content: string;
  cover_image?: string;
}

// Fetch list of all published posts (front matter only)
export async function getPostsList(): Promise<PostSummary[]> {
  const { data } = await octokit.rest.repos.getContent({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path: POSTS_PATH,
  });

  if (!Array.isArray(data)) {
    return [];
  }

  const posts = await Promise.all(
    data
      .filter((file) => file.name.endsWith(".md"))
      .map(async (file) => {
        const slug = file.name.replace(/\.md$/, "");
        const content = await fetchFileContent(file.path);
        const { data: frontMatter } = matter(content);

        return {
          slug,
          title: frontMatter.title,
          description: frontMatter.description,
          tags: frontMatter.tags || [],
          published_at: frontMatter.published_at,
        };
      })
  );

  // Sort by published_at descending (newest first)
  return posts.sort((a, b) => {
    if (!a.published_at) return 1;
    if (!b.published_at) return -1;
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
  });
}

// Fetch single post with full content
export async function getPost(slug: string): Promise<PostFull | null> {
  try {
    const content = await fetchFileContent(`${POSTS_PATH}/${slug}.md`);
    const { data: frontMatter, content: markdown } = matter(content);

    return {
      slug,
      title: frontMatter.title,
      description: frontMatter.description,
      tags: frontMatter.tags || [],
      published_at: frontMatter.published_at,
      cover_image: frontMatter.cover_image,
      content: markdown,
    };
  } catch {
    return null;
  }
}

// Fetch all slugs for static generation
export async function getPostSlugs(): Promise<string[]> {
  const { data } = await octokit.rest.repos.getContent({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path: POSTS_PATH,
  });

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .filter((file) => file.name.endsWith(".md"))
    .map((file) => file.name.replace(/\.md$/, ""));
}

async function fetchFileContent(path: string): Promise<string> {
  const { data } = await octokit.rest.repos.getContent({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path,
  });

  if ("content" in data && data.encoding === "base64") {
    return Buffer.from(data.content, "base64").toString("utf-8");
  }

  throw new Error(`Unable to fetch content for ${path}`);
}
```

## Route: Posts List

Create `src/app/(routes)/(sub-routes)/posts/page.tsx`:

```typescript
import { getPostsList } from "@/api/get-posts-data";
import { DataPageLayout } from "@/app/_shared/ui/data-page-layout";
import Link from "next/link";
import { GlassPanel } from "@/app/_shared/ui/glass-panel";

export default async function PostsPage() {
  const posts = await getPostsList();

  return (
    <DataPageLayout title="Posts">
      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <Link key={post.slug} href={`/posts/${post.slug}`}>
            <GlassPanel className="p-4 hover:bg-white/10 transition-colors">
              <h2 className="text-xl font-semibold">{post.title}</h2>
              <p className="text-white/70 mt-1">{post.description}</p>
              {post.tags.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 bg-white/10 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </GlassPanel>
          </Link>
        ))}
      </div>
    </DataPageLayout>
  );
}
```

## Route: Individual Post

Create `src/app/(routes)/(sub-routes)/posts/[slug]/page.tsx`:

```typescript
import { getPost, getPostSlugs } from "@/api/get-posts-data";
import { DataPageLayout } from "@/app/_shared/ui/data-page-layout";
import { marked } from "marked";
import { notFound } from "next/navigation";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params for all posts
export async function generateStaticParams() {
  const slugs = await getPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const htmlContent = await marked(post.content);

  return (
    <DataPageLayout title={post.title}>
      <article
        className="prose prose-invert prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </DataPageLayout>
  );
}
```

## Prose Styling Customization

Add to `globals.css` to match site aesthetic:

```css
/* Prose overrides for post content */
.prose {
  --tw-prose-body: rgb(255 255 255 / 0.9);
  --tw-prose-headings: #ffffff;
  --tw-prose-links: #60a5fa;
  --tw-prose-bold: #ffffff;
  --tw-prose-code: #f472b6;
  --tw-prose-pre-bg: rgb(0 0 0 / 0.5);
  --tw-prose-pre-code: #e5e7eb;
  --tw-prose-quotes: rgb(255 255 255 / 0.8);
  --tw-prose-quote-borders: rgb(255 255 255 / 0.2);
}

.prose pre {
  border: 1px solid rgb(255 255 255 / 0.1);
}

.prose code::before,
.prose code::after {
  content: none;
}
```

## Caching Strategy

GitHub API responses should be cached to avoid rate limits and improve performance:

```typescript
// In get-posts-data.ts, use Next.js fetch caching
export const revalidate = 3600; // Revalidate every hour
```

Or use `unstable_cache` for more control:

```typescript
import { unstable_cache } from "next/cache";

export const getPostsList = unstable_cache(
  async () => {
    // ...existing implementation
  },
  ["posts-list"],
  { revalidate: 3600 }
);
```

## Optional Enhancements

### Syntax Highlighting

Add `highlight.js` or `shiki` for code block highlighting:

```bash
npm install highlight.js
```

```typescript
import { marked } from "marked";
import hljs from "highlight.js";

marked.setOptions({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return code;
  },
});
```

### Reading Time

```typescript
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}
```

### SEO Metadata

```typescript
// In [slug]/page.tsx
export async function generateMetadata({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      images: post.cover_image ? [post.cover_image] : [],
    },
  };
}
```

## File Structure Summary

```
klamath-next/
├── src/
│   ├── api/
│   │   └── get-posts-data.ts        # New: GitHub API for posts
│   └── app/
│       ├── (routes)/(sub-routes)/
│       │   └── posts/
│       │       ├── page.tsx         # New: Posts list
│       │       └── [slug]/
│       │           └── page.tsx     # New: Individual post
│       └── globals.css              # Update: Prose styles
├── tailwind.config.ts               # Update: Typography plugin
└── package.json                     # Update: New dependencies
```

## Checklist

- [ ] Install dependencies (`gray-matter`, `marked`, `@tailwindcss/typography`)
- [ ] Add typography plugin to Tailwind config
- [ ] Create `get-posts-data.ts` API module
- [ ] Create `/posts` listing page
- [ ] Create `/posts/[slug]` detail page
- [ ] Add prose CSS overrides to `globals.css`
- [ ] Test with a published post
- [ ] Optional: Add syntax highlighting
- [ ] Optional: Add reading time
- [ ] Optional: Add SEO metadata
