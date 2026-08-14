# Curriculum authoring

Curriculum content is grouped by unit. Each unit owns a `unit.yaml` manifest and a nested `lessons/` directory:

```text
units/
  1-home-row/
    unit.yaml
    lessons/
      1-home-anchors.yaml
      2-home-reach.yaml
  2-consonants/
    unit.yaml
    lessons/
      1-common-consonants.yaml
      2-shift-consonants.yaml
```

The numeric prefixes must match each file's `order`, while IDs remain stable inside the YAML. Sources are validated and compiled into `src/generated/curriculum.json`; the application never parses YAML in the browser or downloads a whole authoring tree.

## Adding a lesson

1. Copy an existing lesson inside the owning unit's `lessons/` directory and give it a stable, globally unique `id`.
2. Set `unitId` to the parent unit and choose an unused `order` within that unit.
3. Name the file `<order>-<id>.yaml`.
4. Give every step a stable ID. Reordering steps is safe; do not rename IDs after release unless the step is being replaced.
5. Increase `revision` when changing released prompts or removing steps.
6. Run `pnpm lesson:gen` and commit both the YAML and generated JSON.

To add a unit, create `units/<order>-<id>/unit.yaml` plus its `lessons/` directory. `pnpm lesson:check` validates folder and file naming, parent-unit ownership, schemas, duplicate IDs and ordering, unit references, Unicode normalization, and NIDA key coverage. Key sequences are derived from `src/learning/nida.ts` and must not be authored in YAML.
