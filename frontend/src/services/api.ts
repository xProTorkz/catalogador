import { Round, RoadmapData } from "../lib/roadmap";

/**
 * ARQUITETURA SAAS: URL RELATIVA
 * O site sempre procura a API no mesmo endereço onde foi aberto.
 * Se aberto em https://meu-site.com, procura em https://meu-site.com/api
 */
const API_BASE_URL = "/api"; 

export interface SystemStatus {
  sistema: string;
  motor: {
    total_saved: number;
    seconds_since_last_round: number;
    engine_status: string;
    live?: {
      stage: string;
      player: { score: number; dice: number[] };
      banker: { score: number; dice: number[] };
      is_shaking: boolean;
      round_id: string;
    };
  };
}

export const api = {
  getRodadas: async (limit = 100): Promise<Round[]> => {
    const res = await fetch(`${API_BASE_URL}/rodadas?limit=${limit}`);
    if (!res.ok) throw new Error("API Offline");
    return res.json();
  },

  getRoadmap: async (limit = 200): Promise<RoadmapData> => {
    const res = await fetch(`${API_BASE_URL}/roadmap?limit=${limit}`);
    if (!res.ok) throw new Error("API Offline");
    return res.json();
  },

  getAnalise: async (limit = 2000): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/analise?limit=${limit}`);
    if (!res.ok) throw new Error("API Offline");
    return res.json();
  },

  getStatus: async (): Promise<SystemStatus> => {
    const res = await fetch(`${API_BASE_URL}/status`);
    if (!res.ok) throw new Error("API Offline");
    return res.json();
  },

  getSettings: async (): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/settings`);
    if (!res.ok) throw new Error("Erro ao carregar");
    return res.json();
  },

  saveSettings: async (settings: any): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error("Erro ao salvar");
    return res.json();
  },

  getBeadPlate: async (cols = 30): Promise<any[][]> => {
    const res = await fetch(`${API_BASE_URL}/beadplate?limit_cols=${cols}`);
    if (!res.ok) throw new Error("API Offline");
    return res.json();
  },

  setWs: async (url: string): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/set_ws`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) throw new Error("Falha na injeção");
    return res.json();
  }
};
