export interface Theme {
  name: string;
  count: number;
  sentiment: 'positive' | 'negative' | 'mixed';
}

export interface ScorecardResult {
  overallRating: number;
  totalAnalyzed: number;
  themes: Theme[];
  topPraises: string[];
  topComplaints: string[];
  ratingTrend: 'improving' | 'declining' | 'stable';
  actionPlan: string[];
}

export type AppView = 'input' | 'loading' | 'scorecard';
