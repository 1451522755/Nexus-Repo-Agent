import React, { useState } from 'react';
import LandingView from './components/LandingView';
import AnalysisView from './components/AnalysisView';

export default function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [appState, setAppState] = useState<'idle' | 'analyzing' | 'results'>('idle');

  const startAnalysis = (url: string) => {
    setRepoUrl(url);
    setAppState('analyzing');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#ECECEC] font-sans selection:bg-[#F27D26] selection:text-[#050505] flex flex-col">
      <header className="border-b border-white/10 p-4 shrink-0 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#F27D26] rounded-sm shadow-[0_0_10px_rgba(242,125,38,0.5)]"></div>
            <div className="text-xs tracking-[0.2em] uppercase font-bold text-white/80">
              Nexus Repo Agent
            </div>
         </div>
         <div className="text-[10px] uppercase tracking-widest text-[#8E9299]">v1.0.0.alpha</div>
      </header>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {appState === 'idle' && (
          <LandingView onStart={startAnalysis} />
        )}
        {(appState === 'analyzing' || appState === 'results') && (
          <AnalysisView 
            repoUrl={repoUrl} 
            onReset={() => setAppState('idle')}
            onComplete={() => setAppState('results')}
          />
        )}
      </main>
    </div>
  );
}
