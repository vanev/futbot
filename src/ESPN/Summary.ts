type Summary = {
  boxscore?: unknown;
  format?: unknown;
  gameInfo?: unknown;
  headToHeadGames?: Array<unknown>;
  broadcasts?: Array<unknown>;
  odds?: Array<unknown>;
  hasOdds?: boolean;
  rosters?: Array<unknown>;
  news?: unknown;
  article?: unknown;
  videos?: Array<unknown>;
  header?: unknown;
  keyEvents?: Array<{
    id: string;
    type: { id: string; text: string };
    text?: string;
    period: { number: number };
    clock: { value: number; displayValue: string };
    scoringPlay: boolean;
    source: { id: string; description: string };
    shootout: boolean;
  }>;
  commentary?: Array<unknown>;
  standings?: unknown;
};

export default Summary;
