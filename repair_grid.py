import sqlite3
import os
import sys

# Ajusta path para importar o banco
sys.path.append(os.getcwd())
from backend.config import DATABASE_PATH

def repair_grid():
    print(f"--- REPARADOR DE GRADE CATALOGADOR ---")
    print(f"Banco: {DATABASE_PATH}")
    
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Pega todas as rodadas em ordem cronológica
    rounds = cursor.execute("SELECT round_id FROM rounds ORDER BY timestamp_captura ASC").fetchall()
    print(f"Total de rodadas para re-processar: {len(rounds)}")
    
    col = 0
    row = 0
    
    for r in rounds:
        cursor.execute("UPDATE rounds SET grid_col = ?, grid_row = ? WHERE round_id = ?", (col, row, r['round_id']))
        
        if row < 5:
            row += 1
        else:
            row = 0
            col += 1
            
    conn.commit()
    conn.close()
    print(f"✅ GRADE RECONSTRUÍDA! Colunas totais: {col + 1}")
    print(f"[!] Reinicie o servidor Python agora para ver os dados no front.")

if __name__ == "__main__":
    repair_grid()
