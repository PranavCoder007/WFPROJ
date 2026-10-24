from typing import List, Dict, Any, Optional
import numpy as np
from backend.app.services.matching_engine import matching_engine
from backend.app.services.metrics_engine import metrics_engine

# Typical winter diurnal demand pattern index for UK (scaled to average 1.0)
# Peak in evening (17:00-19:00), trough at night (03:00-05:00)
UK_WINTER_DIURNAL_SHAPE = [
    0.72, 0.68, 0.65, 0.64, 0.66, 0.74, 0.88, 1.05, 1.15, 1.18,
    1.16, 1.14, 1.13, 1.12, 1.14, 1.20, 1.35, 1.42, 1.38, 1.25,
    1.15, 1.02, 0.88, 0.78
]

class ProcurementEngine:
    def __init__(self):
        pass

    def simulate_procurement(
        self,
        date: str = "2026-01-15",
        gate_closure_time: str = "11:00",
        demand_scale_mw: float = 30000.0,
        risk_confidence: str = "P90",
        day_ahead_price_gbp: float = 75.0,
        imbalance_buy_price_gbp: float = 120.0,
        imbalance_sell_price_gbp: float = 40.0
    ) -> Dict[str, Any]:
        """
        Simulates the power procurement decision for a given delivery date.
        Calculates required thermal procurement beyond wind forecast, accounting for quantified error.
        """
        # Get day-ahead matched intervals for target date
        matches = matching_engine.get_day_ahead_matches(
            start_date=date,
            end_date=date,
            gate_closure_time=gate_closure_time,
            resolution="hourly"
        )

        if not matches:
            return {"error": f"No data found for date {date}"}

        # Get overall month error metrics to compute portfolio-appropriate error buffer
        overall = metrics_engine.compute_overall_metrics(
            start_date="2026-01-01",
            end_date="2026-01-31",
            gate_closure_time=gate_closure_time,
            resolution="hourly"
        )
        quantiles = overall.get("quantiles", {})
        mean_bias = overall.get("meanBiasMW", 1840.0)

        # Scale factor if user changed demand scale from UK national ~30GW to smaller portfolio
        national_ref_demand = 30000.0
        portfolio_ratio = demand_scale_mw / national_ref_demand

        # Determine error adjustment buffer based on riskConfidence
        applied_buffer_mw = 0.0
        if risk_confidence == "raw":
            applied_buffer_mw = 0.0
        elif risk_confidence == "bias_corrected":
            # Just subtract the systematic over-forecast
            applied_buffer_mw = mean_bias * portfolio_ratio
        elif risk_confidence == "P75":
            applied_buffer_mw = quantiles.get("p75", 2600.0) * portfolio_ratio
        elif risk_confidence == "P90":
            applied_buffer_mw = quantiles.get("p90", 4300.0) * portfolio_ratio
        elif risk_confidence == "P95":
            applied_buffer_mw = quantiles.get("p95", 5500.0) * portfolio_ratio
        else:
            applied_buffer_mw = 0.0

        intervals = []
        total_demand_mwh = 0.0
        total_forecast_wind_mwh = 0.0
        total_actual_wind_mwh = 0.0
        total_thermal_procured_mwh = 0.0
        total_da_cost_gbp = 0.0
        total_imbalance_cost_gbp = 0.0
        total_cost_gbp = 0.0

        # Unhedged baseline totals to calculate savings
        unhedged_total_cost_gbp = 0.0
        shortfall_hours_count = 0

        for m in matches:
            h = m["hour"]
            shape_factor = UK_WINTER_DIURNAL_SHAPE[h] if h < len(UK_WINTER_DIURNAL_SHAPE) else 1.0
            demand_mw = round(demand_scale_mw * shape_factor, 1)

            # Wind is national wind scaled by portfolio ratio if portfolio is smaller
            fc_wind = round(m["forecastWindMW"] * portfolio_ratio, 1)
            act_wind = round(m["actualWindMW"] * portfolio_ratio, 1)

            # Hedged Strategy:
            # We assume wind provides (fc_wind - applied_buffer_mw)
            effective_wind_planning = max(0.0, fc_wind - applied_buffer_mw)
            procured_thermal_mw = max(0.0, demand_mw - effective_wind_planning)

            # Real-time physical delivery balance
            total_real_gen = procured_thermal_mw + act_wind
            residual = total_real_gen - demand_mw

            if residual < 0:
                # SHORT: utility under-procured! Must buy missing power at System Buy Price (SBP)
                shortfall_mw = abs(residual)
                surplus_mw = 0.0
                imb_cost = shortfall_mw * imbalance_buy_price_gbp
                shortfall_hours_count += 1
            else:
                # LONG: utility over-procured! Sells spill power at System Sell Price (SSP)
                shortfall_mw = 0.0
                surplus_mw = residual
                # SSP cashflow is revenue (offsets cost)
                imb_cost = - (surplus_mw * imbalance_sell_price_gbp)

            da_cost = procured_thermal_mw * day_ahead_price_gbp
            interval_total_cost = da_cost + imb_cost

            # Unhedged Baseline (raw forecast without buffer)
            unhedged_procured_thermal = max(0.0, demand_mw - fc_wind)
            unhedged_residual = (unhedged_procured_thermal + act_wind) - demand_mw
            if unhedged_residual < 0:
                unhedged_imb = abs(unhedged_residual) * imbalance_buy_price_gbp
            else:
                unhedged_imb = - (unhedged_residual * imbalance_sell_price_gbp)
            unhedged_cost = (unhedged_procured_thermal * day_ahead_price_gbp) + unhedged_imb

            unhedged_total_cost_gbp += unhedged_cost

            total_demand_mwh += demand_mw
            total_forecast_wind_mwh += fc_wind
            total_actual_wind_mwh += act_wind
            total_thermal_procured_mwh += procured_thermal_mw
            total_da_cost_gbp += da_cost
            total_imbalance_cost_gbp += imb_cost
            total_cost_gbp += interval_total_cost

            intervals.append({
                "startTime": m["startTime"],
                "hour": h,
                "demandMW": demand_mw,
                "forecastWindMW": fc_wind,
                "actualWindMW": act_wind,
                "procuredThermalMW": round(procured_thermal_mw, 1),
                "netResidualShortfallMW": round(shortfall_mw, 1),
                "netResidualSurplusMW": round(surplus_mw, 1),
                "dayAheadCostGBP": round(da_cost, 2),
                "imbalanceCostGBP": round(imb_cost, 2),
                "totalCostGBP": round(interval_total_cost, 2)
            })

        cost_savings = unhedged_total_cost_gbp - total_cost_gbp

        return {
            "date": date,
            "riskConfidence": risk_confidence,
            "appliedBufferMW": round(applied_buffer_mw, 1),
            "totalDemandMWh": round(total_demand_mwh, 1),
            "totalForecastWindMWh": round(total_forecast_wind_mwh, 1),
            "totalActualWindMWh": round(total_actual_wind_mwh, 1),
            "totalThermalProcuredMWh": round(total_thermal_procured_mwh, 1),
            "totalDayAheadCostGBP": round(total_da_cost_gbp, 2),
            "totalImbalanceCostGBP": round(total_imbalance_cost_gbp, 2),
            "totalProcurementCostGBP": round(total_cost_gbp, 2),
            "unhedgedBaselineCostGBP": round(unhedged_total_cost_gbp, 2),
            "costSavingsGBP": round(cost_savings, 2),
            "shortfallHoursCount": shortfall_hours_count,
            "intervals": intervals
        }

procurement_engine = ProcurementEngine()
