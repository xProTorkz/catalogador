from fastapi import APIRouter, Query
from backend import database
from backend.catalogador import intelligence
import logging
import json

from backend.core.state import LiveState

router = APIRouter()
logger = logging.getLogger("API")

@router.get("/status")
async def get_status():
    # Buscamos a contagem real de rodadas no banco
    with database.get_db() as conn:
        count = conn.execute("SELECT COUNT(*) FROM rounds").fetchone()[0]
    
    live = LiveState.get_instance().get_all()
    return {
        "status": "ok",
        "sistema": "Catalogador Bac Bo V2",
        "motor": {
            "total_saved": count,
            "seconds_since_last_round": 0,
            "engine_status": "running",
            "live": live
        }
    }

@router.get("/rodadas")
async def get_rodadas(limit: int = Query(120)):
    # Agora usamos a função de sincronização profissional
    res = database.get_synchronized_history(limit)
    
    with database.get_db() as conn:
        total_in_db = conn.execute("SELECT COUNT(*) FROM rounds").fetchone()[0]
    
    logger.info(f"API: Enviando {len(res) if res else 0} rodadas. Total no Banco: {total_in_db}")
    
    if res:
        for r in res:
            r['result'] = str(r['resultado']).upper()
            r['round_id'] = str(r['round_id'])
            r['player_score'] = r.get('p_score', 0)
            r['banker_score'] = r.get('b_score', 0)
            r['player_d1'] = r.get('p_card1', 0)
            r['player_d2'] = r.get('p_card2', 0)
            r['banker_d1'] = r.get('b_card1', 0)
            r['banker_d2'] = r.get('b_card2', 0)
            r['timestamp'] = str(r.get('timestamp_captura') or "")
            
            try:
                raw = json.loads(r.get('raw_data', '{}'))
                r['player_bets'] = raw.get('playerTotal', 0)
                r['banker_bets'] = raw.get('bankerTotal', 0)
                r['tie_bets'] = raw.get('tieTotal', 0)
            except:
                r['player_bets'] = 0
                r['banker_bets'] = 0
                r['tie_bets'] = 0
    return res

@router.get("/roadmap")
async def get_roadmap(limit: int = Query(120)):
    # O Bead Plate agora é uma cópia sincronizada das rodadas
    sync_data = await get_rodadas(limit)
    return {
        "beadPlate": sync_data,
        "bigRoadMatrix": [],
        "bigEyeBoy": [],
        "smallRoad": [],
        "cockroachPig": []
    }

@router.get("/analise")
async def get_analise(limit: int = Query(2000)):
    stats = intelligence.calculate_stats(None)
    if not stats:
        stats = {
            "grid": [], 
            "tie_neighbors": [], 
            "total_rounds": 0,
            "statistics": {"pPct": 0, "bPct": 0, "tPct": 0}
        }
    return stats

from backend.core.settings_manager import SettingsManager
from pydantic import BaseModel

class SettingsUpdate(BaseModel):
    theme: str | None = None
    sound_enabled: bool | None = None
    notifications_enabled: bool | None = None
    bet_threshold: int | None = None
    strategy_mode: str | None = None

@router.get("/settings")
async def get_settings():
    return SettingsManager.get_instance().get_all()

@router.post("/settings")
async def update_settings(settings: dict): # Aceita dict genérico para flexibilidade
    return SettingsManager.get_instance().update(settings)

from backend.logger import api_logger, error_logger

@router.get("/beadplate")
async def get_beadplate(limit_cols: int = 16):
    """Retorna a matriz 2D pronta para o frontend renderizar sem lógica local."""
    try:
        rounds = database.get_synchronized_history(limit_cols * 6)
        
        # Criamos a matriz vazia [coluna][linha]
        grid = [ [None for _ in range(6)] for _ in range(limit_cols) ]
        
        if rounds:
            # Blindagem contra None: (r.get('grid_col') or 0) garante que sempre haverá um número
            max_col = max((r.get('grid_col') or 0) for r in rounds)
            start_col = max(0, max_col - (limit_cols - 1))
            
            api_logger.info(f"API: Gerando grade a partir da coluna {start_col} até {max_col}")
            
            for r in rounds:
                col = r.get('grid_col') or 0
                row = r.get('grid_row') or 0
                
                if start_col <= col < start_col + limit_cols:
                    grid[col - start_col][row] = {
                        "res": str(r['resultado'])[0].upper(),
                        "color": "player" if r['resultado'] == 'player' else "banker" if r['resultado'] == 'banker' else "tie"
                    }
        
        api_logger.info(f"API: [GET] /beadplate enviado com sucesso. Tamanho: {limit_cols} colunas.")
        return grid
    except Exception as e:
        error_logger.error(f"API: Erro ao gerar beadplate: {str(e)}", exc_info=True)
        return []

from fastapi import APIRouter, Query, Response

@router.get("/debug/screenshot")
async def debug_screenshot():
    """Retorna uma imagem do que o robô está vendo agora na VPS."""
    session = SessionManager.get_instance()
    img = await session.get_screenshot()
    if img:
        return Response(content=img, media_type="image/jpeg")
    return {"error": "Não foi possível capturar a tela."}

@router.post("/set_ws")
async def set_ws(data: dict):
    url = data.get("url")
    if url:
        return {"success": True, "message": "Conectado."}
    return {"success": False, "message": "Erro."}
