import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Github, Code2 } from 'lucide-react';

export default function LandingView({ onStart }: { onStart: (url: string) => void }) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onStart(url.trim());
    }
  };

  const handleExample = () => {
    setUrl('https://github.com/expressjs/express');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#F27D26]/5 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl flex flex-col items-center text-center z-10"
      >
        <div className="flex items-center gap-4 mb-6">
          <Github className="w-12 h-12 text-[#F27D26]" />
          <Code2 className="w-12 h-12 text-white/40" />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-normal tracking-tight leading-tight mb-4 font-serif italic text-white/90">
          Smart Code Review &<br/>Refactoring Agent
        </h1>
        
        <p className="text-lg md:text-xl text-white/50 max-w-2xl mb-12 font-mono">
          Enter a GitHub URL. The agent will fetch the entire codebase, map the dependency graph in context, and generate a deep refactoring report using AI.
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-2xl relative flex items-center group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
             <Github className="w-5 h-5 text-white/30" />
          </div>
          <input 
            type="text" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            className="w-full bg-[#151619] border border-white/10 rounded-full py-5 pl-12 pr-32 text-lg focus:outline-none focus:border-[#F27D26]/50 focus:ring-1 focus:ring-[#F27D26]/50 transition-all font-mono placeholder:text-white/20 shadow-2xl"
          />
          <button 
            type="submit"
            disabled={!url.trim()}
            className="absolute right-2 top-2 bottom-2 bg-[#F27D26] hover:bg-[#ff8a33] text-black px-6 rounded-full font-bold uppercase tracking-wider text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Analyze <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 flex items-center gap-2 text-xs uppercase tracking-widest text-white/40 font-mono">
           Try an example: <button type="button" onClick={handleExample} className="text-[#F27D26] hover:underline cursor-pointer">Express.js</button>
        </div>
      </motion.div>
    </div>
  );
}
