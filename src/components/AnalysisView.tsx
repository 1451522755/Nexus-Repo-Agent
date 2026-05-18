import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Terminal, AlertCircle, Loader2, Play, Code2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FileEntry {
  path: string;
  content: string;
}

interface AnalysisViewProps {
  repoUrl: string;
  onReset: () => void;
  onComplete: () => void;
}

export default function AnalysisView({ repoUrl, onReset, onComplete }: AnalysisViewProps) {
  const [status, setStatus] = useState<string>('Initializing link...');
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string>('');
  const [isDone, setIsDone] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `> ${new Date().toLocaleTimeString()} - ${msg}`]);
  };

  useEffect(() => {
    let active = true;

    async function analyze() {
      try {
        setStatus('Fetching repository...');
        addLog(`Requesting zipball for ${repoUrl}`);

        const res = await fetch('/api/fetch-repo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ githubUrl: repoUrl })
        });

        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || 'Failed to fetch repository');
        }

        const data = await res.json();
        const files: FileEntry[] = data.files;
        const branchUsed = data.branch;

        if (!active) return;
        
        addLog(`Extracted ${files.length} text files from branch ${branchUsed}.`);
        setStatus('Analyzing codebase with Gemini 3.1 Pro...');

        // Now prepare prompt for Gemini
        // For large repo, we can construct a massive contents string. 
        // Wait, for 2M context, a string is perfectly fine!
        let codeContext = `Here is the codebase from ${repoUrl} (branch: ${branchUsed}):\n\n`;
        for (const f of files) {
          codeContext += `--- File: ${f.path} ---\n${f.content}\n\n`;
        }

        const prompt = `You are a Senior Security Architect and Expert Principal Software Engineer reviewing the above repository. Please provide a deep, comprehensive architectural review and refactoring plan. Focus on:
1. Overall Architecture & File Structure
2. Code Quality, Anti-patterns, and Potential Bugs
3. Security Vulnerabilities
4. Performance Bottlenecks
5. Actionable Refactoring/Migration steps
Write the report in a highly professional, well-structured Markdown format.`;

        // We fetch gemini key from process.env via Vite proxy inside client (but gemini-api says: process.env.GEMINI_API_KEY)
        // Let's use the SDK.
        addLog('Connecting to AI Studio Gemini API...');
        
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const responseStream = await ai.models.generateContentStream({
          model: 'gemini-3.1-pro-preview',
          contents: [codeContext, prompt]
        });

        if (!active) return;

        setStatus('Receiving analysis stream...');
        let fullText = '';
        
        for await (const chunk of responseStream) {
          if (!active) return;
          if (chunk.text) {
             fullText += chunk.text;
             setResult(fullText);
          }
        }
        
        addLog('Analysis complete.');
        setStatus('Complete');
        setIsDone(true);
        onComplete();
      } catch (err: any) {
        if (!active) return;
        console.error(err);
        setError(err.message || 'Unknown error occurred.');
        setStatus('Failed');
        addLog(`ERROR: ${err.message}`);
      }
    }

    analyze();

    return () => {
      active = false;
    };
  }, [repoUrl, onComplete]);

  useEffect(() => {
    if (containerRef.current) {
       containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left panel: Logs widget (Recipe 3: Hardware / Specialist Tool) */}
      <div className="w-[320px] shrink-0 border-r border-[#1a1a1a] bg-[#0A0A0A] flex flex-col">
        <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between">
          <button 
             onClick={onReset}
             className="text-white/50 hover:text-white transition-colors flex items-center gap-2 text-xs uppercase tracking-widest font-mono"
          >
             <ChevronLeft className="w-4 h-4" /> Back
          </button>
        </div>

        <div className="p-4 flex-1 flex flex-col overflow-hidden">
          <div className="text-[10px] text-white/50 uppercase tracking-[0.2em] mb-4">Task Runner</div>
          
          {/* Status badge */}
          <div className="mb-6 p-4 rounded-lg bg-[#151619] border border-[#222]">
            <div className="flex items-center gap-3 mb-2">
              <div className="relative flex items-center justify-center w-8 h-8">
                {error ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : isDone ? (
                   <Play className="w-5 h-5 text-green-500" />
                ) : (
                  <Loader2 className="w-5 h-5 text-[#F27D26] animate-spin" />
                )}
                {!error && !isDone && (
                   <div className="absolute inset-0 border border-[#F27D26]/20 rounded-full animate-ping"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-mono text-xs text-white/70">{status}</div>
                <div className="font-mono text-[10px] text-white/40 truncate">{repoUrl}</div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-white/50 uppercase tracking-[0.2em] mb-2">Terminal Logs</div>
          <div 
             ref={containerRef}
             className="flex-1 bg-black border border-[#222] rounded-md p-3 overflow-y-auto font-mono text-xs text-[#00FF00] space-y-2 opacity-80"
          >
             {logs.map((log, i) => (
                <div key={i}>{log}</div>
             ))}
             {!isDone && !error && (
                <div className="animate-pulse">_</div>
             )}
          </div>
        </div>
      </div>

      {/* Right panel: Markdown Results */}
      <div className="flex-1 bg-[#111111] overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8 md:p-12 lg:p-16">
           <div className="prose prose-invert prose-orange max-w-none">
             {!result && !error && (
                <div className="flex flex-col items-center justify-center h-[50vh] text-white/20">
                   <Code2 className="w-16 h-16 mb-4 opacity-50" />
                   <p className="font-mono text-sm">Aggregating code and waiting for AI analysis...</p>
                </div>
             )}
             {error ? (
                <div className="p-6 border border-red-500/30 bg-red-500/10 rounded-xl text-red-400 font-mono">
                   {error}
                </div>
             ) : (
                <Markdown remarkPlugins={[remarkGfm]}>{result}</Markdown>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
