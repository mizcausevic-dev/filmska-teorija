import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  BadgeDollarSign,
  BookOpen,
  Bot,
  Brain,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clapperboard,
  Clock3,
  ExternalLink,
  FileText,
  Film,
  Image as ImageIcon,
  Link2,
  Menu,
  Network,
  Newspaper,
  Play,
  Plus,
  Save,
  Search,
  Share2,
  Tags,
  Trash2,
  Video,
  Volume2,
  X,
} from 'lucide-react';
import './App.css';
import editorial from './data/editorial.json';
import { caseStudies } from './data/caseStudies';
import { buildKnowledgeGraph } from './data/knowledge';
import { moduleUrl, routeModuleId } from './routes';
import {
  buildAnnotationPrompts,
  featureRoadmap,
  firstSentence,
  lensPages,
  practicePages,
  shortExtract,
  sourceById,
  sourcePages,
  sourceRegistry,
  timelineEvents,
  titleKeywords,
} from './data/learning';
import type { BreakdownItem, MediaSlot, ReaderItem, SourcePage } from './types';

const emptyMedia: MediaSlot = {
  imageUrl: '',
  videoUrl: '',
  audioUrl: '',
  podcastUrl: '',
};

const TheoryGraph = lazy(() => import('./components/TheoryGraph').then((module) => ({ default: module.TheoryGraph })));
const editorialById = editorial as Record<string, {
  take: string;
  method: string;
  references?: Array<{ label: string; url: string }>;
}>;

function formatTimecode(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(whole / 60);
  return `${String(minutes).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`;
}

function parseTimecode(value: string) {
  const parts = value.split(':').map(Number);
  if (parts.length < 2 || parts.length > 3 || parts.some((part) => !Number.isInteger(part) || part < 0)) return null;
  if (parts.slice(1).some((part) => part > 59)) return null;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

const adSlots = [
  { id: 'right-rail-top', label: 'Right rail top', size: '300x250', state: 'Placeholder only' },
  { id: 'mid-workbench', label: 'Workbench mid-scroll', size: '728x90 responsive', state: 'Placeholder only' },
  { id: 'mobile-inline', label: 'Mobile inline', size: '320x100', state: 'Placeholder only' },
];

function useLocalStorageState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = window.localStorage.getItem(key);
    if (!stored) return fallback;
    try {
      return JSON.parse(stored) as T;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

function safeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
    return url.toString();
  } catch {
    return '';
  }
}

function embedUrl(value: string) {
  const safe = safeUrl(value);
  if (!safe) return '';
  const url = new URL(safe);
  const host = url.hostname.replace(/^www\./, '');

  if (host === 'youtube.com' && url.searchParams.get('v')) {
    return `https://www.youtube-nocookie.com/embed/${url.searchParams.get('v')}`;
  }
  if (host === 'youtu.be') {
    return `https://www.youtube-nocookie.com/embed/${url.pathname.replace('/', '')}`;
  }
  if (host === 'vimeo.com') {
    const id = url.pathname.split('/').filter(Boolean)[0];
    return id ? `https://player.vimeo.com/video/${id}` : safe;
  }
  return safe;
}

function urlKind(value: string): 'audio' | 'image' | 'iframe' | 'video' {
  const safe = safeUrl(value);
  if (!safe) return 'iframe';
  const pathname = new URL(safe).pathname.toLowerCase();
  if (/\.(png|jpe?g|webp|gif|avif|svg)$/.test(pathname)) return 'image';
  if (/\.(mp4|webm|mov|m4v)$/.test(pathname)) return 'video';
  if (/\.(mp3|wav|ogg|m4a)$/.test(pathname)) return 'audio';
  return 'iframe';
}

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}

function groupCounts() {
  return sourcePages.reduce<Record<string, number>>((counts, page) => {
    counts[page.area] = (counts[page.area] ?? 0) + 1;
    return counts;
  }, {});
}

function MediaEmbed({ url, label }: { url: string; label: string }) {
  const safe = safeUrl(url);
  if (!safe) return null;
  const kind = urlKind(safe);

  if (kind === 'image') {
    return <img src={safe} alt={label} loading="lazy" />;
  }
  if (kind === 'video') {
    return <video src={safe} controls preload="metadata" />;
  }
  if (kind === 'audio') {
    return <audio src={safe} controls preload="metadata" />;
  }

  return (
    <iframe
      title={label}
      src={embedUrl(safe)}
      loading="lazy"
      sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
      referrerPolicy="no-referrer"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  );
}

function ModuleNav({
  activeId,
  filter,
  onFilter,
  onSelect,
}: {
  activeId: string;
  filter: string;
  onFilter: (value: string) => void;
  onSelect: (id: string) => void;
}) {
  const counts = groupCounts();
  const filteredPages = sourcePages.filter((page) => {
    const haystack = `${page.title} ${page.area} ${page.group} ${page.extract}`.toLowerCase();
    return haystack.includes(filter.toLowerCase());
  });

  return (
    <>
      <div className="brand-block">
        <div className="brand-mark" aria-hidden="true">
          <Film size={30} />
        </div>
        <div>
          <strong>Filmska</strong>
          <span>Teorija</span>
        </div>
      </div>

      <label className="search-box">
        <Search size={16} />
        <input value={filter} onChange={(event) => onFilter(event.target.value)} placeholder="Search modules" />
      </label>

      <div className="source-meter">
        <span>{sourcePages.length}/24 modules loaded</span>
        <a href={sourceRegistry.license.url} target="_blank" rel="noreferrer">
          CC BY-SA
        </a>
      </div>

      <nav className="module-list" aria-label="Film theory modules">
        {filteredPages.map((page) => (
          <a
            key={page.id}
            href={moduleUrl(page.id)}
            className={page.id === activeId ? 'active' : ''}
            aria-current={page.id === activeId ? 'page' : undefined}
            onClick={(event) => {
              event.preventDefault();
              onSelect(page.id);
            }}
          >
            <span className={`area-dot area-${page.area.toLowerCase()}`} />
            <span>
              <strong>{page.title}</strong>
              <small>
                {page.area} · {page.group}
              </small>
            </span>
          </a>
        ))}
      </nav>

      <div className="rail-summary" aria-label="Source coverage by area">
        {Object.entries(counts).map(([area, count]) => (
          <div key={area}>
            <span>{area}</span>
            <strong>{count}</strong>
          </div>
        ))}
      </div>
    </>
  );
}

function Workbench({
  page,
  media,
  items,
  onTimeUpdate,
  onJump,
}: {
  page: SourcePage;
  media: MediaSlot;
  items: BreakdownItem[];
  onTimeUpdate: (seconds: number) => void;
  onJump: (section: string) => void;
}) {
  const annotations = buildAnnotationPrompts(page);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const heroUrl = media.videoUrl || media.imageUrl;
  const hasHero = Boolean(safeUrl(heroUrl));
  const directVideo = media.videoUrl && urlKind(media.videoUrl) === 'video';
  const activeItems = items.filter((item) => item.moduleId === page.id);

  const seekTo = (timecode: string) => {
    const seconds = parseTimecode(timecode);
    if (seconds !== null && videoRef.current && Number.isFinite(videoRef.current.duration)) {
      videoRef.current.currentTime = Math.min(seconds, videoRef.current.duration);
    }
  };

  return (
    <section className="panel workbench-panel fx-layer" id="workbench">
      <div className="panel-bar paper">
        <span>Theory Workbench</span>
        <a href={page.sourceUrl} target="_blank" rel="noreferrer">
          Source <ExternalLink size={14} />
        </a>
      </div>
      <div className="media-stage">
        {directVideo ? (
          <video
            ref={videoRef}
            src={safeUrl(media.videoUrl)}
            controls
            preload="metadata"
            onTimeUpdate={(event) => onTimeUpdate(event.currentTarget.currentTime)}
          />
        ) : hasHero ? (
          <MediaEmbed url={heroUrl} label={`${page.title} media`} />
        ) : (
          <div className="media-placeholder">
            {page.thumbnail ? <img src={page.thumbnail} alt="" loading="lazy" /> : <Video size={48} />}
            <div>
              <strong>{page.title}</strong>
              <span>Drop in a clip or image URL from Media URLs.</span>
            </div>
          </div>
        )}
      </div>
      <div className="annotation-timeline" aria-label="Theory study prompts">
        {annotations.map((annotation) => (
          <article key={annotation.label}>
            <strong>{annotation.label}</strong>
            <p>{annotation.body}</p>
          </article>
        ))}
      </div>
      <div className="clip-tags">
        <strong>{directVideo ? 'Timed scene notes' : 'Scene notes'}</strong>
        {activeItems.length ? activeItems.map((item) => (
          <button key={item.id} type="button" onClick={() => directVideo ? seekTo(item.timecode) : onJump('breakdown')}>
            <time>{item.timecode}</time> {item.technique}
          </button>
        )) : <span>Add an evidence tag below to build a scene reading.</span>}
        {!directVideo && media.videoUrl ? <small>Embedded players do not expose playback time here; enter timecodes manually.</small> : null}
      </div>
    </section>
  );
}

function SourceCard({ page }: { page: SourcePage }) {
  const note = editorialById[page.id];
  return (
    <section className="panel source-panel">
      <div className="panel-bar paper">
        <span>Source-backed module</span>
        <BookOpen size={16} />
      </div>
      <div className="source-body">
        <div className="module-heading">
          {page.thumbnail ? <img src={page.thumbnail} alt="" loading="lazy" /> : <Clapperboard size={34} />}
          <div>
            <h2>{page.title}</h2>
            <p>
              {page.redirectedTo ? `Redirects to ${page.redirectedTo}` : page.sourceTitle} · {page.area}
            </p>
          </div>
        </div>
        {note ? (
          <div className="editorial-note">
            <strong>Filmska reading</strong>
            <p>{note.take}</p>
            <strong>Try it on a scene</strong>
            <p>{note.method}</p>
            {note.references?.map((reference) => (
              <a key={reference.url} className="text-link" href={reference.url} target="_blank" rel="noreferrer">
                {reference.label} <ExternalLink size={13} />
              </a>
            ))}
          </div>
        ) : null}
        <strong className="source-label">Wikipedia source extract</strong>
        <p>{shortExtract(page, 680)}</p>
        <div className="tag-stack">
          {[page.group, page.period, ...page.categories.slice(0, 4)].map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <a className="text-link" href={page.sourceUrl} target="_blank" rel="noreferrer">
          Open source page <ExternalLink size={14} />
        </a>
      </div>
    </section>
  );
}

function MediaUrlPanel({
  draft,
  error,
  onChange,
  onSave,
  onClear,
}: {
  draft: MediaSlot;
  error: string;
  onChange: (slot: keyof MediaSlot, value: string) => void;
  onSave: () => void;
  onClear: () => void;
}) {
  const fields: Array<{ key: keyof MediaSlot; label: string; icon: ReactNode; placeholder: string }> = [
    { key: 'imageUrl', label: 'Image URL', icon: <ImageIcon size={15} />, placeholder: 'https://...' },
    { key: 'videoUrl', label: 'Video or embed URL', icon: <Play size={15} />, placeholder: 'YouTube, Vimeo, MP4...' },
    { key: 'audioUrl', label: 'Audio URL', icon: <Volume2 size={15} />, placeholder: 'MP3, WAV, OGG...' },
    { key: 'podcastUrl', label: 'Podcast embed URL', icon: <Link2 size={15} />, placeholder: 'Spotify, Apple, RSS page...' },
  ];

  return (
    <section className="panel media-url-panel" id="media">
      <div className="panel-bar paper">
        <span>Media URLs</span>
        <Save size={16} />
      </div>
      <div className="field-stack">
        {fields.map((field) => (
          <label key={field.key}>
            <span>
              {field.icon}
              {field.label}
            </span>
            <input
              value={draft[field.key]}
              onChange={(event) => onChange(field.key, event.target.value)}
              placeholder={field.placeholder}
              inputMode="url"
            />
          </label>
        ))}
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="button-row">
        <button type="button" className="primary-button" onClick={onSave}>
          <Save size={15} /> Save media
        </button>
        <button type="button" className="ghost-button" onClick={onClear}>
          <Trash2 size={15} /> Clear
        </button>
      </div>
    </section>
  );
}

function LensSimulator({ page }: { page: SourcePage }) {
  const [selectedLens, setSelectedLens] = useState(lensPages[0]?.id ?? page.id);
  const activeLens = sourceById.get(selectedLens) ?? lensPages[0] ?? page;

  useEffect(() => {
    if (lensPages.some((lens) => lens.id === page.id)) setSelectedLens(page.id);
  }, [page.id]);

  return (
    <section className="panel lens-panel" id="lenses">
      <div className="panel-bar paper">
        <span>Lens Simulator</span>
        <Brain size={16} />
      </div>
      <div className="lens-layout">
        <div className="lens-rail" aria-label="Theory lenses">
          {lensPages.map((lens) => (
            <button
              key={lens.id}
              type="button"
              className={selectedLens === lens.id ? 'active' : ''}
              onClick={() => setSelectedLens(lens.id)}
            >
              {lens.title.replace(' film theory', '')}
            </button>
          ))}
        </div>
        <div className="lens-result">
          <h3>{activeLens.title}</h3>
          <p>{shortExtract(activeLens, 500)}</p>
          <div className="comparison-grid">
            <article>
              <strong>Scene question</strong>
              <span>What detail in the selected clip can be observed before interpretation?</span>
            </article>
            <article>
              <strong>Lens question</strong>
              <span>{`How would ${activeLens.title} change the claim you make about ${page.title}?`}</span>
            </article>
            <article>
              <strong>Counterargument</strong>
              <span>Which source-backed lens would disagree, and what evidence would it need?</span>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelinePanel({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <section className="panel timeline-panel" id="timeline">
      <div className="panel-bar paper">
        <span>Visual History Timeline</span>
        <Clock3 size={16} />
      </div>
      <div className="timeline-list">
        {timelineEvents.map((event) => {
          const page = sourceById.get(event.sourceId);
          return (
            <article key={`${event.year}-${event.title}`}>
              <time>{event.year}</time>
              <div>
                <h3>{event.title}</h3>
                <p>{event.note}</p>
                {page ? (
                  <button type="button" onClick={() => onSelect(page.id)}>
                    Inspect {page.title} <ChevronRight size={14} />
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function PracticePanel({ activeTitle }: { activeTitle: string }) {
  return (
    <section className="panel practice-panel">
      <div className="panel-bar paper">
        <span>Theory vs. Practice</span>
        <Clapperboard size={16} />
      </div>
      <div className="practice-grid">
        {practicePages.map((practice) => (
          <article key={practice.id}>
            <strong>{practice.title}</strong>
            <p>{firstSentence(practice.extract)}</p>
            <span>{`Use with ${activeTitle}: capture one observable production choice before interpreting it.`}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function KnowledgePanel({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
  const [show3d, setShow3d] = useState(false);
  const graph = useMemo(() => buildKnowledgeGraph(sourcePages), []);
  const nodes = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node])), [graph]);
  const sourceLinks = useMemo(
    () => graph.edges.filter((edge) => edge.relation === 'Wikipedia link' && edge.from === activeId),
    [graph, activeId],
  );
  const visibleEdges = useMemo(
    () => graph.edges.filter((edge) => edge.relation !== 'Wikipedia link' || edge.from === activeId || edge.to === activeId),
    [graph, activeId],
  );

  return (
    <section className="panel graph-panel" id="graph">
      <div className="panel-bar paper"><span>Concept Map & Knowledge Graph</span><Network size={16} /></div>
      <div className="graph-accessible">
        <p>Documented connections between theorists, publications, concepts, and modules.</p>
        <ul>
          {graph.edges.filter((edge) => edge.relation !== 'Wikipedia link').map((edge) => {
            const from = nodes.get(edge.from);
            const to = nodes.get(edge.to);
            return (
              <li key={`${edge.from}-${edge.to}`}>
                <span>{from?.label} <em>{edge.relation}</em> {to?.label}</span>
                {to?.moduleId ? (
                  <button type="button" onClick={() => onSelect(to.moduleId!)}>Open module</button>
                ) : null}
                <a href={edge.sourceUrl} target="_blank" rel="noreferrer" aria-label={`Source for ${from?.label} to ${to?.label}`}>
                  <ExternalLink size={14} />
                </a>
              </li>
            );
          })}
        </ul>
        {sourceLinks.length ? (
          <>
            <strong>Links from this source article</strong>
            <ul>
              {sourceLinks.map((edge) => (
                <li key={`source-${edge.from}-${edge.to}`}>
                  <button type="button" onClick={() => onSelect(edge.to)}>{nodes.get(edge.to)?.label}</button>
                  <a href={edge.sourceUrl} target="_blank" rel="noreferrer" aria-label={`Wikipedia source for ${nodes.get(edge.to)?.label}`}>
                    <ExternalLink size={14} />
                  </a>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {!show3d ? (
          <button type="button" className="ghost-button" onClick={() => setShow3d(true)}>Load 3D view</button>
        ) : null}
      </div>
      {show3d ? (
        <Suspense fallback={<p className="graph-loading">Loading 3D view...</p>}>
          <TheoryGraph nodes={graph.nodes} edges={visibleEdges} activeId={activeId} onSelect={onSelect} />
        </Suspense>
      ) : null}
    </section>
  );
}

function CaseStudyPanel({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
  const relevant = caseStudies.filter((study) => study.moduleId === activeId);
  const studies = relevant.length ? relevant : caseStudies;
  return (
    <section className="panel case-study-panel" id="case-studies">
      <div className="panel-bar paper"><span>Worked Scene Readings</span><Clapperboard size={16} /></div>
      <div className="case-study-list">
        {studies.map((study) => (
          <article key={study.id}>
            <div className="case-study-heading">
              <div><small>{study.film}</small><h3>{study.scene}</h3></div>
              <button type="button" className="ghost-button" onClick={() => onSelect(study.moduleId)}>
                {sourceById.get(study.moduleId)?.title} <ChevronRight size={14} />
              </button>
            </div>
            <dl>
              <div><dt>Observable evidence</dt><dd>{study.observation}</dd></div>
              <div><dt>Our reading</dt><dd>{study.reading}</dd></div>
              <div><dt>Counter-reading</dt><dd>{study.counterReading}</dd></div>
            </dl>
            <div className="case-citations">
              <strong>Sources</strong>
              {study.citations.map((citation) => (
                <a key={citation.url} href={citation.url} target="_blank" rel="noreferrer" title={citation.detail}>
                  {citation.label} <ExternalLink size={13} />
                </a>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function BreakdownBoard({
  activePage,
  onCaptureTime,
  canSync,
  items,
  onAdd,
  onRemove,
}: {
  activePage: SourcePage;
  onCaptureTime: () => string;
  canSync: boolean;
  items: BreakdownItem[];
  onAdd: (item: Omit<BreakdownItem, 'createdAt' | 'id'>) => void;
  onRemove: (id: string) => void;
}) {
  const [timecode, setTimecode] = useState('00:00');
  const [technique, setTechnique] = useState('');
  const [evidence, setEvidence] = useState('');
  const [lens, setLens] = useState(activePage.title);
  const [timeError, setTimeError] = useState('');

  useEffect(() => {
    setLens(activePage.title);
  }, [activePage.title]);

  const activeItems = items.filter((item) => item.moduleId === activePage.id);

  const submit = () => {
    if (!technique.trim() || !evidence.trim()) return;
    if (parseTimecode(timecode) === null) {
      setTimeError('Use a timecode such as 01:24 or 01:02:24.');
      return;
    }
    onAdd({
      moduleId: activePage.id,
      timecode: timecode.trim() || '00:00',
      technique: technique.trim(),
      evidence: evidence.trim(),
      lens,
    });
    setTechnique('');
    setEvidence('');
    setTimeError('');
  };

  return (
    <section className="panel breakdown-panel" id="breakdown">
      <div className="panel-bar paper">
        <span>Scene Breakdown Board</span>
        <Tags size={16} />
      </div>
      <div className="breakdown-form">
        <input value={timecode} onChange={(event) => setTimecode(event.target.value)} aria-label="Timecode" />
        {canSync ? (
          <button type="button" className="ghost-button" onClick={() => setTimecode(onCaptureTime())}>
            Use player time
          </button>
        ) : null}
        <input
          value={technique}
          onChange={(event) => setTechnique(event.target.value)}
          placeholder="Technique or term"
          aria-label="Technique or term"
        />
        <select value={lens} onChange={(event) => setLens(event.target.value)} aria-label="Lens">
          {[activePage, ...lensPages.filter((page) => page.id !== activePage.id)].map((page) => (
            <option key={page.id} value={page.title}>
              {page.title}
            </option>
          ))}
        </select>
        <textarea
          value={evidence}
          onChange={(event) => setEvidence(event.target.value)}
          placeholder="Observable evidence, not conclusion first"
          aria-label="Observable evidence"
        />
        <button type="button" className="primary-button" onClick={submit}>
          <Plus size={15} /> Add tag
        </button>
      </div>
      {timeError ? <p className="form-error">{timeError}</p> : null}
      <div className="breakdown-list">
        {activeItems.length ? (
          activeItems.map((item) => (
            <article key={item.id}>
              <time>{item.timecode}</time>
              <div>
                <strong>{item.technique}</strong>
                <span>{item.lens}</span>
                <p>{item.evidence}</p>
              </div>
              <button type="button" aria-label="Remove breakdown item" onClick={() => onRemove(item.id)}>
                <X size={15} />
              </button>
            </article>
          ))
        ) : (
          <p className="empty-note">No local breakdown tags for this module yet.</p>
        )}
      </div>
    </section>
  );
}

function GlossaryQuiz() {
  const quizPages = sourcePages.filter((page) => page.extract.trim().length > 60);
  const [index, setIndex] = useState(0);
  const [answerId, setAnswerId] = useState<string | null>(null);
  const active = quizPages[index % quizPages.length];
  const choices = useMemo(() => {
    const candidates = [
      active,
      quizPages[(index + 5) % quizPages.length],
      quizPages[(index + 11) % quizPages.length],
      quizPages[(index + 17) % quizPages.length],
    ];
    return candidates.sort((a, b) => a.title.localeCompare(b.title));
  }, [active, index, quizPages]);

  const answered = Boolean(answerId);
  const correct = answerId === active.id;

  return (
    <section className="panel quiz-panel" id="quiz">
      <div className="panel-bar paper">
        <span>Glossary & Quiz</span>
        <CircleHelp size={16} />
      </div>
      <p className="quiz-prompt">{firstSentence(active.extract)}</p>
      <div className="choice-list">
        {choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            className={answerId === choice.id ? (correct ? 'correct' : 'wrong') : ''}
            onClick={() => setAnswerId(choice.id)}
          >
            {choice.title}
          </button>
        ))}
      </div>
      <div className="quiz-footer">
        <span>{answered ? (correct ? 'Correct source match' : `Source match: ${active.title}`) : 'Pick the source title'}</span>
        <button
          type="button"
          className="ghost-button"
          onClick={() => {
            setAnswerId(null);
            setIndex((current) => current + 1);
          }}
        >
          Next
        </button>
      </div>
    </section>
  );
}

function ReaderPanel({
  items,
  onAdd,
  onRemove,
}: {
  items: ReaderItem[];
  onAdd: (item: Omit<ReaderItem, 'createdAt' | 'id'>) => void;
  onRemove: (id: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const periodicals = sourceById.get('list-of-film-periodicals');

  const submit = () => {
    const clean = safeUrl(url);
    if (!title.trim() || !clean) {
      setError('Add a title and a valid http/https URL.');
      return;
    }
    onAdd({ title: title.trim(), url: clean, note: note.trim() });
    setTitle('');
    setUrl('');
    setNote('');
    setError('');
  };

  return (
    <section className="panel reader-panel" id="reader">
      <div className="panel-bar paper">
        <span>Periodical & Paper Reader</span>
        <Newspaper size={16} />
      </div>
      {periodicals ? (
        <a className="source-strip" href={periodicals.sourceUrl} target="_blank" rel="noreferrer">
          Start from {periodicals.title} <ExternalLink size={14} />
        </a>
      ) : null}
      <div className="reader-form">
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Paper or feed title" />
        <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." inputMode="url" />
        <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Research note" />
        {error ? <p className="form-error">{error}</p> : null}
        <button type="button" className="primary-button" onClick={submit}>
          <Plus size={15} /> Add source
        </button>
      </div>
      <div className="reader-list">
        {items.length ? (
          items.map((item) => (
            <article key={item.id}>
              <a href={item.url} target="_blank" rel="noreferrer">
                {item.title} <ExternalLink size={13} />
              </a>
              <p>{item.note || 'No note'}</p>
              <button type="button" aria-label="Remove reader item" onClick={() => onRemove(item.id)}>
                <X size={14} />
              </button>
            </article>
          ))
        ) : (
          <p className="empty-note">No local reader items saved.</p>
        )}
      </div>
    </section>
  );
}

function EssayPartner({
  activePage,
  value,
  onChange,
}: {
  activePage: SourcePage;
  value: string;
  onChange: (value: string) => void;
}) {
  const lowerEssay = value.toLowerCase();
  const matchedPages = sourcePages.filter((page) => {
    const keywords = titleKeywords(page);
    return keywords.some((keyword) => lowerEssay.includes(keyword));
  });
  const missingLens = lensPages.filter((lens) => !matchedPages.some((page) => page.id === lens.id)).slice(0, 3);

  return (
    <section className="panel essay-panel" id="essay">
      <div className="panel-bar paper">
        <span>Essay & Hypothesis Partner</span>
        <Bot size={16} />
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`Draft a claim about ${activePage.title}`}
        aria-label="Essay outline"
      />
      <div className="essay-results">
        <article>
          <strong>Detected source lenses</strong>
          <p>{matchedPages.length ? matchedPages.slice(0, 5).map((page) => page.title).join(', ') : 'None yet'}</p>
        </article>
        <article>
          <strong>Counter-lens queue</strong>
          <p>{missingLens.length ? missingLens.map((page) => page.title).join(', ') : 'Core lens set covered'}</p>
        </article>
        <article>
          <strong>Next citation move</strong>
          <p>{`Tie one claim back to ${activePage.title}: ${firstSentence(activePage.extract)}`}</p>
        </article>
      </div>
    </section>
  );
}

function AdSenseInspector() {
  return (
    <section className="panel adsense-panel" id="adsense">
      <div className="panel-bar paper">
        <span>AdSense Inspector</span>
        <BadgeDollarSign size={16} />
      </div>
      <div className="ad-slot-preview">
        <span>AdSense Placeholder</span>
        <strong>Responsive</strong>
        <small>No publisher ID configured</small>
      </div>
      <div className="ad-slot-list">
        {adSlots.map((slot) => (
          <article key={slot.id}>
            <span>{slot.label}</span>
            <strong>{slot.size}</strong>
            <small>{slot.state}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function RoadmapPanel() {
  return (
    <section className="panel roadmap-panel">
      <div className="panel-bar paper">
        <span>Core Feature Roadmap</span>
        <CheckCircle2 size={16} />
      </div>
      <div className="roadmap-list">
        {featureRoadmap.map((feature, index) => (
          <article key={feature.title}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <div>
              <strong>{feature.title}</strong>
              <p>{feature.value}</p>
              <small>{feature.status}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function BlogPanel({ activePage }: { activePage: SourcePage }) {
  const candidates = sourcePages
    .filter((page) => page.id !== activePage.id && page.area === activePage.area)
    .slice(0, 3);

  return (
    <section className="panel blog-panel" id="blog">
      <div className="panel-bar paper">
        <span>Blog & Study Notes</span>
        <FileText size={16} />
      </div>
      <div className="blog-list">
        <article>
          <strong>{`How to read a scene through ${activePage.title}`}</strong>
          <p>{firstSentence(activePage.extract)}</p>
          <small>Draft from source extract. Needs original editorial expansion before publication.</small>
        </article>
        {candidates.map((page) => (
          <article key={page.id}>
            <strong>{`${activePage.title} vs. ${page.title}`}</strong>
            <p>{firstSentence(page.extract)}</p>
            <small>Comparison prompt, source-linked.</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function App() {
  const [activeId, setActiveId] = useState(routeModuleId);
  const [filter, setFilter] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState('');
  const [mediaById, setMediaById] = useLocalStorageState<Record<string, MediaSlot>>('filmska-media', {});
  const [breakdowns, setBreakdowns] = useLocalStorageState<BreakdownItem[]>('filmska-breakdowns', []);
  const [readerItems, setReaderItems] = useLocalStorageState<ReaderItem[]>('filmska-reader', []);
  const [essays, setEssays] = useLocalStorageState<Record<string, string>>('filmska-essays', {});
  const playerTimeRef = useRef(0);
  const activePage = sourceById.get(activeId) ?? sourcePages[0];
  const activeMedia = mediaById[activePage.id] ?? emptyMedia;
  const [draftMedia, setDraftMedia] = useState(activeMedia);
  const [mediaError, setMediaError] = useState('');

  useEffect(() => {
    setDraftMedia(mediaById[activePage.id] ?? emptyMedia);
    setMediaError('');
  }, [activePage.id, mediaById]);

  useEffect(() => {
    if (window.location.hash && sourceById.has(window.location.hash.slice(1))) {
      window.history.replaceState(null, '', moduleUrl(window.location.hash.slice(1)));
    }
    const onPopState = () => setActiveId(routeModuleId());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const rootRoute = window.location.pathname === import.meta.env.BASE_URL;
    const title = rootRoute ? 'Filmska Teorija' : `${activePage.title} | Filmska Teorija`;
    const description = editorialById[activePage.id]?.take ?? firstSentence(activePage.extract);
    document.title = title;
    const setMeta = (selector: string, content: string) => {
      const element = document.head.querySelector<HTMLMetaElement>(selector);
      if (element) element.content = content;
    };
    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute(
      'href',
      `${window.location.origin}${rootRoute ? import.meta.env.BASE_URL : moduleUrl(activePage.id)}`,
    );
    const indexable = rootRoute || caseStudies.some((study) => study.moduleId === activePage.id);
    let robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!indexable && !robots) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      document.head.appendChild(robots);
    }
    if (robots) {
      if (indexable) robots.remove();
      else robots.content = 'noindex';
    }
  }, [activePage.id, activePage.title, activePage.extract]);

  const mediaPreviews = [activeMedia.imageUrl, activeMedia.videoUrl, activeMedia.audioUrl, activeMedia.podcastUrl].filter(
    Boolean,
  );

  const selectPage = (id: string) => {
    if (window.location.pathname !== moduleUrl(id)) {
      window.history.pushState(null, '', moduleUrl(id));
    }
    setActiveId(id);
    playerTimeRef.current = 0;
    setNavOpen(false);
  };

  const jumpTo = (section: string) => {
    document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const saveMedia = () => {
    const invalid = Object.values(draftMedia).find((value) => value.trim() && !safeUrl(value));
    if (invalid) {
      setMediaError('Only valid http/https media URLs are accepted.');
      return;
    }
    setMediaById((current) => ({
      ...current,
      [activePage.id]: {
        imageUrl: safeUrl(draftMedia.imageUrl),
        videoUrl: safeUrl(draftMedia.videoUrl),
        audioUrl: safeUrl(draftMedia.audioUrl),
        podcastUrl: safeUrl(draftMedia.podcastUrl),
      },
    }));
    setMediaError('');
  };

  const clearMedia = () => {
    setMediaById((current) => {
      const next = { ...current };
      delete next[activePage.id];
      return next;
    });
    setDraftMedia(emptyMedia);
  };

  const shareModule = async () => {
    const shareUrl = `${window.location.origin}${moduleUrl(activePage.id)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Filmska Teorija: ${activePage.title}`, url: shareUrl });
        setShareStatus('Shared');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShareStatus('Link copied');
      }
    } catch {
      setShareStatus('Share canceled');
    }
  };

  return (
    <div className="app-shell">
      <aside id="module-nav" className={`side-rail ${navOpen ? 'open' : ''}`}>
        <ModuleNav activeId={activePage.id} filter={filter} onFilter={setFilter} onSelect={selectPage} />
      </aside>

      <button
        type="button"
        className="mobile-nav-button"
        aria-controls="module-nav"
        aria-expanded={navOpen}
        onClick={() => setNavOpen((current) => !current)}
      >
        {navOpen ? <X size={22} /> : <Menu size={22} />}
        <span>Modules</span>
      </button>

      <main className="workspace">
        <header className="workspace-header">
          <div>
            <span className="source-kicker">Source-backed film theory atlas</span>
            <h1>{activePage.title}</h1>
            <p>{editorialById[activePage.id]?.take ?? firstSentence(activePage.extract)}</p>
          </div>
          <button type="button" className="share-button" onClick={shareModule}>
            <Share2 size={17} />
            {shareStatus || 'Share'}
          </button>
        </header>

        <div className="workspace-grid">
          <div className="primary-stack">
            <Workbench
              page={activePage}
              media={activeMedia}
              items={breakdowns}
              onTimeUpdate={(seconds) => { playerTimeRef.current = seconds; }}
              onJump={jumpTo}
            />
            <LensSimulator page={activePage} />
            <KnowledgePanel activeId={activePage.id} onSelect={selectPage} />
            <TimelinePanel onSelect={selectPage} />
            <PracticePanel activeTitle={activePage.title} />
            <CaseStudyPanel activeId={activePage.id} onSelect={selectPage} />
            <BreakdownBoard
              activePage={activePage}
              onCaptureTime={() => formatTimecode(playerTimeRef.current)}
              canSync={Boolean(activeMedia.videoUrl && urlKind(activeMedia.videoUrl) === 'video')}
              items={breakdowns}
              onAdd={(item) =>
                setBreakdowns((current) => [
                  { ...item, id: newId('scene'), createdAt: new Date().toISOString() },
                  ...current,
                ])
              }
              onRemove={(id) => setBreakdowns((current) => current.filter((item) => item.id !== id))}
            />
            <GlossaryQuiz />
            <ReaderPanel
              items={readerItems}
              onAdd={(item) =>
                setReaderItems((current) => [
                  { ...item, id: newId('reader'), createdAt: new Date().toISOString() },
                  ...current,
                ])
              }
              onRemove={(id) => setReaderItems((current) => current.filter((item) => item.id !== id))}
            />
            <EssayPartner
              activePage={activePage}
              value={essays[activePage.id] ?? ''}
              onChange={(value) => setEssays((current) => ({ ...current, [activePage.id]: value }))}
            />
            <BlogPanel activePage={activePage} />
            <RoadmapPanel />
          </div>

          <aside className="inspector-stack">
            <SourceCard page={activePage} />
            <MediaUrlPanel
              draft={draftMedia}
              error={mediaError}
              onChange={(slot, value) => setDraftMedia((current) => ({ ...current, [slot]: value }))}
              onSave={saveMedia}
              onClear={clearMedia}
            />
            <section className="panel media-preview-panel">
              <div className="panel-bar paper">
                <span>Embeds</span>
                <Video size={16} />
              </div>
              <div className="embed-stack">
                {mediaPreviews.length ? (
                  mediaPreviews.map((url) => <MediaEmbed key={url} url={url} label={`${activePage.title} embed`} />)
                ) : (
                  <div className="empty-embed">
                    <FileText size={28} />
                    <span>Image, video, audio, and podcast slots are ready.</span>
                  </div>
                )}
              </div>
            </section>
            <AdSenseInspector />
            <section className="panel license-panel">
              <div className="panel-bar paper">
                <span>Attribution</span>
                <ExternalLink size={16} />
              </div>
              <p>{sourceRegistry.license.text}</p>
              <p>{`Registry generated ${new Date(sourceRegistry.generatedAt).toLocaleString()}.`}</p>
            </section>
          </aside>
        </div>
        <footer className="app-footer">
          <span>Filmska Teorija is a local-first film theory workbench.</span>
          <a href="https://kineticgain.com/" target="_blank" rel="noreferrer">
            Kinetic Gain
          </a>
          <a href="https://www.linkedin.com/company/kinetic-gain/" target="_blank" rel="noreferrer">
            LinkedIn
          </a>
          <a href={`${import.meta.env.BASE_URL}privacy.html`}>Privacy</a>
          <a href={`${import.meta.env.BASE_URL}terms.html`}>Terms</a>
          <a href={`${import.meta.env.BASE_URL}llm.txt`}>llm.txt</a>
        </footer>
      </main>
    </div>
  );
}

export default App;
