import sqlite3
import logging
import os
import json
from datetime import datetime
from contextlib import contextmanager

from backend.config import DATABASE_PATH

# Configure logging
logger = logging.getLogger("Database")

def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

@contextmanager
def get_db():
    conn = get_db_connection()
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    """Initializes the database with grid coordinates support."""
    logger.info("Initializing database with grid coordinates...")
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)

    create_table_sql = """
    CREATE TABLE IF NOT EXISTS rounds (
        round_id TEXT PRIMARY KEY,
        resultado TEXT NOT NULL,
        p_card1 INTEGER,
        p_card2 INTEGER,
        b_card1 INTEGER,
        b_card2 INTEGER,
        p_score INTEGER,
        b_score INTEGER,
        grid_col INTEGER,
        grid_row INTEGER,
        timestamp_oficial TEXT,
        timestamp_captura DATETIME DEFAULT CURRENT_TIMESTAMP,
        source TEXT NOT NULL,
        raw_data TEXT
    );
    """
    
    try:
        with get_db() as conn:
            conn.execute(create_table_sql)
            
            # MIGRATION: Ensure columns exist if table was already there
            existing_cols = [row['name'] for row in conn.execute("PRAGMA table_info(rounds)").fetchall()]
            if 'grid_col' not in existing_cols:
                logger.info("Adding grid_col column to rounds table...")
                conn.execute("ALTER TABLE rounds ADD COLUMN grid_col INTEGER")
            if 'grid_row' not in existing_cols:
                logger.info("Adding grid_row column to rounds table...")
                conn.execute("ALTER TABLE rounds ADD COLUMN grid_row INTEGER")
                
            logger.info("Database initialized and migrated successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise

def insert_round(round_data: dict):
    """Inserts a round with explicit grid coordinates."""
    sql = """
    INSERT OR IGNORE INTO rounds (
        round_id, resultado, p_card1, p_card2, b_card1, b_card2, 
        p_score, b_score, grid_col, grid_row, timestamp_oficial, source, raw_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    
    try:
        with get_db() as conn:
            with conn:
                cursor = conn.execute(sql, (
                    round_id := round_data['round_id'],
                    round_data['resultado'],
                    round_data.get('p_card1'),
                    round_data.get('p_card2'),
                    round_data.get('b_card1'),
                    round_data.get('b_card2'),
                    round_data.get('p_score'),
                    round_data.get('b_score'),
                    round_data.get('grid_col'),
                    round_data.get('grid_row'),
                    round_data.get('timestamp_oficial'),
                    round_data.get('source', 'bacbo_br'),
                    json.dumps(round_data.get('raw_data', {}))
                ))
                return cursor.rowcount > 0
    except Exception as e:
        logger.error(f"Error inserting round {round_data.get('round_id')}: {e}")
        return False

def get_synchronized_history(limit=200):
    """Retrieves the most recent rounds ordered by time ASC."""
    try:
        with get_db() as conn:
            sql = f"SELECT * FROM (SELECT * FROM rounds ORDER BY timestamp_captura DESC LIMIT ?) ORDER BY timestamp_captura ASC"
            cursor = conn.execute(sql, (limit,))
            return [dict(row) for row in cursor.fetchall()]
    except Exception as e:
        logger.error(f"Error fetching sync history: {e}")
        return []

def get_last_rounds(limit=100):
    """Retrieves history DESC."""
    try:
        with get_db() as conn:
            cursor = conn.execute("SELECT * FROM rounds ORDER BY timestamp_captura DESC LIMIT ?", (limit,))
            return [dict(row) for row in cursor.fetchall()]
    except Exception as e:
        logger.error(f"Error fetching last rounds: {e}")
        return []
