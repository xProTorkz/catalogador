import json
import os
import logging
from typing import Any, Dict

SETTINGS_FILE = "backend/settings.json"
DEFAULT_SETTINGS = {
    "theme": "dark",
    "sound_enabled": True,
    "notifications_enabled": True,
    "bet_threshold": 1000,
    "strategy_mode": "balanced",
    "influence": {
        "bigRoad": 80,
        "repetition": 60,
        "alternation": 40,
        "frequency": 70,
        "derived": 50,
        "dragonTail": 90,
        "ties": 30,
        "instability": 20
    },
    "validators": {
        "antiDragon": True,
        "tieFilter": True,
        "regression": False,
        "derivedValidation": True,
        "ignoreTies": False
    }
}

logger = logging.getLogger("SettingsManager")

class SettingsManager:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = SettingsManager()
        return cls._instance

    def __init__(self):
        self.settings = self._load_settings()

    def _load_settings(self) -> Dict[str, Any]:
        if not os.path.exists(SETTINGS_FILE):
            logger.info("Arquivo de configurações não encontrado. Criando padrão.")
            self._save_settings(DEFAULT_SETTINGS)
            return DEFAULT_SETTINGS.copy()
        
        try:
            with open(SETTINGS_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Erro ao carregar configurações: {e}")
            return DEFAULT_SETTINGS.copy()

    def _save_settings(self, settings: Dict[str, Any]):
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
            with open(SETTINGS_FILE, 'w') as f:
                json.dump(settings, f, indent=4)
        except Exception as e:
            logger.error(f"Erro ao salvar configurações: {e}")

    def get_all(self) -> Dict[str, Any]:
        return self.settings

    def update(self, new_settings: Dict[str, Any]) -> Dict[str, Any]:
        self.settings.update(new_settings)
        self._save_settings(self.settings)
        return self.settings
