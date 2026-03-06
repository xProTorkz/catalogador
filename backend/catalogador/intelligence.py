import logging
from backend import database

logger = logging.getLogger("Intelligence")

def reconstruct_grid(history_asc):
    """
    REGRA DA GRADE (MANDATÓRIO):
    - 6 linhas por coluna
    - Preenchimento vertical
    - Ao atingir 6 linhas -> iniciar nova coluna
    """
    grid = []
    current_column = []
    
    for round_data in history_asc:
        result = round_data.get('resultado')
        current_column.append(result)
        
        if len(current_column) == 6:
            grid.append(current_column)
            current_column = []
            
    # Append incomplete last column
    if current_column:
        grid.append(current_column)
        
    return grid

def calculate_stats(latest_round_data):
    """
    Calculates stats and special events (Tie vizinha).
    Mandatório reconstruir da base para garantir integridade.
    """
    # Atualizado para usar o novo contrato profissional de sincronização
    history_asc = database.get_synchronized_history(limit=2000)
    if not history_asc:
        return {
            "grid": [],
            "tie_neighbors": [],
            "total_rounds": 0,
            "statistics": {
                "pPct": 0, "bPct": 0, "tPct": 0,
                "p50Pct": 0, "b50Pct": 0,
                "patterns": {"PP": 0, "BB": 0},
                "pre_tie_combos": []
            }
        }
    
    # Grid derivation
    grid = reconstruct_grid(history_asc)
    
    # basic stats
    total = len(history_asc)
    p_count = sum(1 for r in history_asc if r.get('resultado') == 'player')
    b_count = sum(1 for r in history_asc if r.get('resultado') == 'banker')
    t_count = sum(1 for r in history_asc if r.get('resultado') == 'tie')
    
    # last 50 rounds bias
    last_50 = history_asc[-50:]
    total_50 = len(last_50) or 1
    p50 = sum(1 for r in last_50 if r.get('resultado') == 'player')
    b50 = sum(1 for r in last_50 if r.get('resultado') == 'banker')
    
    # Patterns (PP, BB)
    pp_count = 0
    bb_count = 0
    for i in range(1, len(history_asc)):
        if history_asc[i-1].get('resultado') == 'player' and history_asc[i].get('resultado') == 'player':
            pp_count += 1
        if history_asc[i-1].get('resultado') == 'banker' and history_asc[i].get('resultado') == 'banker':
            bb_count += 1
            
    # Tie Neighbors & Combos
    tie_neighbors = []
    pre_tie_map = {}
    for i, round_data in enumerate(history_asc):
        if round_data.get('resultado') == 'tie':
            # T-1 (Anterior)
            if i > 0:
                prev_round = history_asc[i-1]
                prev = prev_round.get('resultado')
                # Track pre-tie scores
                score_combo = f"{prev_round.get('p_score', 0)}-{prev_round.get('b_score', 0)}"
                pre_tie_map[score_combo] = pre_tie_map.get(score_combo, 0) + 1
            else:
                prev = None
                
            # T-6 (Vizinha de cima)
            neighbor = history_asc[i-6].get('resultado') if i >= 6 else None
            
            tie_neighbors.append({
                "round_id": round_data.get('round_id'),
                "prev": prev,
                "neighbor": neighbor
            })
            
    # Format pre_tie_combos for front
    pre_tie_combos = [{"numero": k, "frequencia": v} for k, v in pre_tie_map.items()]
    pre_tie_combos.sort(key=lambda x: x['frequencia'], reverse=True)
    
    return {
        "grid": grid,
        "tie_neighbors": tie_neighbors[-10:], # Last 10 tie events
        "total_rounds": total,
        "statistics": {
            "pPct": round((p_count/total)*100, 1) if total > 0 else 0,
            "bPct": round((b_count/total)*100, 1) if total > 0 else 0,
            "tPct": round((t_count/total)*100, 1) if total > 0 else 0,
            "p50Pct": round((p50/total_50)*100, 1),
            "b50Pct": round((b50/total_50)*100, 1),
            "patterns": {"PP": pp_count, "BB": bb_count},
            "pre_tie_combos": pre_tie_combos
        }
    }
