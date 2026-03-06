import os
import sys
import asyncio
import logging
from contextlib import asynccontextmanager

# Adiciona a raiz do projeto ao path para resolver imports na VPS
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# MANDATORY: This MUST be the first thing executed
if sys.platform == 'win32':
    try:
        from asyncio import WindowsProactorEventLoopPolicy
        asyncio.set_event_loop_policy(WindowsProactorEventLoopPolicy())
    except ImportError:
        pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend import config
from backend import database
from backend.rotas import api
from backend.integrations.session_manager import SessionManager
from backend.integrations.game_runner import GameRunner

# Configure Logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("==========================================")
    logger.info("   CATALOGADOR BAC BO PRO - V2 ONLINE     ")
    logger.info("==========================================")
    
    if sys.platform != 'win32':
        logger.info("SaaS Linux: Baixando binário do Chromium...")
        # Baixa o navegador sem tentar instalar bibliotecas do sistema (proibido na Square)
        os.system("python3 -m playwright install chromium")

    database.init_db()
    
    # Verifica credenciais
    if not config.EVO_LOGIN or not config.EVO_PASSWORD:
        logger.critical("ERRO: Credenciais (.env) NÃO DETECTADAS!")
    else:
        logger.info(f"Credenciais OK para: {config.EVO_LOGIN[:4]}****")

    session = SessionManager.get_instance()
    asyncio.create_task(session.start())
    asyncio.create_task(GameRunner.get_instance().start())
    
    yield
    await session.stop()

app = FastAPI(lifespan=lifespan)

@app.middleware("http")
async def log_requests(request, call_next):
    if not request.url.path.startswith("/api"):
        return await call_next(request)
    logger.info(f"REQ: {request.method} {request.url.path}")
    response = await call_next(request)
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api.router, prefix="/api")

# Servir Frontend
frontend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
    logger.info(f"Frontend montado em: {frontend_path}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=config.HOST, port=config.PORT, reload=False, loop="asyncio")
