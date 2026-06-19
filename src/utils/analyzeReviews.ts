import type { ScorecardResult } from '../types';

export async function analyzeReviews(reviews: string): Promise<ScorecardResult> {
  if (!reviews || reviews.trim().length === 0) {
    throw new Error('No reviews provided for analysis');
  }

  const response = await fetch('/.netlify/functions/analyze-reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviews }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Analysis failed (${response.status})`);
  }

  return data as ScorecardResult;
}
