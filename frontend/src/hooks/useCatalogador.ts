import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { useMemo } from "react";

export function useCatalogador(limit = 100) {
  /**
   * Rodadas brutas para Bead Plate e Histórico (CRÍTICO)
   */
  const roundsQuery = useQuery({
    queryKey: ["rodadas", limit],
    queryFn: () => api.getRodadas(limit),
    refetchInterval: 2000, // Diminuído para 2 segundos
    staleTime: 1000,
    refetchOnWindowFocus: true,
  });

  /**
   * Deduplicação Robusta: Garante que round_id seja único na UI
   */
  const dedupedRounds = useMemo(() => {
    const rawRounds = roundsQuery.data || [];
    const seen = new Set();
    return rawRounds.filter(r => {
      if (!r.round_id || seen.has(r.round_id)) return false;
      seen.add(r.round_id);
      return true;
    });
  }, [roundsQuery.data]);

  /**
   * Matrizes de Roadmap processadas no Backend
   */
  const roadmapQuery = useQuery({
    queryKey: ["roadmap", limit],
    queryFn: () => api.getRoadmap(limit),
    refetchInterval: 2000, // Sincronizado com as rodadas
    staleTime: 1000,
  });

  /**
   * Análise PREDITIVA de Inteligência
   */
  const analysisQuery = useQuery({
    queryKey: ["analise", limit],
    queryFn: () => api.getAnalise(2000), // Padrão fixo de análise
    refetchInterval: 30000, // Análise pesada roda menos vezes
    staleTime: 10000,
  });

  /**
   * Saúde do Motor de Captura (HEARTBEAT) - AGORA EM TEMPO REAL
   */
  const statusQuery = useQuery({
    queryKey: ["status"],
    queryFn: api.getStatus,
    refetchInterval: 1000, // 1 segundo para o placar ao vivo
  });

  const beadPlateQuery = useQuery({
    queryKey: ["beadPlate"],
    queryFn: () => api.getBeadPlate(16),
    refetchInterval: 2000,
  });

  return {
    rounds: dedupedRounds,
    beadPlateMatrix: beadPlateQuery.data,
    roadmap: roadmapQuery.data,
    analysis: analysisQuery.data,
    status: statusQuery.data,
    // UI só trava se as rodadas principais falharem no primeiro load
    isLoading: roundsQuery.isLoading && !roundsQuery.data,
    isError: roundsQuery.isError,
    isRefetching: roundsQuery.isFetching || roadmapQuery.isFetching
  };
}
