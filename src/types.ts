export type SourceArea = 'Concept' | 'Foundation' | 'Practice' | 'Reference' | 'Theory';

export type SourcePage = {
  id: string;
  title: string;
  area: SourceArea;
  group: string;
  period: string;
  sourceTitle: string;
  redirectedTo: string | null;
  pageId: number;
  displayIndex: number;
  requestedUrl: string;
  sourceUrl: string;
  canonicalUrl: string;
  extract: string;
  thumbnail: string | null;
  relatedTitles: string[];
  relatedIds: string[];
  categories: string[];
  retrievedAt: string;
};

export type SourceRegistry = {
  generatedAt: string;
  source: string;
  license: {
    text: string;
    url: string;
  };
  pages: SourcePage[];
};

export type MediaSlot = {
  imageUrl: string;
  videoUrl: string;
  audioUrl: string;
  podcastUrl: string;
};

export type BreakdownItem = {
  id: string;
  moduleId: string;
  timecode: string;
  technique: string;
  evidence: string;
  lens: string;
  createdAt: string;
};

export type ReaderItem = {
  id: string;
  title: string;
  url: string;
  note: string;
  createdAt: string;
};
