import numpy as np
from typing import List, Dict, Any, Optional
from backend.app.services.matching_engine import matching_engine

class MetricsEngine:
    def __init__(self):
        pass

    def compute_overall_metrics(
        self,
        start_date: str = "2026-01-01",
        end_date: str = "2026-01-31",
        gate_closure_time: str = "11:00",
        resolution: str = "hourly"
    ) -> Dict[str, Any]:
        """
        Computes comprehensive quantitative accuracy evaluation metrics.
        """
        matches = matching_engine.get_day_ahead_matches(
            start_date=start_date,
            end_date=end_date,
            gate_closure_time=gate_closure_time,
            resolution=resolution
        )

        if not matches:
            return {"error": "No matched intervals found"}

        actuals = np.array([m["actualWindMW"] for m in matches], dtype=float)
        forecasts = np.array([m["forecastWindMW"] for m in matches], dtype=float)
        errors = forecasts - actuals  # Positive: Over-forecast
        abs_errors = np.abs(errors)

        n = len(matches)
        mean_actual = float(np.mean(actuals))
        mean_forecast = float(np.mean(forecasts))
        mae = float(np.mean(abs_errors))
        rmse = float(np.sqrt(np.mean(errors ** 2)))
        bias = float(np.mean(errors))
        wape = float(np.sum(abs_errors) / np.sum(actuals) * 100.0) if np.sum(actuals) > 0 else 0.0
        nmae = float(mae / mean_actual * 100.0) if mean_actual > 0 else 0.0

        # Correlation and R2
        corr_matrix = np.corrcoef(actuals, forecasts)
        r = float(corr_matrix[0, 1]) if not np.isnan(corr_matrix[0, 1]) else 0.0
        r2 = float(r ** 2)

        # Quantiles
        quantiles = {
            "p5": round(float(np.percentile(errors, 5)), 1),
            "p10": round(float(np.percentile(errors, 10)), 1),
            "p25": round(float(np.percentile(errors, 25)), 1),
            "p50": round(float(np.percentile(errors, 50)), 1),
            "p75": round(float(np.percentile(errors, 75)), 1),
            "p90": round(float(np.percentile(errors, 90)), 1),
            "p95": round(float(np.percentile(errors, 95)), 1),
        }

        # Over/under forecast frequencies
        over_count = int(np.sum(errors > 0))
        under_count = int(np.sum(errors < 0))
        exact_count = int(np.sum(errors == 0))

        over_pct = round(over_count / n * 100.0, 1)
        under_pct = round(under_count / n * 100.0, 1)

        # Error distribution histogram (20 bins)
        hist, bin_edges = np.histogram(errors, bins=20)
        distribution = []
        for i in range(len(hist)):
            distribution.append({
                "binStart": round(float(bin_edges[i]), 1),
                "binEnd": round(float(bin_edges[i+1]), 1),
                "binCenter": round(float((bin_edges[i] + bin_edges[i+1]) / 2.0), 1),
                "count": int(hist[i]),
                "frequencyPct": round(float(hist[i] / n * 100.0), 2)
            })

        return {
            "totalIntervals": n,
            "dateRange": f"{start_date} to {end_date}",
            "gateClosureTime": f"{gate_closure_time} GMT (D-1)",
            "resolution": resolution,
            "meanActualMW": round(mean_actual, 1),
            "meanForecastMW": round(mean_forecast, 1),
            "maeMW": round(mae, 1),
            "rmseMW": round(rmse, 1),
            "meanBiasMW": round(bias, 1),
            "wapePct": round(wape, 2),
            "nmaePct": round(nmae, 2),
            "correlationR": round(r, 4),
            "rSquared": round(r2, 4),
            "quantiles": quantiles,
            "overForecastFrequencyPct": over_pct,
            "underForecastFrequencyPct": under_pct,
            "exactForecastFrequencyPct": round(exact_count / n * 100.0, 1),
            "distribution": distribution
        }

    def compute_diurnal_profile(
        self,
        start_date: str = "2026-01-01",
        end_date: str = "2026-01-31",
        gate_closure_time: str = "11:00"
    ) -> List[Dict[str, Any]]:
        """
        Computes diurnal (hourly / settlement period) error profiles.
        Shows which hours of the day experience highest forecast volatility and bias.
        """
        matches = matching_engine.get_day_ahead_matches(
            start_date=start_date,
            end_date=end_date,
            gate_closure_time=gate_closure_time,
            resolution="hourly"
        )

        diurnal = []
        for h in range(24):
            hour_matches = [m for m in matches if m["hour"] == h]
            if not hour_matches:
                continue

            acts = np.array([m["actualWindMW"] for m in hour_matches], dtype=float)
            fcs = np.array([m["forecastWindMW"] for m in hour_matches], dtype=float)
            errs = fcs - acts
            abs_errs = np.abs(errs)

            mae = float(np.mean(abs_errs))
            rmse = float(np.sqrt(np.mean(errs ** 2)))
            bias = float(np.mean(errs))
            wape = float(np.sum(abs_errs) / np.sum(acts) * 100.0) if np.sum(acts) > 0 else 0.0

            diurnal.append({
                "hour": h,
                "label": f"{h:02d}:00",
                "settlementPeriodStart": (h * 2) + 1,
                "settlementPeriodEnd": (h * 2) + 2,
                "intervalsCount": len(hour_matches),
                "meanActualMW": round(float(np.mean(acts)), 1),
                "meanForecastMW": round(float(np.mean(fcs)), 1),
                "maeMW": round(mae, 1),
                "rmseMW": round(rmse, 1),
                "meanBiasMW": round(bias, 1),
                "wapePct": round(wape, 2)
            })

        return diurnal

    def compute_daily_breakdown(
        self,
        start_date: str = "2026-01-01",
        end_date: str = "2026-01-31",
        gate_closure_time: str = "11:00"
    ) -> List[Dict[str, Any]]:
        """
        Computes day-by-day metrics across the month to rank best/worst forecasting days.
        """
        matches = matching_engine.get_day_ahead_matches(
            start_date=start_date,
            end_date=end_date,
            gate_closure_time=gate_closure_time,
            resolution="hourly"
        )

        dates = sorted(list(set(m["date"] for m in matches)))
        daily_list = []

        for d in dates:
            day_matches = [m for m in matches if m["date"] == d]
            if not day_matches:
                continue

            acts = np.array([m["actualWindMW"] for m in day_matches], dtype=float)
            fcs = np.array([m["forecastWindMW"] for m in day_matches], dtype=float)
            errs = fcs - acts
            abs_errs = np.abs(errs)

            total_act_mwh = float(np.sum(acts))  # Hourly resolution: sum(MW * 1h) = MWh
            total_fc_mwh = float(np.sum(fcs))
            mae = float(np.mean(abs_errs))
            rmse = float(np.sqrt(np.mean(errs ** 2)))
            bias = float(np.mean(errs))
            wape = float(np.sum(abs_errs) / total_act_mwh * 100.0) if total_act_mwh > 0 else 0.0

            daily_list.append({
                "date": d,
                "totalActualMWh": round(total_act_mwh, 1),
                "totalForecastMWh": round(total_fc_mwh, 1),
                "peakActualMW": round(float(np.max(acts)), 1),
                "peakForecastMW": round(float(np.max(fcs)), 1),
                "maeMW": round(mae, 1),
                "rmseMW": round(rmse, 1),
                "meanBiasMW": round(bias, 1),
                "wapePct": round(wape, 2),
                "maxOverForecastMW": round(float(np.max(errs)), 1),
                "maxUnderForecastMW": round(float(np.min(errs)), 1)
            })

        return daily_list

metrics_engine = MetricsEngine()
