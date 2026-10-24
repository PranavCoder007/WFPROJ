import json
import logging
import urllib.request
from typing import List, Dict, Any, Optional
from datetime import datetime
from backend.app.config import DATA_DIR, ELEXON_API_BASE

logger = logging.getLogger(__name__)

class ElexonClient:
    def __init__(self):
        self._fuelhh_cache: List[Dict[str, Any]] = []
        self._windfor_cache: List[Dict[str, Any]] = []
        self.load_local_data()

    def load_local_data(self):
        """Load pre-cached January 2026 data from local JSON files."""
        fuel_path = DATA_DIR / "fuelhh_jan2026.json"
        wind_path = DATA_DIR / "windfor_jan2026.json"

        if fuel_path.exists():
            try:
                with open(fuel_path, "r", encoding="utf-8") as f:
                    self._fuelhh_cache = json.load(f)
                logger.info(f"Loaded {len(self._fuelhh_cache)} FUELHH records from {fuel_path}")
            except Exception as e:
                logger.error(f"Error loading FUELHH cache: {e}")
                self._fuelhh_cache = []

        if wind_path.exists():
            try:
                with open(wind_path, "r", encoding="utf-8") as f:
                    self._windfor_cache = json.load(f)
                logger.info(f"Loaded {len(self._windfor_cache)} WINDFOR records from {wind_path}")
            except Exception as e:
                logger.error(f"Error loading WINDFOR cache: {e}")
                self._windfor_cache = []

    def get_actuals(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get actual wind generation records (FUELHH with fuelType='WIND').
        Filter by start_date and end_date (format 'YYYY-MM-DD').
        """
        records = [r for r in self._fuelhh_cache if r.get("fuelType") == "WIND"]
        if start_date:
            records = [r for r in records if r.get("startTime", "")[:10] >= start_date]
        if end_date:
            records = [r for r in records if r.get("startTime", "")[:10] <= end_date]
        return records

    def get_forecasts(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get wind forecast records (WINDFOR).
        Filter by startTime start_date and end_date (format 'YYYY-MM-DD').
        """
        records = self._windfor_cache
        if start_date:
            records = [r for r in records if r.get("startTime", "")[:10] >= start_date]
        if end_date:
            records = [r for r in records if r.get("startTime", "")[:10] <= end_date]
        return records

    def fetch_live_fuelhh(self, start_iso: str, end_iso: str) -> List[Dict[str, Any]]:
        """Fetch live FUELHH data from Elexon BMRS stream API."""
        url = f"{ELEXON_API_BASE}/FUELHH/stream?publishDateTimeFrom={start_iso}&publishDateTimeTo={end_iso}&fuelType=WIND"
        req = urllib.request.Request(url, headers={"User-Agent": "Gridbricks-DayAhead/1.0"})
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data

    def fetch_live_windfor(self, start_iso: str, end_iso: str) -> List[Dict[str, Any]]:
        """Fetch live WINDFOR data from Elexon BMRS stream API."""
        url = f"{ELEXON_API_BASE}/WINDFOR/stream?publishDateTimeFrom={start_iso}&publishDateTimeTo={end_iso}"
        req = urllib.request.Request(url, headers={"User-Agent": "Gridbricks-DayAhead/1.0"})
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data

client = ElexonClient()
