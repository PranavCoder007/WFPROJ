from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class HalfHourlyRecord(BaseModel):
    startTime: str
    settlementDate: str
    settlementPeriod: int
    fuelType: str
    generation: float

class WindForecastRecord(BaseModel):
    publishTime: str
    startTime: str
    generation: float

class MatchedInterval(BaseModel):
    startTime: str
    date: str
    hour: int
    settlementPeriod: Optional[int] = None
    actualWindMW: float
    forecastWindMW: float
    errorMW: float  # Forecast - Actual (positive = over-forecast)
    absErrorMW: float
    pctError: Optional[float] = None
    latestForecastMW: Optional[float] = None
    publishTime: str

class DayMetrics(BaseModel):
    date: str
    totalActualMWh: float
    totalForecastMWh: float
    peakActualMW: float
    peakForecastMW: float
    maeMW: float
    rmseMW: float
    meanBiasMW: float
    wapePct: float
    maxOverForecastMW: float
    maxUnderForecastMW: float

class QuantileMetrics(BaseModel):
    p5: float
    p10: float
    p25: float
    p50: float  # median
    p75: float
    p90: float
    p95: float

class OverallMetrics(BaseModel):
    totalIntervals: int
    dateRange: str
    gateClosureTime: str
    meanActualMW: float
    meanForecastMW: float
    maeMW: float
    rmseMW: float
    meanBiasMW: float
    wapePct: float
    nmaePct: float
    correlationR: float
    rSquared: float
    quantiles: QuantileMetrics
    overForecastFrequencyPct: float
    underForecastFrequencyPct: float

class DiurnalMetric(BaseModel):
    hour: int
    settlementPeriodStart: int
    settlementPeriodEnd: int
    label: str
    meanActualMW: float
    meanForecastMW: float
    maeMW: float
    rmseMW: float
    meanBiasMW: float
    wapePct: float

class ForecastEvolutionPoint(BaseModel):
    publishTime: str
    startTime: str
    generation: float
    leadTimeHours: float

class ProcurementSimulationRequest(BaseModel):
    date: Optional[str] = "2026-01-15"
    demandScaleMW: Optional[float] = 30000.0  # National level baseline or custom portfolio
    riskConfidence: Optional[str] = "P90"     # "raw", "bias_corrected", "P75", "P90", "P95"
    dayAheadPricePerMWh: Optional[float] = 75.0
    imbalanceBuyPricePerMWh: Optional[float] = 120.0
    imbalanceSellPricePerMWh: Optional[float] = 40.0

class ProcurementInterval(BaseModel):
    startTime: str
    hour: int
    demandMW: float
    forecastWindMW: float
    actualWindMW: float
    procuredThermalMW: float
    netResidualShortfallMW: float # positive means utility was short (must buy at SBP)
    netResidualSurplusMW: float   # positive means utility was long (must dump at SSP)
    dayAheadCostGBP: float
    imbalanceCostGBP: float
    totalCostGBP: float

class ProcurementSimulationResponse(BaseModel):
    date: str
    riskConfidence: str
    appliedBufferMW: float
    totalDemandMWh: float
    totalForecastWindMWh: float
    totalActualWindMWh: float
    totalThermalProcuredMWh: float
    totalDayAheadCostGBP: float
    totalImbalanceCostGBP: float
    totalProcurementCostGBP: float
    unhedgedBaselineCostGBP: float
    costSavingsGBP: float
    shortfallHoursCount: int
    intervals: List[ProcurementInterval]
