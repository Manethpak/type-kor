# Type ក (TypeKor)

A Khmer typing practice app with cluster-aware input handling and local progress tracking.

## Features

- Timed and word-count typing tests
- Khmer orthographic-cluster accuracy checking
- CPM/WPM, accuracy, and speed charts
- Local test history and customizable themes
- Installable PWA with offline support

> **Note:** CPM means **clusters per minute**, not characters per minute. Khmer text is measured by grapheme clusters so combined characters are treated as a single typing unit.

## Development

Requires [Node.js](https://nodejs.org/) 22.18 or newer and [pnpm](https://pnpm.io/).

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
pnpm words:fetch # Refresh the generated Khmer frequency word pools
```

The word-list library exports cumulative `common250Words`, `common500Words`, and
`common1000Words` pools from `src/data/wordList.ts`. The generated source data is
kept in `src/data/wordLists.generated.ts` so typing tests work offline.

Built with React, TypeScript, Vite, Tailwind CSS, Vitest, and Playwright.
