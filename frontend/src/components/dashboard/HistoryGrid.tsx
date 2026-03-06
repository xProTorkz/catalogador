import { useState } from "react";
import { Maximize2, Users, PieChart as PieIcon, Hash, Info, Landmark } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCatalogador } from "@/hooks/useCatalogador";

export function HistoryGrid() {
  const [limit, setLimit] = useState(1000);
  const { rounds, isLoading } = useCatalogador(limit);
  const [compact, setCompact] = useState(false);
  const [page, setPage] = useState(0);

  if (isLoading && rounds.length === 0) return <div className="flex items-center justify-center p-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!isLoading && rounds.length === 0) return <div className="text-center p-20 text-white/20 font-black text-[10px] uppercase tracking-widest">Aguardando primeira rodada...</div>;

  const perPage = compact ? 200 : 48; // Menos itens no expandido por causa do tamanho do card
  const pageData = rounds.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(rounds.length / perPage);

  return (
    <TooltipProvider delayDuration={0}>
    <div className="glass-card p-6 bg-card/40 border-white/5 flex flex-col h-full shadow-2xl rounded-[2rem]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Fluxo de 1000 Rodadas</h2>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full uppercase">
              {rounds.length.toLocaleString()} Analisadas
            </span>
            <select 
              title="Selecionar limite de rodadas para visualização"
              value={limit} 
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(0); }}
              className="bg-black/40 border border-white/10 rounded-lg text-[10px] font-black text-white px-2 py-1 outline-none cursor-pointer hover:bg-white/5"
            >

              <option value="1000">1.000 RD</option>
              <option value="5000">5.000 RD</option>
              <option value="10000">10.000 RD</option>
              <option value="100000">100.000 RD</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ToggleBtn icon={<Maximize2 className="h-3 w-3" />} label={compact ? "Expandir" : "Compactar"} active={compact} onClick={() => setCompact(!compact)} />
        </div>
      </div>

      {/* Grid de Auditoria */}
      <div className={`flex-1 overflow-y-auto custom-scrollbar-light pr-1 flex flex-wrap content-start ${compact ? "gap-0.5 sm:gap-1" : "gap-1.5 sm:gap-3"}`}>
        {pageData.map((r, i) => {
           const res = r.result === "PLAYER" || r.result === "P" ? "P" : r.result === "BANKER" || r.result === "B" ? "B" : "T";
           const bgClass = res === "P" ? "bg-player text-white shadow-[0_0_15px_rgba(30,64,175,0.2)]" : res === "B" ? "bg-banker text-white shadow-[0_0_15px_rgba(153,27,27,0.2)]" : "bg-tie text-black shadow-[0_0_15px_rgba(181,141,10,0.2)]";
           
           if (compact) {
             return (
               <Tooltip key={r.round_id}>
                 <TooltipTrigger asChild>
                   <button className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center font-black text-[7px] sm:text-[8px] border border-white/5 ${bgClass}`}>
                     {res}
                   </button>
                 </TooltipTrigger>
                 <TooltipContent side="top" className="p-0 border-none bg-transparent shadow-none">
                    <MiniAuditCard round={r} />
                 </TooltipContent>
               </Tooltip>
             );
           }

           // Modo Expandido: Pequenos Cards
           return (
             <Tooltip key={r.round_id}>
               <TooltipTrigger asChild>
                 <div className="flex-grow basis-[calc(33.33%-6px)] sm:basis-[calc(25%-12px)] md:basis-[calc(20%-12px)] lg:basis-[calc(16.66%-12px)] min-w-[100px]">
                    <div className={`group relative p-3 sm:p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-help`}>
                       <div className="flex justify-between items-start mb-2">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] ${bgClass}`}>
                             {res}
                          </div>
                          <span className="text-[10px] font-mono opacity-30">#{r.id}</span>
                       </div>
                       <div className="flex justify-between items-end">
                          <span className="text-xl font-black text-white/90">{r.player_score} <span className="text-[10px] opacity-20">X</span> {r.banker_score}</span>
                       </div>
                    </div>
                 </div>
               </TooltipTrigger>
               <TooltipContent side="right" className="p-0 border-none bg-transparent shadow-2xl" sideOffset={10}>
                  <MiniAuditCard round={r} />
               </TooltipContent>
             </Tooltip>
           );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-8 pt-6 border-t border-white/5 overflow-x-auto pb-2 custom-scrollbar">
          {Array.from({ length: Math.min(10, totalPages) }, (_, i) => (
             <button
               key={i}
               onClick={() => setPage(i)}
               className={`h-8 w-8 min-w-[32px] rounded-xl text-[10px] font-black transition-all ${i === page
                 ? "bg-primary text-black"
                 : "bg-white/5 text-white/40 hover:bg-white/10"
                 }`}
             >
               {i + 1}
             </button>
          ))}
        </div>
      )}
    </div>
    </TooltipProvider>
  );
}

function MiniAuditCard({ round }: { round: any }) {
  return (
    <div className="bg-zinc-950 border border-white/10 p-5 rounded-3xl w-72 shadow-[0_0_50px_rgba(0,0,0,0.9)] backdrop-blur-3xl">
       <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
             <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${round.result === 'PLAYER' ? 'bg-player' : round.result === 'BANKER' ? 'bg-banker' : 'bg-tie text-black'}`}>
                {round.result[0]}
             </div>
             <div>
                <span className="block text-[8px] font-black text-white/40 uppercase">ID da Rodada</span>
                <span className="text-[10px] font-mono text-white/80">{round.round_id}</span>
             </div>
          </div>
          <div className="text-right">
             <span className="block text-[8px] font-black text-primary uppercase">Placar</span>
             <span className="text-sm font-black text-white">{round.player_score} x {round.banker_score}</span>
          </div>
       </div>

       <div className="space-y-4">
          <div>
             <span className="text-[8px] font-black text-white/20 uppercase block mb-2">Composição dos Dados</span>
             <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between bg-white/5 p-2 rounded-xl border border-white/5">
                   <span className="text-[8px] font-black text-player uppercase">P</span>
                   <div className="flex gap-1">
                      <span className="w-5 h-5 bg-player/20 flex items-center justify-center rounded text-[10px] font-black text-player">{round.player_d1}</span>
                      <span className="w-5 h-5 bg-player/20 flex items-center justify-center rounded text-[10px] font-black text-player">{round.player_d2}</span>
                   </div>
                </div>
                <div className="flex items-center justify-between bg-white/5 p-2 rounded-xl border border-white/5">
                   <span className="text-[8px] font-black text-banker uppercase">B</span>
                   <div className="flex gap-1">
                      <span className="w-5 h-5 bg-banker/20 flex items-center justify-center rounded text-[10px] font-black text-banker">{round.banker_d1}</span>
                      <span className="w-5 h-5 bg-banker/20 flex items-center justify-center rounded text-[10px] font-black text-banker">{round.banker_d2}</span>
                   </div>
                </div>
             </div>
          </div>

          <div>
             <span className="text-[8px] font-black text-white/20 uppercase block mb-2">Mercado de Apostas</span>
             <div className="space-y-1.5 bg-black/40 p-3 rounded-2xl border border-white/5">
                <div className="flex justify-between text-[9px] font-bold">
                   <span className="text-player/60">Jogador</span>
                   <span className="text-white">R$ {round.player_bets?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[9px] font-bold">
                   <span className="text-banker/60">Banca</span>
                   <span className="text-white">R$ {round.banker_bets?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[9px] font-bold border-t border-white/5 pt-1.5">
                   <span className="text-tie/60">Empate</span>
                   <span className="text-white">R$ {round.tie_bets?.toLocaleString()}</span>
                </div>
             </div>
          </div>
       </div>

       <div className="mt-4 flex items-center justify-between text-[8px] font-black text-white/20 uppercase">
          <div className="flex items-center gap-1">
             <Landmark className="w-3 h-3 text-primary" />
             <span>Auditado</span>
          </div>
          <span>{new Date(round.timestamp).toLocaleTimeString()}</span>
       </div>
    </div>
  );
}

function ToggleBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${active
        ? "bg-primary text-black"
        : "bg-white/5 text-white/40 border border-white/5 hover:bg-white/10"
        }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
