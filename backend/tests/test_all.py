import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.matching_engine import matching_engine
from backend.app.services.metrics_engine import metrics_engine
from backend.app.services.procurement_engine import procurement_engine

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_overview_endpoint():
    response = client.get("/api/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "summary" in data
    assert data["summary"]["totalIntervalsEvaluated"] == 744
    assert data["summary"]["maeMW"] > 0
    assert data["summary"]["meanBiasMW"] > 0  # Demonstrating the over-forecast finding

def test_day_ahead_matching():
    matches = matching_engine.get_day_ahead_matches(
        start_date="2026-01-01",
        end_date="2026-01-05",
        gate_closure_time="11:00",
        resolution="hourly"
    )
    assert len(matches) == 5 * 24  # 120 hourly intervals
    first = matches[0]
    assert "actualWindMW" in first
    assert "forecastWindMW" in first
    assert "errorMW" in first
    assert first["date"] == "2026-01-01"

def test_forecast_evolution():
    evolution = matching_engine.get_forecast_evolution(target_date="2026-01-10")
    assert evolution["targetDate"] == "2026-01-10"
    assert evolution["totalRuns"] > 0
    assert len(evolution["actuals"]) == 24

def test_overall_metrics_calculation():
    metrics = metrics_engine.compute_overall_metrics(
        start_date="2026-01-01",
        end_date="2026-01-31",
        gate_closure_time="11:00",
        resolution="hourly"
    )
    assert metrics["totalIntervals"] == 744
    assert metrics["maeMW"] > 1500  # Expect around 2122 MW
    assert metrics["rmseMW"] > metrics["maeMW"]  # RMSE >= MAE mathematically
    assert "quantiles" in metrics
    assert "p10" in metrics["quantiles"]
    assert "p90" in metrics["quantiles"]
    assert len(metrics["distribution"]) == 20

def test_diurnal_metrics():
    diurnal = metrics_engine.compute_diurnal_profile(
        start_date="2026-01-01",
        end_date="2026-01-31",
        gate_closure_time="11:00"
    )
    assert len(diurnal) == 24
    for h in diurnal:
        assert 0 <= h["hour"] <= 23
        assert h["maeMW"] > 0

def test_procurement_simulation():
    res = procurement_engine.simulate_procurement(
        date="2026-01-15",
        gate_closure_time="11:00",
        demand_scale_mw=30000.0,
        risk_confidence="P90",
        day_ahead_price_gbp=75.0,
        imbalance_buy_price_gbp=120.0,
        imbalance_sell_price_gbp=40.0
    )
    assert res["date"] == "2026-01-15"
    assert res["appliedBufferMW"] > 0
    assert len(res["intervals"]) == 24
    assert res["totalDemandMWh"] > 0
    assert res["totalThermalProcuredMWh"] > 0
    # Demonstrating value of risk hedging
    assert "costSavingsGBP" in res

def test_api_forecasts_day_ahead():
    resp = client.get("/api/forecasts/day-ahead?start_date=2026-01-10&end_date=2026-01-12")
    assert resp.status_code == 200
    json_data = resp.json()
    assert json_data["count"] == 3 * 24

def test_api_procurement_simulate():
    resp = client.get("/api/procurement/simulate?date=2026-01-20&risk_confidence=P90")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["date"] == "2026-01-20"
    assert data["riskConfidence"] == "P90"
