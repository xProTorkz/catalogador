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
        logger.info(f"Iniciando Browser Profissional. Perfil: {self.user_data_dir}")
        os.makedirs(self.user_data_dir, exist_ok=True)

        async with self.lock:
            try:
                self.playwright = await async_playwright().start()
                is_linux = sys.platform != 'win32'
                
                state_path = os.path.join(self.user_data_dir, "storage_state.json")
                # Se não existir o JSON, ele inicia limpo
                storage_state = state_path if os.path.exists(state_path) else None
                
                if storage_state:
                    logger.info("📦 Estado de login (storage_state.json) encontrado! Carregando sessão...")

                launch_args = [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage', # Essencial para VPS Linux
                    '--disable-gpu',           # Economiza CPU na VPS
                    '--disable-blink-features=AutomationControlled',
                    '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                ]

                # 1. Lança o browser de forma limpa (sem persistência de pasta que trava)
                self.browser = await self.playwright.chromium.launch(
                    headless=is_linux,
                    args=launch_args
                )

                # 2. Cria o contexto usando o storage_state (portabilidade Windows -> Linux)
                self.context = await self.browser.new_context(
                    viewport={'width': 1280, 'height': 720},
                    storage_state=storage_state
                )
                
                self.page = await self.context.new_page()
                
                # DIAGNÓSTICO DE 10 SEGUNDOS: Escuta global de WebSockets
                self.page.on("websocket", lambda ws: logger.info(f"📡 [WS DETECTADO NA PÁGINA] {ws.url[:120]}"))
                
                await self.page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined});")

                self.is_running = True
                self.last_activity_timestamp = asyncio.get_running_loop().time()

                asyncio.create_task(self._anti_pause_loop())
                asyncio.create_task(self._monitor_session_loop())

                await self.login()
                
                # 3. Salva/Atualiza o estado para a próxima vez
                await self.context.storage_state(path=state_path)
                logger.info("✅ Sessão sincronizada e salva com sucesso.")
                
            except Exception as e:
                logger.critical(f"Erro ao iniciar SessionManager: {e}")
                await self.stop()

    async def login(self):
        if not self.page: return
        
        try:
            # 1. Tenta ir direto para a mesa (Eficiência máxima com storage_state)
            logger.info(f"Tentando acesso direto à mesa: {config.EVO_URL}")
            await self.page.goto(config.EVO_URL, timeout=90000, wait_until="load")
            await asyncio.sleep(15) # Tempo extra para o Linux processar scripts pesados

            # 2. SCANNER DE FRAMES: Verifica se a Evolution carregou de verdade
            frames = self.page.frames
            frame_urls = [f.url.lower() for f in frames]
            has_evo = any("evolution" in url or "livecasino" in url or "casinofans" in url for url in frame_urls)
            
            if has_evo:
                logger.info(f"✅ SUCESSO: Mesa Evolution detectada em {len(frames)} frames!")
                self.update_activity()
                return
            else:
                logger.warning(f"⚠️ MESA NÃO DETECTADA. Frames atuais: {len(frames)}")
                for i, f in enumerate(frames): logger.info(f"  > Frame {i}: {f.url[:60]}")

            # 3. Se não detectou a mesa, tenta o fallback via Home
            home_url = "https://cassino.bet.br"
            logger.warning("🚨 Mesa não carregou direto. Tentando re-autenticar via Home...")
            await self.page.goto(home_url, timeout=90000, wait_until="load")
            await asyncio.sleep(10)

            # Procura e clica no botão que abre o login (se necessário)
            btn_abrir_login = self.page.locator('button:has-text("Entrar"), button:has-text("Login"), .login-btn, .btn-login, a:has-text("Entrar")').first
            if await btn_abrir_login.is_visible(timeout=5000):
                await btn_abrir_login.click()
                await asyncio.sleep(3)
            
            # Preenche credenciais
            logger.info("Preenchendo credenciais no fallback...")
            user_input = self.page.locator('input[type="text"], input[name="username"], input[placeholder*="Usuário"], input[placeholder*="CPF"]').first
            pass_input = self.page.locator('input[type="password"], input[name="password"]').first
            submit_btn = self.page.locator('button[type="submit"], .modal-content button:has-text("Entrar"), #login-btn').first

            if await user_input.is_visible(timeout=10000):
                await user_input.fill(config.EVO_LOGIN)
                await pass_input.fill(config.EVO_PASSWORD)
                await submit_btn.click()
                logger.info("Login enviado. Aguardando 10s e indo para a mesa...")
                await asyncio.sleep(10)
            
            await self.page.goto(config.EVO_URL, timeout=90000, wait_until="load")
            await asyncio.sleep(20)

            self.update_activity()
        except Exception as e:
            logger.error(f"Erro no fluxo de login: {e}")
            try:
                shot = await self.get_screenshot()
                if shot:
                    with open("logs/debug_login_error.jpg", "wb") as f: f.write(shot)
            except: pass

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
