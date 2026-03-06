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
    with database.get_db() as conn:
        count = conn.execute("SELECT COUNT(*) FROM rounds").fetchone()[0]
    live = LiveState.get_instance().get_all()
    return {
        "status": "ok",
        "motor": {"total_saved": count, "live": live}
    }

@router.get("/rodadas")
async def get_rodadas(limit: int = Query(120)):
    res = database.get_synchronized_history(limit)
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
    return res

@router.get("/roadmap")
async def get_roadmap(limit: int = Query(120)):
    sync_data = await get_rodadas(limit)
    return {"beadPlate": sync_data}

@router.get("/analise")
async def get_analise(limit: int = Query(2000)):
    stats = intelligence.calculate_stats(None)
    return stats or {}

@router.get("/beadplate")
async def get_beadplate(limit_cols: int = 16):
    try:
        rounds = database.get_synchronized_history(limit_cols * 6)
        grid = [ [None for _ in range(6)] for _ in range(limit_cols) ]
        if rounds:
            max_col = max((r.get('grid_col') or 0) for r in rounds)
            start_col = max(0, max_col - (limit_cols - 1))
            for r in rounds:
                col = r.get('grid_col') or 0
                row = r.get('grid_row') or 0
                if start_col <= col < start_col + limit_cols:
                    grid[col - start_col][row] = {
                        "res": str(r['resultado'])[0].upper(),
                        "color": "player" if r['resultado'] == 'player' else "banker" if r['resultado'] == 'banker' else "tie"
                    }
        return grid
    except: return []

@router.get("/settings")
async def get_settings():
    from backend.core.settings_manager import SettingsManager
    return SettingsManager.get_instance().get_all()

@router.post("/settings")
async def update_settings(settings: dict):
    from backend.core.settings_manager import SettingsManager
    return SettingsManager.get_instance().update(settings)
