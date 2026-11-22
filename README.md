# IRobloxMouseChanger

**React + Electron cursor customization for Windows**, with an English React + Vite landing page deployed through GitHub Pages.

- Website: https://xlg77.github.io/IRobloxMouseChanger/
- Repository: https://github.com/xlg77/IRobloxMouseChanger
- Windows downloads: https://github.com/xlg77/IRobloxMouseChanger/releases/latest

## GitHub Pages website
The root `index.html` is the React + Vite landing page. The existing GitHub Actions Pages workflow should install dependencies and run `npm run build`; Vite outputs the site to `dist/`. The build also includes `desktop.html`, the separate Electron renderer entry.

## Desktop app
Run `npm install` then `npm run dev`. To create a Windows installer on Windows, run `npm run dist`. Publish the resulting installer from `release/` as an asset on GitHub Releases.

## Features
- Eight cursor styles: Glow, Swarm, Ghost, Target, Fluid Glass, Text, Splash, and Blob.
- Live preview and customization controls in the desktop app.
- Transparent, always-on-top, click-through Electron overlay.
- System tray and Ctrl + Shift + M shortcut.
- Optional React JSX cursor editor.

## Limitations
- The overlay does not modify Roblox files, inject into Roblox, or bypass Roblox protections.
- The first version does not globally hide or replace the Windows system cursor.
- Some exclusive-fullscreen modes may cover ordinary desktop overlays; windowed or borderless mode is recommended.
- Multi-monitor coordinate offsets are not fully handled yet.
- The eight supplied React Bits examples were recreated locally because companion CSS/assets were not included.
