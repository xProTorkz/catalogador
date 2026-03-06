import { Round } from "@/lib/roadmap";

interface BeadPlateProps {
  matrix: any[][];
}

export function BeadPlate({ matrix }: BeadPlateProps) {
  if (!matrix || !Array.isArray(matrix)) {
    return <div className="text-white/20 animate-pulse">Carregando Grade...</div>;
  }

  return (
    <div className="flex gap-1 overflow-hidden justify-center p-2 bg-black/40 rounded-3xl border border-white/5 w-full">
      {matrix.map((column, c) => (
        <div key={c} className="flex flex-col gap-1">
          {column.map((cell, r) => (
            <div key={r} className="w-5 h-5 sm:w-[22px] sm:h-[22px] rounded-full flex items-center justify-center text-[9px] font-black text-white border border-white/10 relative shrink-0">
              {cell ? (
                <div className={`w-full h-full rounded-full flex items-center justify-center bg-${cell.color} ${cell.color === 'tie' ? 'text-black shadow-[0_0_10px_rgba(181,141,10,0.5)]' : 'shadow-[0_0_10px_rgba(0,0,0,0.5)]'}`}>
                  {cell.res}
                </div>
              ) : (
                <div className="w-full h-full rounded-full border border-white/5 bg-white/[0.02]" />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
