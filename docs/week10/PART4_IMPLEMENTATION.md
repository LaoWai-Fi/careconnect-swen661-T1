# Week 10 Part 4 — Early React Implementation

Contributor: Wiliss Tako. Scope: Parts 2 and 4 plus a working PWA foundation. Branch: `feat/wiliss-wk10-web-a11y-pwa`, based on main commit `dbbfc33880aa1e9b6881d93152cd9b2d1c4a06a9`.

## Existing work and contribution

The team already had a React/Vite browser app in `web/`, with React Router, demonstration workflows and PWA scaffolding. This contribution adapts and verifies that application rather than claiming it was created from scratch. Dom's Figma Make export, [WebUIBuild at 506e920](https://github.com/LaoWai-Fi/WebUIBuild/tree/506e92023a86b61b07764e7bd9dfac80d75f96a4), was inspected as a visual/workflow reference. Existing CareConnect brand colors, clear headings and care-plan cards are retained. The desktop-style export was not copied over the working browser router or data flows.

## Core pages delivered

| Page | Route | Working behavior |
| --- | --- | --- |
| Sign in | `/signin` | Labeled fields, required/format validation, associated errors, first-invalid focus and local demo sign-in |
| Caregiver Dashboard | `/app` after choosing Caregiver | Status summary, recent activity, alerts and real links to management screens |
| Manage medications | `/app/manage-medications` | Add/edit/delete, multiple schedule times, validation, local persistence, confirmation dialog and live status feedback |

The existing sign-up and role-chooser flow is retained so the prototype can be demonstrated end to end. Other patient/caregiver routes continue to use the shared web shell.

## Responsive implementation

| Width | Navigation | Content |
| --- | --- | --- |
| 320–767px | Hamburger and modal navigation drawer | Single-column forms and cards, wrapping headings and actions |
| 768–1023px | Collapsible sidebar/compact icon rail with accessible labels | Two-column content where the actual available container width permits it |
| 1024px+ | Full sidebar and account-action labels | Multi-column dashboard and two-column medication lists |

CSS container queries respond to the space remaining beside an expanded sidebar. This avoids forcing two unusably narrow cards into a tablet layout. No clipping rule is used to conceal page overflow. The same React routes and content are used at every breakpoint.

## Running and checking

Prerequisite: Node.js 22.12+ (or another Node version supported by Vite 8). From `web/`:

```sh
npm ci
npm run dev
# Production build and PWA preview:
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
# In another terminal; the test command starts its own preview server:
npm run lint
npm run test:e2e
```

Stop a manually started server on port 4173 before running the browser suite. Tests use the installed Microsoft Edge browser on Windows. Set `PLAYWRIGHT_CHANNEL=chrome` to use installed Chrome, or install the appropriate Playwright browser and adjust the channel for another environment. PWA registration deliberately runs in production preview/deployment, not Vite development mode.

Create an account with a fictional name/email and any demonstration password of at least six characters, choose Caregiver, and exercise Dashboard → Medications. This is local mock authentication, not production security. No backend credentials are required for the three core pages.

## Delivery and evidence

- `web/src/` — implementation and reusable accessibility components.
- `web/public/manifest.webmanifest`, icons and worker template; `scripts/build-pwa.mjs` generates the production worker.
- `web/test/week10.spec.ts` — browser, accessibility and PWA regression tests.
- [TEST_RESULTS.md](TEST_RESULTS.md) — actual validation scope/results.
- [PWA_IMPLEMENTATION.md](PWA_IMPLEMENTATION.md) — caching, update, installation and deployment behavior.
- `evidence/` — native browser screenshots, axe JSON and Playwright JSON.

The screenshots are implementation evidence for these pages, not the 8–10 Figma screens at three breakpoints required for the team's separate Part 1. Part 3 performance/SEO planning remains outside this contribution.
