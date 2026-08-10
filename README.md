# ចង្វាក់ (TypKH)

A Khmer typing practice app with cluster-aware input handling and local progress tracking.

## Features

- Timed and word-count typing tests
- Khmer orthographic-cluster accuracy checking
- CPM/WPM, accuracy, and speed charts
- Local test history and customizable themes
- Installable PWA with offline support

> **Note:** CPM means **clusters per minute**, not characters per minute. Khmer text is measured by grapheme clusters so combined characters are treated as a single typing unit.

## Development

Requires [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/).

```bash
pnpm install
pnpm dev
```

## Commands

```bash
pnpm build       # Production build
pnpm test        # Unit tests
pnpm test:e2e    # Playwright end-to-end tests
pnpm typecheck   # TypeScript checks
```

Built with React, TypeScript, Vite, Tailwind CSS, Vitest, and Playwright.
