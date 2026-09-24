import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { caseStudies } from '../src/data/caseStudies.ts';

const root = process.cwd();
const registry = JSON.parse(await readFile(path.join(root, 'src/data/wikipediaSources.json'), 'utf8'));
const editorial = JSON.parse(await readFile(path.join(root, 'src/data/editorial.json'), 'utf8'));
const site = 'https://mizcausevic-dev.github.io/filmska-teorija/';
const base = process.env.GITHUB_PAGES === 'true' ? '/filmska-teorija/' : '/';
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);
const urlFor = (id) => `${base}theory/${id}/`;

for (const page of registry.pages) {
  const note = editorial[page.id];
  const studies = caseStudies.filter((study) => study.moduleId === page.id);
  const indexable = studies.length > 0;
  const title = `${page.title} | Filmska Teorija`;
  const description = (note?.take ?? page.extract).replace(/\s+/g, ' ').slice(0, 160).trim();
  const canonical = `${site}theory/${page.id}/`;
  const links = registry.pages.map((entry) => `<li><a href="${urlFor(entry.id)}">${escapeHtml(entry.title)}</a></li>`).join('');
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="${escapeHtml(description)}" />
  ${indexable ? '' : '<meta name="robots" content="noindex" />'}
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="article" />
  <link rel="canonical" href="${canonical}" />
  <link rel="icon" type="image/svg+xml" href="${base}favicon.svg" />
  <title>${escapeHtml(title)}</title>
</head>
<body>
  <div id="root">
    <main>
      <h1>${escapeHtml(page.title)}</h1>
      ${note ? `<p>${escapeHtml(note.take)}</p><p>${escapeHtml(note.method)}</p>${(note.references ?? []).map((reference) => `<a href="${escapeHtml(reference.url)}">${escapeHtml(reference.label)}</a>`).join('')}` : ''}
      ${studies.map((study) => `<section><h2>${escapeHtml(study.film)}: ${escapeHtml(study.scene)}</h2><h3>Observable evidence</h3><p>${escapeHtml(study.observation)}</p><h3>Our reading</h3><p>${escapeHtml(study.reading)}</p><h3>Counter-reading</h3><p>${escapeHtml(study.counterReading)}</p><h3>Sources</h3><ul>${study.citations.map((citation) => `<li><a href="${escapeHtml(citation.url)}">${escapeHtml(citation.label)}</a>: ${escapeHtml(citation.detail)}</li>`).join('')}</ul></section>`).join('')}
      <p>${escapeHtml(page.extract)}</p>
      <a href="${escapeHtml(page.sourceUrl)}">Wikipedia source</a>
      <nav aria-label="Theory modules"><ul>${links}</ul></nav>
    </main>
  </div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
`;
  const outDir = path.join(root, 'theory', page.id);
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, 'index.html'), html);
}

const listed = [site, `${site}privacy.html`, `${site}terms.html`,
  ...registry.pages.filter((page) => caseStudies.some((study) => study.moduleId === page.id)).map((page) => `${site}theory/${page.id}/`)];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${listed.map((url) => `  <url><loc>${escapeHtml(url)}</loc></url>`).join('\n')}\n</urlset>\n`;
await writeFile(path.join(root, 'public/sitemap.xml'), sitemap);
console.log(`Generated ${registry.pages.length} module entry pages; ${listed.length} sitemap URLs.`);
