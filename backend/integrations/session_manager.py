import asyncio
import logging
import sys
import os
import random
from playwright.async_api import async_playwright, BrowserContext, Page
from backend import config
from backend.catalogador import settings

logger = logging.getLogger("SessionManager")

class SessionManager:
    _instance = None

    def __init__(self):
        self.playwright = None
        self.context: BrowserContext = None
        self.page: Page = None
        self.is_running = False
        self.restarting = False
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
        logger.info(f"Carregando perfil: {self.user_data_dir}")
        os.makedirs(self.user_data_dir, exist_ok=True)

        async with self.lock:
            try:
                self.playwright = await async_playwright().start()
                
                # Configurações para SaaS (Linux) vs Local (Windows)
                is_linux = sys.platform != 'win32'
                launch_args = [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-infobars',
                    '--window-position=0,0',
                    '--ignore-certifcate-errors',
                    '--ignore-certifcate-errors-spki-list',
                    '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                ]

                self.context = await self.playwright.chromium.launch_persistent_context(
                    user_data_dir=self.user_data_dir,
                    headless=is_linux, # SaaS exige True, Local usamos False
                    ignore_default_args=["--enable-automation"],
                    args=launch_args,
                    viewport={'width': 1280, 'height': 720} if is_linux else None
                )
                
                self.page = self.context.pages[0] if self.context.pages else await self.context.new_page()
                
                # Script para esconder o Playwright do Anti-Bot
                await self.page.add_init_script("""
                    Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
                """)

                self.is_running = True
                self.last_activity_timestamp = asyncio.get_running_loop().time()

                # Loops de manutenção
                asyncio.create_task(self._anti_pause_loop())
                asyncio.create_task(self._monitor_session_loop())

                await self.login()
            except Exception as e:
                logger.critical(f"Erro ao iniciar SessionManager: {e}")
                await self.stop()

    async def stop(self):
        self.is_running = False
        try:
            await asyncio.sleep(1)
            if self.context: await self.context.close()
            if self.playwright: await self.playwright.stop()
        except: pass
        self.page = None
        self.context = None
        self.playwright = None

    async def login(self):
        if not self.page: return
        logger.info(f"Acessando cassino: {config.EVO_URL}")
        try:
            await self.page.goto(config.EVO_URL, timeout=90000, wait_until="networkidle")
            await asyncio.sleep(5)
            
            # Tenta realizar login se encontrar campos
            try:
                # Seletores comuns para o site informado
                user_input = self.page.locator('input[type="text"], input[placeholder*="CPF"], input[placeholder*="Usuário"]').first
                pass_input = self.page.locator('input[type="password"]').first
                login_btn = self.page.locator('button:has-text("Entrar"), button:has-text("Login"), .login-button').first

                if await user_input.is_visible(timeout=5000):
                    logger.info("Tela de login detectada. Inserindo credenciais...")
                    await user_input.fill(config.EVO_LOGIN)
                    await pass_input.fill(config.EVO_PASSWORD)
                    await login_btn.click()
                    logger.info("Botão de login clicado. Aguardando carregamento do jogo...")
                    await self.page.wait_for_load_state("networkidle")
                    await asyncio.sleep(10)
            except Exception as e:
                logger.info(f"Login não necessário ou campos não encontrados: {e}")

            self.update_activity()
            logger.info("Sessão inicializada. Monitorando rede...")
        except Exception as e:
            logger.error(f"Erro ao carregar mesa: {e}")

    async def get_screenshot(self):
        """Captura a tela atual para depuração visual na VPS."""
        if self.page:
            return await self.page.screenshot(type='jpeg', quality=50)
        return None
        """Simula atividade humana real e movimentos randômicos."""
        logger.info("Anti-Pause Humanizado Ativado.")
        while self.is_running:
            try:
                # Intervalo randômico entre 20 e 50 segundos para não ser previsível
                await asyncio.sleep(random.randint(20, 50))
                
                if self.page and not self.page.is_closed():
                    # Simula scroll leve (comum em usuários reais)
                    await self.page.mouse.wheel(0, random.randint(-100, 100))
                    
                    # Movimento suave e clique em área central variável
                    x = random.randint(300, 700)
                    y = random.randint(200, 500)
                    await self.page.mouse.move(x, y, steps=10)
                    await self.page.mouse.click(x, y)
                    
                    # Se detectar o overlay de 'Inatividade' da Evolution
                    if await self.page.locator('text="Sim"').is_visible():
                        await self.page.click('text="Sim"')
                        logger.warning("Sessão retomada após detecção de overlay de pausa.")
            except: pass

    async def _memory_cleaner_loop(self):
        """Reinicia a página a cada 45 min para evitar estouro de 512MB de RAM."""
        while self.is_running:
            await asyncio.sleep(2700) # 45 minutos
            logger.info("LIMPANDO MEMÓRIA: Realizando refresh programado do Chromium...")
            try:
                if self.page:
                    await self.page.reload(wait_until="commit")
                    await asyncio.sleep(10)
            except Exception as e:
                logger.error(f"Erro no ciclo de memória: {e}")

    async def _monitor_session_loop(self):
        # Iniciamos o limpador de memória também
        asyncio.create_task(self._memory_cleaner_loop())
        
        while self.is_running:
            await asyncio.sleep(15)
            if not self.page: continue
            
            current_time = asyncio.get_running_loop().time()
            elapsed = current_time - self.last_activity_timestamp
            
            # Se passar de 4 minutos sem dados, a conexão morreu ou caiu em captcha
            if elapsed > 240:
                logger.error(f"Sessão Travada: {int(elapsed)}s sem dados. Forçando RECOVERY...")
                self.update_activity()
                try:
                    await self.page.reload(wait_until="commit")
                    await asyncio.sleep(15)
                except: pass

    def update_activity(self):
        self.last_activity_timestamp = asyncio.get_running_loop().time()
