import os
import sys
import shutil
import logging

# 1. FAXINA ATÔMICA (Janitor) - Executa antes de tudo
def nuke_legacy():
    # Caminho da raiz da aplicação na VPS
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    
    # Itens PERMITIDOS (O que for diferente disso será apagado)
    allowed = ['backend', 'frontend', 'logs', '.env', 'squarecloud.app', 'squarecloud.ignore', 'requirements.txt', '.git']
    
    print("--- [SQUARECLOUD] INICIANDO FAXINA DE ARQUIVOS LEGADOS ---")
    try:
        for item in os.listdir(root):
            item_path = os.path.join(root, item)
            if item not in allowed:
                if os.path.isdir(item_path):
                    shutil.rmtree(item_path)
                else:
                    os.remove(item_path)
                print(f"RESRESET: Removido lixo antigo -> {item}")
        
        # Limpeza interna da pasta backend (remover antiga pasta 'app' se existir lá dentro)
        backend_app = os.path.join(root, "backend", "app")
        if os.path.exists(backend_app):
            shutil.rmtree(backend_app)
            print("RESET: Removida subpasta legada backend/app")
            
    except Exception as e:
        print(f"RESET: Erro durante a limpeza: {e}")
    print("--- [SQUARECLOUD] FAXINA CONCLUÍDA. INICIANDO SISTEMA NOVO ---")

# Executa a limpeza apenas no Linux (SaaS)
if sys.platform != 'win32':
    nuke_legacy()

# 2. INÍCIO DO SISTEMA NOVO
import asyncio

# MANDATORY: This MUST be the first thing executed
if sys.platform == 'win32':
    try:
        from asyncio import WindowsProactorEventLoopPolicy
        asyncio.set_event_loop_policy(WindowsProactorEventLoopPolicy())
    except ImportError:
        pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend import config
from backend import database
from backend.rotas import api
from backend.integrations.session_manager import SessionManager
from backend.integrations.game_runner import GameRunner
from fastapi.staticfiles import StaticFiles

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
        logger.info("SaaS Linux: Garantindo dependências do Playwright...")
        os.system("playwright install chromium")
        os.system("playwright install-deps")

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
