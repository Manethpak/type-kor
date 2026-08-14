# Curriculum authoring

Curriculum content is authored as one YAML file per unit or lesson. Files are validated and compiled into `src/generated/curriculum.json`; the application never parses YAML in the browser.

## Adding a lesson

1. Copy an existing file in `lessons/` and give it a stable, unique `id`.
2. Set `unitId` to an existing unit and choose an unused `order` within that unit.
3. Give every step a stable ID. Reordering steps is safe; do not rename IDs after release unless the step is being replaced.
4. Increase `revision` when changing released prompts or removing steps.
5. Run `pnpm curriculum:generate` and commit both the YAML and generated JSON.

`pnpm curriculum:check` validates schemas, duplicate IDs and ordering, unit references, Unicode normalization, and NIDA key coverage. Key sequences are derived from `src/learning/nida.ts` and must not be authored in YAML.
