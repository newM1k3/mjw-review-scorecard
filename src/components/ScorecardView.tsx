import { useState } from 'react';
import { Star, TrendingUp, TrendingDown, Minus, ThumbsUp, ThumbsDown, Share2, Download, RotateCcw, Check } from 'lucide-react';
import type { ScorecardResult } from '../types';
import { setResultInUrl } from '../utils/encodeDecodeResult';
import LeadCaptureForm from './LeadCaptureForm';
import { trackEvent } from '../lib/analytics';

interface ScorecardViewProps {
  result: ScorecardResult;
  onAnalyzeMore: () => void;
  isReadOnly?: boolean;
}

export default function ScorecardView({ result, onAnalyzeMore, isReadOnly = false }: ScorecardViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = setResultInUrl(result);
    navigator.clipboard.writeText(url);
    trackEvent('scorecard_shared', { overall_rating: result.overallRating });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const getTrendIcon = () => {
    switch (result.ratingTrend) {
      case 'improving':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'declining':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <Minus className="w-5 h-5 text-slate-600" />;
    }
  };

  const getTrendText = () => {
    switch (result.ratingTrend) {
      case 'improving':
        return 'Improving';
      case 'declining':
        return 'Declining';
      default:
        return 'Stable';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-500';
      case 'negative':
        return 'bg-red-500';
      default:
        return 'bg-amber-500';
    }
  };

  const maxThemeCount = Math.max(...result.themes.map(t => t.count));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 print:shadow-none">
          <div className="text-center mb-8 border-b border-slate-200 pb-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Review Scorecard</h1>

            <div className="flex items-center justify-center gap-2 mb-3">
              <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
              <span className="text-5xl font-bold text-slate-900">{result.overallRating.toFixed(1)}</span>
              <span className="text-2xl text-slate-600">/5</span>
            </div>

            <p className="text-slate-600">
              Based on <span className="font-semibold">{result.totalAnalyzed}</span> reviews analyzed
            </p>

            <div className="flex items-center justify-center gap-2 mt-4">
              {getTrendIcon()}
              <span className="text-sm font-medium text-slate-700">
                Rating Trend: {getTrendText()}
              </span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-cyan-600 rounded"></div>
              Theme Breakdown
            </h2>
            <div className="space-y-3">
              {result.themes.map((theme, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-32 text-sm font-medium text-slate-700">{theme.name}</div>
                  <div className="flex-1 bg-slate-100 rounded-full h-8 overflow-hidden">
                    <div
                      className={`h-full ${getSentimentColor(theme.sentiment)} transition-all duration-500 flex items-center justify-end px-3`}
                      style={{ width: `${(theme.count / maxThemeCount) * 100}%` }}
                    >
                      {theme.count > 0 && (
                        <span className="text-xs font-semibold text-white">{theme.count}</span>
                      )}
                    </div>
                  </div>
                  <div className="w-16 text-xs text-slate-600 capitalize">{theme.sentiment}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <ThumbsUp className="w-5 h-5 text-green-600" />
                Top Praises
              </h2>
              <div className="space-y-3">
                {result.topPraises.slice(0, 5).map((praise, index) => (
                  <div
                    key={index}
                    className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-slate-700"
                  >
                    "{praise}"
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <ThumbsDown className="w-5 h-5 text-red-600" />
                Top Complaints
              </h2>
              <div className="space-y-3">
                {result.topComplaints.slice(0, 5).map((complaint, index) => (
                  <div
                    key={index}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-slate-700"
                  >
                    "{complaint}"
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Action Plan</h2>
            <ul className="space-y-2">
              {result.actionPlan.map((action, index) => (
                <li key={index} className="flex items-start gap-3 text-slate-700">
                  <div className="w-6 h-6 bg-cyan-600 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-sm font-semibold">
                    {index + 1}
                  </div>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 print:hidden">
            {!isReadOnly && (
              <button
                onClick={handleCopyLink}
                className="flex-1 min-w-[200px] px-6 py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="w-5 h-5" />
                    Copy Public Link
                  </>
                )}
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex-1 min-w-[200px] px-6 py-3 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>

            <button
              onClick={onAnalyzeMore}
              className="flex-1 min-w-[200px] px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Analyze More
            </button>
          </div>
        </div>

        {/* Funnel: the prospect who just analyzed their own reviews → capture + ImmersiveKit CTA */}
        {!isReadOnly && <LeadCaptureForm result={result} />}

        {isReadOnly && (
          <div className="mt-6 text-center">
            <p className="text-slate-600 mb-4">Want to analyze your own reviews — and turn them into bookings?</p>
            <a
              href="/"
              className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-lg font-semibold hover:from-cyan-700 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Try ReviewScorecard.io
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
