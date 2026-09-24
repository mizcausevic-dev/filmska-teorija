import type { SourcePage } from '../types';

export type GraphNode = {
  id: string;
  label: string;
  kind: 'module' | 'theorist' | 'publication' | 'concept';
  moduleId?: string;
  sourceUrl: string;
};

export type GraphEdge = {
  from: string;
  to: string;
  relation: string;
  sourceUrl: string;
};

const lineages: Array<{ nodes: GraphNode[]; edges: GraphEdge[] }> = [
  {
    nodes: [
      { id: 'mulvey', label: 'Laura Mulvey', kind: 'theorist', sourceUrl: 'https://doi.org/10.1093/screen/16.3.6' },
      { id: 'visual-pleasure', label: 'Visual Pleasure and Narrative Cinema (1975)', kind: 'publication', sourceUrl: 'https://doi.org/10.1093/screen/16.3.6' },
      { id: 'spectatorial-gaze', label: 'Spectatorial gaze', kind: 'concept', sourceUrl: 'https://doi.org/10.1093/screen/16.3.6' },
    ],
    edges: [
      { from: 'mulvey', to: 'visual-pleasure', relation: 'authored', sourceUrl: 'https://doi.org/10.1093/screen/16.3.6' },
      { from: 'visual-pleasure', to: 'spectatorial-gaze', relation: 'examines', sourceUrl: 'https://doi.org/10.1093/screen/16.3.6' },
      { from: 'spectatorial-gaze', to: 'feminist-film-theory', relation: 'informs', sourceUrl: 'https://doi.org/10.1093/screen/16.3.6' },
    ],
  },
  {
    nodes: [
      { id: 'bazin', label: 'André Bazin', kind: 'theorist', sourceUrl: 'https://www.ucpress.edu/books/what-is-cinema-volume-i/epub-pdf' },
      { id: 'what-is-cinema', label: 'What Is Cinema? Volume I', kind: 'publication', sourceUrl: 'https://www.ucpress.edu/books/what-is-cinema-volume-i/epub-pdf' },
      { id: 'language-of-cinema', label: 'The language of cinema', kind: 'concept', sourceUrl: 'https://www.ucpress.edu/books/what-is-cinema-volume-i/epub-pdf' },
    ],
    edges: [
      { from: 'bazin', to: 'what-is-cinema', relation: 'authored', sourceUrl: 'https://www.ucpress.edu/books/what-is-cinema-volume-i/epub-pdf' },
      { from: 'what-is-cinema', to: 'language-of-cinema', relation: 'includes an essay on', sourceUrl: 'https://www.ucpress.edu/books/what-is-cinema-volume-i/epub-pdf' },
      { from: 'language-of-cinema', to: 'film-theory', relation: 'contributes to', sourceUrl: 'https://www.ucpress.edu/books/what-is-cinema-volume-i/epub-pdf' },
    ],
  },
  {
    nodes: [
      { id: 'eisenstein', label: 'Sergei Eisenstein', kind: 'theorist', sourceUrl: 'https://cpb-us-e2.wpmucdn.com/sites.uci.edu/dist/4/2875/files/2017/01/MethodsOfMontageEisenstein_Sergei_Film_Form_Essays_in_Film_Theory_1977.pdf' },
      { id: 'methods-of-montage', label: 'Methods of Montage', kind: 'publication', sourceUrl: 'https://cpb-us-e2.wpmucdn.com/sites.uci.edu/dist/4/2875/files/2017/01/MethodsOfMontageEisenstein_Sergei_Film_Form_Essays_in_Film_Theory_1977.pdf' },
      { id: 'montage', label: 'Montage methods', kind: 'concept', sourceUrl: 'https://cpb-us-e2.wpmucdn.com/sites.uci.edu/dist/4/2875/files/2017/01/MethodsOfMontageEisenstein_Sergei_Film_Form_Essays_in_Film_Theory_1977.pdf' },
    ],
    edges: [
      { from: 'eisenstein', to: 'methods-of-montage', relation: 'authored', sourceUrl: 'https://cpb-us-e2.wpmucdn.com/sites.uci.edu/dist/4/2875/files/2017/01/MethodsOfMontageEisenstein_Sergei_Film_Form_Essays_in_Film_Theory_1977.pdf' },
      { from: 'methods-of-montage', to: 'montage', relation: 'distinguishes methods of', sourceUrl: 'https://cpb-us-e2.wpmucdn.com/sites.uci.edu/dist/4/2875/files/2017/01/MethodsOfMontageEisenstein_Sergei_Film_Form_Essays_in_Film_Theory_1977.pdf' },
      { from: 'montage', to: 'film-theory', relation: 'contributes to', sourceUrl: 'https://cpb-us-e2.wpmucdn.com/sites.uci.edu/dist/4/2875/files/2017/01/MethodsOfMontageEisenstein_Sergei_Film_Form_Essays_in_Film_Theory_1977.pdf' },
    ],
  },
];

export function buildKnowledgeGraph(pages: SourcePage[]) {
  const nodes: GraphNode[] = pages.map((page) => ({
    id: page.id,
    label: page.title,
    kind: 'module',
    moduleId: page.id,
    sourceUrl: page.sourceUrl,
  }));
  const edges: GraphEdge[] = [];
  for (const lineage of lineages) {
    nodes.push(...lineage.nodes);
    edges.push(...lineage.edges);
  }
  for (const page of pages) {
    if (page.redirectedTo) continue;
    for (const relatedId of page.relatedIds) {
      edges.push({ from: page.id, to: relatedId, relation: 'Wikipedia link', sourceUrl: page.sourceUrl });
    }
  }
  return { nodes, edges };
}
