# Week 12 Part 3 — Complete Documentation

**Project:** CareConnect — SWEN 661 Team 1
**Repository:** [LaoWai-Fi/careconnect-swen661-T1](https://github.com/LaoWai-Fi/careconnect-swen661-T1)
**Scope:** user documentation, developer documentation, and WCAG 2.1 Level A/AA conformance reports for web, desktop, and both mobile implementations.

## Submission files

**Latest complete Part 3:** [Word document](CareConnect_Week12_Part3_Complete.docx), including the updated user/developer guides, five Week 12 application screenshots, a rendered architecture diagram, and all three 50-criterion VPATs.

The authoritative updated guide text is [PART3_GUIDES.md](PART3_GUIDES.md). It incorporates the team's final build, installation, coverage, and production evidence on `main`. The individual guides and VPAT exports below remain the earlier documentation baseline; use the complete Word edition for the final assembled submission.

Regenerate the complete edition with `python docs\week12\generate_submission_sections.py --complete`. Its screenshots and architecture image are retained in `submission-assets/`. The generator preserves historical conformance evidence, relabels historical CI references, and adds final evidence without claiming new assistive-technology testing.

| Deliverable | Editable source / evidence |
|---|---|
| User guide | [USER_GUIDE.md](USER_GUIDE.md) |
| Developer guide | [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) |
| Mobile VPAT — Flutter and React Native | [Markdown source](MOBILE_VPAT.md) · [Week 12 Word document](CareConnect_Week12_Mobile_VPAT.docx) |
| Desktop VPAT — Electron | [Markdown source](DESKTOP_VPAT.md) · [Week 12 Word document](CareConnect_Week12_Desktop_VPAT.docx) |
| Web VPAT — React | [Markdown source](WEB_VPAT.md) · [Week 12 Word document](CareConnect_Week12_Web_VPAT.docx) |

All three reports are labeled for Week 12. The desktop report retains the historical Week 9 evaluation baseline and known gaps; references to Week 9 identify the testing evidence, not the current assignment. It is not represented as a new Week 12 retest.

Regenerate the Week 12 desktop source and all three Word reports from the repository root with `python docs\week12\generate_vpats.py`.

## Evidence and scope notes

- The supplied `Team1_Week12_Submission_Items.docx` contains the team's web accessibility testing and fix evidence. Its WAVE and axe DevTools runs were on the local production build of the fix branch, not a post-merge scan of the live site. The Word submission still contains a placeholder asking for the post-merge live-site result; replace that text before submitting the full Week 12 package.
- The team's web report records 455 Playwright passes, 23 documented WebKit skips, 135 Jest/RTL passes, keyboard-only testing, and VoiceOver/Safari testing. The known limitation is that VoiceOver did not speak the appointment-deletion status message.
- Mobile evidence in this repository records TalkBack testing on an Android emulator and six successful Maestro workflows. It does not record iOS VoiceOver testing or a current final-build test on iOS.
- The complete guide includes the team's actual Week 12 Flutter, React Native, packaged Windows, and production web screenshots. Web screenshots are cropped for readability; original downloads are retained. These images are not new screen-reader test evidence.
- The team's [final integration and delivery records](https://github.com/LaoWai-Fi/careconnect-swen661-T1/blob/main/docs/week12/README.md) report final line coverage of Flutter 93.89%, React Native 85.90%, Electron 98.44%, and web 94.56%, six release-APK Maestro passes, and four production Landing/Dashboard Lighthouse accessibility scores of 100. These supplement historical evidence; they do not establish whole-site production WAVE/axe results or new screen-reader sessions.

## Final human verification checklist

- [ ] Replace the stale post-merge placeholder in the supplied Week 12 Word submission. If claiming live WAVE/axe results, run those tools on the deployed version and save the actual reports/screenshots.
- [x] Include the team's Week 12 Flutter and React Native screenshots in the complete user guide.
- [ ] If iOS is in the submission scope, build both apps and complete VoiceOver checks; the current evidence only establishes Android TalkBack testing.
- [ ] Re-run the mobile and desktop manual checks against the exact final builds. Windows/NVDA and Windows contrast themes remain untested for desktop.
- [ ] Open the complete Word edition and check image readability, table layout, and page breaks before inserting it into the team submission. Generated XML/archive integrity is checked; Word's rendered pagination has not been verified.

## Related documentation

- [Desktop Week 8 submission index](../week8/README.md)
- [Web accessibility implementation notes](../../web/ACCESSIBILITY.md)
- [Week 9 desktop accessibility tests and fixes](../week9/ACCESSIBILITY_TESTING.md)
- [Week 6 mobile accessibility evidence](../week6/ACCESSIBILITY_TEST_REPORT.md)
