import { useCatalogador } from "@/hooks/useCatalogador";

export function WinRateChart() {
  const { analysis } = useCatalogador();
  const stats = analysis?.statistics || { pPct: 0, bPct: 0, tPct: 0 };
  
  // Cálculo do gráfico de pizza (CSS conic-gradient)
  // Player (Azul), Tie (Dourado), Banker (Vermelho)
  const p = stats.pPct;
  const t = stats.tPct;
  const b = stats.bPct;

  const gradient = `conic-gradient(
    var(--player) 0% ${p}%, 
    var(--tie) ${p}% ${p + t}%, 
    var(--banker) ${p + t}% 100%
  )`;

  return (
    <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[2.5rem] flex flex-col items-center">
      <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-6">Taxa de Vitória Real</span>
      
      <div className="relative w-48 h-48 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)]" style={{ background: gradient }}>
        {/* Inner Circle (Donut effect) */}
        <div className="absolute w-[75%] h-[75%] bg-zinc-950 rounded-full flex flex-col items-center justify-center border border-white/5 shadow-inner">
           <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total</span>
           <span className="text-3xl font-black text-white">{stats.total || 0}</span>
           <span className="text-[8px] font-bold text-white/20 uppercase mt-1">Rodadas</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full mt-8">
         <StatItem label="Player" value={`${p}%`} color="text-player" />
         <StatItem label="Tie" value={`${t}%`} color="text-tie" />
         <StatItem label="Banker" value={`${b}%`} color="text-banker" />
      </div>
    </div>
  );
}

function StatItem({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="text-center">
       <span className={`block text-[10px] font-black ${color} uppercase mb-1`}>{label}</span>
       <span className="text-sm font-black text-white">{value}</span>
    </div>
  );
}
