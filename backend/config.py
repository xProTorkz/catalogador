import os
from dotenv import load_dotenv

# Caminho absoluto para a raiz do projeto (onde está o .env)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ENV_PATH = os.path.join(BASE_DIR, ".env")

if os.path.exists(ENV_PATH):
    load_dotenv(ENV_PATH)
else:
    load_dotenv() # Fallback para variáveis do sistema/Square Cloud

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
DATABASE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "database.db"))
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))

EVO_URL = os.getenv("EVO_URL")
EVO_LOGIN = os.getenv("EVO_LOGIN")
EVO_PASSWORD = os.getenv("EVO_PASSWORD")
EVO_SESSION_ID = os.getenv("EVO_SESSION_ID")

if not EVO_URL or not EVO_LOGIN or not EVO_PASSWORD:
    raise ValueError("EVO_URL, EVO_LOGIN, and EVO_PASSWORD must be set in .env")
