# Session changes — requested work vs implementation

This document maps **what was asked for** in the chat to **what was implemented**, with the main files touched. Dates reflect the Hauser / `hasure` workspace session (April 2026).

It also records **gaps vs the product narrative** in **`Hauser_AI_Workbench v0.2.pptx`** (AI Diligence Workbench — Archetype × Hauser, April 2026): five layers, Phase 1 epics E1–E8, and value gates.

---

## Workbench v0.2 (deck) vs this repo — what we have vs what’s missing

Legend: **Yes** = meaningful implementation · **Partial** = UI, types, or demo-only path · **No** = not started / stub only

### Five layers (continuous workflow)

| Layer (deck) | In `hasure` today | Missing vs deck |
|--------------|-------------------|-----------------|
| **1 — Intake & parsing** | Deal-scoped documents, upload (PDF/Word/Excel/EML), PHI flag, taxonomy classify (`/api/ai/classify`), local persistence | No production parsing pipeline (OCR/scanned PDF as a service), no isolated tenant/Azure boundary, Word/Excel parsing not server-side for diligence content |
| **2 — DRL auto-population** | DRL templates by practice line, tracker UI, status + link to `documentId`, demo seed matchers | **Auto**-map from extractions to DRL rows in real time; missing-doc flags are manual/demo; **no DRL Excel export** (deck E2) |
| **3 — Rules-based gap detection** | Findings list, severities, `ruleId` strings, source-ish fields on extractions | No **encoded** P&C (50+) or EB rule packs, no deterministic firing, no **Mercer/KFF/PEPY–CMS AV** benchmarking layer, no systematic **source passage** citation per rule hit |
| **4 — Reasoning engine & KB** | AI extract/classify endpoints; findings as narrative objects | No explicit **reasoning chain**, M&A-context packaging, recommendation object model, or **training mode** per analyst/deal |
| **5 — Output generation** | Report hub: summary UI, TL approval toggle, export buttons | Exports are **demo toasts** only (no `.docx` / `.pdf` file generation); no separate **First 100 Days** artifact; no **three deal-size templates**; deck: outputs only from **analyst-validated** findings — not enforced in export pipeline |

Deck principle *“No AI-generated finding enters any client deliverable without explicit analyst approval”*: **Partial** — approval gate exists for export UI; findings workflow exists, but **no real deliverable** is generated and validation is not wired end-to-end.

### Phase 1 epics (slide 5)

| Epic | Scope (deck) | Repo |
|------|----------------|------|
| **E1** | Document ingestion & deal workspace; manual upload; PHI; list view | **Partial** — workspace + list + upload; auth is **email/password demo**, not Azure AD SSO |
| **E2** | DRL management & tracking; P&C & Benefits templates; status; **Excel export** | **Partial** — tracker + templates; **No** Excel export |
| **E3** | AI extraction & gap detection; CR/EB frameworks; PEPY/PEPM vs Mercer/KFF; CMS AV | **Partial** — generic classify/extract APIs + UI; **No** framework-backed gap engine or benchmarks |
| **E4** | Draft DD report & First 100 Days; **three templates**; in-platform edit; **.docx + PDF** export | **No** — preview/shell only; exports stubbed |
| **E5** | Analyst override & audit trail; HIPAA-compliant; **exportable** by team lead | **Partial** — extractions/findings edits + `activityLogs`; **No** HIPAA-grade log product or downloadable audit package |
| **E6** | Knowledge capture & **training mode**; admin rule validation UI; rules seeded from CR/EB | **No** |
| **E7** | Security: **Azure** in Hauser tenant, **Azure AD SSO**, RBAC, HIPAA baseline, uptime | **No** — local Next app + Zustand persist demo |
| **E8** | **Rule-firing traceability log** (rule ID, framework, document, passage, confidence, severity) | **No** — no rule engine event stream |

### Phase 2 (deck — intentionally out of Phase 1)

Not expected in this demo: Fulcrum bridge, PE read-only portal, Applied Epic, Power BI portfolio dashboards, international deals, large-deal template (unless provided). Listed here so we do not count them as “bugs” in Phase 1 scope.

### Value gates & measurement (deck M2 / M3)

| Gate | Deck asks | Repo |
|------|------------|------|
| **M2** | Time on document review & DRL population before vs after; real P&C run with citations | **No** instrumentation or baseline capture |
| **M3** | Shadow deal; platform vs existing process; draft report from validated findings | **No** comparison workflow or real report output |

---

## Summary table (request → result)

| # | User request (paraphrased) | What we did | Primary files |
|---|---------------------------|---------------|----------------|
| 1 | **“Give light mode as well”** — explicit light theme, not only system/dark shell | Light **sidebar** tokens in `:root`; **theme switcher** (Light / Dark / System); **`enableColorScheme`** on `next-themes`; theme control on **login** and **dashboard header** | `app/globals.css`, `components/theme-toggle.tsx` (new), `components/app-providers.tsx`, `components/layout/header.tsx`, `app/(auth)/login/page.tsx` |
| 2 | **Light mode but sidebar stayed dark** (screenshot follow-up) | Re-applied light sidebar CSS on **`:root:not(.dark)`** inside `@layer base` so it wins over later `:root` resets from the CSS pipeline | `app/globals.css` |
| 3 | **“AI classification and other tab is not working”** | Wired **Classify** and **Extract Data** from document cards to **`POST /api/ai/classify`** and **`POST /api/ai/extract`**, then **`updateDocument`** / **`addExtraction`** / **`logActivity`** + toasts; **busy state** on card menu while AI runs | `app/(dashboard)/dashboard/deals/[id]/documents/page.tsx`, `components/documents/document-card.tsx`, `app/api/ai/extract/route.ts` |
| 4 | Deal workspace **cards / “tabs”** type errors (`highlight`, `count` on mixed link shapes) | Introduced **`WorkspaceNavLink`** type; **`workspaceLinkDefs`** as a typed array (removed brittle `as const` union) | `app/(dashboard)/dashboard/deals/[id]/page.tsx` |

---

## Feature detail table

| Area | Behavior after change | Notes |
|------|------------------------|--------|
| **Theme** | User can pick **Light**, **Dark**, or **System** from the header (and login). Browser `color-scheme` follows theme. | `ThemeProvider`: `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `enableColorScheme`. |
| **Sidebar (light)** | In non-dark mode, sidebar uses the same **light rail** palette as the rest of the app. | Dark mode still uses `.dark { … }` sidebar variables. |
| **Classify** | Calls `/api/ai/classify` with document name + optional extracted text; updates **category** and **classificationConfidence**; activity + toast. | API already existed; UI was previously TODO-only. |
| **Extract** | Calls `/api/ai/extract` with document id, text snippet, and **category**; appends **pending** extractions to the store; sets demo **extractedText** / **ocrProcessed**; activity + toast. | Extract route hardened for invalid JSON and defaults. |
| **Deal hub cards** | TypeScript-safe optional **`count`** / **`highlight`** on workspace links. | Fixes `tsc` errors on `highlight` / `count` access. |

---

## Files created or materially edited

| File | Role |
|------|------|
| `components/theme-toggle.tsx` | **New** — dropdown: Light / Dark / System; sun/moon trigger; hydration-safe disabled state. |
| `app/globals.css` | Light **sidebar** `:root` tokens; **`:root:not(.dark)`** sidebar overrides; existing `.dark` block unchanged in intent. |
| `components/app-providers.tsx` | `ThemeProvider` gains **`enableColorScheme`**. |
| `components/layout/header.tsx` | Renders **`ThemeToggle`**. |
| `app/(auth)/login/page.tsx` | Top-right **`ThemeToggle`** on auth layout. |
| `app/(dashboard)/dashboard/deals/[id]/documents/page.tsx` | **`handleClassify`** / **`handleExtract`**; store + fetch + toasts; **`aiBusyDocId`**. |
| `components/documents/document-card.tsx` | **`isAiBusy`**; Classify/Extract use **`onSelect`**; trigger disabled while busy. |
| `app/api/ai/extract/route.ts` | Safe JSON body handling; defaults for **`category`** / **`documentId`**; length guard on **`documentText`**. |
| `app/(dashboard)/dashboard/deals/[id]/page.tsx` | **`WorkspaceNavLink`** + typed **`workspaceLinkDefs`**; **`LucideIcon`** import for typing. |

---

## Not changed (for clarity)

| Item | Reason |
|------|--------|
| `app/api/ai/classify/route.ts` | Logic already implemented; **documents UI** was wired to use it. |
| `app/layout.tsx` | Already used `AppProviders` / theme shell; no structural change required for these requests. |
| Product **README.md** at repo root | This repo had no root README in-tree; this file serves as the **session changelog** you asked for. |

---

## Quick verification checklist

| Check | Action |
|-------|--------|
| Light shell | Set theme to **Light** → sidebar + main content both light. |
| Classify | Documents → **⋯** → **Classify** → category/confidence update + toast. |
| Extract | **⋯** → **Extract Data** → rows under **Raw AI extractions** for the deal. |
| Types | Run `npx tsc --noEmit` — should exit **0**. |

If styles look stale after CSS edits, restart the dev server or remove `.next` once and rebuild.
