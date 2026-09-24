export type Citation = { label: string; url: string; detail: string };

export type CaseStudy = {
  id: string;
  film: string;
  scene: string;
  moduleId: string;
  observation: string;
  reading: string;
  counterReading: string;
  citations: Citation[];
};

export const caseStudies: CaseStudy[] = [
  {
    id: 'train-robbery-direct-address',
    film: 'The Great Train Robbery (1903)',
    scene: 'The gunman faces the camera',
    moduleId: 'apparatus-theory',
    observation: 'The gunman appears in medium close-up and fires directly toward the screen. The Library of Congress notes that exhibitors could place this shot at either end of the film.',
    reading: 'An apparatus reading asks how this direct address changes the viewer from an observer of the robbery into the apparent target of the image. That is our interpretation of the shot, not a claim that the film or its makers advanced apparatus theory.',
    counterReading: 'A narrative reading would first ask whether the shot advances the robbery story at all, especially because its exhibition position was flexible.',
    citations: [
      { label: 'Library of Congress, National Film Registry', url: 'https://www.loc.gov/programs/national-film-preservation-board/film-registry/descriptions-and-essays/', detail: 'The Great Train Robbery entry, final gunman shot and flexible placement.' },
      { label: 'Library of Congress film record', url: 'https://www.loc.gov/item/00694220/', detail: '1903 film record and viewing copy.' },
    ],
  },
  {
    id: 'suspense-triptych',
    film: 'Suspense (1913)',
    scene: 'Three actions share one frame',
    moduleId: 'cinematography',
    observation: 'MoMA describes three simultaneous actions arranged as a triptych in one frame while a mother and child are threatened and the father races home.',
    reading: 'The divided frame makes the viewer compare concurrent spaces rather than wait for separate shots. A close reading can track which part of the frame receives attention first and how that order builds urgency.',
    counterReading: 'A feminist reading should also ask whose knowledge and vulnerability the arrangement foregrounds; it should not infer the filmmakers\' intent from the device alone.',
    citations: [
      { label: 'MoMA collection record', url: 'https://www.moma.org/collection/works/304339', detail: 'Credits, story outline, and three-action triptych.' },
      { label: 'BFI film record', url: 'https://www.bfi.org.uk/film/6fec2bfd-590f-5838-8295-2b3946dff65a/suspense', detail: '1913 film and co-director credits.' },
    ],
  },
  {
    id: 'suspense-authorship',
    film: 'Suspense (1913)',
    scene: 'The triptych and the credit',
    moduleId: 'auteur',
    observation: 'The same formally complex film is credited by both MoMA and BFI to Lois Weber and Phillips Smalley. MoMA describes their work as a directing partnership.',
    reading: 'An auteur reading can describe a distinctive formal choice, but the shared credit prevents an unsupported claim that one director alone devised the triptych. Authorship here is a question to investigate, not a name to assume.',
    counterReading: 'A production-history reading would seek evidence about who planned, shot, and edited this sequence before assigning individual authorship.',
    citations: [
      { label: 'MoMA collection record', url: 'https://www.moma.org/collection/works/304339', detail: 'Joint credit, triptych, and directing partnership.' },
      { label: 'BFI film record', url: 'https://www.bfi.org.uk/film/6fec2bfd-590f-5838-8295-2b3946dff65a/suspense', detail: 'Co-director listing for Suspense.' },
    ],
  },
];
