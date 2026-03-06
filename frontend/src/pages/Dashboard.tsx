import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useCatalogador } from "@/hooks/useCatalogador";
import { RoadmapContainer } from "@/components/dashboard/RoadmapContainer";
import { KPICards } from "@/components/dashboard/KPICards";
import { StatisticsGrid } from "@/components/dashboard/StatisticsGrid";
import { HistoryGrid } from "@/components/dashboard/HistoryGrid";
import { useUI } from "@/store/uiStore";
import { Activity, Bell, Flame, Zap, Volume2, VolumeX, Lightbulb, Trophy, Clock, Server, Signal, XCircle, ShieldCheck, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

// Sintetizador Harmônico Pro (Web Audio API)
const playProSound = (type: 'tie' | 'signal') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    
    if (type === 'tie') {
      // Acorde Harmônico Major 7th (Som Pro de Cassino)
      const freqs = [523.25, 659.25, 783.99, 987.77];
      freqs.forEach(f => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 2.0);
      });
    } else if (type === 'signal') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch (e) { console.warn("Audio Context blocked"); }
};

export default function Dashboard() {
  const { rounds = [], roadmap, analysis, status, isLoading, isError } = useCatalogador();
  const { soundEnabled, setSoundEnabled, insightMode, setInsightMode, lastTie88x, setLastTie88x } = useUI();
  const lastRoundId = useRef<string | null>(null);
  
  const [wsUrl, setWsUrl] = useState("");
  const [isInjecting, setIsInjecting] = useState(false);
  const { toast } = useToast();

  const handleWsInject = async () => {
    if (!wsUrl.startsWith("wss://")) {
      toast({ variant: "destructive", title: "URL Inválida", description: "A URL deve começar com wss://" });
      return;
    }
    setIsInjecting(true);
    try {
      const res = await api.setWs(wsUrl);
      if (res.success) {
        toast({ title: "Conectado!", description: "O motor agora está recebendo dados." });
        setWsUrl("");
      } else {
        toast({ variant: "destructive", title: "Falha", description: res.message });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Falha na comunicação com a VPS." });
    } finally {
      setIsInjecting(false);
    }
  };

  useEffect(() => {
    if (rounds.length === 0) return;
    const latest = rounds[0];

    if (latest.round_id !== lastRoundId.current) {
      // Detecção de Tie (Qualquer)
      if (latest.result === 'TIE') {
        if (soundEnabled) playProSound('tie');
        
        // Detecção Específica de 88x (Multiplicador Máximo Bac Bo)
        if (latest.player_score === 8 && latest.banker_score === 8) {
          const tieData = {
            time: new Date().toLocaleTimeString(),
            round_id: latest.round_id,
            pattern: "88x SUPREMO",
            scores: "8 vs 8"
          };
          setLastTie88x(tieData);
        }
      } else if (analysis?.signal?.confidence >= 90 && soundEnabled) {
         playProSound('signal');
      }
      lastRoundId.current = latest.round_id;
    }
  }, [rounds, soundEnabled, analysis]);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 animate-fade-in">
        
        {/* Barra de Injeção Rápida (Bypass VPS) */}
        <div className="glass-card bg-orange-500/10 border-orange-500/20 p-4 rounded-3xl flex flex-col md:flex-row items-center gap-4 border-2">
          <div className="flex items-center gap-3 shrink-0">
            <ShieldCheck className="w-5 h-5 text-orange-400" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Bypass de Segurança</span>
              <span className="text-[9px] text-white/40">URL do seu computador pessoal</span>
            </div>
          </div>
          <div className="flex-1 w-full relative">
            <input 
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
              placeholder="wss://a8-latam.evo-games.com/..."
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-[10px] font-mono text-white outline-none focus:border-orange-500 transition-all"
            />
          </div>
          <button 
            onClick={handleWsInject}
            disabled={isInjecting || !wsUrl}
            className="shrink-0 bg-orange-600 hover:bg-orange-500 disabled:opacity-30 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all"
          >
            {isInjecting ? "Conectando..." : <><Send className="w-3 h-3" /> Injetar</>}
          </button>
        </div>

        {/* Central de Controles SaaS */}
        <div className="flex justify-end gap-3">
           <button 
             onClick={() => setSoundEnabled(!soundEnabled)}
             title={soundEnabled ? "Desativar Sons" : "Ativar Sons"}
             className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 shadow-lg ${soundEnabled ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-muted-foreground'}`}
           >
             {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
             <span className="text-[10px] font-black uppercase tracking-widest">{soundEnabled ? 'Áudio Ativo' : 'Mudo'}</span>
           </button>
           <button 
             onClick={() => setInsightMode(!insightMode)}
             title={insightMode ? "Ocultar Padrões" : "Destacar Padrões"}
             className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 shadow-lg ${insightMode ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'bg-white/5 border-white/10 text-muted-foreground'}`}
           >
             <Lightbulb className={`w-4 h-4 ${insightMode ? 'animate-pulse' : ''}`} />
             <span className="text-[10px] font-black uppercase tracking-widest">Insights {insightMode ? 'ON' : 'OFF'}</span>
           </button>
        </div>

        {/* Card de Destaque 88x */}
        {lastTie88x && (
          <div className="relative overflow-hidden group bg-gradient-to-r from-tie/30 via-black/40 to-tie/30 border border-tie/50 p-5 rounded-[2rem] flex items-center justify-between shadow-[0_0_50px_rgba(181,141,10,0.15)] transition-all hover:scale-[1.01]">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
             <div className="flex items-center gap-6 relative z-10">
                <div className="bg-tie p-4 rounded-2xl shadow-[0_0_30px_rgba(181,141,10,0.6)] animate-bounce-slow">
                   <Trophy className="w-8 h-8 text-black" />
                </div>
                <div>
                   <h3 className="text-xs font-black text-tie uppercase tracking-[0.3em] mb-1">Último Multiplicador Máximo</h3>
                   <div className="flex items-center gap-5">
                      <div className="flex items-center gap-2 text-white">
                         <Clock className="w-4 h-4 text-tie" />
                         <span className="text-xl font-black">{lastTie88x.time}</span>
                      </div>
                      <div className="h-4 w-[1px] bg-white/10" />
                      <span className="text-xs font-bold text-white/40 font-mono tracking-tighter">RD: {lastTie88x.round_id}</span>
                   </div>
                </div>
             </div>
             <div className="text-right relative z-10">
                <span className="block text-[10px] font-black text-tie/60 uppercase mb-1 tracking-widest">Padrão Registrado</span>
                <span className="text-4xl font-black text-white italic">{lastTie88x.pattern}</span>
             </div>
          </div>
        )}

        {/* Status Live */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white/[0.02] border border-white/5 p-6 rounded-3xl backdrop-blur-md">
          <div className="flex items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-black text-white tracking-tighter uppercase">Mesa Bac Bo</h1>
                <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                  <div className={`w-2 h-2 rounded-full ${status?.motor?.live?.is_shaking ? 'bg-orange-500 animate-ping' : 'bg-primary animate-pulse'}`} />
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">Live Sync</span>
                </div>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{status?.motor?.live?.stage || "Conectando..."}</p>
            </div>
            
            <div className="h-10 w-[1px] bg-white/10" />
            
            <div className="flex items-center gap-10">
               <div className="text-center">
                  <span className="block text-[8px] font-black text-player uppercase mb-1">Jogador</span>
                  <span className="text-3xl font-black text-white">{status?.motor?.live?.player?.score || 0}</span>
               </div>
               <div className="text-center opacity-20 text-xs font-black">VS</div>
               <div className="text-center">
                  <span className="block text-[8px] font-black text-banker uppercase mb-1">Banca</span>
                  <span className="text-3xl font-black text-white">{status?.motor?.live?.banker?.score || 0}</span>
               </div>
            </div>
          </div>

          <div className="min-w-[200px]">
             <div className="flex justify-between text-[9px] font-black uppercase mb-2">
                <span className="text-player">P: {status?.motor?.live?.player?.bets || 0}</span>
                <span className="text-banker">B: {status?.motor?.live?.banker?.bets || 0}</span>
             </div>
             <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden flex border border-white/5">
                {(() => {
                   const p = status?.motor?.live?.player?.bets || 0;
                   const b = status?.motor?.live?.banker?.bets || 0;
                   const t = status?.motor?.live?.tie?.bets || 0;
                   const total = p + b + t || 1;
                   return (
                     <>
                       <div className="h-full bg-player transition-all duration-1000 shadow-[0_0_10px_var(--player)]" style={{ width: `${(p / total) * 100}%` }} />
                       <div className="h-full bg-tie transition-all duration-1000" style={{ width: `${(t / total) * 100}%` }} />
                       <div className="h-full bg-banker transition-all duration-1000 shadow-[0_0_10px_var(--banker)]" style={{ width: `${(b / total) * 100}%` }} />
                     </>
                   );
                })()}
             </div>
          </div>
        </div>

        <RoadmapContainer />
        <KPICards />
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <section className="xl:col-span-1">
             <div className="flex items-center gap-3 mb-6 px-2">
                <Activity className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-black text-white/50 uppercase tracking-[0.2em]">Estatísticas Reais</h2>
             </div>
             <StatisticsGrid />
          </section>
          <section className="xl:col-span-2">
             <HistoryGrid />
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
