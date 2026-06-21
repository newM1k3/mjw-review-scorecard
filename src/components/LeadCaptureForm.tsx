import { useState } from 'react';
import { CheckCircle, Mail, Send, Sparkles } from 'lucide-react';
import type { LeadCapturePayload, LeadInterest, ScorecardResult } from '../types';
import { trackEvent } from '../lib/analytics';

interface LeadCaptureFormProps {
  result: ScorecardResult;
}

const IMMERSIVEKIT_URL = 'https://immersivekit.io';

const INTEREST_OPTIONS: Array<{ value: LeadInterest; label: string }> = [
  { value: 'send_report', label: 'Email me this scorecard' },
  { value: 'improve_reviews', label: 'Help me improve my reviews' },
  { value: 'demo_immersivekit', label: 'Show me ImmersiveKit' },
  { value: 'other', label: 'Something else' },
];

export default function LeadCaptureForm({ result }: LeadCaptureFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [interest, setInterest] = useState<LeadInterest>('send_report');
  const [consentToContact, setConsentToContact] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('submitting');
    setMessage('');

    const payload: LeadCapturePayload = {
      email,
      name,
      company,
      interest,
      consentToContact,
      overallRating: result.overallRating,
      totalAnalyzed: result.totalAnalyzed,
      ratingTrend: result.ratingTrend,
    };

    try {
      const response = await fetch('/.netlify/functions/scorecard-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || 'We could not save your request.');
      }

      trackEvent('scorecard_lead_submitted', {
        interest,
        overall_rating: result.overallRating,
        total_analyzed: result.totalAnalyzed,
      });
      setStatus('success');
      setMessage('Thanks — we\'ll be in touch. Want to see how ImmersiveKit turns reviews into bookings?');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'We could not save your request.');
    }
  }

  if (status === 'success') {
    return (
      <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-left" role="status" aria-live="polite">
        <div className="flex items-start gap-3">
          <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
          <div>
            <h3 className="font-bold text-emerald-800">You're on the list</h3>
            <p className="mt-1 text-sm leading-relaxed text-emerald-700">{message}</p>
            <a
              href={IMMERSIVEKIT_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('scorecard_cta_immersivekit_clicked', { from: 'lead_success' })}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-cyan-700 hover:to-teal-700"
            >
              <Sparkles className="h-4 w-4" />
              Explore ImmersiveKit
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-teal-50 p-5 text-left space-y-4 print:hidden"
      aria-describedby={message && status === 'error' ? 'lead-capture-error' : undefined}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-cyan-600/10 p-2">
          <Mail className="h-5 w-5 text-cyan-700" />
        </div>
        <div>
          <h3 className="text-slate-900 font-bold">Want the full breakdown — and more bookings?</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Get this scorecard by email and see how ImmersiveKit helps entertainment venues turn reviews into repeat visits. Your scorecard stays visible either way.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Email *</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-cyan-500"
            placeholder="you@venue.com"
          />
        </label>
        <label className="block">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-cyan-500"
            placeholder="Your name"
          />
        </label>
        <label className="block">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Venue / Company</span>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-cyan-500"
            placeholder="Venue name"
          />
        </label>
        <label className="block">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">What would help?</span>
          <select
            value={interest}
            onChange={(e) => setInterest(e.target.value as LeadInterest)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-cyan-500"
          >
            {INTEREST_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white/70 p-3">
        <input
          type="checkbox"
          checked={consentToContact}
          onChange={(e) => setConsentToContact(e.target.checked)}
          required
          className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
        />
        <span className="text-slate-500 text-xs leading-relaxed">
          I consent to being contacted about my review scorecard and ImmersiveKit.
        </span>
      </label>

      {message && status === 'error' && (
        <p id="lead-capture-error" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert" aria-live="assertive">{message}</p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        aria-busy={status === 'submitting'}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-5 py-3 font-semibold text-white shadow-md transition hover:from-cyan-700 hover:to-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'submitting' ? 'Sending…' : (<><Send className="h-4 w-4" /> Email Me My Scorecard</>)}
      </button>
    </form>
  );
}
