# Portfolio Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build YAGYU SHAW's artist portfolio site — a left-column/right-area split layout with hover image preview on Projects, served as a static Astro site via Cloudflare Pages.

**Architecture:** Left column (~30%) holds SVG logo, nav, and page-specific lists with transparent background. Right area (~70%) shows content. On Projects, hovering a title triggers a full-bleed photo that bleeds behind the left column text. Mobile collapses to full-width single column with fixed footer nav. Build-time data fetching: microCMS for Projects, Notion for Notes, rebuilt every 6 hours via GitHub Actions.

**Tech Stack:** Astro 5, Tailwind CSS v4, TypeScript, microcms-js-sdk, @notionhq/client, notion-to-md, Cloudflare Pages.

---

## File Map

```
/                              ← project root (Desktop/個人ポートフォリオ)
  astro.config.mjs
  tailwind.config.mjs          ← Tailwind theme tokens
  tsconfig.json
  .env                         ← secrets (gitignored)
  .env.example                 ← committed template
  .gitignore
  public/
    logo1.svg                  ← copied from logo/logo1.svg
  src/
    styles/
      global.css               ← font imports, CSS vars, body reset
    types.ts                   ← all TS interfaces (from handoff doc)
    lib/
      microcms.ts              ← getProjects(), getProject(id)
      notion.ts                ← getNotes(), getNote(id)
    layouts/
      Base.astro               ← <html>, <head>, meta, global CSS
      Site.astro               ← left-col + right-area shell
    components/
      LeftCol.astro            ← logo SVG + nav + <slot name="list" />
      ENToggle.astro           ← EN/JA link (right area top-right)
      detail/
        PatternA.astro         ← statement-first detail layout
        PatternB.astro         ← photo-first detail layout
        PatternC.astro         ← ongoing/dialogue detail layout
    pages/
      index.astro              ← Home (ja, default)
      projects/
        index.astro            ← Projects list with hover
        [id].astro             ← Project Detail
      notes/
        index.astro            ← Notes list + body
      about/
        index.astro            ← About + Contact
      en/
        index.astro            ← EN Home (minimal, links to projects)
        projects/
          index.astro          ← EN Projects list
          [id].astro           ← EN Project Detail
        about/
          index.astro          ← EN About
  .github/
    workflows/
      scheduled-rebuild.yml
```

---

## Phase 1 — Project Setup

### Task 1: Git init + Astro project

**Files:**
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `.env.example`

- [ ] **Step 1: Init git repo**

```bash
cd /Users/sho_folkfolk/Desktop/個人ポートフォリオ
git init
```

- [ ] **Step 2: Create Astro project in current directory**

```bash
npm create astro@latest . -- --template minimal --typescript strict --no-install --no-git
```

When prompted: choose "An empty project", TypeScript: strict, no git (already inited).

- [ ] **Step 3: Install dependencies**

```bash
npm install
npm install -D @astrojs/tailwind tailwindcss
npm install microcms-js-sdk @notionhq/client notion-to-md
```

- [ ] **Step 4: Add Tailwind integration**

```bash
npx astro add tailwind --yes
```

- [ ] **Step 5: Replace `astro.config.mjs`**

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  i18n: {
    defaultLocale: 'ja',
    locales: ['ja', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
    fallback: {
      en: 'ja',
    },
  },
  output: 'static',
});
```

- [ ] **Step 6: Create `.env.example`**

```bash
# .env.example
MICROCMS_SERVICE_DOMAIN=your-service-domain
MICROCMS_API_KEY=your-api-key
NOTION_TOKEN=secret_xxxx
NOTION_NOTES_DATABASE_ID=xxxx
CF_PAGES_DEPLOY_HOOK_URL=https://api.cloudflare.com/...
```

- [ ] **Step 7: Create `.env` with real values (not committed)**

Copy `.env.example` to `.env` and fill in actual secrets.

- [ ] **Step 8: Update `.gitignore`**

```
node_modules/
dist/
.env
.astro/
.superpowers/
```

- [ ] **Step 9: Copy logo to public/**

```bash
cp logo/logo1.svg public/logo1.svg
```

- [ ] **Step 10: Verify Astro dev starts**

```bash
npm run dev
```

Expected: `http://localhost:4321` opens in browser with empty page. No errors.

- [ ] **Step 11: First commit**

```bash
git add -A
git commit -m "chore: init Astro project with Tailwind and i18n config"
```

---

### Task 2: Fonts + global CSS

**Files:**
- Create: `src/styles/global.css`
- Modify: `tailwind.config.mjs`

- [ ] **Step 1: Write `src/styles/global.css`**

```css
/* src/styles/global.css */
@import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Noto+Serif+JP:wght@300;400;500&display=swap');

:root {
  --font-latin: 'EB Garamond', Georgia, serif;
  --font-ja: 'Noto Serif JP', 'Yu Mincho', serif;
  --color-ink: #1a1a1a;
  --color-muted: #888;
  --color-faint: #ccc;
  --color-bg: #ffffff;
  --col-left-width: 30%;
}

*, *::before, *::after {
  box-sizing: border-box;
}

html {
  font-family: var(--font-latin);
  color: var(--color-ink);
  background: var(--color-bg);
  -webkit-font-smoothing: antialiased;
}

body {
  margin: 0;
}

a {
  color: inherit;
  text-decoration: none;
}

:lang(ja) {
  font-family: var(--font-ja);
}
```

- [ ] **Step 2: Write `tailwind.config.mjs`**

```js
// tailwind.config.mjs
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        latin: ['EB Garamond', 'Georgia', 'serif'],
        ja: ['Noto Serif JP', 'Yu Mincho', 'serif'],
      },
      colors: {
        ink: '#1a1a1a',
        muted: '#888888',
        faint: '#cccccc',
      },
    },
  },
};
```

- [ ] **Step 3: Verify font loads**

```bash
npm run dev
```

Open browser, open DevTools Network tab, confirm `fonts.googleapis.com` request is present.

- [ ] **Step 4: Commit**

```bash
git add src/styles/global.css tailwind.config.mjs
git commit -m "chore: add EB Garamond + Noto Serif JP and Tailwind tokens"
```

---

### Task 3: TypeScript types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Write `src/types.ts`**

```ts
// src/types.ts

export type ProjectStatus = 'ongoing' | 'completed' | 'archive';
export type ProjectPattern = 'A' | 'B' | 'C';

export interface Photo {
  url: string;
  caption?: string;
  order: number;
}

export interface ProcessEntry {
  date?: string;
  text: string;
  photos?: Photo[];
}

export interface ExhibitionOrPublication {
  title: string;
  type: 'Exhibition' | 'Book' | 'Zine' | 'Collaboration';
  date: string;
  venueOrPublisher?: string;
  summary?: string;
  externalLink?: string;
  relatedProjectIds?: string[];
}

export interface Person {
  name: string;
  role: string;
}

export interface Project {
  id: string;
  name: string;
  nameEn?: string;
  period?: string;
  status?: ProjectStatus;
  showStatus: boolean;
  pattern: ProjectPattern;
  coverImage?: Photo;
  summary: string;
  summaryEn?: string;
  statement: string;
  statementEn?: string;
  startingQuestion?: string;
  photos: Photo[];
  includeProcess: boolean;
  process?: ProcessEntry[];
  exhibitions?: ExhibitionOrPublication[];
  collaborators?: Person[];
  credits?: Person[];
}

export interface Note {
  id: string;
  title?: string;
  body: string;          // HTML converted from Notion blocks
  date: string;          // ISO date string
  type: string;          // 'Poem' | 'DiaryEntry' | 'FieldNote' | 'Daily' | ...
  photo?: Photo;
  relatedProjectIds?: string[];
}

export interface AboutPage {
  name: string;
  bioShort: string;
  bioShortEn?: string;
  bioLong: string;
  bioLongEn?: string;
  artistStatement: string;
  artistStatementEn?: string;
  focusAreas: string[];
  exhibitionHistory: ExhibitionOrPublication[];
  contactEmail: string;
  snsLinks?: { label: string; url: string }[];
  commercialNote?: { text: string; link?: string };
}
```

- [ ] **Step 2: Run type check**

```bash
npx astro check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "chore: add TypeScript types from handoff spec"
```

---

## Phase 2 — Data Layer

### Task 4: microCMS client

**Files:**
- Create: `src/lib/microcms.ts`

microCMS content model for Projects matches the `Project` interface in `src/types.ts`. The API endpoint is `projects`.

- [ ] **Step 1: Write `src/lib/microcms.ts`**

```ts
// src/lib/microcms.ts
import { createClient } from 'microcms-js-sdk';
import type { Project } from '../types';

const client = createClient({
  serviceDomain: import.meta.env.MICROCMS_SERVICE_DOMAIN,
  apiKey: import.meta.env.MICROCMS_API_KEY,
});

export async function getProjects(): Promise<Project[]> {
  const res = await client.getList<Project>({
    endpoint: 'projects',
    queries: { limit: 100, orders: '-publishedAt' },
  });
  return res.contents;
}

export async function getProject(id: string): Promise<Project> {
  return client.getListDetail<Project>({
    endpoint: 'projects',
    contentId: id,
  });
}
```

- [ ] **Step 2: Run type check**

```bash
npx astro check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/microcms.ts
git commit -m "feat: add microCMS client for Projects"
```

---

### Task 5: Notion client

**Files:**
- Create: `src/lib/notion.ts`

Notion database columns (from handoff): Title (title), 本文 (page body), 種別 (select), 写真 (files), 関連Project (text), 公開フラグ (checkbox).

- [ ] **Step 1: Install `notion-to-md` (already done in Task 1) — verify**

```bash
node -e "require('notion-to-md'); console.log('ok')"
```

Expected: `ok`

- [ ] **Step 2: Write `src/lib/notion.ts`**

```ts
// src/lib/notion.ts
import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import type { Note } from '../types';

const notion = new Client({ auth: import.meta.env.NOTION_TOKEN });
const n2m = new NotionToMarkdown({ notionClient: notion });

const DB_ID = import.meta.env.NOTION_NOTES_DATABASE_ID;

export async function getNotes(): Promise<Note[]> {
  const res = await notion.databases.query({
    database_id: DB_ID,
    filter: {
      property: '公開フラグ',
      checkbox: { equals: true },
    },
    sorts: [{ property: '日付', direction: 'descending' }],
  });

  const notes = await Promise.all(
    res.results.map(async (page: any) => {
      const props = page.properties;
      const mdBlocks = await n2m.pageToMarkdown(page.id);
      const body = n2m.toMarkdownString(mdBlocks).parent;

      const photo = props['写真']?.files?.[0];

      return {
        id: page.id,
        title: props['Title']?.title?.[0]?.plain_text ?? undefined,
        body,
        date: props['日付']?.date?.start ?? page.created_time.slice(0, 10),
        type: props['種別']?.select?.name ?? 'Daily',
        photo: photo
          ? { url: photo.file?.url ?? photo.external?.url ?? '', order: 0 }
          : undefined,
        relatedProjectIds: props['関連Project']?.rich_text?.[0]?.plain_text
          ?.split(',')
          .map((s: string) => s.trim())
          .filter(Boolean) ?? [],
      } satisfies Note;
    })
  );

  return notes;
}

export async function getNote(id: string): Promise<Note | undefined> {
  const notes = await getNotes();
  return notes.find((n) => n.id === id);
}
```

- [ ] **Step 3: Run type check**

```bash
npx astro check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/notion.ts
git commit -m "feat: add Notion client for Notes"
```

---

## Phase 3 — Layout System

### Task 6: Base layout

**Files:**
- Create: `src/layouts/Base.astro`

- [ ] **Step 1: Write `src/layouts/Base.astro`**

```astro
---
// src/layouts/Base.astro
export interface Props {
  title?: string;
  lang?: 'ja' | 'en';
}

const { title = 'YAGYU SHAW', lang = 'ja' } = Astro.props;
---
<!doctype html>
<html lang={lang}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="/src/styles/global.css" />
  </head>
  <body>
    <slot />
  </body>
</html>
```

- [ ] **Step 2: Run type check**

```bash
npx astro check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/Base.astro
git commit -m "feat: add Base layout"
```

---

### Task 7: LeftCol component

**Files:**
- Create: `src/components/LeftCol.astro`

The left column is transparent, holds the SVG logo (width 100%), nav links, and a slot for the page-specific list. On desktop: fixed-width column. On mobile: hidden (footer nav takes over).

- [ ] **Step 1: Write `src/components/LeftCol.astro`**

```astro
---
// src/components/LeftCol.astro
export interface Props {
  currentPath?: string;
  lang?: 'ja' | 'en';
}

const { currentPath = '', lang = 'ja' } = Astro.props;

const prefix = lang === 'en' ? '/en' : '';

const nav = [
  { label: 'works', href: `${prefix}/projects` },
  { label: 'notes', href: `${prefix}/notes` },
  { label: 'about', href: `${prefix}/about` },
];
---

<aside class="left-col">
  <a href={`${prefix}/`} class="logo-link" aria-label="YAGYU SHAW home">
    <img
      src="/logo1.svg"
      alt="YAGYU SHAW"
      class="logo"
      width="360"
      height="55"
    />
  </a>

  <nav class="site-nav">
    {nav.map((item) => (
      <a
        href={item.href}
        class:list={['nav-link', { active: currentPath.startsWith(item.href) }]}
      >
        {item.label}
      </a>
    ))}
  </nav>

  <div class="list-slot">
    <slot />
  </div>
</aside>

<style>
  .left-col {
    position: relative;
    z-index: 10;
    width: var(--col-left-width);
    flex-shrink: 0;
    padding: 2rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0;
    /* transparent — no background */
  }

  .logo-link {
    display: block;
    margin-bottom: 0.75rem;
  }

  .logo {
    width: 100%;
    height: auto;
    display: block;
  }

  .site-nav {
    display: flex;
    gap: 0.75rem;
    font-family: var(--font-latin);
    font-size: 0.75rem;
    color: var(--color-muted);
    letter-spacing: 0.05em;
    margin-bottom: 1.5rem;
  }

  .nav-link {
    transition: color 0.15s;
  }

  .nav-link:hover,
  .nav-link.active {
    color: var(--color-ink);
  }

  .list-slot {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  /* Mobile: hide left col entirely */
  @media (max-width: 767px) {
    .left-col {
      display: none;
    }
  }
</style>
```

- [ ] **Step 2: Run type check**

```bash
npx astro check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/LeftCol.astro
git commit -m "feat: add LeftCol component with logo and nav"
```

---

### Task 8: Site layout (split shell)

**Files:**
- Create: `src/layouts/Site.astro`

This is the core layout. Left column is fixed-width and transparent. Right area fills remaining space. On Projects hover, the image is absolutely positioned below both columns — left column sits on top via z-index.

- [ ] **Step 1: Write `src/layouts/Site.astro`**

```astro
---
// src/layouts/Site.astro
import Base from './Base.astro';
import LeftCol from '../components/LeftCol.astro';

export interface Props {
  title?: string;
  lang?: 'ja' | 'en';
  currentPath?: string;
}

const { title, lang = 'ja', currentPath } = Astro.props;
---

<Base title={title} lang={lang}>
  <div class="site-frame">
    <LeftCol lang={lang} currentPath={currentPath}>
      <slot name="left-list" />
    </LeftCol>

    <main class="right-area">
      <slot name="right-content" />
    </main>
  </div>

  <!-- Mobile footer nav -->
  <footer class="mobile-footer">
    <a href={lang === 'en' ? '/en/projects' : '/projects'}>works</a>
    <a href={lang === 'en' ? '/en/notes' : '/notes'}>notes</a>
    <a href={lang === 'en' ? '/en/about' : '/about'}>about</a>
  </footer>
</Base>

<style>
  .site-frame {
    min-height: 100dvh;
    display: flex;
    position: relative;
  }

  .right-area {
    flex: 1;
    min-height: 100dvh;
    position: relative;
  }

  /* Mobile: single column */
  @media (max-width: 767px) {
    .site-frame {
      flex-direction: column;
    }

    .right-area {
      min-height: unset;
      padding: 1rem 1.25rem 5rem; /* space for footer */
    }
  }

  /* Mobile footer nav */
  .mobile-footer {
    display: none;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    border-top: 1px solid var(--color-faint);
    background: var(--color-bg);
    padding: 0.75rem 0;
    justify-content: space-around;
    font-family: var(--font-latin);
    font-size: 0.75rem;
    color: var(--color-muted);
    z-index: 100;
  }

  .mobile-footer a {
    color: inherit;
  }

  .mobile-footer a:hover {
    color: var(--color-ink);
  }

  @media (max-width: 767px) {
    .mobile-footer {
      display: flex;
    }
  }
</style>
```

- [ ] **Step 2: Run type check**

```bash
npx astro check
```

Expected: no errors.

- [ ] **Step 3: Quick visual test — update `src/pages/index.astro` to use Site layout**

```astro
---
import Site from '../layouts/Site.astro';
---
<Site title="YAGYU SHAW" currentPath="/">
  <span slot="left-list"></span>
  <div slot="right-content"></div>
</Site>
```

Run `npm run dev`, open `http://localhost:4321`, confirm left column and logo appear.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/Site.astro src/pages/index.astro
git commit -m "feat: add Site split layout with mobile footer nav"
```

---

### Task 9: EN toggle component

**Files:**
- Create: `src/components/ENToggle.astro`

Shown only on pages that have EN versions (Project Detail, About). Positioned in the right area, top-right corner.

- [ ] **Step 1: Write `src/components/ENToggle.astro`**

```astro
---
// src/components/ENToggle.astro
export interface Props {
  currentLang: 'ja' | 'en';
  jaHref: string;
  enHref: string;
}

const { currentLang, jaHref, enHref } = Astro.props;
---

<div class="en-toggle">
  {currentLang === 'ja' ? (
    <a href={enHref} class="toggle-link">EN</a>
  ) : (
    <a href={jaHref} class="toggle-link">JA</a>
  )}
</div>

<style>
  .en-toggle {
    position: absolute;
    top: 1.25rem;
    right: 1.25rem;
    z-index: 20;
  }

  .toggle-link {
    font-family: var(--font-latin);
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    color: var(--color-muted);
    border: 1px solid var(--color-faint);
    padding: 0.2rem 0.5rem;
    transition: color 0.15s, border-color 0.15s;
  }

  .toggle-link:hover {
    color: var(--color-ink);
    border-color: var(--color-muted);
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ENToggle.astro
git commit -m "feat: add EN/JA toggle component"
```

---

## Phase 4 — Pages

### Task 10: Home page

**Files:**
- Modify: `src/pages/index.astro`

Left: logo, nav, short text, → latest Note. Right: blank.

- [ ] **Step 1: Rewrite `src/pages/index.astro`**

```astro
---
// src/pages/index.astro
import Site from '../layouts/Site.astro';
import { getNotes } from '../lib/notion';

const notes = await getNotes();
const latestNote = notes[0];
---

<Site title="YAGYU SHAW" currentPath="/">
  <div slot="left-list" class="home-left">
    <p class="tagline">Works of Expression</p>
    {latestNote && (
      <a href={`/notes`} class="latest-note-link">
        → {latestNote.type}
        {latestNote.date}
      </a>
    )}
  </div>

  <div slot="right-content" class="home-right">
    <!-- intentionally blank -->
  </div>
</Site>

<style>
  .home-left {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-top: 0.5rem;
  }

  .tagline {
    font-family: var(--font-latin);
    font-size: 0.75rem;
    color: var(--color-muted);
    letter-spacing: 0.05em;
    margin: 0;
  }

  .latest-note-link {
    font-family: var(--font-latin);
    font-size: 0.8rem;
    color: var(--color-muted);
    transition: color 0.15s;
  }

  .latest-note-link:hover {
    color: var(--color-ink);
  }

  /* Mobile: show a brief intro in the right area */
  @media (max-width: 767px) {
    .home-right {
      padding-top: 1rem;
    }
  }
</style>
```

- [ ] **Step 2: Add mobile header (logo only, for mobile)**

In `src/layouts/Site.astro`, add inside `<Base>` before `.site-frame`, shown only on mobile:

```astro
<!-- Mobile-only header inside Base, above site-frame -->
<header class="mobile-header">
  <a href="/">
    <img src="/logo1.svg" alt="YAGYU SHAW" class="mobile-logo" />
  </a>
</header>
```

Add to `<style>` in `Site.astro`:

```css
.mobile-header {
  display: none;
  padding: 1.25rem 1.25rem 0;
}

.mobile-logo {
  width: 180px;
  height: auto;
}

@media (max-width: 767px) {
  .mobile-header {
    display: block;
  }
}
```

- [ ] **Step 3: Visual test**

```bash
npm run dev
```

Open `http://localhost:4321`. Confirm:
- Desktop: logo + nav in left column, right side is blank white
- Resize to < 768px: logo appears at top, footer nav at bottom

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro src/layouts/Site.astro
git commit -m "feat: Home page — blank right area, latest Note link"
```

---

### Task 11: Projects page with hover

**Files:**
- Create: `src/pages/projects/index.astro`

Left: project title list. Right: full-bleed cover image on hover (image bleeds behind left column via absolute positioning + z-index). Vanilla JS handles the hover.

- [ ] **Step 1: Write `src/pages/projects/index.astro`**

```astro
---
// src/pages/projects/index.astro
import Site from '../../layouts/Site.astro';
import { getProjects } from '../../lib/microcms';

const projects = await getProjects();
---

<Site title="Projects — YAGYU SHAW" currentPath="/projects">
  <!-- Left: project list -->
  <ul slot="left-list" class="project-list" role="list">
    {projects.map((p) => (
      <li class="project-item">
        <a
          href={`/projects/${p.id}`}
          class="project-link"
          data-cover={p.coverImage?.url ?? ''}
          data-cover-alt={p.name}
        >
          {p.name}
        </a>
      </li>
    ))}
  </ul>

  <!-- Right: hover image layer (full-bleed, behind left col) -->
  <div slot="right-content" class="hover-stage" aria-hidden="true">
    <div class="hover-img-wrap" id="hover-img-wrap">
      <img id="hover-img" src="" alt="" class="hover-img" />
    </div>
  </div>
</Site>

<style>
  .project-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .project-link {
    font-family: var(--font-ja);
    font-size: 0.9rem;
    color: var(--color-ink);
    transition: color 0.15s;
    display: block;
  }

  .project-link:hover {
    color: var(--color-muted);
  }

  /* Hover image: positioned behind left col (left: 0) */
  .hover-stage {
    position: absolute;
    inset: 0;
    /* right-area is already position:relative in Site.astro */
  }

  .hover-img-wrap {
    /* extend to the full viewport width, behind the left col */
    position: fixed;
    inset: 0;
    z-index: 1; /* behind left-col z-index:10 */
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .hover-img-wrap.visible {
    opacity: 1;
  }

  .hover-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Mobile: no hover, show thumbnail list */
  @media (max-width: 767px) {
    .hover-stage { display: none; }
  }
</style>

<script>
  const links = document.querySelectorAll<HTMLAnchorElement>('.project-link[data-cover]');
  const wrap = document.getElementById('hover-img-wrap') as HTMLDivElement;
  const img = document.getElementById('hover-img') as HTMLImageElement;

  let preloaded = new Set<string>();

  links.forEach((link) => {
    const src = link.dataset.cover ?? '';
    const alt = link.dataset.coverAlt ?? '';

    // Preload image on page load
    if (src && !preloaded.has(src)) {
      const pre = new Image();
      pre.src = src;
      preloaded.add(src);
    }

    link.addEventListener('mouseenter', () => {
      if (!src) return;
      img.src = src;
      img.alt = alt;
      wrap.classList.add('visible');
    });

    link.addEventListener('mouseleave', () => {
      wrap.classList.remove('visible');
    });
  });
</script>
```

- [ ] **Step 2: Visual test with real data**

```bash
npm run dev
```

Open `http://localhost:4321/projects`. Hover over a project title — cover image should fade in across the full screen. Left column text stays readable on top.

- [ ] **Step 3: Commit**

```bash
git add src/pages/projects/index.astro
git commit -m "feat: Projects page with full-bleed hover image"
```

---

### Task 12: Project Detail — Pattern A (statement-first)

**Files:**
- Create: `src/components/detail/PatternA.astro`
- Create: `src/pages/projects/[id].astro`

- [ ] **Step 1: Write `src/components/detail/PatternA.astro`**

```astro
---
// src/components/detail/PatternA.astro
import type { Project, ExhibitionOrPublication, Person } from '../../types';

export interface Props {
  project: Project;
  lang?: 'ja' | 'en';
}

const { project: p, lang = 'ja' } = Astro.props;
const statement = lang === 'en' && p.statementEn ? p.statementEn : p.statement;
const isEn = lang === 'en';
---

<article class="detail-a">
  <header class="detail-header">
    <h1 class="project-name">{p.name}</h1>
    {p.period && <p class="project-meta">{p.period}</p>}
    {p.showStatus && p.status && (
      <p class="project-meta status">{p.status}</p>
    )}
  </header>

  {statement && (
    <section class="statement">
      <p>{statement}</p>
    </section>
  )}

  {p.photos.length > 0 && (
    <section class="photos">
      {p.photos
        .sort((a, b) => a.order - b.order)
        .map((photo) => (
          <figure class="photo-fig">
            <img src={photo.url} alt={photo.caption ?? p.name} loading="lazy" />
            {photo.caption && <figcaption>{photo.caption}</figcaption>}
          </figure>
        ))}
    </section>
  )}

  {p.includeProcess && p.process && p.process.length > 0 && (
    <section class="process">
      {p.process.map((entry) => (
        <div class="process-entry">
          {entry.date && <time class="process-date">{entry.date}</time>}
          <p>{entry.text}</p>
          {entry.photos?.map((photo) => (
            <img src={photo.url} alt={photo.caption ?? ''} loading="lazy" />
          ))}
        </div>
      ))}
    </section>
  )}

  {p.exhibitions && p.exhibitions.length > 0 && (
    <section class="exhibitions">
      <h2 class="section-heading">
        {isEn ? 'Exhibitions & Publications' : '展示・出版歴'}
      </h2>
      <ul class="exhibition-list">
        {p.exhibitions.map((ex) => (
          <li>
            <time>{ex.date}</time>
            {' '}{ex.type}{' — '}{ex.title}
            {ex.venueOrPublisher && <span>, {ex.venueOrPublisher}</span>}
          </li>
        ))}
      </ul>
    </section>
  )}

  {p.credits && p.credits.length > 0 && (
    <section class="credits">
      <h2 class="section-heading">{isEn ? 'Credits' : 'クレジット'}</h2>
      <ul class="credits-list">
        {p.credits.map((person) => (
          <li>{person.role}: {person.name}</li>
        ))}
      </ul>
    </section>
  )}
</article>

<style>
  .detail-a {
    padding: 2rem 2.5rem 4rem;
    max-width: 680px;
  }

  .detail-header {
    margin-bottom: 2rem;
  }

  .project-name {
    font-family: var(--font-latin);
    font-size: 1.4rem;
    font-weight: 400;
    margin: 0 0 0.5rem;
  }

  .project-meta {
    font-family: var(--font-latin);
    font-size: 0.8rem;
    color: var(--color-muted);
    margin: 0;
  }

  .statement {
    margin-bottom: 2.5rem;
    font-family: var(--font-ja);
    font-size: 0.9rem;
    line-height: 2;
    color: #333;
  }

  .photos {
    margin-bottom: 2.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .photo-fig {
    margin: 0;
  }

  .photo-fig img {
    width: 100%;
    height: auto;
    display: block;
  }

  figcaption {
    font-family: var(--font-latin);
    font-size: 0.75rem;
    color: var(--color-muted);
    margin-top: 0.4rem;
  }

  .process {
    margin-bottom: 2.5rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .process-date {
    display: block;
    font-family: var(--font-latin);
    font-size: 0.75rem;
    color: var(--color-muted);
    margin-bottom: 0.4rem;
  }

  .process-entry p {
    font-family: var(--font-ja);
    font-size: 0.875rem;
    line-height: 1.9;
    margin: 0;
  }

  .section-heading {
    font-family: var(--font-latin);
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-muted);
    font-weight: 400;
    margin: 0 0 1rem;
  }

  .exhibition-list,
  .credits-list {
    list-style: none;
    padding: 0;
    margin: 0;
    font-family: var(--font-latin);
    font-size: 0.85rem;
    line-height: 2;
    color: #444;
  }

  .exhibitions,
  .credits {
    margin-bottom: 2rem;
  }
</style>
```

- [ ] **Step 2: Write `src/components/detail/PatternB.astro`**

```astro
---
// src/components/detail/PatternB.astro
import type { Project } from '../../types';

export interface Props {
  project: Project;
  lang?: 'ja' | 'en';
}

const { project: p, lang = 'ja' } = Astro.props;
const summary = lang === 'en' && p.summaryEn ? p.summaryEn : p.summary;
---

<article class="detail-b">
  <header class="detail-header">
    <h1 class="project-name">{p.name}</h1>
    {p.period && <p class="project-meta">{p.period}</p>}
  </header>

  {p.photos.length > 0 && (
    <section class="photos">
      {p.photos
        .sort((a, b) => a.order - b.order)
        .map((photo) => (
          <figure class="photo-fig">
            <img src={photo.url} alt={photo.caption ?? p.name} loading="lazy" />
            {photo.caption && <figcaption>{photo.caption}</figcaption>}
          </figure>
        ))}
    </section>
  )}

  {summary && (
    <section class="summary">
      <p>{summary}</p>
    </section>
  )}

  {p.exhibitions && p.exhibitions.length > 0 && (
    <section class="exhibitions">
      <h2 class="section-heading">
        {lang === 'en' ? 'Exhibitions & Publications' : '展示・出版歴'}
      </h2>
      <ul class="exhibition-list">
        {p.exhibitions.map((ex) => (
          <li>
            <time>{ex.date}</time>
            {' '}{ex.type}{' — '}{ex.title}
            {ex.venueOrPublisher && <span>, {ex.venueOrPublisher}</span>}
          </li>
        ))}
      </ul>
    </section>
  )}

  {p.credits && p.credits.length > 0 && (
    <section class="credits">
      <h2 class="section-heading">{lang === 'en' ? 'Credits' : 'クレジット'}</h2>
      <ul class="credits-list">
        {p.credits.map((person) => (
          <li>{person.role}: {person.name}</li>
        ))}
      </ul>
    </section>
  )}
</article>

<style>
  /* Same token usage as PatternA — share via global.css if needed */
  .detail-b { padding: 2rem 2.5rem 4rem; max-width: 680px; }
  .detail-header { margin-bottom: 2rem; }
  .project-name { font-family: var(--font-latin); font-size: 1.4rem; font-weight: 400; margin: 0 0 0.5rem; }
  .project-meta { font-family: var(--font-latin); font-size: 0.8rem; color: var(--color-muted); margin: 0; }
  .photos { margin-bottom: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
  .photo-fig { margin: 0; }
  .photo-fig img { width: 100%; height: auto; display: block; }
  figcaption { font-family: var(--font-latin); font-size: 0.75rem; color: var(--color-muted); margin-top: 0.4rem; }
  .summary { margin-bottom: 2.5rem; font-family: var(--font-ja); font-size: 0.9rem; line-height: 2; color: #333; }
  .section-heading { font-family: var(--font-latin); font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-muted); font-weight: 400; margin: 0 0 1rem; }
  .exhibition-list, .credits-list { list-style: none; padding: 0; margin: 0; font-family: var(--font-latin); font-size: 0.85rem; line-height: 2; color: #444; }
  .exhibitions, .credits { margin-bottom: 2rem; }
</style>
```

- [ ] **Step 3: Write `src/components/detail/PatternC.astro`**

```astro
---
// src/components/detail/PatternC.astro
import type { Project } from '../../types';

export interface Props {
  project: Project;
  lang?: 'ja' | 'en';
}

const { project: p, lang = 'ja' } = Astro.props;
---

<article class="detail-c">
  <header class="detail-header">
    <h1 class="project-name">{p.name}</h1>
    {p.period && <p class="project-meta">{p.period}</p>}
  </header>

  {p.process && p.process.length > 0 && (
    <section class="timeline">
      {p.process.map((entry) => (
        <div class="timeline-entry">
          {entry.date && <time class="entry-date">{entry.date}</time>}
          <p class="entry-text">{entry.text}</p>
          {entry.photos?.map((photo) => (
            <img src={photo.url} alt={photo.caption ?? ''} loading="lazy" class="entry-photo" />
          ))}
        </div>
      ))}
    </section>
  )}

  {p.photos.length > 0 && (
    <section class="photos">
      {p.photos
        .sort((a, b) => a.order - b.order)
        .map((photo) => (
          <figure class="photo-fig">
            <img src={photo.url} alt={photo.caption ?? p.name} loading="lazy" />
            {photo.caption && <figcaption>{photo.caption}</figcaption>}
          </figure>
        ))}
    </section>
  )}

  {p.startingQuestion && (
    <section class="question">
      <p class="question-text">{p.startingQuestion}</p>
    </section>
  )}

  {p.collaborators && p.collaborators.length > 0 && (
    <section class="collaborators">
      <h2 class="section-heading">
        {lang === 'en' ? 'Collaborators' : '共同制作者'}
      </h2>
      <ul class="person-list">
        {p.collaborators.map((person) => (
          <li>{person.role}: {person.name}</li>
        ))}
      </ul>
    </section>
  )}
</article>

<style>
  .detail-c { padding: 2rem 2.5rem 4rem; max-width: 680px; }
  .detail-header { margin-bottom: 2rem; }
  .project-name { font-family: var(--font-latin); font-size: 1.4rem; font-weight: 400; margin: 0 0 0.5rem; }
  .project-meta { font-family: var(--font-latin); font-size: 0.8rem; color: var(--color-muted); margin: 0; }
  .timeline { display: flex; flex-direction: column; gap: 2.5rem; margin-bottom: 2.5rem; }
  .entry-date { display: block; font-family: var(--font-latin); font-size: 0.75rem; color: var(--color-muted); margin-bottom: 0.4rem; }
  .entry-text { font-family: var(--font-ja); font-size: 0.875rem; line-height: 1.9; margin: 0 0 0.75rem; }
  .entry-photo { width: 100%; height: auto; display: block; margin-top: 0.75rem; }
  .photos { margin-bottom: 2.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
  .photo-fig { margin: 0; }
  .photo-fig img { width: 100%; height: auto; display: block; }
  figcaption { font-family: var(--font-latin); font-size: 0.75rem; color: var(--color-muted); margin-top: 0.4rem; }
  .question { margin-bottom: 2rem; }
  .question-text { font-family: var(--font-ja); font-size: 0.9rem; line-height: 1.9; color: #444; font-style: italic; }
  .section-heading { font-family: var(--font-latin); font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-muted); font-weight: 400; margin: 0 0 1rem; }
  .person-list { list-style: none; padding: 0; margin: 0; font-family: var(--font-latin); font-size: 0.85rem; line-height: 2; color: #444; }
  .collaborators { margin-bottom: 2rem; }
</style>
```

- [ ] **Step 4: Write `src/pages/projects/[id].astro`**

```astro
---
// src/pages/projects/[id].astro
import Site from '../../layouts/Site.astro';
import ENToggle from '../../components/ENToggle.astro';
import PatternA from '../../components/detail/PatternA.astro';
import PatternB from '../../components/detail/PatternB.astro';
import PatternC from '../../components/detail/PatternC.astro';
import { getProjects, getProject } from '../../lib/microcms';

export async function getStaticPaths() {
  const projects = await getProjects();
  return projects.map((p) => ({ params: { id: p.id } }));
}

const { id } = Astro.params;
const [project, allProjects] = await Promise.all([
  getProject(id!),
  getProjects(),
]);

const idx = allProjects.findIndex((p) => p.id === id);
const prev = idx > 0 ? allProjects[idx - 1] : null;
const next = idx < allProjects.length - 1 ? allProjects[idx + 1] : null;
---

<Site
  title={`${project.name} — YAGYU SHAW`}
  currentPath={`/projects/${id}`}
>
  <!-- Left: project list with current highlighted -->
  <ul slot="left-list" class="project-list" role="list">
    {allProjects.map((p) => (
      <li>
        <a
          href={`/projects/${p.id}`}
          class:list={['project-link', { current: p.id === id }]}
        >
          {p.name}
        </a>
      </li>
    ))}
    <li class="prev-next">
      {prev && <a href={`/projects/${prev.id}`}>← {prev.name}</a>}
      {next && <a href={`/projects/${next.id}`}>{next.name} →</a>}
    </li>
  </ul>

  <!-- Right: project detail + EN toggle -->
  <div slot="right-content" class="detail-wrap">
    {project.statementEn && (
      <ENToggle
        currentLang="ja"
        jaHref={`/projects/${id}`}
        enHref={`/en/projects/${id}`}
      />
    )}

    {project.pattern === 'A' && <PatternA project={project} lang="ja" />}
    {project.pattern === 'B' && <PatternB project={project} lang="ja" />}
    {project.pattern === 'C' && <PatternC project={project} lang="ja" />}
  </div>
</Site>

<style>
  .project-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .project-link {
    font-family: var(--font-ja);
    font-size: 0.9rem;
    color: var(--color-muted);
    display: block;
    transition: color 0.15s;
  }

  .project-link:hover,
  .project-link.current {
    color: var(--color-ink);
  }

  .prev-next {
    margin-top: auto;
    padding-top: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    font-family: var(--font-latin);
    font-size: 0.75rem;
    color: var(--color-muted);
  }

  .prev-next a:hover {
    color: var(--color-ink);
  }

  .detail-wrap {
    position: relative;
    overflow-y: auto;
    height: 100dvh;
  }
</style>
```

- [ ] **Step 5: Visual test**

```bash
npm run dev
```

Open a project detail page. Confirm:
- Left column shows project list with current highlighted
- Right shows project content per pattern
- EN toggle visible only if `statementEn` exists

- [ ] **Step 6: Commit**

```bash
git add src/components/detail/ src/pages/projects/[id].astro
git commit -m "feat: Project Detail pages with patterns A, B, C"
```

---

### Task 13: Notes page

**Files:**
- Create: `src/pages/notes/index.astro`

Left: note list (date + type). Right: note body (click to navigate, or first note shown by default). For simplicity, the URL changes to `/notes?id=xxx` and the right area updates — but since this is a static site, each note gets its own URL `/notes/[id]` and the "list stays left" is handled by the layout.

Actually, for a static Astro site the cleanest approach is: `/notes` shows the list (right = first note body), and `/notes/[id]` shows a specific note. The left list stays visible in both.

- [ ] **Step 1: Create `src/pages/notes/index.astro`**

```astro
---
// src/pages/notes/index.astro
import Site from '../../layouts/Site.astro';
import { getNotes } from '../../lib/notion';

const notes = await getNotes();
const first = notes[0];
---

<Site title="Notes — YAGYU SHAW" currentPath="/notes">
  <ul slot="left-list" class="note-list" role="list">
    {notes.map((note, i) => (
      <li>
        <a
          href={`/notes/${note.id}`}
          class:list={['note-link', { current: i === 0 }]}
        >
          <time class="note-date">{note.date}</time>
          <span class="note-type">{note.type}</span>
        </a>
      </li>
    ))}
  </ul>

  <div slot="right-content" class="note-body-wrap">
    {first && (
      <article class="note-body">
        {first.title && <h1 class="note-title">{first.title}</h1>}
        <div class="note-meta">
          <time>{first.date}</time>
          <span>{first.type}</span>
        </div>
        {first.photo && (
          <img src={first.photo.url} alt="" class="note-photo" loading="lazy" />
        )}
        <div class="note-text" set:html={first.body} />
      </article>
    )}
  </div>
</Site>

<style>
  .note-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .note-link {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    transition: opacity 0.15s;
  }

  .note-link:hover,
  .note-link.current {
    opacity: 1;
  }

  .note-link:not(.current) {
    opacity: 0.5;
  }

  .note-date {
    font-family: var(--font-latin);
    font-size: 0.7rem;
    color: var(--color-muted);
  }

  .note-type {
    font-family: var(--font-ja);
    font-size: 0.85rem;
    color: var(--color-ink);
  }

  .note-body-wrap {
    padding: 2rem 2.5rem 4rem;
    max-width: 640px;
    height: 100dvh;
    overflow-y: auto;
  }

  .note-title {
    font-family: var(--font-ja);
    font-size: 1.1rem;
    font-weight: 400;
    margin: 0 0 0.5rem;
  }

  .note-meta {
    font-family: var(--font-latin);
    font-size: 0.75rem;
    color: var(--color-muted);
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .note-photo {
    width: 100%;
    height: auto;
    display: block;
    margin-bottom: 1.5rem;
  }

  .note-text {
    font-family: var(--font-ja);
    font-size: 0.9rem;
    line-height: 2;
    color: #333;
  }

  .note-text p { margin: 0 0 1rem; }
</style>
```

- [ ] **Step 2: Create `src/pages/notes/[id].astro`**

```astro
---
// src/pages/notes/[id].astro
import Site from '../../layouts/Site.astro';
import { getNotes, getNote } from '../../lib/notion';

export async function getStaticPaths() {
  const notes = await getNotes();
  return notes.map((n) => ({ params: { id: n.id } }));
}

const { id } = Astro.params;
const [note, allNotes] = await Promise.all([getNote(id!), getNotes()]);
if (!note) return Astro.redirect('/notes');
---

<Site
  title={`${note.type} — Notes — YAGYU SHAW`}
  currentPath="/notes"
>
  <ul slot="left-list" class="note-list" role="list">
    {allNotes.map((n) => (
      <li>
        <a
          href={`/notes/${n.id}`}
          class:list={['note-link', { current: n.id === id }]}
        >
          <time class="note-date">{n.date}</time>
          <span class="note-type">{n.type}</span>
        </a>
      </li>
    ))}
  </ul>

  <div slot="right-content" class="note-body-wrap">
    <article class="note-body">
      {note.title && <h1 class="note-title">{note.title}</h1>}
      <div class="note-meta">
        <time>{note.date}</time>
        <span>{note.type}</span>
      </div>
      {note.photo && (
        <img src={note.photo.url} alt="" class="note-photo" loading="lazy" />
      )}
      <div class="note-text" set:html={note.body} />
    </article>
  </div>
</Site>

<style>
  /* same as notes/index.astro */
  .note-list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:0.8rem; }
  .note-link { display:flex; flex-direction:column; gap:0.1rem; transition:opacity 0.15s; }
  .note-link:not(.current) { opacity:0.5; }
  .note-date { font-family:var(--font-latin); font-size:0.7rem; color:var(--color-muted); }
  .note-type { font-family:var(--font-ja); font-size:0.85rem; color:var(--color-ink); }
  .note-body-wrap { padding:2rem 2.5rem 4rem; max-width:640px; height:100dvh; overflow-y:auto; }
  .note-title { font-family:var(--font-ja); font-size:1.1rem; font-weight:400; margin:0 0 0.5rem; }
  .note-meta { font-family:var(--font-latin); font-size:0.75rem; color:var(--color-muted); display:flex; gap:0.75rem; margin-bottom:1.5rem; }
  .note-photo { width:100%; height:auto; display:block; margin-bottom:1.5rem; }
  .note-text { font-family:var(--font-ja); font-size:0.9rem; line-height:2; color:#333; }
  .note-text p { margin:0 0 1rem; }
</style>
```

- [ ] **Step 3: Visual test**

```bash
npm run dev
```

Open `/notes`. Confirm note list on left, first note body on right. Click a note — URL changes to `/notes/[id]`, that note's body appears.

- [ ] **Step 4: Commit**

```bash
git add src/pages/notes/
git commit -m "feat: Notes page with list/body split"
```

---

### Task 14: About page

**Files:**
- Create: `src/pages/about/index.astro`

Left: section links (Biography, Statement, ＋展示歴, ＋出版歴, Contact). Right: content. Exhibition/Publication history uses `<details>` for accordion. EN toggle shown.

This page's content comes from a static config file (no CMS) — it's edited directly in code or a separate `src/data/about.ts`.

- [ ] **Step 1: Create `src/data/about.ts`**

```ts
// src/data/about.ts
import type { AboutPage } from '../types';

export const aboutJa: AboutPage = {
  name: 'ヤギュウショウ',
  bioShort: '写真家・アーティスト。',
  bioShortEn: 'Photographer and artist.',
  bioLong: `ここに詳しい経歴を記入する。`,
  bioLongEn: `Long biography in English here.`,
  artistStatement: `ここにアーティストステートメントを記入する。`,
  artistStatementEn: `Artist statement in English here.`,
  focusAreas: ['写真', '出版', '共同制作'],
  exhibitionHistory: [
    // populate when available
  ],
  contactEmail: 'sho.yagyu@gmail.com',
  snsLinks: [],
  commercialNote: {
    text: '商業撮影・デザインのご依頼は FOLK FOLK Inc. へ。',
    link: 'https://folkfolk.jp',
  },
};
```

- [ ] **Step 2: Create `src/pages/about/index.astro`**

```astro
---
// src/pages/about/index.astro
import Site from '../../layouts/Site.astro';
import ENToggle from '../../components/ENToggle.astro';
import { aboutJa } from '../../data/about';

const about = aboutJa;
const sections = ['Biography', 'Statement', '展示歴', '出版歴', 'Contact'];
---

<Site title="About — YAGYU SHAW" currentPath="/about">
  <ul slot="left-list" class="about-nav" role="list">
    {sections.map((s) => (
      <li>
        <a href={`#${s}`} class="about-nav-link">{s}</a>
      </li>
    ))}
  </ul>

  <div slot="right-content" class="about-content">
    <ENToggle currentLang="ja" jaHref="/about" enHref="/en/about" />

    <section id="Biography" class="about-section">
      <h2 class="section-label">Biography</h2>
      <p class="bio-text">{about.bioLong}</p>
    </section>

    <section id="Statement" class="about-section">
      <h2 class="section-label">Statement</h2>
      <p class="bio-text">{about.artistStatement}</p>
    </section>

    <section id="展示歴" class="about-section">
      <details class="accordion">
        <summary class="accordion-toggle">＋ 展示歴</summary>
        <ul class="history-list">
          {about.exhibitionHistory
            .filter((ex) => ex.type === 'Exhibition')
            .map((ex) => (
              <li>
                <time>{ex.date}</time> — {ex.title}
                {ex.venueOrPublisher && <span>, {ex.venueOrPublisher}</span>}
              </li>
            ))}
        </ul>
      </details>
    </section>

    <section id="出版歴" class="about-section">
      <details class="accordion">
        <summary class="accordion-toggle">＋ 出版歴</summary>
        <ul class="history-list">
          {about.exhibitionHistory
            .filter((ex) => ['Book', 'Zine', 'Collaboration'].includes(ex.type))
            .map((ex) => (
              <li>
                <time>{ex.date}</time> — {ex.title}
                {ex.venueOrPublisher && <span>, {ex.venueOrPublisher}</span>}
              </li>
            ))}
        </ul>
      </details>
    </section>

    <section id="Contact" class="about-section">
      <h2 class="section-label">Contact</h2>
      <a href={`mailto:${about.contactEmail}`} class="contact-email">
        {about.contactEmail}
      </a>
      {about.commercialNote && (
        <p class="commercial-note">
          {about.commercialNote.link ? (
            <a href={about.commercialNote.link} target="_blank" rel="noopener">
              {about.commercialNote.text}
            </a>
          ) : (
            about.commercialNote.text
          )}
        </p>
      )}
    </section>
  </div>
</Site>

<style>
  .about-nav { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:0.6rem; }
  .about-nav-link { font-family:var(--font-ja); font-size:0.85rem; color:var(--color-muted); transition:color 0.15s; }
  .about-nav-link:hover { color:var(--color-ink); }

  .about-content { padding:2rem 2.5rem 4rem; max-width:640px; position:relative; height:100dvh; overflow-y:auto; }

  .about-section { margin-bottom:3rem; }

  .section-label { font-family:var(--font-latin); font-size:0.7rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--color-muted); font-weight:400; margin:0 0 1rem; }

  .bio-text { font-family:var(--font-ja); font-size:0.9rem; line-height:2; color:#333; margin:0; }

  .accordion { border:none; }
  .accordion-toggle { font-family:var(--font-ja); font-size:0.85rem; color:var(--color-muted); cursor:pointer; list-style:none; transition:color 0.15s; }
  .accordion-toggle:hover { color:var(--color-ink); }
  .accordion[open] .accordion-toggle { color:var(--color-ink); }

  .history-list { list-style:none; padding:0; margin:1rem 0 0; display:flex; flex-direction:column; gap:0.5rem; font-family:var(--font-latin); font-size:0.85rem; line-height:1.8; color:#444; }

  .contact-email { font-family:var(--font-latin); font-size:0.9rem; color:var(--color-ink); }
  .contact-email:hover { text-decoration:underline; }

  .commercial-note { margin-top:1.5rem; font-family:var(--font-latin); font-size:0.8rem; color:var(--color-muted); }
  .commercial-note a { text-decoration:underline; }
</style>
```

- [ ] **Step 3: Visual test**

```bash
npm run dev
```

Open `/about`. Confirm sections, accordion expand/collapse, EN toggle visible.

- [ ] **Step 4: Commit**

```bash
git add src/pages/about/ src/data/about.ts
git commit -m "feat: About page with accordion and EN toggle"
```

---

## Phase 5 — i18n (EN routes)

### Task 15: EN pages

**Files:**
- Create: `src/pages/en/index.astro`
- Create: `src/pages/en/projects/index.astro`
- Create: `src/pages/en/projects/[id].astro`
- Create: `src/pages/en/about/index.astro`

EN pages reuse the same components with `lang="en"`. Notes has no EN version — `/en/notes` redirects to `/notes`.

- [ ] **Step 1: Create `src/pages/en/index.astro`**

```astro
---
// src/pages/en/index.astro
import Site from '../../layouts/Site.astro';
import { getNotes } from '../../lib/notion';

const notes = await getNotes();
const latestNote = notes[0];
---

<Site title="YAGYU SHAW" lang="en" currentPath="/en">
  <div slot="left-list" class="home-left">
    <p class="tagline">Works of Expression</p>
    {latestNote && (
      <a href="/notes" class="latest-note-link">→ Latest Note</a>
    )}
  </div>
  <div slot="right-content"></div>
</Site>

<style>
  .home-left { display:flex; flex-direction:column; gap:1.5rem; margin-top:0.5rem; }
  .tagline { font-family:var(--font-latin); font-size:0.75rem; color:var(--color-muted); letter-spacing:0.05em; margin:0; }
  .latest-note-link { font-family:var(--font-latin); font-size:0.8rem; color:var(--color-muted); }
  .latest-note-link:hover { color:var(--color-ink); }
</style>
```

- [ ] **Step 2: Create `src/pages/en/projects/index.astro`**

```astro
---
// src/pages/en/projects/index.astro
import Site from '../../../layouts/Site.astro';
import { getProjects } from '../../../lib/microcms';

const projects = await getProjects();
---

<Site title="Projects — YAGYU SHAW" lang="en" currentPath="/en/projects">
  <ul slot="left-list" class="project-list" role="list">
    {projects.map((p) => (
      <li>
        <a
          href={`/en/projects/${p.id}`}
          class="project-link"
          data-cover={p.coverImage?.url ?? ''}
          data-cover-alt={p.nameEn ?? p.name}
        >
          {p.nameEn ?? p.name}
        </a>
      </li>
    ))}
  </ul>

  <div slot="right-content" class="hover-stage" aria-hidden="true">
    <div class="hover-img-wrap" id="hover-img-wrap">
      <img id="hover-img" src="" alt="" class="hover-img" />
    </div>
  </div>
</Site>

<style>
  .project-list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:0.6rem; }
  .project-link { font-family:var(--font-latin); font-size:0.9rem; color:var(--color-ink); display:block; transition:color 0.15s; }
  .project-link:hover { color:var(--color-muted); }
  .hover-stage { position:absolute; inset:0; }
  .hover-img-wrap { position:fixed; inset:0; z-index:1; pointer-events:none; opacity:0; transition:opacity 0.2s ease; }
  .hover-img-wrap.visible { opacity:1; }
  .hover-img { width:100%; height:100%; object-fit:cover; }
  @media (max-width:767px) { .hover-stage { display:none; } }
</style>

<script>
  const links = document.querySelectorAll<HTMLAnchorElement>('.project-link[data-cover]');
  const wrap = document.getElementById('hover-img-wrap') as HTMLDivElement;
  const img = document.getElementById('hover-img') as HTMLImageElement;
  links.forEach((link) => {
    const src = link.dataset.cover ?? '';
    const alt = link.dataset.coverAlt ?? '';
    if (src) { const pre = new Image(); pre.src = src; }
    link.addEventListener('mouseenter', () => { if (!src) return; img.src = src; img.alt = alt; wrap.classList.add('visible'); });
    link.addEventListener('mouseleave', () => { wrap.classList.remove('visible'); });
  });
</script>
```

- [ ] **Step 3: Create `src/pages/en/projects/[id].astro`**

```astro
---
// src/pages/en/projects/[id].astro
import Site from '../../../layouts/Site.astro';
import ENToggle from '../../../components/ENToggle.astro';
import PatternA from '../../../components/detail/PatternA.astro';
import PatternB from '../../../components/detail/PatternB.astro';
import PatternC from '../../../components/detail/PatternC.astro';
import { getProjects, getProject } from '../../../lib/microcms';

export async function getStaticPaths() {
  const projects = await getProjects();
  // Only generate EN pages for projects that have English content
  return projects
    .filter((p) => p.statementEn || p.summaryEn)
    .map((p) => ({ params: { id: p.id } }));
}

const { id } = Astro.params;
const [project, allProjects] = await Promise.all([
  getProject(id!),
  getProjects(),
]);

const idx = allProjects.findIndex((p) => p.id === id);
const prev = idx > 0 ? allProjects[idx - 1] : null;
const next = idx < allProjects.length - 1 ? allProjects[idx + 1] : null;
---

<Site title={`${project.nameEn ?? project.name} — YAGYU SHAW`} lang="en" currentPath={`/en/projects/${id}`}>
  <ul slot="left-list" class="project-list" role="list">
    {allProjects.map((p) => (
      <li>
        <a
          href={`/en/projects/${p.id}`}
          class:list={['project-link', { current: p.id === id }]}
        >
          {p.nameEn ?? p.name}
        </a>
      </li>
    ))}
    <li class="prev-next">
      {prev && <a href={`/en/projects/${prev.id}`}>← {prev.nameEn ?? prev.name}</a>}
      {next && <a href={`/en/projects/${next.id}`}>{next.nameEn ?? next.name} →</a>}
    </li>
  </ul>

  <div slot="right-content" class="detail-wrap">
    <ENToggle currentLang="en" jaHref={`/projects/${id}`} enHref={`/en/projects/${id}`} />
    {project.pattern === 'A' && <PatternA project={project} lang="en" />}
    {project.pattern === 'B' && <PatternB project={project} lang="en" />}
    {project.pattern === 'C' && <PatternC project={project} lang="en" />}
  </div>
</Site>

<style>
  .project-list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:0.6rem; }
  .project-link { font-family:var(--font-latin); font-size:0.9rem; color:var(--color-muted); display:block; transition:color 0.15s; }
  .project-link:hover,.project-link.current { color:var(--color-ink); }
  .prev-next { margin-top:auto; padding-top:1.5rem; display:flex; flex-direction:column; gap:0.4rem; font-family:var(--font-latin); font-size:0.75rem; color:var(--color-muted); }
  .prev-next a:hover { color:var(--color-ink); }
  .detail-wrap { position:relative; overflow-y:auto; height:100dvh; }
</style>
```

- [ ] **Step 4: Create `src/pages/en/about/index.astro`**

```astro
---
// src/pages/en/about/index.astro
import Site from '../../../layouts/Site.astro';
import ENToggle from '../../../components/ENToggle.astro';
import { aboutJa } from '../../../data/about';

const about = aboutJa;
const sections = ['Biography', 'Statement', 'Exhibitions', 'Publications', 'Contact'];
---

<Site title="About — YAGYU SHAW" lang="en" currentPath="/en/about">
  <ul slot="left-list" class="about-nav" role="list">
    {sections.map((s) => (
      <li><a href={`#${s}`} class="about-nav-link">{s}</a></li>
    ))}
  </ul>

  <div slot="right-content" class="about-content">
    <ENToggle currentLang="en" jaHref="/about" enHref="/en/about" />

    <section id="Biography" class="about-section">
      <h2 class="section-label">Biography</h2>
      <p class="bio-text">{about.bioLongEn ?? about.bioLong}</p>
    </section>

    <section id="Statement" class="about-section">
      <h2 class="section-label">Statement</h2>
      <p class="bio-text">{about.artistStatementEn ?? about.artistStatement}</p>
    </section>

    <section id="Exhibitions" class="about-section">
      <details class="accordion">
        <summary class="accordion-toggle">＋ Exhibitions</summary>
        <ul class="history-list">
          {about.exhibitionHistory
            .filter((ex) => ex.type === 'Exhibition')
            .map((ex) => (
              <li><time>{ex.date}</time> — {ex.title}{ex.venueOrPublisher && <span>, {ex.venueOrPublisher}</span>}</li>
            ))}
        </ul>
      </details>
    </section>

    <section id="Publications" class="about-section">
      <details class="accordion">
        <summary class="accordion-toggle">＋ Publications</summary>
        <ul class="history-list">
          {about.exhibitionHistory
            .filter((ex) => ['Book', 'Zine', 'Collaboration'].includes(ex.type))
            .map((ex) => (
              <li><time>{ex.date}</time> — {ex.title}{ex.venueOrPublisher && <span>, {ex.venueOrPublisher}</span>}</li>
            ))}
        </ul>
      </details>
    </section>

    <section id="Contact" class="about-section">
      <h2 class="section-label">Contact</h2>
      <a href={`mailto:${about.contactEmail}`} class="contact-email">{about.contactEmail}</a>
    </section>
  </div>
</Site>

<style>
  .about-nav { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:0.6rem; }
  .about-nav-link { font-family:var(--font-latin); font-size:0.85rem; color:var(--color-muted); transition:color 0.15s; }
  .about-nav-link:hover { color:var(--color-ink); }
  .about-content { padding:2rem 2.5rem 4rem; max-width:640px; position:relative; height:100dvh; overflow-y:auto; }
  .about-section { margin-bottom:3rem; }
  .section-label { font-family:var(--font-latin); font-size:0.7rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--color-muted); font-weight:400; margin:0 0 1rem; }
  .bio-text { font-family:var(--font-latin); font-size:0.9rem; line-height:1.9; color:#333; margin:0; }
  .accordion { border:none; }
  .accordion-toggle { font-family:var(--font-latin); font-size:0.85rem; color:var(--color-muted); cursor:pointer; list-style:none; }
  .accordion-toggle:hover { color:var(--color-ink); }
  .history-list { list-style:none; padding:0; margin:1rem 0 0; display:flex; flex-direction:column; gap:0.5rem; font-family:var(--font-latin); font-size:0.85rem; line-height:1.8; color:#444; }
  .contact-email { font-family:var(--font-latin); font-size:0.9rem; color:var(--color-ink); }
  .contact-email:hover { text-decoration:underline; }
</style>
```

- [ ] **Step 5: Add EN Notes redirect**

```astro
---
// src/pages/en/notes/index.astro
return Astro.redirect('/notes');
---
```

- [ ] **Step 6: Full build test**

```bash
npm run build
```

Expected: no TypeScript errors, all pages generate. Check `dist/` folder exists.

- [ ] **Step 7: Commit**

```bash
git add src/pages/en/
git commit -m "feat: EN routes for Home, Projects, About"
```

---

## Phase 6 — Deploy

### Task 16: GitHub Actions scheduled rebuild

**Files:**
- Create: `.github/workflows/scheduled-rebuild.yml`

- [ ] **Step 1: Create workflow file**

```yaml
# .github/workflows/scheduled-rebuild.yml
name: Scheduled Rebuild

on:
  schedule:
    - cron: "0 */6 * * *"   # every 6 hours
  workflow_dispatch: {}       # manual trigger

jobs:
  trigger-rebuild:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Cloudflare Pages deploy
        run: curl -X POST "${{ secrets.CF_PAGES_DEPLOY_HOOK_URL }}"
```

- [ ] **Step 2: Add `CF_PAGES_DEPLOY_HOOK_URL` to GitHub repo secrets**

GitHub repo → Settings → Secrets → Actions → New repository secret  
Name: `CF_PAGES_DEPLOY_HOOK_URL`  
Value: the Deploy Hook URL from Cloudflare Pages project settings

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/scheduled-rebuild.yml
git commit -m "chore: add GitHub Actions scheduled rebuild every 6 hours"
```

---

### Task 17: Cloudflare Pages deployment

- [ ] **Step 1: Push to GitHub**

```bash
git remote add origin https://github.com/YOUR_USERNAME/yagyu-portfolio.git
git push -u origin main
```

- [ ] **Step 2: Connect Cloudflare Pages**

1. Cloudflare dashboard → Workers & Pages → Create application → Pages → Connect to Git
2. Select the GitHub repo
3. Build settings:
   - Framework preset: Astro
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Environment variables (add in Cloudflare dashboard):
   - `MICROCMS_SERVICE_DOMAIN`
   - `MICROCMS_API_KEY`
   - `NOTION_TOKEN`
   - `NOTION_NOTES_DATABASE_ID`

- [ ] **Step 3: Trigger first deploy and verify**

Cloudflare Pages → Deployments → trigger deploy  
Open the `.pages.dev` URL, check all pages load, fonts render, hover works.

- [ ] **Step 4: Get Deploy Hook URL and add to GitHub secrets**

Cloudflare Pages → project → Settings → Builds & deployments → Deploy hooks → Add hook  
Copy the URL → add as `CF_PAGES_DEPLOY_HOOK_URL` in GitHub secrets (Task 16, Step 2).

---

## Self-Review Checklist

- [x] **Spec coverage**
  - Left column transparent: Task 7 (`LeftCol.astro` — no background CSS)
  - Right blank on Home: Task 10
  - Projects hover full-bleed: Task 11 (`hover-img-wrap` `position:fixed; inset:0`)
  - Project Detail left col stays: Task 12 (`[id].astro` project list in left slot)
  - Notes: Task 13
  - About accordion: Task 14 (`<details>`)
  - EN toggle right top: Tasks 9, 12, 14, 15
  - Mobile footer nav: Task 8 (`Site.astro`)
  - Logo SVG: Task 7 (`LeftCol.astro`)
  - EB Garamond + Noto Serif JP: Task 2
  - i18n routing: Task 1 (`astro.config.mjs`)
  - Scheduled rebuild: Task 16
  - Cloudflare Pages: Task 17

- [x] **Placeholder scan**: No TBD or "implement later" — all steps have code

- [x] **Type consistency**
  - `Project`, `Note`, `Photo` defined in Task 3 (`types.ts`)
  - Used consistently in Tasks 4, 5, 12, 13, 14
  - `getProjects()` / `getProject(id)` defined in Task 4, used in Tasks 11, 12, 15
  - `getNotes()` / `getNote(id)` defined in Task 5, used in Tasks 10, 13, 15
  - `PatternA/B/C` props accept `project: Project` and `lang: 'ja'|'en'`
  - `aboutJa` typed as `AboutPage` in Task 14 and referenced in Task 15
