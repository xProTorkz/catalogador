import { useCatalogador } from "@/hooks/useCatalogador";
import { TrendingUp, TrendingDown, Target, BrainCircuit } from "lucide-react";
import { WinRateChart } from "./WinRateChart";
import { useMemo } from "react";

export function StatisticsGrid() {
  const { analysis } = useCatalogador();

  const stats = analysis?.statistics || {
    p50Pct: 0,
    b50Pct: 0,
    patterns: { "PP": 0, "BB": 0 },
    pre_tie_combos: []
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4">
      <WinRateChart />
      
      {/* Mini Heatmap for Frequent Patterns */}
      <div className="glass-card p-5 bg-card/60 border-white/5 flex flex-col gap-4 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <BrainCircuit className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Frequência de Padrões</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Baseado no histórico capturado</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black/40 rounded-xl p-3 border border-white/5">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-black text-player opacity-60 uppercase tracking-widest">Duplo Player</span>
              <span className="text-lg font-black text-player">{stats.patterns["PP"] || 0}</span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-player" style={{ width: `${Math.min(100, (stats.patterns["PP"] || 0) * 3)}%` }} />
            </div>
          </div>
          
          <div className="bg-black/40 rounded-xl p-3 border border-white/5">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-black text-banker opacity-60 uppercase tracking-widest">Duplo Banker</span>
              <span className="text-lg font-black text-banker">{stats.patterns["BB"] || 0}</span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-banker" style={{ width: `${Math.min(100, (stats.patterns["BB"] || 0) * 3)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tie Attraction Info */}
      <div className="glass-card p-5 bg-tie/5 border-tie/20 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-tie/10 flex items-center justify-center border border-tie/20">
            <Target className="w-4 h-4 text-tie" />
          </div>
          <div>
            <h3 className="text-xs font-black text-tie uppercase tracking-widest">Atração de Empate</h3>
            <p className="text-[10px] text-tie/60 mt-0.5">Pontuações que mais precedem TIE</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {stats.pre_tie_combos?.slice(0, 5).map((t: any, i: number) => (
             <div key={i} className="px-3 py-1.5 bg-black/40 border border-tie/20 rounded-lg flex items-center gap-2 shadow-inner">
               <span className="text-sm font-black text-white">{t.numero}</span>
               <span className="text-[9px] font-black text-tie">({t.frequencia}x)</span>
             </div>
          )) || <span className="text-xs text-muted-foreground">Aguardando dados...</span>}
        </div>
      </div>

      {/* Regression / Trend */}
      <div className="glass-card p-5 bg-card/60 border-white/5 flex flex-col gap-4">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-xs font-black text-white/50 uppercase tracking-widest">Viés Direcional (50 r)</h3>
        </div>
        
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
              {stats.p50Pct > 50 ? <TrendingUp className="w-4 h-4 text-player" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
              <span className="text-sm font-black text-player">Player {stats.p50Pct}%</span>
           </div>
           <span className="text-xs font-black text-white/20">VS</span>
           <div className="flex items-center gap-2 flex-row-reverse">
              {stats.b50Pct > 50 ? <TrendingUp className="w-4 h-4 text-banker" /> : <TrendingDown className="w-4 h-4 text-blue-500" />}
              <span className="text-sm font-black text-banker">Banker {stats.b50Pct}%</span>
           </div>
        </div>
      </div>

    </div>
  );
}