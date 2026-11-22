# IRobloxMouseChanger

**React + Electron desktop overlay prototype** for Windows. Target GitHub repository: `xlg77/IRobloxMouseChanger`.

## Features
- React desktop menu: dashboard, cursor library, customization, and React code editor.
- Eight cursor styles based on the supplied React Bits examples: Glow, Swarm, Ghost, Target, Fluid Glass, Text, Splash, and Blob.
- Live preview and settings for color, size, trail length, animation speed, and cursor opacity.
- Transparent, always-on-top, click-through Electron overlay that follows the Windows pointer.
- System tray menu and `Ctrl + Shift + M` shortcut to return to the app and close the overlay.
- Optional React JSX component editor. Define a `Cursor` component and use its `x`, `y`, `color`, and `size` props.

## Important limitations
- This prototype draws an overlay above the desktop. It does **not** modify Roblox files, inject into Roblox, or bypass Roblox protections.
- The first version does **not** globally hide or replace the Windows system cursor. The standard pointer may remain visible beside the custom cursor. A dedicated, carefully tested native Windows helper is needed for reliable system-wide cursor hiding/replacement.
- Some exclusive-fullscreen / graphics configurations can cover ordinary desktop overlays. Test Roblox in windowed or borderless-windowed mode first.
- The overlay currently uses primary-display coordinates; multi-monitor offsets are not fully handled.
- The uploaded React Bits snippets referenced companion CSS files and, for Blob Cursor, Three.js. Those companion CSS/assets were not included, so the eight styles are local React/CSS implementations inspired by the supplied component names and behavior, rather than direct imports of incomplete source files.
- The JSX editor executes the code you enter in the app's renderer. Only use code you wrote or trust; do not paste unknown scripts.

## Development
Requires Node.js 20+.

```bash
npm install
npm run dev
```

## Build a Windows installer
Run on Windows:

```bash
npm install
npm run dist
```

The installer is generated in `release/`.

## GitHub setup
Create a repository named **IRobloxMouseChanger** under `xlg77` and push this folder. This is a desktop Electron app, so GitHub Pages cannot execute the app. Publish the Windows installer through GitHub Releases.
