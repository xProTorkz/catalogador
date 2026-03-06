import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { RoundResult } from '../lib/roadmap';

interface UIState {
  probingResult: RoundResult | null;
  setProbingResult: (res: RoundResult | null) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  // Novos Estados SaaS
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  insightMode: boolean;
  setInsightMode: (enabled: boolean) => void;
  lastTie88x: any | null;
  setLastTie88x: (data: any) => void;
}

const UIContext = createContext<UIState | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [probingResult, setProbingResult] = useState<RoundResult | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  
  // Persistência local de preferências
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('sound_enabled') !== 'false');
  const [insightMode, setInsightMode] = useState(() => localStorage.getItem('insight_mode') === 'true');
  const [lastTie88x, setLastTie88x] = useState<any | null>(() => {
    const saved = localStorage.getItem('last_tie_88x');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('sound_enabled', String(soundEnabled));
    localStorage.setItem('insight_mode', String(insightMode));
    if (lastTie88x) localStorage.setItem('last_tie_88x', JSON.stringify(lastTie88x));
  }, [soundEnabled, insightMode, lastTie88x]);

  return (
    <UIContext.Provider value={{ 
      probingResult, setProbingResult, 
      isSidebarOpen, setSidebarOpen,
      soundEnabled, setSoundEnabled,
      insightMode, setInsightMode,
      lastTie88x, setLastTie88x
    }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) throw new Error("useUI must be used within UIProvider");
  return context;
}
