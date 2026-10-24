from fastapi import APIRouter, Query, Body
from typing import Optional
from backend.app.models.schemas import ProcurementSimulationRequest
from backend.app.services.procurement_engine import procurement_engine

router = APIRouter(prefix="/api/procurement", tags=["Procurement & Risk Optimization"])

@router.get("/simulate")
def simulate_procurement_get(
    date: str = Query("2026-01-15", description="Delivery date (YYYY-MM-DD)"),
    gate_closure_time: str = Query("11:00", description="Gate closure time GMT on D-1"),
    demand_scale_mw: float = Query(30000.0, description="Consumer demand scale in MW"),
    risk_confidence: str = Query("P90", description="Risk hedging confidence: 'raw', 'bias_corrected', 'P75', 'P90', 'P95'"),
    day_ahead_price_gbp: float = Query(75.0, description="Day-Ahead power price (£/MWh)"),
    imbalance_buy_price_gbp: float = Query(120.0, description="System Buy Price (£/MWh) for short imbalance"),
    imbalance_sell_price_gbp: float = Query(40.0, description="System Sell Price (£/MWh) for spill")
):
    """
    Simulate Day-Ahead procurement and thermal requirements under different risk hedging modes.
    """
    result = procurement_engine.simulate_procurement(
        date=date,
        gate_closure_time=gate_closure_time,
        demand_scale_mw=demand_scale_mw,
        risk_confidence=risk_confidence,
        day_ahead_price_gbp=day_ahead_price_gbp,
        imbalance_buy_price_gbp=imbalance_buy_price_gbp,
        imbalance_sell_price_gbp=imbalance_sell_price_gbp
    )
    return {
        "status": "success",
        "data": result
    }

@router.post("/simulate")
def simulate_procurement_post(request: ProcurementSimulationRequest):
    """
    POST endpoint for custom simulation scenarios.
    """
    result = procurement_engine.simulate_procurement(
        date=request.date or "2026-01-15",
        gate_closure_time="11:00",
        demand_scale_mw=request.demandScaleMW or 30000.0,
        risk_confidence=request.riskConfidence or "P90",
        day_ahead_price_gbp=request.dayAheadPricePerMWh or 75.0,
        imbalance_buy_price_gbp=request.imbalanceBuyPricePerMWh or 120.0,
        imbalance_sell_price_gbp=request.imbalanceSellPricePerMWh or 40.0
    )
    return {
        "status": "success",
        "data": result
    }
