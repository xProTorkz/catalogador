import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SlidersHorizontal, ShieldCheck, Wallet, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useCatalogador } from "@/hooks/useCatalogador";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Advanced() {
  const { analysis } = useCatalogador();
  const { toast } = useToast();
  const stats = analysis?.statistics || { pPct: 50, bPct: 50 };

  const [influence, setInfluence] = useState({
    bigRoad: 80,
    repetition: 60,
    alternation: 40,
    frequency: 70,
    derived: 50,
    dragonTail: 90,
    ties: 30,
    instability: 20
  });

  const [validators, setValidators] = useState({
    antiDragon: true,
    tieFilter: true,
    regression: false,
    derivedValidation: true,
    ignoreTies: false
  });

  // Load settings on mount
  useEffect(() => {
    api.getSettings().then(data => {
      if (data.influence) setInfluence(data.influence);
      if (data.validators) setValidators(data.validators);
    }).catch(err => console.error("Error loading settings:", err));
  }, []);

  const [wsUrl, setWsUrl] = useState("");
  const [isInjecting, setIsInjecting] = useState(false);

  const handleWsInject = async () => {
    if (!wsUrl.startsWith("wss://")) {
      toast({ variant: "destructive", title: "URL Inválida", description: "A URL deve começar com wss://" });
      return;
    }
    setIsInjecting(true);
    try {
      const res = await api.setWs(wsUrl);
      if (res.success) {
        toast({ title: "Injeção Concluída", description: "O motor agora está capturando dados direto da Evolution." });
      } else {
        toast({ variant: "destructive", title: "Falha na Conexão", description: res.message });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Erro de Rede", description: "Não foi possível enviar a URL para a VPS." });
    } finally {
      setIsInjecting(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.saveSettings({ influence, validators });
      toast({
        title: "Configurações Salvas",
        description: "A engine de inteligência foi atualizada com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao Salvar",
        description: "Não foi possível conectar ao servidor.",
      });
    }
  };

  const validatorList = [
    { id: 'antiDragon', label: "Modo Anti-Dragão", desc: "Evita entradas contra sequências longas" },
    { id: 'tieFilter', label: "Filtro de Empate Recent", desc: "Bloqueia sinal se saiu empate nas últimas 3" },
    { id: 'regression', label: "Regressão à Média", desc: "Prioriza cor com menor frequência na shoe" },
    { id: 'derivedValidation', label: "Validação Derived", desc: "Só confirma se 2/3 vias derivadas concordarem" },
    { id: 'ignoreTies', label: "Ignorar Empates", desc: "Não quebra contagem em caso de empate" }
  ];

  return (
    <DashboardLayout>
      <div className="mb-10 animate-slide-up">
        <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-2">Advanced Mode</h1>
        <p className="text-sm font-medium text-muted-foreground text-balance max-w-2xl">
          Engine de IA configurável. Ajuste os pesos dos indicadores para recalibrar o nível de confiança e as predições do sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-slide-up stagger-2">
        
        {/* COL 1: INDICADORES */}
        <div className="glass-card flex flex-col overflow-hidden border-white/10 shadow-2xl bg-card/40">
          <div className="p-5 border-b border-white/5 bg-black/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="w-4 h-4 text-purple-400" />
              <h2 className="text-xs font-black text-white uppercase tracking-widest">Influência</h2>
            </div>
            <span className="text-[10px] font-black text-purple-400/50 bg-purple-400/10 px-2 py-0.5 rounded">AI ENGINE</span>
          </div>
          
          <div className="p-6 flex flex-col gap-8">
            {Object.entries(influence).map(([key, value]) => (
              <div key={key} className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <Tooltip>
                      <TooltipTrigger><Info className="w-3 h-3 text-white/20 hover:text-white/50 transition-colors" /></TooltipTrigger>
                      <TooltipContent className="bg-black border-white/10 text-[10px] max-w-[200px]">
                        Ajusta o peso deste indicador no cálculo final do sinal.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="text-xs font-mono text-purple-400 font-bold">{value}%</span>
                </div>
                <Slider 
                  value={[value]} 
                  onValueChange={([v]) => setInfluence(prev => ({...prev, [key]: v}))}
                  max={100} 
                  step={1} 
                  className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
                />
              </div>
            ))}

            <div className="mt-4 p-5 bg-black/60 rounded-2xl border border-white/5 space-y-4 shadow-inner">
               <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] text-center">Nível de Confiança Atual</h3>
               <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-player">{stats.pPct}%</span>
                    <span className="text-[9px] font-black text-player/50 uppercase">PLAYER</span>
                  </div>
                  <div className="h-12 w-[2px] bg-white/5" />
                  <div className="flex flex-col text-right">
                    <span className="text-2xl font-black text-banker">{stats.bPct}%</span>
                    <span className="text-[9px] font-black text-banker/50 uppercase">BANKER</span>
                  </div>
               </div>
               <div className="w-full h-1.5 bg-banker rounded-full overflow-hidden flex">
                  <div className="h-full bg-player shadow-[0_0_10px_#1e40af]" style={{ width: `${stats.pPct}%` }} />
               </div>
               <p className="text-[10px] font-black text-primary text-center uppercase tracking-widest animate-pulse">
                 Sinal: {stats.pPct > 55 ? "Confirmado Player" : stats.bPct > 55 ? "Confirmado Banker" : "Aguardando Tendência"}
               </p>
            </div>
          </div>
        </div>

        {/* COL 2: VALIDATORES */}
        <div className="glass-card flex flex-col overflow-hidden border-white/10 shadow-2xl bg-card/40">
          <div className="p-5 border-b border-white/5 bg-black/40 flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-orange-400" />
            <h2 className="text-xs font-black text-white uppercase tracking-widest">Validadores</h2>
          </div>
          
          <div className="p-6 space-y-4">
            {validatorList.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-colors group">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-white group-hover:text-primary transition-colors">{v.label}</span>
                  <span className="text-[10px] text-muted-foreground">{v.desc}</span>
                </div>
                <Switch 
                  title={`Ativar ${v.label}`}
                  aria-label={v.label}
                  checked={(validators as any)[v.id]} 
                  onCheckedChange={(checked) => setValidators(prev => ({...prev, [v.id]: checked}))}
                />
              </div>
            ))}
            
            <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl space-y-3">
               <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Filtro de Sequência</span>
               <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">Mínimo para entrada:</span>
                  <input 
                    title="Mínimo de repetições para entrada"
                    type="number" 
                    defaultValue={3} 
                    className="w-12 bg-black/40 border border-white/10 rounded-lg py-1 text-center text-xs font-bold focus:border-primary outline-none" 
                  />
               </div>
            </div>
          </div>
        </div>

        {/* COL 3: GERENCIAMENTO */}
        <div className="flex flex-col gap-8">
          <div className="glass-card flex flex-col overflow-hidden border-white/10 shadow-2xl bg-card/40">
            <div className="p-5 border-b border-white/5 bg-black/40 flex items-center gap-3">
              <Wallet className="w-4 h-4 text-blue-400" />
              <h2 className="text-xs font-black text-white uppercase tracking-widest">Gestão SaaS</h2>
            </div>
            
            <div className="p-6 flex flex-col gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Banca Inicial</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-sm">R$</span>
                  <input 
                    title="Valor da banca inicial"
                    type="number" 
                    defaultValue={1000} 
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-11 pr-4 text-lg font-black text-white focus:border-primary transition-all outline-none shadow-inner" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-green-400/50 uppercase tracking-[0.2em]">Meta Diária</label>
                  <input 
                    title="Valor da meta diária"
                    type="number" 
                    defaultValue={200} 
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:border-green-400 outline-none transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-red-400/50 uppercase tracking-[0.2em]">Stop Loss</label>
                  <input 
                    title="Valor do limite de perda"
                    type="number" 
                    defaultValue={100} 
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:border-red-400 outline-none transition-all" 
                  />
                </div>
              </div>

              <div className="pt-4 mt-auto">
                <button 
                  onClick={handleSave}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(34,197,94,0.3)] border-t border-white/20"
                >
                  Salvar & Iniciar Engine
                </button>
              </div>
            </div>
          </div>

          {/* NOVO CARD: BYPASS VPS */}
          <div className="glass-card flex flex-col overflow-hidden border-orange-500/20 shadow-2xl bg-orange-500/5 border-2">
            <div className="p-5 border-b border-orange-500/10 bg-orange-500/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-orange-400" />
                <h2 className="text-xs font-black text-white uppercase tracking-widest">Bypass de Segurança</h2>
              </div>
              <span className="text-[9px] font-black text-orange-400 animate-pulse">MODO VPS ATIVO</span>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Use este recurso se a VPS estiver bloqueada pelo cassino. Cole a URL do WebSocket (wss://...) capturada no seu computador pessoal.
              </p>
              
              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/40 uppercase">URL do WebSocket (Evolution)</label>
                <textarea 
                  value={wsUrl}
                  onChange={(e) => setWsUrl(e.target.value)}
                  placeholder="wss://a8-latam.evo-games.com/public/bacbo/player/game/..."
                  className="w-full h-24 bg-black/60 border border-white/10 rounded-xl p-3 text-[10px] font-mono text-orange-200 outline-none focus:border-orange-500 transition-all resize-none"
                />
              </div>

              <button 
                onClick={handleWsInject}
                disabled={isInjecting || !wsUrl}
                className="w-full py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all"
              >
                {isInjecting ? "Injetando..." : "Forçar Conexão Direta"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
