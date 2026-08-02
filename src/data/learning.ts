import registry from './wikipediaSources.json';
import type { SourcePage, SourceRegistry } from '../types';

export const sourceRegistry = registry as SourceRegistry;

export const sourcePages = [...sourceRegistry.pages].sort(
  (a, b) => a.displayIndex - b.displayIndex,
) as SourcePage[];

export const sourceById = new Map(sourcePages.map((page) => [page.id, page]));

export const featureRoadmap = [
  {
    title: 'Interactive Theory Workbench',
    status: 'local media, source annotations, saved notes',
    value: 'Clip study gets paired with theory excerpts and timestamped evidence.',
  },
  {
    title: 'Film Lens Simulator',
    status: 'implemented with source-bounded lens prompts',
    value: 'Compare feminist, Marxist, psychoanalytic, queer, cognitive, and apparatus readings.',
  },
  {
    title: 'Visual History Timeline',
    status: 'implemented as vertical source timeline',
    value: 'Turns dense development history into inspectable events with source links.',
  },
  {
    title: 'Scene Breakdown & Tagging Tool',
    status: 'implemented as local saved board',
    value: 'Catalogs timecodes, techniques, lens, and evidence without pretending to be public community data.',
  },
  {
    title: 'Concept Map & Knowledge Graph',
    status: 'implemented with Three.js node map',
    value: 'Maps all requested sub-areas by field, practice, reference, and theory group.',
  },
  {
    title: 'Theory vs. Practice Case Studies',
    status: 'implemented as guided comparison prompts',
    value: 'Links abstract theories to cinematography, digital cinema, 3D film, narrative film, and sound.',
  },
  {
    title: 'Interactive Glossary & Quiz Engine',
    status: 'implemented with source-title flashcards',
    value: 'Uses page extracts as the answer basis, avoiding invented definitions.',
  },
  {
    title: 'Film Periodical & Paper Reader',
    status: 'implemented as local reader queue',
    value: 'Anchors research in the supplied periodicals index and user-added URLs.',
  },
  {
    title: 'Community Debate & Essay Boards',
    status: 'local draft board only',
    value: 'Preserves critique drafts until a real moderated backend exists.',
  },
  {
    title: 'AI Essay & Hypothesis Partner',
    status: 'local checklist partner only',
    value: 'Finds covered and missing source lenses without making model calls.',
  },
];

export const lensIds = [
  'feminist-film-theory',
  'marxist-film-theory',
  'psychoanalytic-film-theory',
  'queer-theory',
  'cognitive-film-theory',
  'apparatus-theory',
] as const;

export const lensPages = lensIds
  .map((id) => sourceById.get(id))
  .filter((page): page is SourcePage => Boolean(page));

export const timelineEvents = [
  {
    year: '1896',
    title: 'Matter and Memory anticipates later film theory',
    sourceId: 'film-theory',
    note: 'The Film theory article identifies Henri Bergson and the birth of cinema as early context.',
  },
  {
    year: '1915-1916',
    title: 'Early writing by Vachel Lindsay and Hugo Munsterberg',
    sourceId: 'film-theory',
    note: 'The Film theory article places these writers in early attempts to define the medium.',
  },
  {
    year: '1919',
    title: 'Photogenie enters early French film culture',
    sourceId: 'film-theory',
    note: 'The Film theory article links Louis Delluc, Jean Epstein, and close-up debates to this term.',
  },
  {
    year: '1920s',
    title: 'Film theory begins as a formal inquiry',
    sourceId: 'film-theory',
    note: 'The lead source frames film theory as questioning the formal attributes of motion pictures.',
  },
  {
    year: '1950s',
    title: 'Auteurism develops in French criticism',
    sourceId: 'auteur',
    note: 'The Auteur article ties the concept to Bazin, Astruc, Truffaut, and French criticism.',
  },
  {
    year: '1962',
    title: 'Andrew Sarris popularizes auteur theory in the United States',
    sourceId: 'auteur',
    note: 'The Auteur article names Sarris and the United States adoption point.',
  },
  {
    year: '1970s',
    title: 'Feminist film theory enters U.S. film criticism',
    sourceId: 'feminist-film-theory',
    note: 'The supplied source describes feminist film theory as influenced by second-wave feminism.',
  },
  {
    year: '1985',
    title: 'Cognitive film studies gains a named anchor',
    sourceId: 'cognitive-film-theory',
    note: 'The resolved Cognitivism source names David Bordwell and Narration in the Fiction Film.',
  },
  {
    year: 'Digital era',
    title: 'Digital cinema shifts production and projection practice',
    sourceId: 'digital-cinema',
    note: 'The Digital cinema source anchors the technology-practice layer of the map.',
  },
];

export const practiceIds = [
  'cinematography',
  'digital-cinema',
  '3d-film',
  'narrative-film',
  'invisible-auditor',
] as const;

export const practicePages = practiceIds
  .map((id) => sourceById.get(id))
  .filter((page): page is SourcePage => Boolean(page));

export function firstSentence(text: string) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const sentence = normalized.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
  return sentence || normalized.slice(0, 220);
}

export function shortExtract(page: SourcePage, maxLength = 360) {
  const normalized = page.extract.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trim()}...`;
}

export function buildAnnotationPrompts(page: SourcePage) {
  const related = page.relatedIds
    .map((id) => sourceById.get(id)?.title)
    .filter(Boolean)
    .slice(0, 2);

  return [
    {
      time: '00:12',
      label: 'Concept anchor',
      body: firstSentence(page.extract),
      tone: 'cyan',
    },
    {
      time: '00:37',
      label: 'Visible evidence',
      body: `Name the frame, sound, edit, performance, or narrative detail that would support a ${page.title} reading.`,
      tone: 'amber',
    },
    {
      time: '01:04',
      label: 'Counter-lens',
      body: related.length
        ? `Pressure-test the same scene against ${related.join(' and ')}.`
        : 'Pressure-test the same scene against a second theory before writing the conclusion.',
      tone: 'red',
    },
  ];
}

export function titleKeywords(page: SourcePage) {
  return page.title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3);
}
