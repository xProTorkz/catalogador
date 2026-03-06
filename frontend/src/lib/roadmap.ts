export type RoundResult = "PLAYER" | "BANKER" | "TIE" | "P" | "B" | "T";

/**
 * Interface de Rodada Pura
 */
export interface Round {
  id?: number;
  round_id: string;
  result: RoundResult;
  player_score: number;
  banker_score: number;
  timestamp: string;
  player_d1: number;
  player_d2: number;
  banker_d1: number;
  banker_d2: number;
  is_tie: number;
  tie_number?: number | null;
  // Campos adicionados pela API
  color?: string;
  display_score?: number | string;
}

/**
 * Ponto na Matriz Big Road
 */
export interface BigRoadDot {
  result: RoundResult;
  ties: number;
}

/**
 * Objeto centralizado de Roadmap recebido do Backend
 */
export interface RoadmapData {
  beadPlate: Round[];
  bigRoadMatrix: (BigRoadDot | null)[][];
  bigEyeBoy: (("red" | "blue") | null)[][];
  smallRoad: (("red" | "blue") | null)[][];
  cockroachPig: (("red" | "blue") | null)[][];
}
