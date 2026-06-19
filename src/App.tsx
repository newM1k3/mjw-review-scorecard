import { useState, useEffect, useCallback } from 'react';
import type { AppView, ScorecardResult } from './types';
import { getResultFromUrl } from './utils/encodeDecodeResult';
import { analyzeReviews } from './utils/analyzeReviews';
import { pb, saveProject, loadProjects, type SavedScorecardMeta } from './lib/pocketbase';
import InputView from './components/InputView';
import LoadingView from './components/LoadingView';
import ScorecardView from './components/ScorecardView';

function App() {
  const [view, setView] = useState<AppView>('input');
  const [result, setResult] = useState<ScorecardResult | null>(null);
  const [error, setError] = useState('');
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [savedScorecards, setSavedScorecards] = useState<SavedScorecardMeta[]>([]);
  const [showLoadMenu, setShowLoadMenu] = useState(false);

  // SSO token handoff + load saved scorecards on mount
  useEffect(() => {
    async function initApp() {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      if (token) {
        try {
          pb.authStore.save(token, null);
          await pb.collection('users').authRefresh();
        } catch {
          pb.authStore.clear();
        }
        window.history.replaceState({}, '', window.location.pathname);
      }

      // Check for shared result in URL hash (existing share feature)
      const sharedResult = getResultFromUrl();
      if (sharedResult) {
        setResult(sharedResult);
        setView('scorecard');
        setIsReadOnly(true);
        return;
      }

      const saved = await loadProjects();
      setSavedScorecards(saved);
    }
    void initApp();
  }, []);

  const persistScorecard = useCallback(async (r: ScorecardResult, id: string) => {
    if (!pb.authStore.isValid) return;
    try {
      await saveProject({ id, result: r, analyzedAt: new Date().toISOString() });
      const refreshed = await loadProjects();
      setSavedScorecards(refreshed);
    } catch (err) {
      console.warn('Review Scorecard: save failed', err);
    }
  }, []);

  const handleGenerate = async (reviews: string) => {
    setError('');
    setView('loading');

    try {
      const analysisResult = await analyzeReviews(reviews);
      const id = crypto.randomUUID();
      setResult(analysisResult);
      setView('scorecard');
      setIsReadOnly(false);

      // Save after render
      void persistScorecard(analysisResult, id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze reviews');
      setView('input');
    }
  };

  const handleAnalyzeMore = () => {
    setResult(null);
    setView('input');
    setIsReadOnly(false);
    window.location.hash = '';
  };

  const loadSavedScorecard = (meta: SavedScorecardMeta) => {
    setResult(meta.payload.result);
    setView('scorecard');
    setIsReadOnly(false);
    setShowLoadMenu(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Load saved scorecards — shown on input view when signed in with saved scorecards */}
      {view === 'input' && savedScorecards.length > 0 && (
        <div className="fixed top-4 right-4 z-50">
          <div className="relative">
            <button
              onClick={() => setShowLoadMenu((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              📂 Load Saved ({savedScorecards.length})
            </button>
            {showLoadMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 w-72 rounded-xl border border-slate-200 bg-white shadow-xl py-1">
                {savedScorecards.map((meta) => (
                  <button
                    key={meta.id}
                    onClick={() => loadSavedScorecard(meta)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                  >
                    <div className="text-sm text-slate-800 font-semibold truncate">
                      ⭐ {meta.overallRating.toFixed(1)} — {meta.totalAnalyzed} reviews
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {new Date(meta.savedAt).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'input' && (
        <InputView
          onGenerate={handleGenerate}
        />
      )}

      {view === 'loading' && <LoadingView />}

      {view === 'scorecard' && result && (
        <ScorecardView
          result={result}
          onAnalyzeMore={handleAnalyzeMore}
          isReadOnly={isReadOnly}
        />
      )}

      {error && view === 'input' && (
        <div className="fixed bottom-4 right-4 max-w-md p-4 bg-red-50 border border-red-200 rounded-lg shadow-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </>
  );
}

export default App;
