import type { Handler } from '@netlify/functions';
import type { LeadCapturePayload, LeadCaptureResponse, LeadInterest } from '../../src/types';
import {
  createPocketBaseRecord,
  getRequestIp,
  getUserAgent,
  hashRequestIdentifier,
  hasPocketBaseWriteConfig,
  normalizeEmail,
  normalizeTextField,
} from './pocketbaseServer';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const VALID_INTERESTS: LeadInterest[] = ['improve_reviews', 'demo_immersivekit', 'send_report', 'other'];

function jsonResponse(statusCode: number, body: LeadCaptureResponse | { error: string }) {
  return {
    statusCode,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function normalizeInterest(value: unknown): LeadInterest {
  if (typeof value === 'string' && VALID_INTERESTS.includes(value as LeadInterest)) {
    return value as LeadInterest;
  }
  return 'send_report';
}

function toNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function definedPayload<T extends Record<string, unknown>>(payload: T): T {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== ''),
  ) as T;
}

const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders, body: '' };
  if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method Not Allowed' });

  try {
    let body: Partial<LeadCapturePayload>;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return jsonResponse(400, { error: 'Submit a valid lead form.' });
    }

    const email = normalizeEmail(body.email);
    if (!isValidEmail(email)) {
      return jsonResponse(400, { error: 'Enter a valid email address.' });
    }

    if (body.consentToContact !== true) {
      return jsonResponse(400, { error: 'Consent is required before we can contact you.' });
    }

    if (!hasPocketBaseWriteConfig()) {
      return jsonResponse(503, { error: 'Lead capture is not configured yet. Please contact the team directly.' });
    }

    const record = await createPocketBaseRecord('scorecard_leads', definedPayload({
      email,
      name: normalizeTextField(body.name, 120),
      company: normalizeTextField(body.company, 160),
      interest: normalizeInterest(body.interest),
      consent_to_contact: true,
      overall_rating: toNumber(body.overallRating),
      total_analyzed: toNumber(body.totalAnalyzed),
      rating_trend: normalizeTextField(body.ratingTrend, 20),
      source: 'review_scorecard',
      created_ip_hash: await hashRequestIdentifier(getRequestIp(event.headers)),
      created_user_agent: getUserAgent(event.headers),
    }));

    return jsonResponse(200, { success: true, leadId: record.id });
  } catch (error) {
    console.error('Scorecard lead capture failed:', error);
    return jsonResponse(500, { error: 'We could not save your request. Please try again or contact the team directly.' });
  }
};

export { handler };
