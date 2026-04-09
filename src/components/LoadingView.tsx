import { Loader2 } from 'lucide-react';

export default function LoadingView() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-cyan-600">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-lg font-medium">Analyzing your reviews...</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 animate-pulse">
          <div className="mb-8">
            <div className="h-8 bg-slate-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-16 bg-slate-200 rounded w-48 mx-auto mb-2"></div>
            <div className="h-6 bg-slate-200 rounded w-40 mx-auto"></div>
          </div>

          <div className="mb-8">
            <div className="h-6 bg-slate-200 rounded w-48 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-4 bg-slate-200 rounded w-24"></div>
                  <div className="h-8 bg-slate-200 rounded flex-1"></div>
                  <div className="h-4 bg-slate-200 rounded w-12"></div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <div className="h-6 bg-slate-200 rounded w-32 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-slate-200 rounded"></div>
                ))}
              </div>
            </div>
            <div>
              <div className="h-6 bg-slate-200 rounded w-32 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-slate-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="h-6 bg-slate-200 rounded w-40 mb-4"></div>
            <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
          </div>

          <div>
            <div className="h-6 bg-slate-200 rounded w-32 mb-4"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 bg-slate-200 rounded w-full"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
