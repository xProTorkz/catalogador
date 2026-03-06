import logging
import os
from logging.handlers import RotatingFileHandler

# Cria diretório de logs se não existir
if not os.path.exists('logs'):
    os.makedirs('logs')

def setup_logger(name, log_file, level=logging.INFO):
    """Configura um logger específico para um módulo."""
    formatter = logging.Formatter('[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s')
    
    # Rotação de logs: 10MB por arquivo, mantém os últimos 10
    handler = RotatingFileHandler(f'logs/{log_file}', maxBytes=10*1024*1024, backupCount=10)
    handler.setFormatter(formatter)

    # Log no terminal também
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)

    logger = logging.getLogger(name)
    logger.setLevel(level)
    logger.addHandler(handler)
    logger.addHandler(console_handler)
    
    return logger

# Loggers específicos
system_logger = setup_logger('SYSTEM', 'system.log')
error_logger = setup_logger('ERROR', 'error.log', logging.ERROR)
api_logger = setup_logger('API', 'api.log')
grid_logger = setup_logger('GRID', 'grid.log')
scraper_logger = setup_logger('SCRAPER', 'scraper.log')
