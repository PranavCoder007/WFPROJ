from fastapi import APIRouter, Query
from typing import Optional
from backend.app.services.matching_engine import matching_engine

router = APIRouter(prefix="/api/forecasts", tags=["Forecasts"])

@router.get("/day-ahead")
def get_day_ahead_forecasts(
    start_date: str = Query("2026-01-01", description="Start date (YYYY-MM-DD)"),
    end_date: str = Query("2026-01-31", description="End date (YYYY-MM-DD)"),
    gate_closure_time: str = Query("11:00", description="Gate closure time GMT on D-1 (e.g. 11:00)"),
    resolution: str = Query("hourly", description="Resolution: 'hourly' or 'half_hourly'")
):
    """
    Get the Day-Ahead renewable wind forecasts matched with actuals.
    Returns the latest forecast available prior to the specified gate closure time on D-1.
    """
    matches = matching_engine.get_day_ahead_matches(
        start_date=start_date,
        end_date=end_date,
        gate_closure_time=gate_closure_time,
        resolution=resolution
    )
    return {
        "status": "success",
        "count": len(matches),
        "parameters": {
            "startDate": start_date,
            "endDate": end_date,
            "gateClosureTime": f"{gate_closure_time} GMT (D-1)",
            "resolution": resolution
        },
        "data": matches
    }

@router.get("/evolution")
def get_forecast_evolution(
    target_date: str = Query("2026-01-15", description="Target delivery date (YYYY-MM-DD)")
):
    """
    Get the evolution of wind forecasts for a given delivery date across all publication batches.
    """
    evolution = matching_engine.get_forecast_evolution(target_date=target_date)
    return {
        "status": "success",
        "data": evolution
    }
