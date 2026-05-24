# Ravro Kanban — Electron + React Starter

A lightweight, local-first desktop Kanban board built with Electron and React.
Designed for fast iteration, offline use, and a clean industrial UI with subtle maroon accents inspired by the Ravro design language.

## Overview

Ravro Kanban is a minimal starter project that gives you:

- A native desktop window powered by Electron
- A React-based UI rendered directly inside the Electron shell
- Four default workflow columns: **Backlog → In Progress → Review → Done**
- Add-card input per column
- Move cards left/right between columns
- Local-first architecture (no backend required)
- Clean dark theme with Ravro-style accents
- **Board persistence** via Electron IPC + JSON file in user data directory

This starter is intentionally simple so you can extend it however you want — drag-and-drop, richer card metadata, themes, or integration with Ravro's internal tooling.

## Project Structure

```
electron-react-kanban/
│
├── main.js          # Electron main process + IPC handlers (save/load board)
├── preload.js       # Preload bridge (exposes electronAPI to renderer)
├── index.html       # React UI (CDN-based, no build step required)
├── package.json     # App metadata + scripts
└── README.md
```

## Getting Started

```bash
# Install Electron
npm install

# Launch the app
npm start
```

> No bundler or build step needed — React and Babel are loaded from CDN.

## Features

| Feature | Status |
|---|---|
| Four Kanban columns | ✅ |
| Add cards per column | ✅ |
| Move cards left / right | ✅ |
| Delete cards | ✅ |
| Persist board to disk (JSON) | ✅ |
| Drag-and-drop reordering | 🔜 Extend it |
| Card metadata (labels, dates) | 🔜 Extend it |

## Tech Stack

- [Electron](https://www.electronjs.org/) — desktop shell
- [React 18](https://react.dev/) — UI (CDN)
- [Babel Standalone](https://babeljs.io/docs/babel-standalone) — JSX in-browser transform

## License

MIT
