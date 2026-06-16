# Number Flash

A flashcard PWA for learning numbers in French and Italian. Works 100% offline after first load — no server, no login, no Firebase.

## Features

- 🇫🇷 French & 🇮🇹 Italian number flashcards (0–100)
- 🎯 Configurable number ranges
- 📊 Per-number accuracy and timing stats (stored on-device via localStorage)
- 🔊 Text-to-speech pronunciation
- 📱 Installable on iPhone home screen — works fully offline

---

## Setup: What You Need to Do

Everything below requires your credentials / device, so it can't be automated. Follow these steps in order.

### Step 1 — Commit and push the refactored code

Open a terminal in the project folder and run:

```bash
cd ~/apps/number_flash
git add -A
git commit -m "Refactor: offline PWA — remove Firebase, use localStorage"
git push origin main
```

This pushes all changes to your existing repo at:
**https://github.com/dombraccia/number_flash**

### Step 2 — Enable GitHub Pages

1. Go to **https://github.com/dombraccia/number_flash/settings/pages**
2. Under **"Build and deployment"**:
   - **Source**: select **Deploy from a branch**
   - **Branch**: select **`main`** and **`/ (root)`**
3. Click **Save**
4. Wait 1–2 minutes for the deployment to complete
5. Your app will be live at:

   **https://dombraccia.github.io/number_flash/**

> **Tip:** You can check deployment status at  
> https://github.com/dombraccia/number_flash/actions

### Step 3 — Add to iPhone home screen

1. Open **Safari** on your iPhone (this does **not** work from Chrome or other browsers)
2. Navigate to **https://dombraccia.github.io/number_flash/**
3. Tap the **Share** button (the square icon with an upward arrow at the bottom of the screen)
4. Scroll down and tap **"Add to Home Screen"**
5. Optionally rename it (default will be "NumFlash"), then tap **Add**

The app icon will appear on your home screen. From this point:
- It launches **full-screen** (no Safari browser chrome)
- It works **100% offline** — you can put your phone in airplane mode and it still runs
- All your stats are saved **on-device** in localStorage

### Step 4 — Future updates

When you change the code and want the update to reach your phone:

1. Commit and push changes to `main`:
   ```bash
   git add -A && git commit -m "your message" && git push origin main
   ```
2. GitHub Pages will automatically redeploy (1–2 min)
3. **Important:** Bump the `CACHE_NAME` version in `sw.js` (e.g., `numflash-v3` → `numflash-v4`) so the service worker knows to re-download assets
4. On your iPhone, open the app while connected to the internet — the service worker will silently update in the background
5. Close and reopen the app to see the new version

---

## Local Development

No build step, no npm, no dependencies. Serve with any static file server:

```bash
npx -y serve .
```

Then open **http://localhost:3000** in your browser.

---

## Project Structure

```
number_flash/
├── index.html       ← App shell (single page)
├── app.js           ← All app logic (session, stats, speech)
├── data.js          ← French & Italian number dictionaries
├── storage.js       ← localStorage wrapper for stats
├── styles.css       ← Dark theme with glassmorphism
├── sw.js            ← Service worker (offline caching)
├── manifest.json    ← PWA manifest (icon, name, display mode)
├── icon-512.png     ← App icon for home screen
└── README.md
```
