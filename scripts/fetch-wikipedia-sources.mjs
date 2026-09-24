import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const pages = [
  { id: 'film-theory', title: 'Film theory', area: 'Foundation', group: 'Foundation', period: '1920s' },
  { id: 'apparatus-theory', title: 'Apparatus theory', area: 'Theory', group: 'Ideology and spectatorship', period: '1970s' },
  { id: 'auteur', title: 'Auteur', area: 'Theory', group: 'Authorship', period: '1950s' },
  { id: 'cognitive-film-theory', title: 'Cognitive film theory', area: 'Theory', group: 'Mind and perception', period: '1980s' },
  { id: 'feminist-film-theory', title: 'Feminist film theory', area: 'Theory', group: 'Identity and power', period: '1970s' },
  { id: 'genre-studies', title: 'Genre studies', area: 'Theory', group: 'Classification', period: '20th century' },
  { id: 'linguistic-film-theory', title: 'Linguistic film theory', area: 'Theory', group: 'Language and signs', period: '1960s' },
  { id: 'marxist-film-theory', title: 'Marxist film theory', area: 'Theory', group: 'Ideology and labor', period: '20th century' },
  { id: 'psychoanalytic-film-theory', title: 'Psychoanalytic film theory', area: 'Theory', group: 'Mind and desire', period: '1970s' },
  { id: 'queer-theory', title: 'Queer theory', area: 'Theory', group: 'Identity and power', period: '1990s' },
  { id: 'schreiber-theory', title: 'Schreiber theory', area: 'Theory', group: 'Authorship', period: '2000s' },
  { id: 'screen-theory', title: 'Screen theory', area: 'Theory', group: 'Ideology and spectatorship', period: '1970s' },
  { id: 'structuralist-film-theory', title: 'Structuralist film theory', area: 'Theory', group: 'Language and signs', period: '1960s' },
  { id: 'cinematography', title: 'Cinematography', area: 'Practice', group: 'Image practice', period: '19th century' },
  { id: 'digital-cinema', title: 'Digital cinema', area: 'Practice', group: 'Technology', period: '1990s' },
  { id: '3d-film', title: '3D film', area: 'Practice', group: 'Technology', period: '20th century' },
  { id: 'film', title: 'Film', area: 'Foundation', group: 'Medium', period: '19th century' },
  { id: 'film-studies', title: 'Film studies', area: 'Foundation', group: 'Academic field', period: '20th century' },
  { id: 'glossary-of-motion-picture-terms', title: 'Glossary of motion picture terms', area: 'Reference', group: 'Vocabulary', period: 'Reference' },
  { id: 'invisible-auditor', title: 'Invisible auditor', area: 'Concept', group: 'Narration and sound', period: '20th century' },
  { id: 'list-of-film-periodicals', title: 'List of film periodicals', area: 'Reference', group: 'Research sources', period: 'Reference' },
  { id: 'narrative-film', title: 'Narrative film', area: 'Concept', group: 'Narrative form', period: '20th century' },
  { id: 'philosophy-of-film', title: 'Philosophy of film', area: 'Foundation', group: 'Philosophy', period: '20th century' },
  { id: 'psychology-of-film', title: 'Psychology of film', area: 'Foundation', group: 'Mind and perception', period: '20th century' },
];

const titleSet = new Set(pages.map((page) => page.title));
const api = 'https://en.wikipedia.org/w/api.php';

const query = new URLSearchParams({
  action: 'query',
  format: 'json',
  origin: '*',
  redirects: '1',
  prop: 'extracts|info|pageimages|categories',
  exintro: '1',
  explaintext: '1',
  inprop: 'url',
  cllimit: '50',
  piprop: 'thumbnail|original',
  pithumbsize: '900',
  titles: pages.map((page) => page.title).join('|'),
});

const response = await fetch(`${api}?${query.toString()}`, {
  headers: {
    'User-Agent': 'FilmskaTeorija/1.0 (source-backed educational app; https://github.com/mizcausevic-dev/filmska-teorija)',
  },
});

if (!response.ok) {
  throw new Error(`Wikipedia API request failed: ${response.status} ${response.statusText}`);
}

const payload = await response.json();
const apiPages = Object.values(payload.query.pages);

const byTitle = new Map(apiPages.map((page) => [page.title, page]));
const redirectMap = new Map(payload.query.redirects?.map((redirect) => [redirect.from, redirect.to]) ?? []);
const normalizedMap = new Map(payload.query.normalized?.map((entry) => [entry.from, entry.to]) ?? []);

function cleanThumbnail(value) {
  if (!value) return null;
  const url = new URL(value);
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith('utm_')) url.searchParams.delete(key);
  }
  return url.toString();
}

async function fetchRelatedTitles(pageId, ownTitle) {
  const titles = new Set();
  let continuation = null;
  do {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      prop: 'links',
      pageids: String(pageId),
      pllimit: 'max',
      ...(continuation ?? {}),
    });
    const result = await fetch(`${api}?${params}`, {
      headers: {
        'User-Agent': 'FilmskaTeorija/1.0 (source-backed educational app; https://github.com/mizcausevic-dev/filmska-teorija)',
      },
    });
    if (!result.ok) throw new Error(`Wikipedia links failed for ${ownTitle}: ${result.status}`);
    const body = await result.json();
    const entry = body.query?.pages?.[pageId];
    for (const link of entry?.links ?? []) {
      if (titleSet.has(link.title) && link.title !== ownTitle) titles.add(link.title);
    }
    continuation = body.continue ?? null;
  } while (continuation);
  return [...titles];
}

async function fetchFallbackExtract(title) {
  const fallbackQuery = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    redirects: '1',
    prop: 'extracts',
    explaintext: '1',
    exsectionformat: 'plain',
    titles: title,
  });

  const fallbackResponse = await fetch(`${api}?${fallbackQuery.toString()}`, {
    headers: {
      'User-Agent': 'FilmskaTeorija/1.0 (source-backed educational app; https://github.com/mizcausevic-dev/filmska-teorija)',
    },
  });

  if (!fallbackResponse.ok) {
    return '';
  }

  const fallbackPayload = await fallbackResponse.json();
  const fallbackPage = Object.values(fallbackPayload.query.pages)[0];
  const text = fallbackPage?.extract ?? '';
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4)
    .join('\n\n');
}

const normalized = await Promise.all(pages.map(async (page, index) => {
  const resolvedTitle = redirectMap.get(page.title) ?? normalizedMap.get(page.title) ?? page.title;
  const apiPage = byTitle.get(page.title) ?? byTitle.get(resolvedTitle);
  if (!apiPage || apiPage.missing !== undefined) {
    throw new Error(`Missing Wikipedia page: ${page.title}`);
  }

  const linkedTitles = await fetchRelatedTitles(apiPage.pageid, page.title);

  const categories =
    apiPage.categories
      ?.map((category) => category.title.replace(/^Category:/, ''))
      .filter((title) => !title.toLowerCase().includes('articles'))
      .slice(0, 8) ?? [];

  const extract = (apiPage.extract ?? '').trim();

  return {
    ...page,
    title: page.title,
    sourceTitle: apiPage.title,
    redirectedTo: apiPage.title === page.title ? null : apiPage.title,
    pageId: apiPage.pageid,
    displayIndex: index + 1,
    requestedUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replaceAll(' ', '_'))}`,
    sourceUrl: apiPage.fullurl,
    canonicalUrl: apiPage.canonicalurl,
    extract: extract || (await fetchFallbackExtract(apiPage.title)),
    thumbnail: cleanThumbnail(apiPage.thumbnail?.source ?? apiPage.original?.source),
    relatedTitles: linkedTitles,
    categories,
    retrievedAt: new Date().toISOString(),
  };
}));

const linkMap = new Map(normalized.map((page) => [page.title, page.id]));
for (const page of normalized) {
  if (!linkMap.has(page.sourceTitle)) linkMap.set(page.sourceTitle, page.id);
}
const withRelations = normalized.map((page) => ({
  ...page,
  relatedIds: [...new Set(page.relatedTitles.map((title) => linkMap.get(title)).filter((id) => id && id !== page.id))],
}));

const sourceRegistry = {
  generatedAt: new Date().toISOString(),
  source: 'Wikipedia API action=query extracts/info/links/pageimages/categories',
  license: {
    text: 'Wikipedia text is available under the Creative Commons Attribution-ShareAlike License 4.0 unless otherwise noted.',
    url: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
  pages: withRelations,
};

const outDir = path.join(process.cwd(), 'src', 'data');
await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, 'wikipediaSources.json'), `${JSON.stringify(sourceRegistry, null, 2)}\n`);
console.log(`Wrote ${withRelations.length} source-backed pages to src/data/wikipediaSources.json`);
