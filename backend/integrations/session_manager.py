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
                    viewport={'width': 1280, 'height': 720}
                )
                
                # Se houver um estado universal salvo (JSON), injeta os cookies manualmente
                if storage_state:
                    try:
                        import json
                        with open(state_path, 'r') as f:
                            state_data = json.load(f)
                            await self.context.add_cookies(state_data.get('cookies', []))
                        logger.info("🍪 Cookies injetados com sucesso via storage_state.json!")
                    except Exception as e:
                        logger.error(f"Erro ao injetar cookies: {e}")

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
            # Mudança: 'load' em vez de 'networkidle' para evitar travar em sites pesados
            await self.page.goto(config.EVO_URL, timeout=120000, wait_until="load")
            await asyncio.sleep(15) # Tempo extra para o JavaScript do cassino rodar
            
            all_frames = self.page.frames
            logger.info(f"Analisando estrutura de frames ({len(all_frames)} encontrados):")
            for i, f in enumerate(all_frames):
                logger.info(f"  Frame {i}: {f.url[:80]}...")

            # Tenta encontrar campos de login ou botões de "Jogar"
            found_action = False
            for frame in all_frames:
                try:
                    # 1. Busca campos de login
                    user_field = frame.locator('input[type="text"], input[placeholder*="CPF"], input[placeholder*="Usuário"], input[name*="username"]').first
                    if await user_field.is_visible(timeout=2000):
                        logger.info(f"🚨 Tela de Login detectada em: {frame.url[:50]}")
                        await user_field.fill(config.EVO_LOGIN)
                        await frame.locator('input[type="password"]').first.fill(config.EVO_PASSWORD)
                        await frame.locator('button:has-text("Entrar"), button:has-text("Login"), .login-button').first.click()
                        found_action = True
                        await asyncio.sleep(20)
                        break
                    
                    # 2. Busca botão de "Jogar" ou "Play" (comum após o login ou em iframes)
                    play_btn = frame.locator('button:has-text("Jogar"), button:has-text("Play"), .play-button, .launch-game').first
                    if await play_btn.is_visible(timeout=2000):
                        logger.info("▶️ Botão 'Jogar' encontrado! Clicando...")
                        await play_btn.click()
                        found_action = True
                        await asyncio.sleep(15)
                        break
                except:
                    continue

            # Verificação final de sucesso
            game_element = self.page.locator('canvas, .game-view, .evolution-game-ui, iframe[src*="evolution"]').first
            if await game_element.count() > 0 or "bac-bo" in self.page.url.lower():
                logger.info("✅ SUCESSO: Jogo identificado na tela!")
            else:
                logger.warning("⚠️ O jogo ainda não apareceu. Verifique o print em logs/debug_view.jpg")

            self.update_activity()
        except Exception as e:
            logger.error(f"Erro crítico no login: {e}")

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
