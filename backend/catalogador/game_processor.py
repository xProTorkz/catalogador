import logging

logger = logging.getLogger("GameProcessor")

def process_raw_data(raw_data: dict) -> dict:
    """
    ETAPA 2 – Validação estrutural (MANDATÓRIO)
    Garante que os dados são do tipo esperado, completos e seguros.
    """
    try:
        if not raw_data or not isinstance(raw_data, dict):
            return None
            
        # Mandatory Fields Check
        round_id = raw_data.get('round_id')
        resultado = raw_data.get('resultado')
        
        if not round_id or not resultado:
            logger.warning(f"Dados incompletos recebidos: {raw_data}")
            return None
            
        # Normalization
        # Evolution results usually come as 'player', 'banker', 'tie'
        # But some versions use numbers or specific strings like 'PlayerWon' or 'Tie8or7or6'
        resultado = str(resultado).lower()
        
        # Mapeamento Flexível
        if "player" in resultado:
            resultado = "player"
        elif "banker" in resultado:
            resultado = "banker"
        elif "tie" in resultado:
            resultado = "tie"
        
        mapping = {
            "0": "tie",
            "1": "player",
            "2": "banker",
            "p": "player",
            "b": "banker",
            "t": "tie"
        }
        
        if resultado in mapping:
            resultado = mapping[resultado]
            
        if resultado not in ['player', 'banker', 'tie']:
            logger.warning(f"Resultado inválido: {resultado}")
            return None
            
        processed = {
            "round_id": str(round_id),
            "resultado": resultado,
            "p_card1": int(raw_data.get('p_card1', 0)),
            "p_card2": int(raw_data.get('p_card2', 0)),
            "b_card1": int(raw_data.get('b_card1', 0)),
            "b_card2": int(raw_data.get('b_card2', 0)),
            "p_score": int(raw_data.get('p_score', 0)),
            "b_score": int(raw_data.get('b_score', 0)),
            "timestamp_oficial": raw_data.get('timestamp_oficial'),
            "source": raw_data.get('source', 'bacbo_br'),
            "raw_data": raw_data.get('raw_data', raw_data)
        }
        
        return processed

    except Exception as e:
        logger.error(f"Erro na validação estrutural: {e}")
        return None
