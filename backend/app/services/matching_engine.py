import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from backend.app.services.elexon_client import client

logger = logging.getLogger(__name__)

class MatchingEngine:
    def __init__(self):
        pass

    def get_day_ahead_matches(
        self,
        start_date: str = "2026-01-01",
        end_date: str = "2026-01-31",
        gate_closure_time: str = "11:00",
        resolution: str = "hourly"  # "hourly" or "half_hourly"
    ) -> List[Dict[str, Any]]:
        """
        Matches actual wind generation against the Day-Ahead forecast available at gate closure on D-1.
        
        Parameters:
        - start_date: 'YYYY-MM-DD'
        - end_date: 'YYYY-MM-DD'
        - gate_closure_time: 'HH:MM' (default '11:00' GMT)
        - resolution: 'hourly' (24 points/day) or 'half_hourly' (48 points/day)
        """
        # Get actuals and forecasts from client
        actuals = client.get_actuals()
        forecasts = client.get_forecasts()

        # Map actuals by startTime
        actual_dict: Dict[str, float] = {}
        sp_dict: Dict[str, int] = {}
        for r in actuals:
            st = r.get("startTime")
            gen = r.get("generation")
            sp = r.get("settlementPeriod")
            if st and gen is not None:
                actual_dict[st] = float(gen)
                if sp:
                    sp_dict[st] = int(sp)

        # Parse date range
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")

        matched_intervals: List[Dict[str, Any]] = []

        cur_dt = start_dt
        while cur_dt <= end_dt:
            day_str = cur_dt.strftime("%Y-%m-%d")
            prev_dt = cur_dt - timedelta(days=1)
            prev_day_str = prev_dt.strftime("%Y-%m-%d")

            # Cutoff timestamp on D-1
            gate_cutoff = f"{prev_day_str}T{gate_closure_time}:00Z"

            # Forecasts published on or before gate_cutoff that cover day_str
            eligible_fcs = [
                w for w in forecasts
                if w.get("publishTime", "") <= gate_cutoff and w.get("startTime", "").startswith(day_str)
            ]

            da_forecast_dict: Dict[str, float] = {}
            da_publish_time = ""
            if eligible_fcs:
                latest_publish = max(w.get("publishTime", "") for w in eligible_fcs)
                da_publish_time = latest_publish
                for w in eligible_fcs:
                    if w.get("publishTime") == latest_publish:
                        da_forecast_dict[w.get("startTime", "")] = float(w.get("generation", 0.0))

            # Also find latest intraday forecasts (published right before delivery)
            # For each hour/period, find latest published forecast with publishTime <= target startTime
            day_forecasts = [w for w in forecasts if w.get("startTime", "").startswith(day_str)]

            if resolution == "hourly":
                for h in range(24):
                    st_hour = f"{day_str}T{h:02d}:00:00Z"
                    st_hh1 = f"{day_str}T{h:02d}:00:00Z"
                    st_hh2 = f"{day_str}T{h:02d}:30:00Z"

                    gen1 = actual_dict.get(st_hh1)
                    gen2 = actual_dict.get(st_hh2)

                    if gen1 is not None and gen2 is not None:
                        actual_mw = (gen1 + gen2) / 2.0
                    elif gen1 is not None:
                        actual_mw = gen1
                    elif gen2 is not None:
                        actual_mw = gen2
                    else:
                        continue

                    # Day-ahead forecast for this hour
                    fc_mw = da_forecast_dict.get(st_hour)
                    if fc_mw is None:
                        # Fallback if specific hour is missing from da batch
                        continue

                    # Find latest intraday forecast for this hour
                    intra_fcs = [
                        w for w in day_forecasts
                        if w.get("startTime") == st_hour and w.get("publishTime", "") <= st_hour
                    ]
                    latest_intra_mw = None
                    if intra_fcs:
                        best_run = max(intra_fcs, key=lambda x: x.get("publishTime", ""))
                        latest_intra_mw = float(best_run.get("generation", 0.0))

                    error_mw = fc_mw - actual_mw  # positive means over-forecast
                    abs_error = abs(error_mw)
                    pct_error = (abs_error / actual_mw * 100.0) if actual_mw > 0 else 0.0

                    matched_intervals.append({
                        "startTime": st_hour,
                        "date": day_str,
                        "hour": h,
                        "settlementPeriodStart": (h * 2) + 1,
                        "settlementPeriodEnd": (h * 2) + 2,
                        "actualWindMW": round(actual_mw, 1),
                        "forecastWindMW": round(fc_mw, 1),
                        "errorMW": round(error_mw, 1),
                        "absErrorMW": round(abs_error, 1),
                        "pctError": round(pct_error, 2),
                        "latestForecastMW": round(latest_intra_mw, 1) if latest_intra_mw is not None else round(fc_mw, 1),
                        "publishTime": da_publish_time
                    })

            else:
                # Half-hourly resolution (48 settlement periods)
                for h in range(24):
                    st_hour = f"{day_str}T{h:02d}:00:00Z"
                    fc_mw = da_forecast_dict.get(st_hour)
                    if fc_mw is None:
                        continue

                    for minute, sp_offset in [(0, 1), (30, 2)]:
                        st_hh = f"{day_str}T{h:02d}:{minute:02d}:00Z"
                        sp = (h * 2) + sp_offset
                        actual_mw = actual_dict.get(st_hh)
                        if actual_mw is None:
                            continue

                        error_mw = fc_mw - actual_mw
                        abs_error = abs(error_mw)
                        pct_error = (abs_error / actual_mw * 100.0) if actual_mw > 0 else 0.0

                        matched_intervals.append({
                            "startTime": st_hh,
                            "date": day_str,
                            "hour": h,
                            "settlementPeriod": sp,
                            "actualWindMW": round(actual_mw, 1),
                            "forecastWindMW": round(fc_mw, 1),
                            "errorMW": round(error_mw, 1),
                            "absErrorMW": round(abs_error, 1),
                            "pctError": round(pct_error, 2),
                            "publishTime": da_publish_time
                        })

            cur_dt += timedelta(days=1)

        return matched_intervals

    def get_forecast_evolution(self, target_date: str) -> Dict[str, Any]:
        """
        Retrieves all forecast publication runs that forecasted for target_date.
        Allows procurement desk to trace how the wind forecast changed over time.
        """
        forecasts = client.get_forecasts()
        target_fcs = [w for w in forecasts if w.get("startTime", "").startswith(target_date)]

        publish_times = sorted(list(set(w.get("publishTime", "") for w in target_fcs)))

        runs: List[Dict[str, Any]] = []
        for pt in publish_times:
            batch = [w for w in target_fcs if w.get("publishTime") == pt]
            # sort by startTime
            batch_sorted = sorted(batch, key=lambda x: x.get("startTime", ""))
            
            # calculate average forecast for that day in this run
            gens = [float(b.get("generation", 0.0)) for b in batch_sorted]
            avg_mw = sum(gens) / len(gens) if gens else 0.0

            points = [
                {
                    "startTime": b.get("startTime"),
                    "hour": int(b.get("startTime", "")[11:13]) if len(b.get("startTime", "")) >= 13 else 0,
                    "generation": float(b.get("generation", 0.0))
                }
                for b in batch_sorted
            ]

            runs.append({
                "publishTime": pt,
                "dataPointsCount": len(points),
                "avgGenerationMW": round(avg_mw, 1),
                "points": points
            })

        # Also get actuals for target_date
        actuals = client.get_actuals(start_date=target_date, end_date=target_date)
        # aggregate hourly
        hourly_actuals = []
        for h in range(24):
            st_hh1 = f"{target_date}T{h:02d}:00:00Z"
            st_hh2 = f"{target_date}T{h:02d}:30:00Z"
            g1 = next((float(r["generation"]) for r in actuals if r.get("startTime") == st_hh1), None)
            g2 = next((float(r["generation"]) for r in actuals if r.get("startTime") == st_hh2), None)
            if g1 is not None and g2 is not None:
                act = (g1 + g2) / 2.0
            elif g1 is not None:
                act = g1
            elif g2 is not None:
                act = g2
            else:
                act = None

            hourly_actuals.append({
                "hour": h,
                "startTime": st_hh1,
                "actualWindMW": round(act, 1) if act is not None else None
            })

        return {
            "targetDate": target_date,
            "totalRuns": len(runs),
            "runs": runs,
            "actuals": hourly_actuals
        }

matching_engine = MatchingEngine()
