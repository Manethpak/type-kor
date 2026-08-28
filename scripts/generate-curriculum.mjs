import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import { parseDocument } from "yaml";
import { keySequenceFor } from "../src/learning/nida.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentDirectory = path.join(root, "content", "curriculum");
const generatedPath = path.join(root, "src", "generated", "curriculum.json");
const checkOnly = process.argv.includes("--check");
const printOnly = process.argv.includes("--stdout");

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(contentDirectory, relativePath), "utf8"));
}

async function readYamlFile(relativePath) {
  const source = await readFile(path.join(contentDirectory, relativePath), "utf8");
  const document = parseDocument(source, { prettyErrors: true, uniqueKeys: true });
  if (document.errors.length) {
    throw new Error(`${relativePath}: ${document.errors.map((error) => error.message).join("; ")}`);
  }
  return { file: relativePath, value: document.toJS() };
}

async function readCurriculumUnits() {
  const unitsDirectory = path.join(contentDirectory, "units");
  const entries = await readdir(unitsDirectory, { withFileTypes: true });
  const flatUnitFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".yaml"));
  if (flatUnitFiles.length) {
    throw new Error(
      `units/: unit YAML must live in a unit folder: ${flatUnitFiles
        .map((entry) => entry.name)
        .sort()
        .join(", ")}`,
    );
  }

  const directories = entries
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name, "en", { numeric: true }));

  return Promise.all(
    directories.map(async (directory) => {
      const base = path.posix.join("units", directory.name);
      const lessonsDirectory = path.join(contentDirectory, base, "lessons");
      const lessonEntries = await readdir(lessonsDirectory, { withFileTypes: true });
      const lessonFiles = lessonEntries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".yaml"))
        .sort((left, right) => left.name.localeCompare(right.name, "en", { numeric: true }));

      return {
        directory: directory.name,
        unit: await readYamlFile(path.posix.join(base, "unit.yaml")),
        lessons: await Promise.all(
          lessonFiles.map((file) => readYamlFile(path.posix.join(base, "lessons", file.name))),
        ),
      };
    }),
  );
}

function assertUnique(items, key, label) {
  const seen = new Map();
  for (const item of items) {
    const value = key(item.value);
    if (seen.has(value)) {
      throw new Error(
        `${label} ${JSON.stringify(value)} is duplicated in ${seen.get(value)} and ${item.file}`,
      );
    }
    seen.set(value, item.file);
  }
}

function formatSchemaErrors(errors) {
  return errors
    .map((error) => `${error.instancePath || "/"} ${error.message ?? "is invalid"}`)
    .join("; ");
}

function validateNidaCoverage(lesson) {
  for (const step of lesson.steps) {
    const reconstructed = keySequenceFor(step.prompt)
      .map((hint) => hint.output)
      .join("");
    if (reconstructed !== step.prompt) {
      const missing = Array.from(step.prompt).filter(
        (character) => !keySequenceFor(character).length,
      );
      throw new Error(
        `lessons/${lesson.id}: step ${step.id} contains NIDA outputs without a mapping: ${[
          ...new Set(missing),
        ].join(" ")}`,
      );
    }
    if (step.prompt !== step.prompt.normalize("NFC")) {
      throw new Error(`lessons/${lesson.id}: step ${step.id} prompt must use NFC Unicode`);
    }
  }
}

async function generate() {
  const [unitSchema, lessonSchema, unitGroups] = await Promise.all([
    readJson("unit.schema.json"),
    readJson("lesson.schema.json"),
    readCurriculumUnits(),
  ]);
  const unitFiles = unitGroups.map((group) => group.unit);
  const lessonFiles = unitGroups.flatMap((group) => group.lessons);

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validateUnit = ajv.compile(unitSchema);
  const validateLesson = ajv.compile(lessonSchema);

  for (const group of unitGroups) {
    const item = group.unit;
    if (!validateUnit(item.value)) {
      throw new Error(`${item.file}: ${formatSchemaErrors(validateUnit.errors)}`);
    }
    const expectedDirectory = `${item.value.order}-${item.value.id}`;
    if (group.directory !== expectedDirectory) {
      throw new Error(`${item.file}: unit folder must be named ${expectedDirectory}`);
    }

    for (const lesson of group.lessons) {
      if (!validateLesson(lesson.value)) {
        throw new Error(`${lesson.file}: ${formatSchemaErrors(validateLesson.errors)}`);
      }
      const expectedFilename = `${lesson.value.order}-${lesson.value.id}.yaml`;
      if (path.basename(lesson.file) !== expectedFilename) {
        throw new Error(`${lesson.file}: lesson file must be named ${expectedFilename}`);
      }
      if (lesson.value.unitId !== item.value.id) {
        throw new Error(
          `${lesson.file}: unitId must match parent unit ${JSON.stringify(item.value.id)}`,
        );
      }
    }
  }

  assertUnique(unitFiles, (item) => item.id, "Unit id");
  assertUnique(unitFiles, (item) => item.order, "Unit order");
  assertUnique(lessonFiles, (item) => item.id, "Lesson id");

  const unitIds = new Set(unitFiles.map((item) => item.value.id));
  for (const item of lessonFiles) {
    const lesson = item.value;
    if (!unitIds.has(lesson.unitId)) {
      throw new Error(`${item.file}: references unknown unit ${lesson.unitId}`);
    }
    assertUnique(
      lesson.steps.map((step) => ({ file: `${item.file}#${step.id}`, value: step })),
      (step) => step.id,
      `Step id in ${lesson.id}`,
    );
    validateNidaCoverage(lesson);
  }

  for (const unit of unitFiles) {
    const unitLessons = lessonFiles.filter((lesson) => lesson.value.unitId === unit.value.id);
    if (!unitLessons.length) throw new Error(`${unit.file}: unit has no lessons`);
    assertUnique(unitLessons, (lesson) => lesson.order, `Lesson order in ${unit.value.id}`);
  }

  const units = unitFiles.map((item) => item.value).sort((left, right) => left.order - right.order);
  const unitOrder = new Map(units.map((unit) => [unit.id, unit.order]));
  const lessons = lessonFiles
    .map((item) => item.value)
    .sort(
      (left, right) =>
        unitOrder.get(left.unitId) - unitOrder.get(right.unitId) || left.order - right.order,
    );

  return `${JSON.stringify({ schemaVersion: 1, units, lessons }, null, 2)}\n`;
}

try {
  const output = await generate();
  if (printOnly) {
    process.stdout.write(output);
  } else if (checkOnly) {
    const current = await readFile(generatedPath, "utf8").catch(() => "");
    if (current !== output) {
      throw new Error("Generated curriculum is stale. Run `pnpm lesson:gen`.");
    }
    process.stdout.write("Curriculum sources and generated output are valid.\n");
  } else {
    await mkdir(path.dirname(generatedPath), { recursive: true });
    await writeFile(generatedPath, output);
    process.stdout.write(`Generated ${path.relative(root, generatedPath)}.\n`);
  }
} catch (error) {
  process.stderr.write(
    `Curriculum generation failed: ${error instanceof Error ? error.message : error}\n`,
  );
  process.exitCode = 1;
}
