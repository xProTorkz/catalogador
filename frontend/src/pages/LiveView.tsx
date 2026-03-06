import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useCatalogador } from "@/hooks/useCatalogador";
import { 
  Monitor, 
  MessageSquare, 
  Users, 
  Circle, 
  Send, 
  Gamepad2,
  TrendingUp,
  Activity,
  History,
  Lock,
  Unlock
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { StatisticsGrid } from "@/components/dashboard/StatisticsGrid";

export default function LiveView() {
  const { status, rounds = [] } = useCatalogador();
  const [isOnline, setIsOnline] = useState(true);
  const [chatMessage, setChatMessage] = useState("");
  const [forceCasino, setForceCasino] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeUrl = status?.motor?.live?.game_url;
  const showCasino = !activeUrl || forceCasino;

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full gap-6 animate-fade-in">
        
        {/* Header com Status */}
        <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="bg-primary/20 p-2 rounded-xl border border-primary/30">
              <Monitor className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tighter uppercase">Live View</h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {showCasino ? "Modo Login / Navegação" : "Modo Retransmissão Evolution"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             {activeUrl && (
               <button 
                onClick={() => setForceCasino(!forceCasino)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                  forceCasino ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' : 'bg-primary/20 border-primary/50 text-primary'
                }`}
               >
                {forceCasino ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                {forceCasino ? "Sair do Cassino" : "Voltar ao Cassino"}
               </button>
             )}
             
             <button 
                onClick={() => setIsOnline(!isOnline)}
                className={`flex items-center gap-3 px-6 py-2.5 rounded-xl border transition-all duration-300 shadow-xl group ${
                  isOnline ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' : 'bg-red-500/10 border-red-500/50 text-red-500'
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-xs font-black uppercase tracking-widest">{isOnline ? 'Ativo' : 'Pausa'}</span>
              </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
          
          <div className="lg:col-span-8 flex flex-col gap-6 h-full">
            
            {/* Janela de Visualização - AGORA DIGITAL (Sem Login) */}
            <div className="relative aspect-video w-full bg-[#0a0a0a] rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl flex items-center justify-center group">
               
               {/* Background Decorativo */}
               <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#3b82f633_0%,transparent_70%)]" />
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
               </div>

               {/* Placar Digital Central */}
               <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-2xl px-10">
                  
                  {/* Status da Rodada */}
                  <div className="flex flex-col items-center gap-2">
                    <Badge className={`px-6 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-[0.3em] animate-pulse ${
                      status?.motor?.live?.is_shaking ? 'bg-orange-500/20 border-orange-500/50 text-orange-500' : 'bg-primary/20 border-primary/50 text-primary'
                    }`}>
                      {status?.motor?.live?.stage || "Sincronizando..."}
                    </Badge>
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em]">Bac Bo Digital Live</span>
                  </div>

                  {/* Dados em Tempo Real */}
                  <div className="flex items-center justify-between w-full gap-4">
                    {/* Lado Jogador */}
                    <div className="flex flex-col items-center gap-4 flex-1">
                       <span className="text-[10px] font-black text-player uppercase tracking-widest opacity-60">Player</span>
                       <div className="flex gap-3">
                          {[0, 1].map((idx) => (
                            <div key={`p-${idx}`} className={`w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-player/20 to-player/5 border-2 border-player/30 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl font-black text-player shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)] transition-all duration-500 ${status?.motor?.live?.is_shaking ? 'animate-bounce scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
                               {status?.motor?.live?.player?.dice?.[idx] || 0}
                            </div>
                          ))}
                       </div>
                       <div className="text-4xl sm:text-6xl font-black text-white italic drop-shadow-2xl">
                          {status?.motor?.live?.player?.score || 0}
                       </div>
                    </div>

                    {/* Divisor Central (VS) */}
                    <div className="flex flex-col items-center gap-2">
                       <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-white/5 text-[10px] font-black text-white/40 italic">VS</div>
                       <div className="h-32 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                    </div>

                    {/* Lado Banca */}
                    <div className="flex flex-col items-center gap-4 flex-1">
                       <span className="text-[10px] font-black text-banker uppercase tracking-widest opacity-60">Banker</span>
                       <div className="flex gap-3">
                          {[0, 1].map((idx) => (
                            <div key={`b-${idx}`} className={`w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-banker/20 to-banker/5 border-2 border-banker/30 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl font-black text-banker shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)] transition-all duration-500 ${status?.motor?.live?.is_shaking ? 'animate-bounce scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
                               {status?.motor?.live?.banker?.dice?.[idx] || 0}
                            </div>
                          ))}
                       </div>
                       <div className="text-4xl sm:text-6xl font-black text-white italic drop-shadow-2xl">
                          {status?.motor?.live?.banker?.score || 0}
                       </div>
                    </div>
                  </div>

                  {/* Volume de Apostas Visual */}
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden flex gap-1">
                     <div className="bg-player h-full transition-all duration-1000 shadow-[0_0_15px_var(--player)]" style={{ width: `${(status?.motor?.live?.player?.bets || 1) / ((status?.motor?.live?.player?.bets || 1) + (status?.motor?.live?.banker?.bets || 1) + 1) * 100}%` }} />
                     <div className="bg-tie h-full transition-all duration-1000 shadow-[0_0_15px_var(--tie)]" style={{ width: `${(status?.motor?.live?.tie?.bets || 1) / ((status?.motor?.live?.player?.bets || 1) + (status?.motor?.live?.banker?.bets || 1) + 1) * 100}%` }} />
                     <div className="bg-banker h-full transition-all duration-1000 shadow-[0_0_15px_var(--banker)]" style={{ width: `${(status?.motor?.live?.banker?.bets || 1) / ((status?.motor?.live?.player?.bets || 1) + (status?.motor?.live?.banker?.bets || 1) + 1) * 100}%` }} />
                  </div>
               </div>

               {/* Overlay de Vencedor */}
               {status?.motor?.live?.result && (
                 <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-30 animate-in fade-in zoom-in duration-500">
                    <div className={`px-12 py-6 rounded-[2rem] border-4 flex flex-col items-center gap-2 shadow-2xl ${
                      status.motor.live.result === 'PLAYER' ? 'bg-player/20 border-player/50 text-player' :
                      status.motor.live.result === 'BANKER' ? 'bg-banker/20 border-banker/50 text-banker' :
                      'bg-tie/20 border-tie/50 text-tie'
                    }`}>
                       <span className="text-[10px] font-black uppercase tracking-[0.5em] opacity-60">Vencedor da Rodada</span>
                       <span className="text-5xl sm:text-7xl font-black italic uppercase tracking-tighter drop-shadow-2xl">{status.motor.live.result}</span>
                    </div>
                 </div>
               )}

               {/* Barra de Status Inferior (Realtime Info) */}
               <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between px-6 py-3 bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-2xl z-20">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${status?.motor?.live?.is_shaking ? 'bg-orange-500 animate-ping' : 'bg-primary animate-pulse'}`} />
                       <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{status?.motor?.live?.stage || "Offline"}</span>
                    </div>
                    <div className="h-4 w-[1px] bg-white/10" />
                    <div className="flex items-center gap-4">
                       <span className="text-[9px] font-black text-white/20 uppercase tracking-tighter">Shoe: {status?.motor?.live?.shoe_index || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Users className="w-3 h-3 text-white/20" />
                    <span className="text-[10px] font-black text-white/40 uppercase tabular-nums tracking-widest">{status?.motor?.live?.total_players || 0} na Mesa</span>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-primary opacity-60">
                     <TrendingUp className="w-4 h-4" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Tendência</span>
                  </div>
                  <div className="flex items-end justify-between italic">
                     <span className="text-2xl font-black text-white italic uppercase">{status?.motor?.live?.result || "..."}</span>
                     <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-[9px] font-black">Em Analise</Badge>
                  </div>
               </div>
               <div className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-amber-500 opacity-60">
                     <Activity className="w-4 h-4" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Volume Mesa</span>
                  </div>
                  <div className="flex items-end justify-between tabular-nums">
                     <span className="text-2xl font-black text-white italic uppercase">R$ {status?.motor?.live?.total_bets || 0}</span>
                     <span className="text-[9px] font-bold text-muted-foreground uppercase">Realtime</span>
                  </div>
               </div>
               <div className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-purple-500 opacity-60">
                     <History className="w-4 h-4" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Status Motor</span>
                  </div>
                  <div className="flex items-end justify-between">
                     <span className="text-2xl font-black text-white italic uppercase">{status?.engine_status || "..."}</span>
                     <span className="text-[9px] font-bold text-muted-foreground uppercase">Ativo</span>
                  </div>
               </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[2.5rem] mt-auto overflow-hidden">
               <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-4 bg-primary rounded-full shadow-[0_0_10px_var(--primary)]" />
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Métricas Avançadas da Mesa</h3>
               </div>
               <StatisticsGrid />
            </div>
          </div>

          {/* LADO DIREITO: CHATS (4 Colunas) */}
          <div className="lg:col-span-4 flex flex-col gap-6 h-[800px] lg:h-auto">
            <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                <div className="flex items-center gap-3">
                   <MessageSquare className="w-4 h-4 text-primary" />
                   <h3 className="text-xs font-black text-white uppercase tracking-widest">Chat do Sistema</h3>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar flex items-center justify-center text-white/20">
                 <div className="flex flex-col items-center gap-2">
                   <MessageSquare className="w-8 h-8 opacity-20" />
                   <span className="text-[10px] font-black uppercase tracking-widest italic">Aguardando Mensagens...</span>
                 </div>
              </div>
            </div>

            <div className="h-[300px] bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 rounded-[2.5rem] p-6 flex flex-col gap-4 overflow-hidden">
               <div className="flex items-center gap-3">
                  <Circle className="w-2 h-2 text-primary fill-primary animate-pulse" />
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Log de Sinais</h3>
               </div>
               <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1">
                  {rounds.slice(0, 5).map((round, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-2xl">
                       <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                            round.result === 'PLAYER' ? 'bg-player text-white' : 
                            round.result === 'BANKER' ? 'bg-banker text-white' : 
                            'bg-tie text-black'
                          }`}>
                             {round.result[0]}
                          </div>
                          <div>
                             <span className="block text-[10px] font-black text-white uppercase">{round.result}</span>
                             <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-tighter">Soma: {round.player_score || 0} vs {round.banker_score || 0}</span>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
