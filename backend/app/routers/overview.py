from fastapi import APIRouter
from backend.app.services.metrics_engine import metrics_engine
from backend.app.services.elexon_client import client

router = APIRouter(prefix="/api/overview", tags=["Overview"])

@router.get("")
def get_overview():
    """
    Get top-level dashboard overview metrics for January 2026.
    """
    metrics = metrics_engine.compute_overall_metrics(
        start_date="2026-01-01",
        end_date="2026-01-31",
        gate_closure_time="11:00",
        resolution="hourly"
    )

    actuals = client.get_actuals()
    forecasts = client.get_forecasts()

    return {
        "status": "success",
        "market": "UK Wholesale Electricity Market (GB)",
        "scope": "Day-Ahead Renewable Wind Procurement - January 2026",
        "gateClosureDefault": "11:00 GMT on D-1",
        "dataSource": "Elexon BMRS Insights Solution (FUELHH & WINDFOR)",
        "cachedActualRecordsCount": len(actuals),
        "cachedForecastRecordsCount": len(forecasts),
        "summary": {
            "totalIntervalsEvaluated": metrics.get("totalIntervals"),
            "meanActualWindMW": metrics.get("meanActualMW"),
            "meanForecastWindMW": metrics.get("meanForecastMW"),
            "maeMW": metrics.get("maeMW"),
            "rmseMW": metrics.get("rmseMW"),
            "meanBiasMW": metrics.get("meanBiasMW"),
            "wapePct": metrics.get("wapePct"),
            "overForecastFrequencyPct": metrics.get("overForecastFrequencyPct"),
            "underForecastFrequencyPct": metrics.get("underForecastFrequencyPct"),
            "p90ShortfallRiskMW": metrics.get("quantiles", {}).get("p90")
        }
    }
