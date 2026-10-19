# Week 10 Part 2 — Web Accessibility Documentation

Project: CareConnect · Contributor: Wiliss Tako · Date: 20 October 2026 (Asia/Kolkata)

Scope: the responsive browser application in `web/`, with focused implementation and evidence for Sign in (`/signin`), Dashboard (`/app`, caregiver view), and Manage medications (`/app/manage-medications`). Shared navigation, dialogs, form fields and PWA feedback support the other existing routes. This report covers Part 2; it does not replace the team's Figma or performance/SEO deliverables.

## 1. Semantic HTML structure

The public sign-in screen contains a page `header` and one `main`. The signed-in application has the following source order, which matches the desktop visual order:

```
Skip to main content
Connection/update feedback (when relevant)
header — brand, account actions, date and care-plan context
div.web-workspace
  aside — care-plan navigation on tablet/desktop
    nav — Main navigation
  main#main-content — one page h1 and the current screen
    section — a named group such as Current medications
      ul > li > article — an independent prescription record
footer — prototype context, support contacts and installation instructions
dialog — mobile navigation or a confirmation, only exposed while open
```

`article` is used for a prescription record that makes sense independently. `section` groups related content under a heading. `aside` contains the secondary navigation area. Containers with no semantic purpose remain `div` elements. Semantic tags are not added merely to satisfy a checklist.

Implementation: `web/src/components/Layout.tsx`, `Modal.tsx`, and `web/src/pages/ManageMedications.tsx`.

## 2. ARIA landmarks and accessible names

| HTML element | Implicit landmark/role | Use |
| --- | --- | --- |
| Page-level `header` | `banner` | Product identity and account actions |
| `nav aria-label="Main navigation"` | `navigation` | Current role's destinations |
| `main id="main-content"` | `main` | One primary content region per page |
| Page-level `footer` | `contentinfo` | Support and installation information |
| Named `aside` | `complementary` | Care-plan navigation container |
| Named `section` | `region` | Related screen content |
| Native `dialog` opened with `showModal()` | `dialog` | Named, modal navigation/confirmation |

Native elements already supply the roles named in the rubric; redundant explicit roles are unnecessary. `NavLink` exposes `aria-current="page"`. Hidden tablet labels remain available to assistive technology. Decorative Lucide icons use `aria-hidden="true"`. Accessible names include visible button/link text; redundant `aria-label` values that hid part of a quick-link's visible text were removed.

## 3. Skip links and route changes

`RouteAccessibility.tsx` renders one global **Skip to main content** link before page controls. It becomes visible on focus. Activating it focuses `main#main-content`, which is programmatically focusable with `tabindex="-1"` and does not create an extra ordinary Tab stop. All public and app routes use that same target.

React Router handles browser URLs, links and Back/Forward. After a client-side route change, the page heading receives focus and the document title reflects the heading. Initial page loading does not intentionally steal focus. The native heading announces the destination; no duplicate assertive page announcement is added.

## 4. Form accessibility

`Field.tsx` supplies a stable input ID, matching visible `label`, native `required`, a visible required marker plus screen-reader text, and `aria-invalid` when appropriate. `aria-describedby` references only helper/error elements that are currently rendered and preserves caller-provided descriptions. Instructions are not conveyed solely through placeholders or color.

Sign-in/sign-up validation preserves input and moves focus to the first invalid field. An account-level failure moves focus to a readable error summary. The medication form uses a focusable error summary, inline messages and a `fieldset`/`legend` for schedule times; opening the form focuses the medication name. Saving and deleting publish a polite status message. All authentication is a local course demonstration: passwords are not stored or verified, and fictional account details must be used.

## 5. Keyboard navigation and modal focus

| Context | Behavior |
| --- | --- |
| Mobile, 320–767 CSS px | Hamburger opens a named modal drawer. Close, all destinations, Tab/Shift+Tab and Escape work by keyboard. |
| Tablet, 768–1023 CSS px | A labeled button expands/collapses the sidebar and exposes `aria-expanded`. Labels stay in the accessibility tree when visually collapsed. |
| Desktop, 1024+ CSS px | Full navigation remains visible before the main content in source and visual order. |
| Modal dialog | `showModal()` makes the background inert. Tab/Shift+Tab explicitly wrap at the first/last control. Escape and Close dismiss it. |
| Confirmation | Initial focus goes to Cancel, the less destructive choice. Cancel/Escape restore the triggering button. If that button is removed, focus falls back to the main heading. |
| Breakpoint change | An open mobile drawer closes when resized to tablet/desktop; focus returns to a visible, logical target. |

Only active modal dialogs contain focus. Ordinary page navigation and the installation offer do not trap focus. Focus outlines remain visible; reduced-motion preferences suppress nonessential transitions. Controls are sized for touch as well as keyboard use. Layout is allowed to reflow rather than hiding horizontal overflow.

## 6. Screen-reader considerations

- One `h1` per core screen, followed by meaningful `h2`/`h3` groups. Heading order is maintained across breakpoints.
- Descriptive links such as **View all recent activity** and **Caregiver and support contacts** identify their destinations.
- Polite live regions report medication actions, connectivity and pending updates. Validation errors are announced without requiring visual inspection.
- The install banner never steals focus when it appears. Dismissing it while focused returns focus to the page heading.
- CSS reflow preserves the same destinations and names across device sizes. The sidebar appears before content in both source and visual order.

These are implemented screen-reader support patterns and automated checks. This Week 10 run does not claim a new manual NVDA or VoiceOver session, an assistive-technology certification, or full WCAG conformance for every legacy screen.

## 7. Relevant WCAG 2.1 criteria and verification

| Criteria | Implementation / evidence |
| --- | --- |
| 1.3.1 Info and Relationships; 1.3.2 Meaningful Sequence | Landmarks, headings, labels, prescription articles and consistent DOM/visual order |
| 1.4.3 Contrast (Minimum); 1.4.10 Reflow | Browser-rendered axe checks on the three core screens at seven widths; overflow checks and 200% text-size check |
| 2.1.1 Keyboard; 2.1.2 No Keyboard Trap | Keyboard drawer/confirmation tests and Escape/focus restoration |
| 2.4.1 Bypass Blocks; 2.4.2 Page Titled; 2.4.3 Focus Order | Global skip link, route titles/focus, source order |
| 2.4.4 Link Purpose; 2.4.6 Headings and Labels; 2.4.7 Focus Visible | Descriptive links, heading hierarchy, keyboard outlines |
| 2.5.3 Label in Name | Visible text is included in control names; rendered axe checks |
| 3.3.1 Error Identification; 3.3.2 Labels or Instructions | Required fields, associated inline errors and focusable summaries |
| 4.1.2 Name, Role, Value; 4.1.3 Status Messages | Native controls, current-page/expanded states and live feedback |

Actual run results are in [TEST_RESULTS.md](TEST_RESULTS.md), with raw browser scans and screenshots in [evidence/](evidence/). Automated results cover the tested rules/states and are not a blanket conformance statement. Axe's `incomplete` results are retained for human review.

## 8. Recommended human verification before broader release

1. In NVDA on Windows or VoiceOver on macOS, read the sign-in labels/errors, heading list, landmarks, medication status and dialog title.
2. Use only Tab, Shift+Tab, Enter, Space and Escape through sign-in, navigation, add medication and Cancel/delete confirmation.
3. On an actual phone/tablet, check portrait/landscape, text enlargement, visible focus, touch controls and installation.
4. Record device/browser/version, tester, date, observed result and any defect; do not mark an unperformed session as passed.

## References

- W3C WAI: [Landmark regions](https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/)
- W3C WAI: [Modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- W3C WAI: [Forms tutorial](https://www.w3.org/WAI/tutorials/forms/)
- W3C WAI: [WCAG 2.1](https://www.w3.org/TR/WCAG21/)

Tool assistance: an AI assistant supported implementation, regression-test drafting and documentation. The contributor remains responsible for reviewing and understanding the submitted work.
