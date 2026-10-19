# Week 10 - Android phone testing

Use only fictional names, email addresses and medication details. This is a local course demonstration, not production authentication or clinical storage.

## Open the app

For layout-only checks on the same Wi-Fi, run the production preview bound to the laptop's Wi-Fi address and open that address with port 4173 on the phone. Keep the laptop awake. Do not disable Windows Firewall; if Windows requests access for Node, allow only the trusted private network.

An HTTP LAN address does not provide the secure context needed for this app's service worker or proper offline/install testing. For those checks, use an HTTPS deployment or a deliberately enabled temporary HTTPS test tunnel. The temporary URL is shared separately, not committed here. It stops working when the tunnel or laptop stops; restarting the tunnel changes the origin and creates separate browser storage.

## Install and test with Chrome on Android

1. Open the supplied HTTPS link directly in Chrome, not a chat app's embedded browser or an Incognito tab.
2. Select Create account, enter fictional details and a demo password of at least six characters, then choose Caregiver.
3. Check Dashboard and Medications in portrait and landscape. Open/close the hamburger menu. Try an empty medication form and confirm the required-field messages are readable.
4. Add a fictional medication, reload, and confirm it remains. Try edit, Cancel and delete confirmation. Record what you actually observe.
5. Stay online for the initial load. In Chrome's three-dot menu, choose Install app or Add to Home screen, then the installation option if offered. The in-page Install button only appears when Chrome provides its install event; its absence does not itself mean the app is broken.
6. Launch CareConnect from its new home-screen icon. With connectivity still enabled, open the app once and navigate to Medications to allow the installed app's worker/cache to initialize. Installed apps may have separate browser storage, so create the demo account there again if needed.
7. Enable airplane mode and ensure Wi-Fi is also off. Close and reopen the installed app. The shell and local demo data should load, with an offline notice. Add a fictional medication, reload/reopen, and check persistence. No cloud synchronization is expected.
8. Re-enable connectivity. Check that the connection notice clears. Optional: turn on TalkBack and inspect labels, headings, navigation and validation announcements; document this as a separate manual screen-reader session only if performed.

If offline reopening fails, retry the first installed-app load while online, then record the device/browser version, failing route, exact steps and screenshot. If Chrome offers only a browser shortcut rather than installation, report that distinction rather than recording a successful standalone install.

## Record actual results

Use a short log with tester, date, Android version, Chrome version, phone model, HTTPS origin, portrait/landscape results, install result, offline reopen, local persistence and defects. A screenshot of the home-screen icon, standalone app and offline notice provides useful evidence. Do not claim a pass until tested on the phone. Server availability alone is not a phone test.

Keep the laptop and preview/tunnel running while testing. Anyone with a public tunnel URL can view the demo; do not enter real patient information. Ask the contributor to stop the temporary tunnel once testing is complete. A long-term release needs a stable HTTPS hostname.

References: [MDN PWA installability](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable), [Cloudflare Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/).
