import asyncio
import logging
import sys
import os
import random
from playwright.async_api import async_playwright, BrowserContext, Page
from backend import config

logger = logging.getLogger("SessionManager")

class SessionManager:
    _instance = None

    def __init__(self):
        self.playwright = None
        self.context: BrowserContext = None
        self.page: Page = None
        self.is_running = False
        self.last_activity_timestamp = 0 
        self.lock = asyncio.Lock()
        self.user_data_dir = os.path.abspath(os.path.join(os.getcwd(), "backend", "user_data"))

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = SessionManager()
        return cls._instance

    async def start(self):
        if self.is_running: return
        logger.info(f"Iniciando Browser. Perfil: {self.user_data_dir}")
        os.makedirs(self.user_data_dir, exist_ok=True)

        async with self.lock:
            try:
                self.playwright = await async_playwright().start()
                is_linux = sys.platform != 'win32'
                
                state_path = os.path.join(self.user_data_dir, "storage_state.json")
                storage_state = state_path if os.path.exists(state_path) else None
                
                if storage_state:
                    logger.info("📦 Estado de login encontrado! Carregando sessão universal...")

                launch_args = [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-blink-features=AutomationControlled',
                    '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                ]

                self.context = await self.playwright.chromium.launch_persistent_context(
                    user_data_dir=self.user_data_dir,
                    headless=is_linux,
                    args=launch_args,
                    viewport={'width': 1280, 'height': 720},
                    storage_state=storage_state
                )
                
                self.page = self.context.pages[0] if self.context.pages else await self.context.new_page()
                
                await self.page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined});")

                self.is_running = True
                self.last_activity_timestamp = asyncio.get_running_loop().time()

                asyncio.create_task(self._anti_pause_loop())
                asyncio.create_task(self._monitor_session_loop())

                await self.login()
                
                # Salva o estado após o login para garantir que temos os cookies novos
                await self.context.storage_state(path=state_path)
                logger.info("✅ Sessão sincronizada em storage_state.json")
                
            except Exception as e:
                logger.critical(f"Erro ao iniciar SessionManager: {e}")
                await self.stop()

    async def login(self):
        if not self.page: return
        logger.info(f"Navegando para: {config.EVO_URL}")
        try:
            await self.page.goto(config.EVO_URL, timeout=120000, wait_until="networkidle")
            await asyncio.sleep(10)
            
            # Tenta encontrar campos de login na página principal e em todos os IFrames
            found_login = False
            all_frames = self.page.frames
            logger.info(f"Verificando login em {len(all_frames)} frames...")

            for frame in all_frames:
                try:
                    user_field = frame.locator('input[type="text"], input[placeholder*="CPF"], input[placeholder*="Usuário"], input[name*="username"]').first
                    pass_field = frame.locator('input[type="password"]').first
                    btn = frame.locator('button:has-text("Entrar"), button:has-text("Login"), .login-button, button[type="submit"]').first

                    if await user_field.is_visible(timeout=3000):
                        logger.info(f"Campos de login encontrados no frame: {frame.name or 'principal'}. Autenticando...")
                        await user_field.fill(config.EVO_LOGIN)
                        await pass_field.fill(config.EVO_PASSWORD)
                        await btn.click()
                        found_login = True
                        logger.info("Login disparado. Aguardando 20s para carregamento do jogo...")
                        await asyncio.sleep(20)
                        break
                except:
                    continue

            if not found_login:
                logger.info("Nenhum campo de login detectado. Verificando se o jogo já está visível...")
                # Verifica se existe um canvas ou elemento de jogo para confirmar se já está logado
                game_element = self.page.locator('canvas, .game-view, .evolution-game-ui').first
                if await game_element.count() > 0:
                    logger.info("✅ Jogo detectado! Sessão ativa confirmada.")
                else:
                    logger.warning("⚠️ Atenção: Nem login nem jogo foram encontrados. Verifique o storage_state.json ou a URL.")

            logger.info(f"URL Final: {self.page.url}")
            self.update_activity()
        except Exception as e:
            logger.error(f"Erro no fluxo de login: {e}")

    async def get_screenshot(self):
        if self.page:
            try:
                return await self.page.screenshot(type='jpeg', quality=60)
            except: return None
        return None

    async def _anti_pause_loop(self):
        logger.info("Loop Anti-Pause iniciado.")
        while self.is_running:
            try:
                await asyncio.sleep(random.randint(30, 60))
                if self.page and not self.page.is_closed():
                    x, y = random.randint(200, 800), random.randint(200, 500)
                    await self.page.mouse.click(x, y)
                    # Screenshot de debug automático a cada ciclo para log
                    shot = await self.get_screenshot()
                    if shot:
                        with open("logs/debug_view.jpg", "wb") as f:
                            f.write(shot)
            except: pass

    async def _monitor_session_loop(self):
        while self.is_running:
            await asyncio.sleep(20)
            if not self.page: continue
            elapsed = asyncio.get_running_loop().time() - self.last_activity_timestamp
            if elapsed > 300: # 5 minutos sem dados
                logger.warning(f"Inatividade detectada ({int(elapsed)}s). Recarregando mesa...")
                try:
                    await self.page.reload()
                    self.update_activity()
                    await asyncio.sleep(10)
                except: pass

    def update_activity(self):
        self.last_activity_timestamp = asyncio.get_running_loop().time()

    async def stop(self):
        self.is_running = False
        try:
            if self.context: await self.context.close()
            if self.playwright: await self.playwright.stop()
        except: pass
