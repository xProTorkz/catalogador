import logging
import json
import asyncio
from backend.catalogador import game_processor, intelligence, strategy
from backend import database

logger = logging.getLogger("Worker_BacBo")
processing_lock = asyncio.Lock() # Trava para garantir cálculo de grid sequencial

from backend.logger import grid_logger, error_logger

async def process_game_data(raw_data: dict):
    """
    PIPELINE DE PROCESSAMENTO (MANDATÓRIO)
    """
    round_id = raw_data.get('round_id', 'N/A')
    source = raw_data.get('source', 'bacbo_br').upper()

    async with processing_lock: # Início da trava sequencial
        try:
            # ETAPA 1 – Recebimento
            grid_logger.debug(f"MOTOR: [RECEBIDO] Round {round_id} da fonte {source}")

            # ETAPA 2 – Validação
            clean_data = game_processor.process_raw_data(raw_data)
            if not clean_data:
                grid_logger.error(f"MOTOR: [ERRO] Falha na validação do Round {round_id}")
                return

            # ETAPA 3 – Cálculo de Posição na Grade (MOTOR DE GRID)
            with database.get_db() as conn:
                last = conn.execute("SELECT grid_col, grid_row FROM rounds WHERE grid_col IS NOT NULL ORDER BY grid_col DESC, grid_row DESC LIMIT 1").fetchone()
            
            if last:
                if last['grid_row'] < 5:
                    clean_data['grid_row'] = last['grid_row'] + 1
                    clean_data['grid_col'] = last['grid_col']
                else:
                    clean_data['grid_row'] = 0
                    clean_data['grid_col'] = last['grid_col'] + 1
            else:
                clean_data['grid_row'] = 0
                clean_data['grid_col'] = 0

            grid_logger.debug(f"MOTOR: [GRID] Posicionando Round {round_id} em Col:{clean_data['grid_col']} Lin:{clean_data['grid_row']}")

            # ETAPA 4 – Persistência
            was_inserted = database.insert_round(clean_data)
            
            if not was_inserted:
                return
            
            grid_logger.info(f"💾 [DATABASE] Rodada {round_id} salva com sucesso.")

            # ETAPA 6 – Inteligência
            stats = intelligence.calculate_stats(clean_data)

        except Exception as e:
            error_logger.error(f"MOTOR: Erro crítico no pipeline: {str(e)}", exc_info=True)
            logger.error(f"PAYLOAD ORIGINAL: {json.dumps(raw_data)}")
