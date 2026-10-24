from fastapi import APIRouter, Query
from backend.app.services.metrics_engine import metrics_engine

router = APIRouter(prefix="/api/metrics", tags=["Quantitative Metrics"])

@router.get("/overall")
def get_overall_metrics(
    start_date: str = Query("2026-01-01", description="Start date (YYYY-MM-DD)"),
    end_date: str = Query("2026-01-31", description="End date (YYYY-MM-DD)"),
    gate_closure_time: str = Query("11:00", description="Gate closure time GMT on D-1"),
    resolution: str = Query("hourly", description="Resolution: 'hourly' or 'half_hourly'")
):
    """
    Get full quantitative accuracy evaluation metrics: MAE, RMSE, Mean Bias, WAPE, quantiles, and distribution.
    """
    metrics = metrics_engine.compute_overall_metrics(
        start_date=start_date,
        end_date=end_date,
        gate_closure_time=gate_closure_time,
        resolution=resolution
    )
    return {
        "status": "success",
        "data": metrics
    }

@router.get("/diurnal")
def get_diurnal_profile(
    start_date: str = Query("2026-01-01", description="Start date (YYYY-MM-DD)"),
    end_date: str = Query("2026-01-31", description="End date (YYYY-MM-DD)"),
    gate_closure_time: str = Query("11:00", description="Gate closure time GMT on D-1")
):
    """
    Get diurnal (hourly / settlement period) error profiles.
    """
    diurnal = metrics_engine.compute_diurnal_profile(
        start_date=start_date,
        end_date=end_date,
        gate_closure_time=gate_closure_time
    )
    return {
        "status": "success",
        "count": len(diurnal),
        "data": diurnal
    }

@router.get("/daily")
def get_daily_breakdown(
    start_date: str = Query("2026-01-01", description="Start date (YYYY-MM-DD)"),
    end_date: str = Query("2026-01-31", description="End date (YYYY-MM-DD)"),
    gate_closure_time: str = Query("11:00", description="Gate closure time GMT on D-1")
):
    """
    Get day-by-day metrics and error rankings across January 2026.
    """
    daily = metrics_engine.compute_daily_breakdown(
        start_date=start_date,
        end_date=end_date,
        gate_closure_time=gate_closure_time
    )
    return {
        "status": "success",
        "count": len(daily),
        "data": daily
    }
