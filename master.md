# AutoBrief Master PRD and Codebase Audit

Review date: 2026-06-17  
Repository: `news-automation-website`  
Branch observed: `main`  
Head observed: `8d5560a` (`fixed ready and live configuration`)

## 1. Executive Summary

AutoBrief is a Next.js App Router news aggregation website. It reads published article data from Google Sheets, renders a public news website, exposes public JSON APIs, and includes a scheduled GitHub Actions RSS scraper that appends raw RSS items into a Google Sheet.

The current product is a public automated news reader with:

- Home page with featured and latest news.
- Category browsing.
- Article detail pages with metadata, structured data, sharing, and related articles.
- Search dialog powered by `/api/search`.
- Public JSON endpoints for news, posts, categories, search, post detail, and health.
- Theme switching through `next-themes`.
- RSS ingestion automation running every 30 minutes through GitHub Actions.

The codebase is compact and understandable, but several production-readiness issues need attention:

- `npm audit --omit=dev` now reports 2 moderate production vulnerabilities and no high or critical findings; the remaining issue is a vulnerable `postcss` copy nested under `next`.
- Public API error responses expose raw exception messages.
- TypeScript validation currently fails, while `next.config.mjs` disables build-time TypeScript enforcement.
- Production build compiles, but static page generation fails during article prerendering after many Google Sheets-backed pages are generated.
- Article slugs now use the Google Sheet slug column first, with a generated-title fallback. Remaining slug hardening is validation, length limits, and uniqueness checks.
- Category filtering is inconsistent because category slugs are generated with hyphens, but filtering compares raw lowercased category names.
- The repo has both `package-lock.json` and `pnpm-lock.yaml`, and Next also detected a parent lockfile outside the repo, causing workspace root inference warnings.

## 2. Product Overview

### Product Name

AutoBrief

### Product Type

Automated news aggregation and publishing website.

### Core Value Proposition

AutoBrief turns structured article data from Google Sheets into a public news website with automated ingestion, categorization, search, and SEO-friendly article pages.

### Current Audience

- General readers who want quick access to recent articles.
- Site owner/editor who manages content through Google Sheets.
- Automation operator maintaining RSS ingestion and publishing flow.
- Developers maintaining the Next.js website and workflow scripts.

### Current Maturity

Prototype to early production. The user-facing surface exists, but dependency security, build reliability, data validation, and operational hardening need work before treating it as a robust production system.

## 3. Technology Stack

### Framework and Runtime

- Next.js `16.2.9` resolved in the current lockfile (`package.json` range: `^16.1.6`)
- React `19.2.0`
- TypeScript `^5`
- App Router under `app/`
- Node.js runtime for API routes that access Google Sheets

### Styling and UI

- Tailwind CSS v4
- shadcn-style component structure under `components/ui`
- Radix UI primitives
- Lucide icons
- `next-themes` for light/dark mode

### Data and Integration

- Google Sheets as the primary data source.
- `google-auth-library` with service account JWT authentication.
- Google Sheets REST API.
- `rss-parser` for RSS ingestion.
- GitHub Actions scheduled workflow for RSS scraping.

### Tooling

- `tsx` for running TypeScript scripts.
- `npm` scripts for dev, build, start, lint.
- Both npm and pnpm lockfiles are present.

## 4. Repository Inventory

### Application Routes

- `app/page.tsx`: Home page. Loads first page of posts, categories, and featured posts.
- `app/news/[slug]/page.tsx`: Article detail page with metadata, JSON-LD, sharing, and related articles.
- `app/category/[slug]/page.tsx`: Category page.
- `app/categories/page.tsx`: Category directory.
- `app/about/page.tsx`: About page with organization structured data.
- `app/status/page.tsx`: Client-side system status page polling `/api/health`.
- `app/layout.tsx`: Root layout, theme provider, header, footer.

### API Routes

- `app/api/news/route.ts`: Public list endpoint with optional category and limit.
- `app/api/posts/route.ts`: Paginated post endpoint for infinite scroll.
- `app/api/post/route.ts`: Single post lookup by slug.
- `app/api/categories/route.ts`: Category list with counts.
- `app/api/search/route.ts`: Case-insensitive substring search.
- `app/api/health/route.ts`: Basic health response.

### Core Libraries

- `lib/google-sheets.ts`: Main data access layer, Google auth, caching, row mapping, filtering, search.
- `lib/data-source.ts`: Provider indirection layer. Currently always uses Sheets.
- `lib/types.ts`: Shared `NewsPost`, `Category`, `ApiResponse`, and `HealthResponse` types.
- `lib/utils.ts`: Tailwind class merge helper.

### UI Components

Core product components:

- `components/header.tsx`
- `components/footer.tsx`
- `components/news-card.tsx`
- `components/featured-section.tsx`
- `components/infinite-news.tsx`
- `components/search-dialog.tsx`
- `components/category-filter.tsx`
- `components/share-buttons.tsx`
- `components/theme-provider.tsx`
- `components/theme-toggle.tsx`

Reusable UI component set:

- `components/ui/*`: shadcn/Radix-style controls such as buttons, cards, dialogs, dropdowns, inputs, forms, charts, toast, tabs, tooltip, sheet, sidebar, table, etc.

### Automation Scripts

- `scripts/rss/rssScraper.ts`: Reads RSS sources from `SOURCES`, checks existing URLs in `RAW_NEWS`, and appends new rows.
- `scripts/googleSheets.ts`: Write-scope Google Sheets token helper.
- `scripts/check-env.ts`: Logs whether required Google env vars exist.

### CI and Automation

- `.github/workflows/rss-scraper.yml`: Runs every 30 minutes and manually via workflow dispatch. Installs dependencies and runs RSS scraper with GitHub Secrets.

## 5. Current Functional Behavior

### 5.1 Data Source

The app reads from the Google Sheet range `FINAL_BLOGS!A2:Q`.

Expected column mapping in `lib/google-sheets.ts`:

| Index | Field |
| --- | --- |
| 0 | id |
| 1 | source_id |
| 2 | title |
| 3 | slug |
| 4 | content_base |
| 5 | summary_base |
| 6 | category |
| 7 | author |
| 8 | published_at |
| 9 | is_published |
| 10 | is_featured |
| 11 | seo_title_base |
| 12 | seo_description_base |
| 13 | processing_status |
| 14 | ai_summary |
| 15 | ai_content |
| 16 | ai_seo_title |

### 5.2 Publishing Rules

Current code publishes rows when:

- `is_published` is `TRUE`, and
- `processing_status` is `LIVE` or `READY`.

AI content behavior:

- Published rows with `processing_status` `LIVE` or `READY` may use AI fields.
- If `ai_seo_title` passes the AI-output guard, the rendered title uses `ai_seo_title`.
- If `ai_content` passes the AI-output guard, the rendered content uses `ai_content`.
- Otherwise title/content fall back to base fields.
- The AI-output guard rejects blank values, formulas, `=AI(`-style sheet formulas, and known prompt-template fragments such as "write a short, clear", "write a clear and well-structured", and "summarize the following news".
- This `READY` behavior is intentional: a `READY` row can publish with AI title/content as long as it is explicitly marked published and the AI output passes validation.

Slug behavior:

- Column 3 `slug` is now treated as the canonical public slug.
- If column 3 is blank, the code falls back to a generated slug based on the selected final title.
- Remaining hardening: validate canonical slugs for allowed characters, maximum length, and uniqueness before publication.

### 5.3 Caching

The data layer maintains process-level memory cache:

- `cachedPosts`
- `cacheTimestamp`
- `CACHE_DURATION = 60 seconds`

Next fetch also uses:

- `next: { revalidate: 60 }` on the Google Sheets fetch.

Pages use:

- `export const revalidate = 60` on the main pages.

API route cache headers:

- `/api/news`: `s-maxage=60, stale-while-revalidate=120`
- `/api/post`: `s-maxage=60, stale-while-revalidate=300`
- `/api/categories`: `s-maxage=300, stale-while-revalidate=600`
- `/api/search`: `s-maxage=60, stale-while-revalidate=120`
- `/api/health`: no-store
- `/api/posts`: no explicit cache header

### 5.4 Home Page

Home page behavior:

- Fetches page 1 with limit 18.
- Fetches categories.
- Fetches up to 3 featured posts.
- Removes featured posts from the initial latest list.
- Renders `FeaturedSection`, `CategoryFilter`, and `InfiniteNews`.

### 5.5 Infinite Scroll

`InfiniteNews` behavior:

- Starts from server-provided initial posts.
- Loads `/api/posts?page=N&limit=18`.
- Uses `IntersectionObserver` with `rootMargin: 200px`.
- Appends results until an empty response is returned.

### 5.6 Search

Search behavior:

- Client dialog opens from header.
- Keyboard shortcut: `Cmd/Ctrl + K`.
- Debounces input by 300ms.
- Calls `/api/search?q=<query>&limit=10`.
- Server searches title, content, category, and author by lowercase substring.

### 5.7 Categories

Category list behavior:

- Categories are derived from published posts.
- Category slugs are generated by lowercasing and replacing whitespace with hyphens.
- Category pages are generated from category slugs.

Known issue:

- `getPostsByCategory` compares `p.category.toLowerCase()` directly to `categorySlug`. This fails for multi-word categories such as `World News` versus `world-news`.
- Related article lookup passes `post.category` directly to `getPostsByCategory`, which can fail when category capitalization differs.

### 5.8 Article Detail Pages

Article detail behavior:

- Static params are generated from all published posts.
- Metadata is generated from post title and content.
- Canonical URL uses `/news/${post.slug}`, where `post.slug` now prefers the sheet slug column.
- JSON-LD `NewsArticle` structured data is rendered.
- Article body is split by double newline and rendered as React text paragraphs.
- Share buttons support Twitter, Facebook, LinkedIn, and clipboard.
- Related posts are selected from same category.

Remaining slug gap:

- Canonical sheet slugs are trusted as-is.
- Slugs still need format validation, max-length enforcement, and duplicate detection.

### 5.9 Status Page

Status page behavior:

- Client-only page.
- Polls `/api/health` every 30 seconds.
- Stores uptime start in browser `localStorage`.
- Tracks in-session response history only.

Limitation:

- This is not real service uptime monitoring. It only measures the current browser session's ability to reach `/api/health`.

### 5.10 RSS Scraper

Workflow behavior:

- GitHub Actions runs at minutes 7 and 37 of every hour.
- Reads enabled RSS sources from `SOURCES!A2:E`.
- Reads existing URLs from `RAW_NEWS!D2:D`.
- Generates IDs with date prefix and serial.
- Parses up to 5 items per source.
- Appends new items to `RAW_NEWS!A:H`.

Required GitHub Secrets:

- `GOOGLE_SHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`

## 6. API Contract

### GET `/api/news`

Purpose: Return published posts.

Query parameters:

- `category` optional.
- `limit` optional positive integer.

Response:

- `200`: `NewsPost[]`
- `500`: `{ error, message }`

Security note:

- Current `500` response exposes raw `error.message`.

### GET `/api/posts`

Purpose: Return paginated posts for infinite scroll.

Query parameters:

- `page` optional, defaults to `1`.
- `limit` optional, defaults to `18`.

Response:

- `200`: `NewsPost[]`

Gaps:

- No try/catch.
- No limit cap.
- No negative page guard.
- No explicit cache header.

### GET `/api/post`

Purpose: Return a single post by slug.

Query parameters:

- `slug` required.

Response:

- `200`: `NewsPost`
- `400`: missing slug
- `404`: post not found
- `500`: raw error message

### GET `/api/categories`

Purpose: Return categories with counts.

Response:

- `200`: `Category[]`
- `500`: raw error message

### GET `/api/search`

Purpose: Search published posts.

Query parameters:

- `q` required for actual search.
- `limit` optional.

Response:

- `200`: `NewsPost[]`
- `500`: raw error message

Gaps:

- No query length cap.
- No rate limiting.

### GET `/api/health`

Purpose: Basic service health response.

Response:

```json
{
  "status": "OK",
  "timestamp": "ISO timestamp",
  "version": "1.0.0"
}
```

Gaps:

- Does not verify Google Sheets connectivity.
- Version is hard-coded.

## 7. Security Review

### 7.1 Secret Handling

Findings:

- `.env` and `.env.local` exist in the workspace.
- They are ignored by `.gitignore` via `.env*`.
- They are not tracked by Git in this checkout.
- No `.env` history was found with `git log --all -- .env .env.local`.

Risk:

- Current repository state does not show committed env secrets.
- Runtime and workflow still rely on powerful service account credentials.

Recommendation:

- Keep local env files ignored.
- Rotate credentials if they have ever been copied into issue trackers, logs, shared screenshots, or public deployments.
- Use separate read-only and write-capable service accounts.

### 7.2 Dependency Vulnerabilities

Command:

```bash
npm audit --json --omit=dev
```

Result:

- Total production vulnerabilities: 2
- High: 0
- Moderate: 2
- Critical: 0

Reported packages:

| Package | Severity | Direct | Observed version/path | Main risk |
| --- | --- | --- | --- | --- |
| `next` | Moderate | Yes | `next@16.2.9` | Reported because it includes an affected nested `postcss` dependency. |
| `postcss` | Moderate | Transitive | `next/node_modules/postcss@8.4.31` | XSS advisory in CSS stringify output for affected versions. |

Resolved since the first audit:

- High-severity audit findings for `next`, `lodash`, and `minimatch` are no longer present in the current installed/lockfile state.
- `uuid` is resolved to `13.0.2`.
- Top-level `postcss` is resolved to `8.5.15`.
- `lodash` is resolved to `4.18.1`.

Recommendation:

- Track the remaining `next`/nested-`postcss` advisory and upgrade to a patched Next.js release when available.
- Keep direct `postcss` and `uuid` at patched versions in both `package.json` and the lockfile.
- Re-run `npm audit --omit=dev` after upgrades.

### 7.3 Public Error Message Leakage

Affected routes:

- `app/api/news/route.ts`
- `app/api/post/route.ts`
- `app/api/categories/route.ts`
- `app/api/search/route.ts`

Current pattern:

- Server logs the error.
- Response includes `message: error.message`.

Risk:

- Google Sheets API failures can expose upstream response bodies, configuration details, sheet access errors, or auth-related diagnostic text to public clients.

Recommendation:

- Return generic client messages.
- Log detailed server errors privately.
- Add structured error IDs if needed.

### 7.4 Build-Time Google Sheets Fetching and Availability Risk

Observed production build:

- `next build` compiled successfully with network access.
- Type validation was skipped.
- Static generation began generating 1004 pages.
- Build failed while prerendering `/news/[slug]` due to `TypeError: fetch failed` from an upstream socket close.

Risk:

- Build success depends on live Google Sheets/API availability.
- Large static generation can repeatedly hit Google Sheets during build workers.
- One upstream/network issue can fail deployment.
- Builds may become slower and less reliable as article count grows.

Recommendation:

- Avoid prerendering every article at build time unless data is locally snapshotted.
- Consider dynamic rendering with ISR and fallback behavior.
- Fetch all posts once for static generation or persist a build-time data snapshot.
- Add retry/backoff and better failure handling around Google Sheets fetches.
- Consider moving content into a database/cache designed for public serving.

### 7.5 Slug Canonicalization and Remaining Validation Risk

Current behavior:

- `rowToPost` now reads sheet column 3 `slug` and uses it as the canonical public slug.
- If the sheet slug is blank, the code falls back to generating a slug from the selected final title.
- Final title may come from `ai_seo_title` for both `LIVE` and `READY` posts when the AI output passes validation.
- Prompt-like AI outputs and formula-like values are rejected before being used as title/content.

Resolved issue:

- The previous issue where `rowToPost` ignored column 3 and generated slugs from final titles is fixed.
- The previous build exposed a generated slug containing prompt-like text: `ai-write-a-short-clear-and-seo-friendly-news-headline-based-on-the-content-keep-it-factual-precise-and-not-clickbait-c269`. The new AI-output guard reduces recurrence of that title/content path.

Remaining risk:

- Sheet-provided slugs are trusted without validation.
- Missing sheet slugs still fall back to generated title slugs.
- Duplicate titles can create duplicate slugs.
- Duplicate sheet slugs can create route ambiguity.
- Existing links can break.

Recommendation:

- Validate slugs for allowed format, uniqueness, and length.
- Require canonical slugs before publication or fall back to immutable IDs.
- Generate fallback slugs once during ingestion/editorial processing, not at render time.
- Fall back to `id` only if slug is missing.

### 7.6 Missing Input Bounds and Rate Limiting

Affected endpoints:

- `/api/search`
- `/api/posts`
- `/api/news`

Risks:

- Large limits can request more data than intended.
- Search can scan all cached content for arbitrary query lengths.
- Public endpoints have no rate limiting.

Recommendation:

- Enforce maximum `limit`, such as 50.
- Enforce `page >= 1`.
- Enforce search query min/max length.
- Add rate limiting at hosting platform, middleware, or edge layer.

### 7.7 RSS Source SSRF/Abuse Risk

Current behavior:

- RSS source URLs come from the `SOURCES` sheet.
- Enabled rows are fetched by `parser.parseURL(rssUrl)`.
- There is no allowlist or URL validation.

Risk:

- If a sheet editor is compromised or untrusted, the GitHub Actions runner can be made to fetch arbitrary URLs.
- This is an SSRF-style risk in the automation environment.

Recommendation:

- Validate protocol is `https`.
- Deny localhost/private/link-local IP ranges after DNS resolution.
- Maintain an allowlist of source domains.
- Log source fetch failures with enough internal detail for operators, but avoid exposing secrets.

### 7.8 Google Sheets Credential Scope

Current behavior:

- Website uses read-only Sheets scope.
- RSS scraper uses full spreadsheets scope.

Risk:

- If the workflow service account key leaks, an attacker can modify accessible sheets.

Recommendation:

- Use a dedicated write-capable service account only for automation.
- Give that account access only to the required spreadsheet.
- Store secrets only in GitHub Secrets or deployment secret stores.
- Rotate keys regularly.

### 7.9 Missing Security Headers

Current behavior:

- `next.config.mjs` does not define security headers.

Recommendation:

- Add headers such as:
  - `Content-Security-Policy`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy`
  - `Permissions-Policy`
  - `Strict-Transport-Security` on HTTPS production domains

### 7.10 `dangerouslySetInnerHTML` Usage

Current uses:

- Article JSON-LD in `app/news/[slug]/page.tsx`.
- Organization JSON-LD in `app/about/page.tsx`.
- Dynamic chart style generation in `components/ui/chart.tsx`.

Assessment:

- Article body is not rendered as HTML, which reduces XSS risk.
- JSON-LD is generated with `JSON.stringify`, which is safer than injecting raw HTML.
- Chart styles could become unsafe if untrusted chart config values are passed in the future.

Recommendation:

- Keep article content rendered as React text unless a sanitizer is introduced.
- If HTML content is ever supported, sanitize with a proven server-side HTML sanitizer.
- Treat chart color config as trusted-only or validate CSS color values.

### 7.11 External Share Links

Current behavior:

- Share anchors use `target="_blank"` without explicit `rel="noopener noreferrer"`.

Risk:

- Modern browsers often imply `noopener`, but explicit `rel` is still recommended.

Recommendation:

- Add `rel="noopener noreferrer"` to all external `target="_blank"` links.

## 8. Functional and Technical Findings

### High Priority Findings

1. Remaining dependency vulnerabilities must be patched or explicitly accepted before production hardening.
2. Public API routes leak raw error messages.
3. TypeScript errors are hidden from builds because `typescript.ignoreBuildErrors` is enabled.
4. Production build can fail during prerendering because it depends on live Google Sheets fetches across many pages.
5. Slug canonicalization now uses the sheet slug column, but slug validation and uniqueness checks are still missing.

### Medium Priority Findings

1. Category filtering breaks for multi-word category slugs and related articles.
2. `/api/posts` lacks error handling, input bounds, and cache headers.
3. Search has no query-length cap or rate limiting.
4. Multiple lockfiles reduce install/build determinism.
5. GitHub Actions uses `npm install` instead of `npm ci`.
6. RSS source URLs are not allowlisted.
7. `next/font/google` requires network access during build unless fonts are cached or self-hosted.

### Low Priority Findings

1. `styles/globals.css` appears unused while `app/globals.css` is imported.
2. `components/ui/toaster.tsx` imports a missing hook path.
3. `hooks/use-mobile.ts` and `components/ui/use-mobile.tsx` duplicate the same hook.
4. `Analytics` is imported in `app/layout.tsx` but not rendered.
5. Root layout wraps children in `<main>`, and some pages also render `<main>`, creating nested main landmarks.
6. Status page measures browser-session status, not real platform uptime.
7. Share button tooltip uses `group-hover` but the parent button does not have a `group` class.
8. Mobile menu button links to categories rather than opening a navigation menu.

## 9. Verification Results

### Git State

Before writing this file:

- `git status --short` showed no local changes.
- `.env` and `.env.local` were ignored and untracked.

### Secret Tracking Check

Commands:

```bash
git ls-files -- .env .env.local
git check-ignore -v .env .env.local
git log --all --oneline -- .env .env.local
```

Result:

- No tracked env files.
- `.gitignore` ignores `.env*`.
- No env file history found in this checkout.

### Lint

Command:

```bash
npm run lint
```

Result:

- Failed because `eslint` is not installed.

Output summary:

```text
sh: eslint: command not found
```

### TypeScript

Command:

```bash
npx tsc --noEmit
```

Result:

- Failed.

Errors:

- `components/ui/toaster.tsx` cannot find `@/hooks/use-toast`.
- Destructured toast fields have implicit `any` types because the import fails.

### Production Build

Command:

```bash
npm run build
```

Sandboxed result:

- Failed fetching Google Fonts because network was restricted.

Network-enabled result:

- Compilation succeeded.
- Type validation was skipped.
- Static generation started for 1004 pages.
- Build failed during article prerendering due to upstream `fetch failed`.

Important build warning:

- Next inferred the workspace root as `/Users/mohdkaifansari` because multiple lockfiles were detected, including a parent `package-lock.json` outside this repo and this repo's `pnpm-lock.yaml`.

## 10. Product Requirements Document

### 10.1 Problem Statement

Publishing news from multiple sources requires ingestion, filtering, transformation, editorial approval, and fast public presentation. The current system uses Google Sheets as a lightweight editorial database and a Next.js website as the publishing layer, but it needs stronger reliability, data validation, security, and operational controls to scale safely.

### 10.2 Goals

1. Provide a fast public news reading experience.
2. Automate RSS ingestion into a structured editorial pipeline.
3. Publish only approved content.
4. Support SEO-friendly article pages.
5. Keep content operations simple through Google Sheets.
6. Protect secrets and upstream integration details.
7. Make builds and deployments reliable.
8. Maintain stable URLs for all published articles.

### 10.3 Non-Goals

1. Building a full CMS admin interface in the current phase.
2. User accounts, comments, or personalization.
3. Paid subscriptions or gated content.
4. Real-time breaking-news push notifications.
5. Replacing Google Sheets immediately, unless scale requires it.

### 10.4 Personas

#### Reader

Needs:

- Browse latest news quickly.
- Search topics.
- Filter by category.
- Open article detail pages.
- Share articles.

Success criteria:

- Pages load quickly.
- Articles are readable on mobile and desktop.
- Search returns relevant results.

#### Editor/Owner

Needs:

- Control what gets published.
- Use familiar tools such as Google Sheets.
- Mark posts as ready/live.
- Feature important posts.

Success criteria:

- Only intended posts appear publicly.
- Titles, slugs, categories, and status are predictable.
- Bad data is caught before publication.

#### Automation Operator

Needs:

- Reliable scheduled RSS ingestion.
- Safe source management.
- Clear logs and failure visibility.

Success criteria:

- Workflow runs every 30 minutes.
- Duplicate URLs are not reinserted.
- Invalid RSS sources do not break the whole job.

#### Developer

Needs:

- Deterministic installs and builds.
- Passing type checks and linting.
- Safe API errors.
- Clear data contracts.

Success criteria:

- `npm ci`, type check, lint, audit, and build run predictably.
- Failures are actionable.
- Security issues are visible in CI.

### 10.5 Current Functional Requirements

| ID | Requirement | Current status |
| --- | --- | --- |
| FR-001 | Show latest published posts on homepage. | Implemented |
| FR-002 | Show featured posts. | Implemented |
| FR-003 | Browse all categories. | Implemented |
| FR-004 | Browse posts by category. | Partially implemented; slug mismatch bug |
| FR-005 | View individual article pages. | Implemented |
| FR-006 | Generate article metadata and JSON-LD. | Implemented |
| FR-007 | Search posts by text. | Implemented |
| FR-008 | Infinite scroll latest posts. | Implemented |
| FR-009 | Toggle dark/light theme. | Implemented |
| FR-010 | Share articles externally. | Implemented |
| FR-011 | Expose public news APIs. | Implemented |
| FR-012 | Poll basic health endpoint. | Implemented |
| FR-013 | Scrape RSS sources on a schedule. | Implemented |
| FR-014 | Avoid duplicate RSS URLs. | Implemented |
| FR-015 | Use valid AI fields for published `LIVE` and `READY` rows. | Implemented intentionally |

### 10.6 Required Improvements

| ID | Requirement | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| RQ-001 | Patch production dependency vulnerabilities. | P0 | `npm audit --omit=dev` shows no high or moderate production vulnerabilities unless explicitly accepted. |
| RQ-002 | Remove raw error messages from public APIs. | P0 | Public 500 responses return generic messages; server logs retain details. |
| RQ-003 | Re-enable TypeScript enforcement in builds. | P0 | `typescript.ignoreBuildErrors` is removed or false; `npx tsc --noEmit` passes. |
| RQ-004 | Fix toast hook import. | P0 | `components/ui/toaster.tsx` imports the actual hook path or the hook is moved to `hooks/use-toast.ts`. |
| RQ-005 | Validate canonical slugs. | P0 | Public URLs use the sheet slug column or immutable fallback, and every slug is URL-safe, length-limited, and unique. |
| RQ-006 | Fix category slug matching. | P1 | Category pages and related articles work for multi-word and mixed-case categories. |
| RQ-007 | Bound API parameters. | P1 | `page`, `limit`, and `q` are validated; invalid values return 400 or safe defaults. |
| RQ-008 | Add rate limiting. | P1 | Search and list APIs have reasonable request limits. |
| RQ-009 | Make builds independent from fragile live fetches. | P1 | Production build succeeds even when one article fetch fails or upstream temporarily flakes. |
| RQ-010 | Resolve lockfile strategy. | P1 | Repo uses one package manager and one lockfile; CI uses deterministic install. |
| RQ-011 | Add security headers. | P1 | Production responses include CSP and common hardening headers. |
| RQ-012 | Validate RSS source URLs. | P1 | RSS scraper accepts only allowed domains/protocols and rejects private network targets. |
| RQ-013 | Add observability. | P2 | Scraper and APIs expose useful internal logs/metrics without leaking secrets. |
| RQ-014 | Improve health checks. | P2 | Health can optionally verify data-source connectivity and report degraded status internally. |
| RQ-015 | Add content validation. | P2 | Rows missing required fields or containing prompt/template text are rejected or hidden. |

### 10.7 Data Requirements

Required public post fields:

- `id`
- `title`
- `slug`
- `content`
- `category`
- `publishedAt`

Optional public post fields:

- `summary`
- `author`
- `isFeatured`
- `isBreaking`
- `readingTime`
- `views`

Recommended additional internal fields:

- `sourceUrl`
- `canonicalSlug`
- `validationStatus`
- `validationErrors`
- `lastModifiedAt`
- `publishedBy`
- `seoDescription`
- `imageUrl`

### 10.8 Data Validation Rules

Before publication:

- `id` must be unique.
- `slug` must be unique, lowercase, URL-safe, and length-limited.
- `title` must be present and length-limited.
- `content` must be present and above a minimum length.
- `category` must map to a known category slug.
- `publishedAt` must be a valid date.
- `is_published` must be explicit `TRUE`.
- `processing_status` may be `LIVE` or `READY` for AI-generated public fields; this is intentional as long as the row is explicitly published and AI output passes validation.
- Prompt-like placeholder text must be rejected.

### 10.9 API Requirements

All APIs should:

- Return JSON.
- Validate query parameters.
- Return generic public errors.
- Avoid leaking upstream messages.
- Include cache headers where appropriate.
- Include request IDs in logs.
- Support bounded pagination.

Recommended response wrapper:

```json
{
  "success": true,
  "data": []
}
```

Recommended error response:

```json
{
  "success": false,
  "error": "Internal Server Error",
  "requestId": "..."
}
```

### 10.10 Security Requirements

P0 requirements:

- No tracked secrets.
- No raw upstream errors returned to public users.
- No known high-severity production dependency vulnerabilities.
- Type checks must pass before deployment.
- Service account credentials must be least-privilege.

P1 requirements:

- API rate limiting.
- Security headers.
- RSS URL allowlisting.
- Parameter validation with schema validation.
- Dependency audit in CI.

P2 requirements:

- Secret rotation policy.
- Alerting for failed scraper runs.
- Monitoring for high error rates.
- Optional content moderation/validation checks.

### 10.11 Performance Requirements

Target requirements:

- Home page should serve from cache/ISR under normal operation.
- Search should respond quickly for current data size and degrade safely as content grows.
- Infinite scroll should cap page size.
- Build should not fetch the entire sheet repeatedly per page.
- Google Sheets should not be the hot path for every public request at scale.

Recommended future architecture:

1. RSS and editorial processing write to Sheets or a database.
2. A publishing job validates and snapshots public posts.
3. Website reads from a cached JSON artifact, database, or edge cache.
4. Google Sheets remains editorial input, not the only production serving layer.

### 10.12 SEO Requirements

Current:

- Page metadata exists.
- Article JSON-LD exists.
- Canonical URLs exist.
- About page organization schema exists.

Required improvements:

- Use stable slugs.
- Add sitemap generation.
- Add robots configuration.
- Add OpenGraph images.
- Use explicit `metadataBase` globally.
- Avoid prompt text or bad AI output in titles/descriptions.

### 10.13 Accessibility Requirements

Current strengths:

- Semantic links and buttons are mostly used.
- Theme toggle has screen-reader text.
- Search dialog has hidden title.

Required improvements:

- Avoid nested `<main>` landmarks.
- Ensure mobile navigation is complete.
- Add accessible labels to external share buttons.
- Ensure status colors are not the only status indicator.

### 10.14 Operational Requirements

Required:

- Deterministic install command.
- Clear package manager choice.
- CI checks for type, lint, audit, and build.
- Scheduled scraper failure visibility.
- Deployment should not require live Google Fonts fetch if avoidable.

Recommended CI:

```bash
npm ci
npm audit --omit=dev
npx tsc --noEmit
npm run lint
npm run build
```

This requires adding/configuring ESLint first.

## 11. Prioritized Roadmap

### Phase 0: Security and Build Stabilization

1. Resolve or formally accept the remaining moderate dependency advisories.
2. Fix TypeScript errors.
3. Enable build type checking.
4. Remove raw API error messages.
5. Add validation and uniqueness checks for canonical sheet slugs.
6. Fix production build strategy for article pages.

### Phase 1: Data and API Hardening

1. Add Zod validation for query params and sheet rows.
2. Fix category slug matching.
3. Add pagination bounds.
4. Add API rate limiting.
5. Add security headers.
6. Validate RSS source URLs.
7. Choose npm or pnpm and remove the other lockfile.

### Phase 2: Product Completeness

1. Add sitemap and robots support.
2. Add OpenGraph image support.
3. Improve status page into real status/health view.
4. Add content validation dashboard or report.
5. Add monitoring and alerts for scraper failures.
6. Add reading time calculation.

### Phase 3: Scale and Maintainability

1. Add persistent content cache or database.
2. Move from live Sheets serving to published snapshots.
3. Add admin/editor workflow if Sheets becomes limiting.
4. Add automated tests for data mapping, APIs, and core components.

## 12. Recommended Immediate Fix List

1. Resolve the remaining `next` nested-`postcss` audit finding when a patched Next.js release is available.
2. Fix `components/ui/toaster.tsx` import from `@/hooks/use-toast` to the correct path or move the hook.
3. Remove `typescript.ignoreBuildErrors: true` after TypeScript passes.
4. Replace public API error messages with generic responses.
5. Add validation and duplicate detection for `row[3]` canonical slugs.
6. Add a shared `slugifyCategory` helper and use it in category generation, category filtering, and related posts.
7. Cap API `limit` values and validate `page`.
8. Add `rel="noopener noreferrer"` to external share links.
9. Pick one lockfile/package manager and update CI to use deterministic install.
10. Add RSS source URL validation.

## 13. Open Questions

1. Should bad or missing canonical slugs block publication, or should the system fall back to immutable IDs?
2. Who can edit the Google Sheets source tabs?
3. Should RSS sources be restricted to a fixed approved domain list?
4. What deployment platform is the production target: Netlify, Vercel, or another host?
5. Should Google Sheets remain the serving data source, or only the editorial input?
6. Should all articles be statically generated, or should detail pages render dynamically with ISR?
7. Is AI generation handled outside this repository? If yes, where are validation and moderation enforced?

## 14. Final Assessment

AutoBrief has a clear foundation: a Next.js public site, Google Sheets-backed publishing, RSS automation, and a useful API surface. The canonical slug issue has been partly resolved by using the sheet slug column and guarding against prompt-like AI outputs. The biggest remaining risks are operational and security hardening gaps: dependency updates, type/build enforcement, safe error handling, slug validation/uniqueness, category filtering correctness, and making deployment independent from fragile repeated live Google Sheets fetches.
