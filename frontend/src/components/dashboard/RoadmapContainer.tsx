import { useMemo } from "react";
import { useCatalogador } from "@/hooks/useCatalogador";
import { Round } from "@/lib/roadmap";
import { useUI } from "@/store/uiStore";
import { BeadPlate } from "./BeadPlate";

export function RoadmapContainer() {
  const { roadmap, analysis, rounds, beadPlateMatrix } = useCatalogador();
  const { probingResult, setProbingResult } = useUI();

  // 1. Fallback imediato para todos os dados
  const stats = analysis?.statistics || { pPct: 0, bPct: 0, tPct: 0 };
  const { pPct, bPct, tPct } = stats;

  const { 
    bigRoadMatrix = [], 
    bigEyeBoy = [], 
    smallRoad = [], 
    cockroachPig = [] 
  } = roadmap || {};

  const isProbingP = probingResult === "P";
  const isProbingB = probingResult === "B";

  const renderBigRoad = () => {
    const rows = 6;
    const maxCols = 30; 
    const currentCols = (bigRoadMatrix && bigRoadMatrix[0]) ? bigRoadMatrix[0].length : 0;
    const startCol = Math.max(0, currentCols - maxCols);
    
    const grid = [];
    for (let c = 0; c < maxCols; c++) {
      const colItems = [];
      const matrixColIndex = startCol + c;
      for (let r = 0; r < rows; r++) {
        const dot = bigRoadMatrix[r] && bigRoadMatrix[r][matrixColIndex];
        if (dot) {
          const isPlayer = dot.result === "PLAYER" || dot.result === "P";
          const borderClass = isPlayer ? "border-player" : "border-banker";
          colItems.push(
            <div key={r} className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] flex items-center justify-center relative shrink-0">
              <div className={`w-[14px] h-[14px] sm:w-[16px] sm:h-[16px] rounded-full border-[2px] ${borderClass} relative flex items-center justify-center bg-transparent`}>
                {dot.ties > 0 && <span className="absolute -top-1 -right-1 text-[5px] font-black bg-tie text-black px-0.5 rounded-full">{dot.ties}</span>}
              </div>
            </div>
          );
        } else {
          colItems.push(<div key={r} className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] flex items-center justify-center opacity-5 shrink-0"><div className="w-0.5 h-0.5 bg-white rounded-full" /></div>);
        }
      }
      grid.push(<div key={c} className="flex flex-col gap-[2px]">{colItems}</div>);
    }
    return grid;
  };

  const renderDerived = (matrix: any, type: string) => {
    const maxCols = 40; 
    const currentLength = (matrix && matrix[0]) ? matrix[0].length : 0;
    const startCol = Math.max(0, currentLength - maxCols);
    const grid = [];

    for (let c = 0; c < maxCols; c++) {
      const colItems = [];
      for (let r = 0; r < 6; r++) {
        const matrixColIndex = startCol + c;
        const dot = matrix[r] && matrix[r][matrixColIndex];
        if (dot) {
          const colorClass = dot === "red" ? "bg-banker" : "bg-player";
          const borderClass = dot === "red" ? "border-banker" : "border-player";
          if (type === "bigEye") {
            colItems.push(<div key={r} className="w-2 h-2 flex items-center justify-center"><div className={`w-1.5 h-1.5 rounded-full border-[1px] ${borderClass}`} /></div>);
          } else if (type === "small") {
            colItems.push(<div key={r} className="w-2 h-2 flex items-center justify-center"><div className={`w-1 h-1 rounded-full ${colorClass}`} /></div>);
          } else {
            colItems.push(<div key={r} className="w-2 h-2 flex items-center justify-center"><div className={`w-1.5 h-[1px] -rotate-45 ${colorClass}`} /></div>);
          }
        } else {
           colItems.push(<div key={r} className="w-2 h-2 opacity-5 flex items-center justify-center"><div className="w-0.5 h-0.5 bg-white rounded-full"/></div>);
        }
      }
      grid.push(<div key={c} className="flex flex-col gap-[0.5px]">{colItems}</div>);
    }
    return grid;
  };

  return (
    <div className="flex flex-col gap-3 w-full animate-slide-up">
      <div className="glass-card flex flex-col md:flex-row items-center justify-between p-3 gap-3 bg-card/60 backdrop-blur-xl border border-white/5">
        <div className="flex-1 w-full flex items-center gap-3">
          <div className="flex-1 h-5 bg-black/40 rounded-full overflow-hidden flex font-black text-[9px] tracking-wider border border-white/10 shadow-inner">
            <div className="bg-player flex items-center justify-center text-white transition-all duration-700 relative overflow-hidden" style={{ width: `${pPct}%` }}>
              <span className="z-10 relative">PLAYER {pPct}%</span>
            </div>
            <div className="bg-tie text-black flex items-center justify-center transition-all duration-700" style={{ width: `${tPct}%` }}>{tPct}%</div>
            <div className="bg-banker flex items-center justify-center text-white transition-all duration-700 relative overflow-hidden" style={{ width: `${bPct}%` }}>
               <span className="z-10 relative">BANKER {bPct}%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onMouseEnter={() => setProbingResult("P")} onMouseLeave={() => setProbingResult(null)} className={`px-3 py-1 rounded-lg border transition-all duration-300 ${isProbingP ? "bg-player/20 border-player text-player" : "bg-black/30 border-white/10 text-muted-foreground"}`}><span className="font-black text-[10px]">P?</span></button>
          <button onMouseEnter={() => setProbingResult("B")} onMouseLeave={() => setProbingResult(null)} className={`px-3 py-1 rounded-lg border transition-all duration-300 ${isProbingB ? "bg-banker/20 border-banker text-banker" : "bg-banker/10 border-white/10 text-muted-foreground"}`}><span className="font-black text-[10px]">B?</span></button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-3 items-stretch">
        <div className="glass-card flex flex-col overflow-hidden border-white/10 w-full xl:w-1/2">
          <div className="p-1.5 border-b border-white/5 bg-black/40 flex items-center justify-between">
            <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">Bead Plate</span>
          </div>
          <div className="flex-1 p-2 bg-black/60 flex flex-row gap-[3px] items-start justify-center overflow-hidden">
            <BeadPlate matrix={beadPlateMatrix} />
          </div>
        </div>

        <div className="glass-card flex flex-col overflow-hidden border-white/10 w-full xl:w-1/2">
          <div className="p-1.5 border-b border-white/5 bg-black/40 flex items-center justify-between">
            <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">Big Road</span>
          </div>
          <div className="flex-1 p-2 bg-black/80 flex flex-row gap-[3px] items-start justify-center overflow-hidden">
            {renderBigRoad()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="glass-card bg-black/90 border border-white/5 relative overflow-hidden flex flex-row p-2 gap-0.5 h-[70px] justify-center items-center">
           <div className="absolute top-1 left-2 z-20 opacity-30 text-[7px] font-black text-white uppercase tracking-widest">Big Eye Boy</div>
           <div className="flex-1 flex flex-row gap-0.5 justify-center">{renderDerived(bigEyeBoy, "bigEye")}</div>
        </div>
        <div className="glass-card bg-black/90 border border-white/5 relative overflow-hidden flex flex-row p-2 gap-0.5 h-[70px] justify-center items-center">
           <div className="absolute top-1 left-2 z-20 opacity-30 text-[7px] font-black text-white uppercase tracking-widest">Small Road</div>
           <div className="flex-1 flex flex-row gap-0.5 justify-center">{renderDerived(smallRoad, "small")}</div>
        </div>
        <div className="glass-card bg-black/90 border border-white/5 relative overflow-hidden flex flex-row p-2 gap-0.5 h-[70px] justify-center items-center">
           <div className="absolute top-1 left-2 z-20 opacity-30 text-[7px] font-black text-white uppercase tracking-widest">Cockroach Pig</div>
           <div className="flex-1 flex flex-row gap-0.5 justify-center">{renderDerived(cockroachPig, "cockroach")}</div>
        </div>
      </div>
    </div>
  );
}
