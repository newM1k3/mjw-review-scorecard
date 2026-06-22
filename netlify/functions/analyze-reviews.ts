import Anthropic from '@anthropic-ai/sdk';
import { Handler } from '@netlify/functions';

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

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { reviews } = JSON.parse(event.body || '{}');

    if (!reviews || typeof reviews !== 'string' || reviews.trim().length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No reviews provided for analysis' }) };
    }

    // Instantiate per-request so a freshly-set ANTHROPIC_API_KEY is picked up without
    // depending on a cold start (module-level init captured env once and went stale).
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Analyze these reviews:\n\n${reviews}` }],
    });

    const textContent = message.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    // Strip markdown code fences if present
    let rawJson = textContent.text.trim();
    rawJson = rawJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');

    const result = JSON.parse(rawJson);

    if (
      result.overallRating === undefined ||
      result.totalAnalyzed === undefined ||
      !result.themes ||
      !result.topPraises ||
      !result.topComplaints ||
      !result.ratingTrend ||
      !result.actionPlan
    ) {
      throw new Error('Invalid response format from AI');
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error('Error analyzing reviews:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to analyze reviews. Please try again.' }),
    };
  }
};

export { handler };
