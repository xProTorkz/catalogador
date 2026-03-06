import asyncio
import logging
import json
import re
import time
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
        self.processed_rounds = set() 
        self._last_stage = ""
        self._last_dice = {"p1": 0, "p2": 0, "b1": 0, "b2": 0}
        self._last_dealer = ""

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

    async def _setup_listeners(self, page):
        page.on("websocket", self._on_websocket)

    def _on_websocket(self, ws: WebSocket):
        url_lower = ws.url.lower()
        targets = ["bacbo", "player/game", "evo-games", "evolution"]
        if any(t in url_lower for t in targets):
            self.ws_found = True
            ws.on("framereceived", lambda frame: self._handle_frame(frame, ws.url))

    def _handle_frame(self, frame_text, url_source):
        try:
            if isinstance(frame_text, bytes):
                try: frame_text = frame_text.decode("utf-8")
                except: return
            if len(frame_text) < 20 or "PONG" in frame_text: return

            SessionManager.get_instance().update_activity()
            match = re.search(r'([\[\{].*)', frame_text)
            if not match: return
            data = json.loads(match.group(1))

            msg_type = data.get("type", "")
            args = data.get("args", {})
            if isinstance(args, list) and len(args) > 0: args = args[0]

            # 1. Troca de Dealer
            if "dealer.changed" in msg_type:
                dealer = args.get("dealer", {}).get("screenName", "Desconhecido")
                if dealer != self._last_dealer:
                    logger.info(f"👤 [DEALER] Novo dealer na mesa: {dealer}")
                    self._last_dealer = dealer

            # 2. Processamento Live (Tempo Real)
            self._process_live(data)

            # 3. Resultado Final
            if "bacbo.playerState" in msg_type or "bacbo.roundStatus" in msg_type:
                if args.get("stage") == "Result" or "winner" in args:
                    self._process_final(args)
                    return

            if "bacbo.road" in msg_type:
                history = args.get("history", [])
                for entry in history: self._process_final(entry)
                return

        except Exception as e:
            pass # Silencia erros de parsing irrelevantes

    def _process_live(self, data):
        try:
            target = data
            if isinstance(data, list) and len(data) > 1: target = data[1]
            if not isinstance(target, dict): return
            
            ev_type = str(target.get("type", "")).lower()
            args = target.get("args", {})
            if isinstance(args, list) and len(args) > 0: args = args[0]

            if "playerstate" in ev_type:
                stage = args.get("stage", "Wait")
                dice = args.get("dice", {})
                p1, p2, b1, b2 = dice.get("p1", 0), dice.get("p2", 0), dice.get("b1", 0), dice.get("b2", 0)
                
                # MUDANÇA DE FASE
                if stage != self._last_stage:
                    if stage == "Shaking":
                        logger.info("🔥 [MESA] Dados sendo chacoalhados...")
                    elif stage == "Wait":
                        logger.info("⏳ [MESA] Aguardando próxima rodada...")
                    elif stage == "Result":
                        logger.info("✨ [MESA] Processando resultado...")
                    self._last_stage = stage

                # REVELAÇÃO DE DADOS E SCORE PARCIAL
                current_dice = {"p1": p1, "p2": p2, "b1": b1, "b2": b2}
                if current_dice != self._last_dice:
                    revealed = []
                    if p1 > 0 and self._last_dice["p1"] == 0: revealed.append(f"P1:{p1}")
                    if p2 > 0 and self._last_dice["p2"] == 0: revealed.append(f"P2:{p2}")
                    if b1 > 0 and self._last_dice["b1"] == 0: revealed.append(f"B1:{b1}")
                    if b2 > 0 and self._last_dice["b2"] == 0: revealed.append(f"B2:{b2}")
                    
                    if revealed:
                        p_score = args.get("playerScore", 0)
                        b_score = args.get("bankerScore", 0)
                        logger.info(f"🎲 [DICE] {' | '.join(revealed)} ➔ Placar: P {p_score} x {b_score} B")
                    
                    self._last_dice = current_dice

                # Atualiza State para o Front
                live = LiveState.get_instance()
                live.update_general(
                    stage=stage,
                    round_id=str(args.get("id", args.get("gameId", "---"))),
                    player={"score": args.get("playerScore", 0), "dice": [p1, p2], "bets": 0},
                    banker={"score": args.get("bankerScore", 0), "dice": [b1, b2], "bets": 0}
                )
        except: pass

    def _process_final(self, target):
        try:
            rid = target.get("roundId") or target.get("gameId") or target.get("id")
            winner = target.get("winner") or target.get("result")
            
            if winner and rid:
                rid_str = str(rid)
                if rid_str in self.processed_rounds: return
                self.processed_rounds.add(rid_str)
                if len(self.processed_rounds) > 200: 
                    self.processed_rounds.remove(next(iter(self.processed_rounds)))

                dice_obj = target.get("dice", {})
                if isinstance(dice_obj, dict):
                    p1, p2, b1, b2 = dice_obj.get("p1", 0), dice_obj.get("p2", 0), dice_obj.get("b1", 0), dice_obj.get("b2", 0)
                elif isinstance(dice_obj, list) and len(dice_obj) >= 4:
                    p1, p2, b1, b2 = dice_obj[0].get("value", 0), dice_obj[1].get("value", 0), dice_obj[2].get("value", 0), dice_obj[3].get("value", 0)
                else:
                    p1, p2 = target.get("p1", 0), target.get("p2", 0)
                    b1, b2 = target.get("b1", 0), target.get("b2", 0)

                p_score = target.get("playerScore", 0)
                b_score = target.get("bankerScore", 0)
                
                win_icon = "🔵 PLAYER" if winner.lower() == 'player' else "🔴 BANKER" if winner.lower() == 'banker' else "🟡 TIE"
                logger.info(f"🏆 [RESULTADO] {win_icon} venceu ({p_score} x {b_score})")
                
                parsed = {
                    "round_id": rid_str, "resultado": str(winner).lower(),
                    "p_score": p_score, "b_score": b_score,
                    "p_card1": p1, "p_card2": p2, "b_card1": b1, "b_card2": b2,
                    "source": "bacbo_evo"
                }
                
                self._last_dice = {"p1": 0, "p2": 0, "b1": 0, "b2": 0}
                asyncio.create_task(catalogador.process_game_data(parsed))
        except Exception as e:
            pass
