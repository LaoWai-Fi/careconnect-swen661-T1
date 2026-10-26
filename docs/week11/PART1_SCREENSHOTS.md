# Week 11 Part 1 responsive screenshots

These are unedited native browser captures with fictional data from local production preview, not a live deployment or a physical phone. Widths are CSS pixels and the viewport height is 900px. Full-page counterparts and Landing, Sign in and Activity captures are in `evidence/`. Embed the screenshots and explanations in the team's final Word document; Word preparation was deferred.

## Mobile 375 pixels

Single content column, hamburger navigation and reachable quick links. Forms and actions reflow without clipping.

![Mobile dashboard](evidence/viewport-dashboard-375.png)
![Mobile medications](evidence/viewport-medications-375.png)
![Mobile appointments](evidence/viewport-appointments-375.png)
![Mobile messages](evidence/viewport-messages-375.png)
![Mobile settings](evidence/viewport-settings-375.png)

## Tablet 768 pixels

Compact sidebar rail expands through a labeled control. Content columns adapt to actual space remaining next to navigation.

![Tablet dashboard](evidence/viewport-dashboard-768.png)
![Tablet medications](evidence/viewport-medications-768.png)
![Tablet appointments](evidence/viewport-appointments-768.png)
![Tablet messages](evidence/viewport-messages-768.png)
![Tablet settings](evidence/viewport-settings-768.png)

## Desktop 1440 pixels

Full labeled navigation remains visible; cards and message lists use multiple columns where space permits. Each page retains one main landmark and page heading.

![Desktop dashboard](evidence/viewport-dashboard-1440.png)
![Desktop medications](evidence/viewport-medications-1440.png)
![Desktop appointments](evidence/viewport-appointments-1440.png)
![Desktop messages](evidence/viewport-messages-1440.png)
![Desktop settings](evidence/viewport-settings-1440.png)

## PWA keyboard and coverage evidence

![Actual offline message persistence](evidence/offline-messages.png)
![Generated summary of measured tests and installability diagnostics](evidence/measured-results.png)
![Visible keyboard focus in the help modal](evidence/keyboard-help-focus.png)
![Real generated Jest coverage summary](evidence/coverage-summary.png)

The measured-results image is a generated view of raw JSON, not an OS installation screenshot. See [TEST_RESULTS.md](TEST_RESULTS.md) for scope, retained axe incomplete results and limitations.
