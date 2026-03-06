import asyncio
import logging
import json
import re
from playwright.async_api import Page, WebSocket
from backend.integrations.session_manager import SessionManager
from backend.catalogador import catalogador
from backend.core.state import LiveState

logger = logging.getLogger("GameRunner")

class GameRunner:
    _instance = None

    def __init__(self):
        self.is_running = False
        self.active_game = "bacbo"
        self.ws_found = False

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = GameRunner()
        return cls._instance

    async def start(self):
        if self.is_running: return
        self.is_running = True
        logger.info(f"Farejador ativado para: {self.active_game}")
        session = SessionManager.get_instance()
        while not session.page:
            await asyncio.sleep(1)
        await self._setup_listeners(session.page)

    async def _setup_listeners(self, page: Page):
        logger.info("Monitorando conexões da Evolution...")
        page.on("websocket", self._on_websocket)

    def _on_websocket(self, ws: WebSocket):
        logger.info(f"📡 [WS DETECTADO] {ws.url[:120]}")
        
        # Monitora TODOS os frames de todos os sockets para não perder nada
        ws.on("framereceived", lambda frame: self._handle_frame(frame, ws.url))
        
        if "/bacbo/" in ws.url or "bacbo" in ws.url or "egcvi.com" in ws.url or "casinofans" in ws.url:
            self.ws_found = True
            logger.info(f"🎯 [ALVO POSSÍVEL] {ws.url[:80]}...")

    def _handle_frame(self, frame_text, url_source):
        try:
            if isinstance(frame_text, bytes): return
            
            # Se o frame contém palavras-chave da Evolution, processamos
            # Isso é o "Farejador por Conteúdo" (mais robusto que por URL)
            is_evo_data = "roundId" in frame_text or "winner" in frame_text or "playerScore" in frame_text or "bankerScore" in frame_text
            
            if not is_evo_data:
                return

            SessionManager.get_instance().update_activity()
            if len(frame_text) < 30 or "PONG" in frame_text: return

            # Extração do JSON limpo
            clean_json = frame_text
            match = re.search(r'([\[\{].*)', frame_text)
            if match:
                clean_json = match.group(1)
            else: return

            data = json.loads(clean_json)
            
            # Log de debug para sabermos que estamos recebendo dados reais
            if "bettingstats" not in frame_text.lower():
                 logger.info(f"📥 [FRAME RECEBIDO] Conteúdo detectado de: {url_source[:50]}")

            self._process_live(data)

            def find_candidate(obj):
                if isinstance(obj, dict):
                    ev_type = str(obj.get("type", "")).lower()
                    if "bettingstats" in ev_type or "balance" in ev_type: return None
                    s_keys = str(list(obj.keys())).lower()
                    if ("id" in s_keys or "roundid" in s_keys) and ("winner" in s_keys or "result" in s_keys or "win" in s_keys):
                        return obj
                    for v in obj.values():
                        if isinstance(v, (dict, list)):
                            found = find_candidate(v)
                            if found: return found
                elif isinstance(obj, list):
                    for item in obj:
                        found = find_candidate(item)
                        if found: return found
                return None

            candidate = find_candidate(data)
            if candidate:
                self._process_final(candidate)
            elif isinstance(data, dict) and len(data) > 3:
                ev_type = data.get("eventType") or data.get("type") or "unknown"
                logger.debug(f" [SNIFFER-{source}] [{ev_type}] Mensagem complexa IGNORADA.")
        except Exception as e:
            logger.error(f"Erro ao processar frame: {e}")

    def _process_live(self, data):
        try:
            target = data
            if isinstance(data, list) and len(data) > 1: target = data[1]
            if not isinstance(target, dict): return
            
            ev_type = str(target.get("type", "")).lower()
            live = LiveState.get_instance()
            current_state = live.get_all()
            
            # Extract args safely
            args = target.get("args", [{}])
            if isinstance(args, list) and len(args) > 0:
                args = args[0]
            elif isinstance(args, dict):
                pass
            else:
                args = {}

            if "playerstate" in ev_type:
                stage = args.get("stage", "Wait")
                dice = args.get("dice", {})
                
                # Handle dice being a list or dict
                p1, p2, b1, b2 = 0, 0, 0, 0
                if isinstance(dice, dict):
                    p1 = dice.get("p1", 0)
                    p2 = dice.get("p2", 0)
                    b1 = dice.get("b1", 0)
                    b2 = dice.get("b2", 0)
                elif isinstance(dice, list) and len(dice) >= 4:
                     # Assuming order [p1, p2, b1, b2] or similar, usually Evo uses objects for BacBo
                     pass 

                live.update_general(
                    stage="SACUDINDO..." if stage == "Shaking" else f"STATUS: {stage.upper()}",
                    is_shaking=stage == "Shaking",
                    round_id=str(args.get("id", "---")),
                    player={
                        "score": args.get("playerScore", 0), 
                        "dice": [p1, p2], 
                        "bets": current_state["player"].get("bets", 0)
                    },
                    banker={
                        "score": args.get("bankerScore", 0), 
                        "dice": [b1, b2], 
                        "bets": current_state["banker"].get("bets", 0)
                    }
                )
            elif "bettingstats" in ev_type:
                p_bets = args.get("playerTotal", 0)
                b_bets = args.get("bankerTotal", 0)
                t_bets = args.get("tieTotal", 0)
                
                # Calculate totals
                total_bets = args.get("totalBets", p_bets + b_bets + t_bets)
                total_players = args.get("totalUsers", args.get("totalPlayers", 0))
                
                live.update_general(
                    player={**current_state["player"], "bets": p_bets},
                    banker={**current_state["banker"], "bets": b_bets},
                    tie={"bets": t_bets},
                    total_bets=total_bets,
                    total_players=total_players
                )
        except Exception as e:
            logger.debug(f"Erro no processamento live: {e}")

    def _process_final(self, data):
        try:
            target = data
            if isinstance(data, list):
                for item in data:
                    if isinstance(item, dict):
                        target = item
                        break
            if isinstance(target.get("args"), list) and len(target["args"]) > 0:
                target = target["args"][0]
            if target.get("type") == "initial_state" or target.get("type") == "table_state":
                history = target.get("history")
                if isinstance(history, list):
                    for round_data in history: self._process_final(round_data)
                    return
            rid = target.get("roundId") or target.get("id") or target.get("rId") or target.get("gameId")
            winner = target.get("winner") or target.get("result") or target.get("win")
            if isinstance(winner, dict): 
                winner = winner.get("winner") or winner.get("result")
            if rid is not None and winner is not None:
                # Extração de Dados (Dice)
                dice_list = target.get("dice", [])
                p_d1, p_d2, b_d1, b_d2 = 0, 0, 0, 0
                if isinstance(dice_list, list) and len(dice_list) >= 4:
                    p_d1, p_d2, b_d1, b_d2 = dice_list[0].get("value", 0), dice_list[1].get("value", 0), dice_list[2].get("value", 0), dice_list[3].get("value", 0)
                parsed = {
                    "round_id": str(rid),
                    "resultado": str(winner).lower(),
                    "p_score": target.get("playerScore") or target.get("pScore", 0),
                    "b_score": target.get("bankerScore") or target.get("bScore", 0),
                    "p_card1": p_d1, "p_card2": p_d2, "b_card1": b_d1, "b_card2": b_d2,
                    "source": "bacbo_br", "raw_data": data
                }
                logger.info(f" [OK] Rodada {rid} identificada: {winner}")
                asyncio.create_task(catalogador.process_game_data(parsed))
        except Exception as e:
            logger.error(f"Erro no processamento final: {e}")
