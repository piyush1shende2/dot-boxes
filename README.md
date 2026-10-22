# Dots & Boxes

Classic Dots and Boxes built with React + Vite. Play **You vs AI** or **2-7 players** on 10x10, 30x30, 50x50 or custom (up to 100x100) dot grids, with a 3D light/night interface.

- Complete a box to claim it and play again; most boxes wins.
- Every player's latest line glows until their next turn. Drawn lines can never be redrawn.
- Rainbow colours for up to 7 players, or pick your own letter.
- **Works offline** - no external fonts, CDNs or APIs. After the first visit the installed service worker serves the game from cache (installable as an app too).
- **Effects: Full / Lite / Off** - Lite is chosen automatically on low-end devices and keeps animations smooth.

## Run locally

```
npm install
npm run dev
```

## Build and test offline

```
npm run build
npm run preview
```

Open the preview URL once, then turn off your internet and reload - the game still works.
(Browsers block ES modules from `file://`, so use `npm run preview` or the deployed site rather than double-clicking `dist/index.html`.)

## Deploy to GitHub Pages

Push to `main`. In the repo go to **Settings -> Pages -> Source: GitHub Actions**. The included workflow builds and publishes the site at `https://<your-username>.github.io/<repo-name>/`.

## License

MIT
