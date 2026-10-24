# UK Renewable Wind Day-Ahead Procurement & Forecast Error Quantifier

Enterprise Analytics & Decision Support Tool tailored for UK Energy Utilities trading in Day-Ahead Wholesale Electricity Markets.

---

## 1. Problem Statement & Domain Context

An energy utility in the UK needs to buy electricity from the wholesale market to meet consumer electricity demand. Power purchase decisions in the **UK Day-Ahead Market (EPEX SPOT / Nord Pool)** must be committed one day prior to delivery ($D-1$), before the **11:00 GMT Gate Closure**.

To serve consumers reliably and cost-effectively:
1. The desk must determine how much conventional/thermal power needs to be procured to cover the gap left by renewable wind generation.
2. Because wind generation is weather-dependent, power purchase decisions rely heavily on Day-Ahead wind forecasts.
3. If wind underperforms relative to forecast, the utility is forced short into the real-time **Balancing Mechanism (BM)**, incurring punitive **System Buy Price (SBP)** cash-out imbalance penalties.

### Objectives of this Solution:
- **Understand Latest Available Forecasts**: Filter forecasts strictly by the $D-1$ 11:00 GMT Gate Closure cutoff to eliminate lookahead bias.
- **Quantify Forecast Error & Statistical Risk**: Calculate standard and robust error metrics (MAE, RMSE, Bias, WAPE, $R^2$, and P5–P95 quantiles).
- **Hedge Procurement Decisions**: Model dynamic thermal reserve margins to balance wholesale auction procurement costs against balancing cash-out penalties.

---

## 2. Data Sources & January 2026 Scope

This application exclusively analyzes national-level actuals and forecasts published by **Elexon BMRS** across all 744 hours (1,488 settlement periods) of **January 2026**:

1. **Actual Wind Generation (`FUELHH`)**:
   - Source: `https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream`
   - Filtered on: `fuelType = "WIND"`
   - Fields used: `startTime` (30-min settlement period), `generation` (MW).
2. **Forecasted Wind Generation (`WINDFOR`)**:
   - Source: `https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream`
   - Fields used: `startTime` (forecast delivery period), `publishTime` (forecast creation time), `generation` (forecasted MW).
   - Gate Closure: Evaluates the latest forecast batch published on or prior to $D-1$ 11:00 GMT for the target delivery date.

---

## 3. Key Quantitative Findings (January 2026)

- **Systemic Over-Forecast Bias (+1,840 MW Mean Bias)**: The national Day-Ahead forecast systematically over-predicted wind generation in ~73.8% of intervals throughout January 2026.
- **High Dispersion**: MAE of **~2,122 MW** and RMSE of **~2,649 MW** with a WAPE of **21.4%**.
- **Diurnal Risk Concentration**: Peak forecast over-prediction occurs during peak evening demand hours (17:00–20:00 GMT), precisely when power prices and balancing cash-out spreads are highest.
- **Financial Impact**: Operating on raw P50 forecasts creates severe short imbalance exposure; sizing thermal procurement to a P90 buffer mitigates high SBP cash-out penalties.

---

## 4. Directory & File Structure

```
Gridbricks/
├── docker-compose.yml              # Multi-container orchestration (FastAPI + Nginx React)
├── vercel.json                     # Vercel deployment & routing configuration
├── .gitignore                      # Git exclusion rules (dependencies, cache, build artifacts)
├── README.md                       # Comprehensive system documentation
│
├── backend/
│   ├── Dockerfile                  # Python container build definition
│   ├── requirements.txt            # Python dependencies (FastAPI, NumPy, Pydantic, Pytest)
│   ├── run.py                      # Uvicorn production server runner
│   │
│   ├── app/
│   │   ├── main.py                 # FastAPI application, CORS, routers & static serving
│   │   ├── config.py               # Global settings, paths, and default gate closure times
│   │   │
│   │   ├── data/                   # Pre-cached January 2026 Elexon datasets
│   │   │   ├── fuelhh_jan2026.json # Actual wind generation records
│   │   │   └── windfor_jan2026.json# Wind forecast generation records
│   │   │
│   │   ├── models/
│   │   │   └── schemas.py          # Pydantic validation schemas
│   │   │
│   │   ├── services/
│   │   │   ├── elexon_client.py    # Ingestion & live API polling client for BMRS
│   │   │   ├── matching_engine.py  # D-1 gate cutoff logic & temporal resolution alignment
│   │   │   ├── metrics_engine.py   # Statistical engine (MAE, RMSE, Bias, quantiles, diurnal)
│   │   │   └── procurement_engine.py # Thermal reserve margin & balancing cost optimizer
│   │   │
│   │   └── routers/
│   │       ├── overview.py         # Summary statistics & executive scorecard endpoint
│   │       ├── forecasts.py        # Day-ahead matched pairs & evolution endpoints
│   │       ├── metrics.py          # Detailed quantitative accuracy & distribution endpoints
│   │       └── procurement.py      # Interactive procurement risk simulation endpoint
│   │
│   └── tests/
│       └── test_all.py             # Pytest automated test suite (endpoints, math & engines)
│
└── frontend/
    ├── Dockerfile                  # Production Nginx frontend container
    ├── nginx.conf                  # Nginx configuration & API proxy pass
    ├── package.json                # React 19, Vite, Lucide-React dependencies
    ├── vite.config.js              # Vite bundler configuration & local backend proxy
    ├── index.html                  # HTML entry point with enterprise typography
    │
    ├── public/
    │   ├── favicon.svg             # Utility brand icon
    │   └── data/                   # Bundled JSON for standalone serverless deployment
    │       ├── fuelhh_jan2026.json
    │       └── windfor_jan2026.json
    │
    └── src/
        ├── main.jsx                # React root mount
        ├── App.jsx                 # Main layout, tab navigation & modal controllers
        ├── index.css               # Design system tokens, dark theme & responsive styles
        ├── App.css                 # Component-specific styles
        │
        ├── services/
        │   └── api.js              # Dual-mode API (hits FastAPI or client-side fallback)
        │
        └── components/
            ├── Header.jsx          # Header with gate closure picker & pitch/tech openers
            ├── DayAheadView.jsx    # Time-series actual vs forecast with residual chart
            ├── QuantitativeMetricsView.jsx # Error scorecards, quantiles & diurnal curves
            ├── ForecastEvolutionView.jsx   # Forecast run evolution across lead times
            ├── ProcurementSimulatorView.jsx# Thermal procurement & cash-out hedge simulator
            ├── DataExplorerView.jsx# Raw record browser, search & CSV export
            ├── ClientPitchModal.jsx# In-app executive pitch deck for utility buyers
            └── TechLeadModal.jsx   # In-app architecture & mathematical design review
```

---

## 5. How to Start the Application

### Option 1: Quickstart via Docker Compose (Recommended)

Ensure [Docker](https://www.docker.com/) is installed and running, then execute from the project root:

```bash
docker-compose up --build
```

- **Frontend (Web Application)**: [http://localhost:3000](http://localhost:3000)
- **Backend API Docs (Swagger / OpenAPI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Backend Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

To stop the containers:
```bash
docker-compose down
```

---

### Option 2: Running Locally Without Docker

#### Step 1: Run the Backend (Python 3.10+)

1. Navigate to the backend directory and set up a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux / macOS:
   source venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the backend server:
   ```bash
   python run.py
   ```
   The backend will be running at `http://localhost:8000`.

#### Step 2: Run the Frontend (Node.js 18+)

1. In a separate terminal, navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

### Running the Test Suite

Execute the automated backend test suite covering API endpoints, matching logic, and statistical calculations:

```bash
cd backend
pytest -v tests/test_all.py
```

---

## 6. Deployment to Vercel

The application is structured with a **dual-mode architecture** for serverless deployment:
- `vercel.json` is configured to build `frontend/` into static files.
- `frontend/src/services/api.js` includes an automatic client-side calculation fallback utilizing the pre-bundled data in `/public/data`. If the FastAPI backend is not connected, all matching, statistical distributions, diurnal profiles, and procurement simulations run directly in-browser.

To deploy via Vercel CLI:
```bash
vercel --prod
```
Or link this GitHub repository directly to [Vercel](https://vercel.com).

---

## 7. Client Pitch & Technical Lead Review

The application includes two interactive, standalone presentation modals built directly into the UI:

- **Client Pitch Deck (`ClientPitchModal`)**:
  - Outlines the wholesale day-ahead procurement challenge.
  - Explains the financial risks of the Balancing Mechanism (SBP penalties).
  - Demonstrates how quantified error buffers optimize procurement and yield immediate net savings.
  - Access via the **"Client Pitch Deck"** button in the header.

- **Technical Lead Architecture Review (`TechLeadModal`)**:
  - Explains the architectural split (FastAPI + React 19 + Docker).
  - Outlines the Elexon ingestion pipeline and half-hour to hourly temporal resolution reconciliation.
  - Reviews mathematical formulas for MAE, RMSE, WAPE, quantiles, and thermal reserve calculations.
  - Access via the **"Tech Lead Review"** button in the header.

---

## 8. AI Tools Explicit Disclosure

In compliance with the project guidelines, AI tools (including Google DeepMind Antigravity and Large Language Models) were utilized during the design and development of this application for:
- Accelerating frontend component structuring and responsive styling.
- Generating boilerplate schemas, Docker configurations, and unit tests.
- Assisting in the mathematical verification of statistical error metrics.
All domain business logic, Elexon data integration, gate closure cutoff filtering, and financial simulation mechanics were reviewed, tested, and validated for correctness.

---
# LIVE DEMO LINK:

https://wfproject-rust.vercel.app/
