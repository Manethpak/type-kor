# Agent Instructions

## Website Content Language

- Write agent responses and technical communication in English.
- Write website-facing content primarily in Khmer.
- When a website term is highly technical, has no direct or widely accepted Khmer translation, or translating it could make the meaning unclear, use the established English term instead.
- Do not invent or guess Khmer translations for technical terminology in website content.
- Keep code, identifiers, commands, file paths, API names, library names, and other technical literals in English.

## Engineering Principles

- Apply DRY and SOLID principles wherever practical, while avoiding unnecessary abstractions.
- Before adding new code, search the project for existing components, functions, hooks, utilities, and styles that can be reused or extended.
- When component structure or styling is repeated, extract it into a separate reusable component instead of duplicating it.
- Keep reusable components and functions focused, composable, and named according to their purpose.
- Add concise comments or JSDoc to reusable functions when their purpose, intended usage, or search terms are not obvious. These notes should help other agents quickly discover the code and determine when to reuse it.
- Do not add comments that merely restate what the code does.
