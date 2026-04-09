import { useState, useEffect } from 'react';
import type { AppView, ScorecardResult } from './types';
import { getResultFromUrl } from './utils/encodeDecodeResult';
import { analyzeReviews } from './utils/analyzeReviews';
import InputView from './components/InputView';
import LoadingView from './components/LoadingView';
import ScorecardView from './components/ScorecardView';
import ApiKeyModal from './components/ApiKeyModal';

function App() {
  const [view, setView] = useState<AppView>('input');
  const [result, setResult] = useState<ScorecardResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [isReadOnly, setIsReadOnly] = useState(false);

  useEffect(() => {
    const sharedResult = getResultFromUrl();
    if (sharedResult) {
      setResult(sharedResult);
      setView('scorecard');
      setIsReadOnly(true);
    }
  }, []);

  const handleGenerate = async (reviews: string) => {
    setError('');
    setView('loading');

    const apiKey = localStorage.getItem('openai_api_key');
    if (!apiKey) {
      setError('API key not found. Please set your OpenAI API key.');
      setView('input');
      setIsModalOpen(true);
      return;
    }

    try {
      const analysisResult = await analyzeReviews(reviews, apiKey);
      setResult(analysisResult);
      setView('scorecard');
      setIsReadOnly(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze reviews');
      setView('input');

      if (err instanceof Error && err.message.includes('API key')) {
        setIsModalOpen(true);
      }
    }
  };

  const handleAnalyzeMore = () => {
    setResult(null);
    setView('input');
    setIsReadOnly(false);
    window.location.hash = '';
  };

  return (
    <>
      {view === 'input' && (
        <InputView
          onGenerate={handleGenerate}
          onOpenSettings={() => setIsModalOpen(true)}
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

      <ApiKeyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {error && view === 'input' && (
        <div className="fixed bottom-4 right-4 max-w-md p-4 bg-red-50 border border-red-200 rounded-lg shadow-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </>
  );
}

export default App;
