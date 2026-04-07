# Roadmap

Notes on what it would take to make this app usable beyond one family's LAN.

## Distribution options

### Option A: PWA on a public server (recommended starting point)

The app is structurally ready — Vite produces a static bundle, PocketBase serves it. The main blocker is that the backend only lives on a local network.

**Steps:**
1. Deploy the existing Docker image to a public VPS (Hetzner, Fly.io, Railway, etc.)
2. Add HTTPS — required for "Add to Home Screen" on both Android and iOS (Caddy handles this with one line of config)
3. Add a Web App Manifest + service worker via `vite-plugin-pwa` (~10 lines of Vite config)
4. Optional: enable PocketBase auth so users have their own saved plans

**Result:** share a URL → browser prompts "Add to Home Screen" → installs with an icon, works offline.
**Effort:** ~1–2 days, mostly hosting setup.

---

### Option B: Fully offline / static (lowest cost, widest reach)

If multi-user sync isn't needed, drop the server entirely:

- Replace PocketBase calls with `localStorage` for plan state
- The product catalogue is already baked into the bundle (`lidlData.js`)
- Host static files on GitHub Pages or Netlify (free)
- Add PWA manifest → full offline, zero server cost

**Effort:** ~1 day of refactoring.

---

### Option C: Native app via Capacitor

[Capacitor](https://capacitorjs.com/) wraps the existing React app in a native WebView — no framework rewrite needed.

- `npm install @capacitor/core @capacitor/cli && npx cap init && npx cap add android`
- Android: build with Android Studio, publish to Play Store ($25 one-time fee)
- iOS: requires a Mac + $99/year Apple Developer account
- Still needs a public backend (Option A) unless going fully offline (Option B)

**Effort:** 1–3 days for Android; iOS adds significant cost and tooling overhead.

---

## Other things worth doing before sharing

- **Generalise the product catalogue** — support stores other than Lidl Sweden, or let users add items manually
- **Multi-language / multi-currency support** — currently Swedish UI, SEK prices
- **PocketBase auth** — right now the API rules are fully open; anyone who finds the URL can read/write all data
- **Nutritional data quality** — many items have estimated or missing micronutrient values
- **Responsive/mobile polish** — designed for desktop, works on mobile but not optimised for it
