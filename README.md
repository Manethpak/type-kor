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

The complete Hugging Face dataset, including `sessions` and `clients`, is kept in
`src/data/khmer-search-frequency.csv` so typing tests work offline. Run
`pnpm words:fetch` to refresh it.

Each frequency entry also includes NIDA `keyPressCount`, `coengCount`, and a
`difficultyScore` calculated as `keyPressCount + (coengCount * 2)`. The exported
`difficultyWordLists` divide words into beginner (score 6 or lower),
intermediate (7–8), and advanced (9 or higher) pools.

The typing test also offers a mixed difficulty targeting 50% beginner, 30%
intermediate, and 20% advanced words before deterministic shuffling.

Built with React, TypeScript, Vite, Tailwind CSS, Vitest, and Playwright.
