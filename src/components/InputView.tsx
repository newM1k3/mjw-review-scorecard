import { useState } from 'react';
import { Settings, Upload, Sparkles, AlertCircle } from 'lucide-react';
import { parseCSVFile } from '../utils/parseReviews';
import { getStoredApiKey } from '../utils/analyzeReviews';

interface InputViewProps {
  onGenerate: (reviews: string) => void;
  onOpenSettings: () => void;
}

export default function InputView({ onGenerate, onOpenSettings }: InputViewProps) {
  const [reviewText, setReviewText] = useState('');
  const [error, setError] = useState('');
  const hasApiKey = !!getStoredApiKey();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    try {
      const parsed = await parseCSVFile(file);
      setReviewText(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
    }

    e.target.value = '';
  };

  const handleGenerate = () => {
    setError('');

    if (!hasApiKey) {
      setError('Please set your OpenAI API key first');
      return;
    }

    if (!reviewText.trim()) {
      setError('Please paste some reviews or upload a CSV file');
      return;
    }

    onGenerate(reviewText);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <button
          onClick={onOpenSettings}
          className="absolute top-6 right-6 p-2 text-slate-600 hover:text-cyan-600 hover:bg-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
          title="Settings"
        >
          <Settings className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-slate-900 mb-3">
            Review<span className="text-cyan-600">Scorecard</span>.io
          </h1>
          <p className="text-slate-600 text-lg">
            Paste your reviews. Get instant insights. Share your scorecard.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <label htmlFor="reviews" className="block text-sm font-medium text-slate-700 mb-2">
              Paste Your Reviews
            </label>
            <textarea
              id="reviews"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Rating: 5 - Comment: Great service!&#10;Rating: 4 - Comment: Good food, but slow service.&#10;Rating: 3 - Comment: Average experience..."
              rows={12}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none font-mono text-sm"
            />
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-sm text-slate-500">Or upload a CSV</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-cyan-500 hover:bg-cyan-50 transition-all duration-200 cursor-pointer group">
            <Upload className="w-5 h-5 text-slate-400 group-hover:text-cyan-600" />
            <span className="text-slate-600 group-hover:text-cyan-700 font-medium">
              Upload CSV File
            </span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {!hasApiKey && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-amber-700">
                Please set your OpenAI API key in settings (gear icon) before generating a scorecard.
              </span>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={!reviewText.trim() || !hasApiKey}
            className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-lg font-semibold text-lg hover:from-cyan-700 hover:to-teal-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-xl flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Generate Scorecard
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-slate-500">
          Your reviews are analyzed using AI. No data is stored on our servers.
        </div>
      </div>
    </div>
  );
}
