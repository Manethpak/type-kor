import { mkdir, writeFile } from "node:fs/promises";

const source =
  "https://huggingface.co/datasets/seanghay/khmer-search-frequency/resolve/main/data.csv";
const output = new URL("../src/data/khmer-search-frequency.csv", import.meta.url);

const response = await fetch(source);
if (!response.ok) throw new Error(`Hugging Face request failed: ${response.status}`);
const csv = await response.text();
const [header, ...rows] = csv.trim().split(/\r?\n/u);

if (header !== "word,sessions,clients") throw new Error(`Unexpected CSV header: ${header}`);
if (rows.length === 0) throw new Error("Dataset contains no words");

const words = rows.map((row, index) => {
  const [word, sessions, clients, ...extra] = row.split(",");
  if (
    extra.length > 0 ||
    !word ||
    /\s/u.test(word) ||
    !/^\d+$/u.test(sessions ?? "") ||
    !/^\d+$/u.test(clients ?? "")
  ) {
    throw new Error(`Invalid CSV row ${index + 2}: ${row}`);
  }
  return word;
});

if (new Set(words).size !== words.length) throw new Error("Dataset contains duplicate words");

await mkdir(new URL("../src/data/", import.meta.url), { recursive: true });
await writeFile(output, csv.endsWith("\n") ? csv : `${csv}\n`);
console.log(`Downloaded ${rows.length} Khmer words to ${output.pathname}`);
