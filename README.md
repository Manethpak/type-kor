# Type ក (TypeKor)

A Khmer typing practice app with cluster-aware input handling and local progress tracking.

## Features

- Timed and word-count typing tests
- Khmer Character Cluster (KCC) accuracy checking
- CPM/WPM, accuracy, and speed charts
- Local test history and customizable themes
- Installable PWA with offline support

> **Note:** CPM means **Khmer Character Clusters per minute**, not characters per minute. KCCs keep a base and its dependent characters together as a typing unit. Character clustering is not Khmer word segmentation, and KCCs are not necessarily words or spoken syllables.

### Khmer Character Clustering

The engine in `src/engine/khmer.ts` exposes `clusterKhmerText()` through
`khmerTextEngine.cluster()`. It matches the following grammar before structural
reordering, so join controls stay in their intended KCC positions:

```text
<C|I> [Robat|Regshift] {COENG <C|I> [Regshift]}
[[ZWJ|ZWNJ] V] {S} [ZWJ COENG <C|I>]
```

`[]` means zero or one occurrence; `{}` means zero to two occurrences. `C` is a
consonant, `I` an independent vowel, `V` a dependent vowel, and `S` a combining
sign. COENG is U+17D2. Robat, register shifters, and join controls are handled
explicitly rather than collecting every mark after a base.

For example, `ខ្ញុំ` is one KCC, while `ច្រើន` contains `ច្រើ` and `ន`.
Spaces, punctuation, and unmatched characters are preserved as standalone tokens.
Display text and UTF-16 offsets preserve the input, except for test-space
normalization (which preserves length). Each token has a separately normalized
comparison key. Validation is separate from clustering;
preserving a token does not mean its spelling is valid. This engine does not
identify word boundaries in unspaced Khmer text.

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
