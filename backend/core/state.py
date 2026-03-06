import time

class LiveState:
    _instance = None
    
    def __init__(self):
        self.data = {
            "stage": "Aguardando...",
            "player": {"score": 0, "dice": [0, 0], "bets": 0},
            "banker": {"score": 0, "dice": [0, 0], "bets": 0},
            "tie": {"bets": 0},
            "total_players": 0,
            "total_bets": 0,
            "is_shaking": False,
            "round_id": "---",
            "last_update": 0
        }

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = LiveState()
        return cls._instance

    def update_player(self, score=None, dice=None, bets=None):
        if score is not None: self.data["player"]["score"] = score
        if dice is not None: self.data["player"]["dice"] = dice
        if bets is not None: self.data["player"]["bets"] = bets
        self.data["last_update"] = time.time()

    def update_banker(self, score=None, dice=None, bets=None):
        if score is not None: self.data["banker"]["score"] = score
        if dice is not None: self.data["banker"]["dice"] = dice
        if bets is not None: self.data["banker"]["bets"] = bets
        self.data["last_update"] = time.time()

    def update_general(self, **kwargs):
        for key, value in kwargs.items():
            if key in self.data:
                self.data[key] = value
        self.data["last_update"] = time.time()

    def get_all(self):
        return self.data
