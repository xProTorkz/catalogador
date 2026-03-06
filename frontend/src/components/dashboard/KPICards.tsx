import { useCatalogador } from "@/hooks/useCatalogador";
import { Activity, Flame, Target, User, ShieldCheck } from "lucide-react";
import { useMemo } from "react";

export function KPICards() {
  const { analysis } = useCatalogador();

  const stats = analysis?.statistics || {
    total: 0,
    pPct: 0,
    bPct: 0,
    tPct: 0,
    p50Pct: 0,
    b50Pct: 0,
    t50Pct: 0,
    current_streak: 0,
    max_streak: 0,
    current_winner: null
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {/* Total */}
      <div className="glass-card p-4 flex flex-col justify-between h-[110px] bg-card/40 border-white/5 hover:border-white/20 transition-all duration-300">
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Total</span>
          <Activity className="h-4 w-4 text-white/40" />
        </div>
        <div className="text-3xl font-black">{stats.total}</div>
      </div>

      {/* Win Rates */}
      <div className="glass-card p-4 flex flex-col justify-between h-[110px] bg-player/5 border-player/20 hover:border-player/40 transition-all duration-300">
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-black text-player opacity-80 uppercase tracking-widest">Player</span>
          <User className="h-4 w-4 text-player" />
        </div>
        <div className="flex items-end justify-between">
           <div className="text-3xl font-black text-player">{stats.pPct}%</div>
           <span className="text-[10px] font-black text-player/50 mb-1">ALL</span>
        </div>
      </div>

      <div className="glass-card p-4 flex flex-col justify-between h-[110px] bg-banker/5 border-banker/20 hover:border-banker/40 transition-all duration-300">
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-black text-banker opacity-80 uppercase tracking-widest">Banker</span>
          <ShieldCheck className="h-4 w-4 text-banker" />
        </div>
        <div className="flex items-end justify-between">
           <div className="text-3xl font-black text-banker">{stats.bPct}%</div>
           <span className="text-[10px] font-black text-banker/50 mb-1">ALL</span>
        </div>
      </div>

      <div className="glass-card p-4 flex flex-col justify-between h-[110px] bg-tie/5 border-tie/20 hover:border-tie/40 transition-all duration-300">
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-black text-tie opacity-80 uppercase tracking-widest">Tie</span>
          <Target className="h-4 w-4 text-tie" />
        </div>
        <div className="flex items-end justify-between">
           <div className="text-3xl font-black text-tie">{stats.tPct}%</div>
           <span className="text-[10px] font-black text-tie/50 mb-1">ALL</span>
        </div>
      </div>

      {/* Recent 50 */}
      <div className="glass-card p-4 flex flex-col justify-between h-[110px] bg-card/40 border-white/5 hover:border-white/20 transition-all duration-300 relative overflow-hidden">
        <div className="flex justify-between items-start z-10">
          <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Freq. 50</span>
          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/80">Last</span>
        </div>
        <div className="flex gap-2 w-full h-8 mt-2 z-10">
          <div className="bg-player h-full rounded flex items-center justify-center text-[9px] font-black" style={{ width: `${stats.p50Pct}%` }}>{stats.p50Pct}%</div>
          <div className="bg-banker h-full rounded flex items-center justify-center text-[9px] font-black" style={{ width: `${stats.b50Pct}%` }}>{stats.b50Pct}%</div>
        </div>
      </div>

      {/* Streaks */}
      <div className="glass-card p-4 flex flex-col justify-between h-[110px] bg-orange-500/5 border-orange-500/20 hover:border-orange-500/40 transition-all duration-300">
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-black text-orange-400 opacity-80 uppercase tracking-widest">Sequências</span>
          <Flame className="h-4 w-4 text-orange-400 animate-pulse" />
        </div>
        <div className="flex justify-between items-end">
           <div>
             <span className="text-[9px] font-black text-orange-400/50 uppercase block">Atual</span>
             <span className="text-xl font-black text-orange-400">{stats.current_streak}x</span>
           </div>
           <div className="text-right">
             <span className="text-[9px] font-black text-orange-400/50 uppercase block">Máxima</span>
             <span className="text-xl font-black text-white">{stats.max_streak}x</span>
           </div>
        </div>
      </div>

    </div>
  );
}