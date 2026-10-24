import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

from backend.app.routers import overview, forecasts, metrics, procurement

app = FastAPI(
    title="UK Renewable Wind Day-Ahead Procurement & Forecast Error Quantifier",
    description="Enterprise Analytics & Decision Support Tool for UK Energy Utilities trading in Day-Ahead Wholesale Power Markets.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(overview.router)
app.include_router(forecasts.router)
app.include_router(metrics.router)
app.include_router(procurement.router)

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "Gridbricks-DayAhead-Backend",
        "version": "1.0.0"
    }

# If frontend static build exists, serve it
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")
    if (FRONTEND_DIST / "data").exists():
        app.mount("/data", StaticFiles(directory=FRONTEND_DIST / "data"), name="data")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")
