import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

DEFAULT_GATE_CLOSURE_TIME = "11:00"  # 11:00 GMT on D-1 (EPEX SPOT UK Day-Ahead Auction)
TARGET_YEAR = 2026
TARGET_MONTH = 1

ELEXON_API_BASE = "https://data.elexon.co.uk/bmrs/api/v1/datasets"
