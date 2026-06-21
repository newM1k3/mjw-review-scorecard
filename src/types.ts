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

// --- Lead capture (funnel into ImmersiveKit) ---
export type LeadInterest = 'improve_reviews' | 'demo_immersivekit' | 'send_report' | 'other';

export interface LeadCapturePayload {
  email: string;
  name?: string;
  company?: string;
  interest?: LeadInterest;
  consentToContact: boolean;
  // scorecard context, for follow-up
  overallRating?: number;
  totalAnalyzed?: number;
  ratingTrend?: ScorecardResult['ratingTrend'];
}

export interface LeadCaptureResponse {
  success: boolean;
  leadId?: string;
  error?: string;
}
