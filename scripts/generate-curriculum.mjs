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

async function readYamlDirectory(name) {
  const directory = path.join(contentDirectory, name);
  const files = (await readdir(directory)).filter((file) => file.endsWith(".yaml")).sort();
  return Promise.all(
    files.map(async (file) => {
      const source = await readFile(path.join(directory, file), "utf8");
      const document = parseDocument(source, { prettyErrors: true, uniqueKeys: true });
      if (document.errors.length) {
        throw new Error(
          `${name}/${file}: ${document.errors.map((error) => error.message).join("; ")}`,
        );
      }
      return { file: `${name}/${file}`, value: document.toJS() };
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
  const [unitSchema, lessonSchema, unitFiles, lessonFiles] = await Promise.all([
    readJson("unit.schema.json"),
    readJson("lesson.schema.json"),
    readYamlDirectory("units"),
    readYamlDirectory("lessons"),
  ]);

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validateUnit = ajv.compile(unitSchema);
  const validateLesson = ajv.compile(lessonSchema);

  for (const item of unitFiles) {
    if (!validateUnit(item.value)) {
      throw new Error(`${item.file}: ${formatSchemaErrors(validateUnit.errors)}`);
    }
    if (`${item.value.id}.yaml` !== path.basename(item.file)) {
      throw new Error(`${item.file}: filename must match unit id ${item.value.id}`);
    }
  }
  for (const item of lessonFiles) {
    if (!validateLesson(item.value)) {
      throw new Error(`${item.file}: ${formatSchemaErrors(validateLesson.errors)}`);
    }
    if (`${item.value.id}.yaml` !== path.basename(item.file)) {
      throw new Error(`${item.file}: filename must match lesson id ${item.value.id}`);
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
      throw new Error("Generated curriculum is stale. Run `pnpm curriculum:generate`.");
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
