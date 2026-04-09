import type { ScorecardResult } from '../types';

const SYSTEM_PROMPT = `You are an expert business analyst. Analyze these customer reviews. Return ONLY valid JSON matching this exact schema:
{
  "overallRating": number,
  "totalAnalyzed": number,
  "themes": [{ "name": string, "count": number, "sentiment": "positive" | "negative" | "mixed" }],
  "topPraises": string[],
  "topComplaints": string[],
  "ratingTrend": "improving" | "declining" | "stable",
  "actionPlan": string[]
}`;

export async function analyzeReviews(reviews: string, apiKey: string): Promise<ScorecardResult> {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  if (!reviews || reviews.trim().length === 0) {
    throw new Error('No reviews provided for analysis');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: `Analyze these reviews:\n\n${reviews}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenAI API key.');
      }
      throw new Error(error.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response content from API');
    }

    const result = JSON.parse(content) as ScorecardResult;

    if (!result.overallRating || !result.totalAnalyzed || !result.themes || !result.topPraises || !result.topComplaints || !result.ratingTrend || !result.actionPlan) {
      throw new Error('Invalid response format from AI');
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to analyze reviews. Please try again.');
  }
}

export function getStoredApiKey(): string | null {
  return localStorage.getItem('openai_api_key');
}

export function setStoredApiKey(key: string): void {
  localStorage.setItem('openai_api_key', key);
}
