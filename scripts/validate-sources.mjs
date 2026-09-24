import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { caseStudies } from '../src/data/caseStudies.ts';

const root = process.cwd();
const registry = JSON.parse(await readFile(path.join(root, 'src/data/wikipediaSources.json'), 'utf8'));
const editorial = JSON.parse(await readFile(path.join(root, 'src/data/editorial.json'), 'utf8'));
const failures = [];
const pages = registry.pages;
const ids = new Set(pages.map((page) => page.id));

if (pages.length !== 24 || ids.size !== 24) failures.push('Expected 24 distinct module IDs.');
for (const page of pages) {
  if (!page.title || !page.extract?.trim() || page.extract.trim().length < 50) {
    failures.push(`${page.id}: missing or exceptionally short source text.`);
  }
  if (!page.sourceUrl?.startsWith('https://en.wikipedia.org/wiki/')) {
    failures.push(`${page.id}: invalid Wikipedia source URL.`);
  }
  if (page.redirectedTo && page.sourceTitle !== page.redirectedTo) {
    failures.push(`${page.id}: redirect target and source title disagree.`);
  }
  for (const relatedId of page.relatedIds ?? []) {
    if (!ids.has(relatedId)) failures.push(`${page.id}: unknown relation ${relatedId}.`);
  }
}
for (const [id, note] of Object.entries(editorial)) {
  if (!ids.has(id)) failures.push(`Editorial note has unknown module ID ${id}.`);
  if (!note.take?.trim() || !note.method?.trim()) failures.push(`${id}: incomplete editorial note.`);
  for (const reference of note.references ?? []) {
    if (!reference.label?.trim() || !reference.url?.startsWith('https://')) {
      failures.push(`${id}: invalid editorial citation.`);
    }
  }
}
for (const study of caseStudies) {
  if (!ids.has(study.moduleId)) failures.push(`Case study ${study.id}: unknown module.`);
  if (!study.observation || !study.reading || !study.counterReading || study.citations.length < 2) {
    failures.push(`Case study ${study.id}: incomplete analysis or citations.`);
  }
  for (const citation of study.citations) {
    if (!citation.label || !citation.detail || !citation.url?.startsWith('https://')) {
      failures.push(`Case study ${study.id}: invalid citation.`);
    }
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Validated ${pages.length} source modules and ${Object.keys(editorial).length} editorial notes.`);
}
