export const DIFFICULTY_LABELS = Object.freeze({
  D1: 'Easy',
  D2: 'Medium',
  D3: 'Tough',
  D4: 'Stretch'
});

export function difficultyLabel(code) {
  return DIFFICULTY_LABELS[code] || code;
}

export const TOPIC_CATALOG = Object.freeze([
  {
    id: 'percentages',
    domain: 'Quantitative aptitude',
    shortDomain: 'Quant',
    name: 'Percentages',
    description: 'See the whole, compare change, and work backwards with confidence.',
    concepts: ['Percent of a whole', 'Percentage change', 'Reverse percentage', 'Successive change'],
    accent: 'indigo',
    icon: 'percent',
    questionCount: 30
  },
  {
    id: 'ratios',
    domain: 'Quantitative aptitude',
    shortDomain: 'Quant',
    name: 'Ratio & proportion',
    description: 'Scale relationships, split totals, and reason through mixtures.',
    concepts: ['Simplifying', 'Proportion', 'Sharing', 'Mixtures'],
    accent: 'emerald',
    icon: 'scale',
    questionCount: 30
  },
  {
    id: 'averages-mixtures',
    domain: 'Quantitative aptitude',
    shortDomain: 'Quant',
    name: 'Averages & mixtures',
    description: 'Balance totals, combine groups, and track weighted values precisely.',
    concepts: ['Simple average', 'Missing value', 'Weighted average', 'Mixture value'],
    accent: 'coral',
    icon: 'chart',
    questionCount: 115
  },
  {
    id: 'ages',
    domain: 'Quantitative aptitude',
    shortDomain: 'Quant',
    name: 'Problems on ages',
    description: 'Translate past, present, and future relationships into clean equations.',
    concepts: ['Present ages', 'Age ratios', 'Past and future', 'Family averages'],
    accent: 'indigo',
    icon: 'calendar',
    questionCount: 110
  },
  {
    id: 'profit-loss',
    domain: 'Quantitative aptitude',
    shortDomain: 'Quant',
    name: 'Profit, loss & discount',
    description: 'Keep cost, marked price, selling price, and percentage bases distinct.',
    concepts: ['Profit and loss', 'Discount', 'Marked price', 'Successive change'],
    accent: 'emerald',
    icon: 'award',
    questionCount: 115
  },
  {
    id: 'time-work',
    domain: 'Quantitative aptitude',
    shortDomain: 'Quant',
    name: 'Time & work',
    description: 'Reason with rates, combined effort, workers, pipes, and changing efficiency.',
    concepts: ['Work rate', 'Combined work', 'Workers and days', 'Pipes and leaks'],
    accent: 'coral',
    icon: 'timer',
    questionCount: 110
  },
  {
    id: 'series',
    domain: 'Logical reasoning',
    shortDomain: 'Logical',
    name: 'Number & letter series',
    description: 'Detect arithmetic, geometric, alternating, and layered patterns.',
    concepts: ['Arithmetic series', 'Geometric series', 'Alternating patterns', 'Second differences'],
    accent: 'indigo',
    icon: 'layers',
    questionCount: 110
  },
  {
    id: 'coding',
    domain: 'Logical reasoning',
    shortDomain: 'Logical',
    name: 'Coding & decoding',
    description: 'Track letter shifts, reversals, position values, and multi-step codes.',
    concepts: ['Letter shifts', 'Word codes', 'Position values', 'Multi-step coding'],
    accent: 'emerald',
    icon: 'refresh',
    questionCount: 110
  },
  {
    id: 'syllogisms',
    domain: 'Logical reasoning',
    shortDomain: 'Logical',
    name: 'Syllogisms',
    description: 'Separate what must follow from what merely seems possible.',
    concepts: ['All and some', 'No statements', 'Linked classes', 'Conclusion testing'],
    accent: 'coral',
    icon: 'target',
    questionCount: 110
  },
  {
    id: 'grammar',
    domain: 'Verbal ability',
    shortDomain: 'Verbal',
    name: 'Grammar & error spotting',
    description: 'Find the rule behind what sounds right and repair errors precisely.',
    concepts: ['Agreement', 'Tense', 'Articles', 'Usage'],
    accent: 'indigo',
    icon: 'type',
    questionCount: 30
  },
  {
    id: 'sentence-correction',
    domain: 'Verbal ability',
    shortDomain: 'Verbal',
    name: 'Sentence correction',
    description: 'Choose concise, grammatical revisions using context rather than instinct.',
    concepts: ['Verb forms', 'Pronouns', 'Parallelism', 'Modifiers'],
    accent: 'emerald',
    icon: 'book',
    questionCount: 110
  },
  {
    id: 'para-jumbles',
    domain: 'Verbal ability',
    shortDomain: 'Verbal',
    name: 'Para jumbles & comprehension',
    description: 'Use reference, chronology, cause, and purpose to organize and interpret text.',
    concepts: ['Opening sentence', 'Reference links', 'Logical order', 'Main idea'],
    accent: 'coral',
    icon: 'layers',
    questionCount: 110
  }
]);

export const TOPIC_IDS = Object.freeze(TOPIC_CATALOG.map((topic) => topic.id));

export function topicById(topicId) {
  return TOPIC_CATALOG.find((topic) => topic.id === topicId) || null;
}
