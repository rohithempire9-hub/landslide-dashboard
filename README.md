# BHUSAKTHI

**AI-Based Early Warning & Landslide Risk Monitoring System in the North Eastern Region (NER)**

Smart India Hackathon software solution for PS 26001. The dashboard combines GIS visualisation, an explainable risk-fusion baseline, weather-linked forecasting, sensor telemetry concepts, road connectivity, emergency prioritisation and geo-tagged field reporting.

## What is implemented

- Command-centre dashboard with Critical / High / Moderate / Low risk levels
- Interactive GIS map for monitored NER hazard zones
- Weather-linked rainfall vs risk forecast
- Road connectivity status and emergency prioritisation
- Incident management API with MongoDB Atlas persistence and memory fallback
- Geo-tagged field reports with photo/video capture (small demo payloads)
- Evacuation warning workflow with browser notification/speech demo
- Response actions for field-team dispatch and road control logging
- Analytics view explaining the current risk-fusion model
- Low-network-friendly UI and a visible demo/API status indicator

## Important demo note

The repository does **not** contain trained ML weights, an IMD API integration, satellite-feed credentials, or a validated historical landslide dataset. Therefore the current dashboard labels its prediction layer as an **explainable weighted risk-fusion baseline**, not as a trained AI model. This is deliberate: do not claim model accuracy during judging unless validated model artefacts are added.

The baseline combines historical/geospatial susceptibility, rainfall, soil moisture and slope. It is designed so a validated ML inference service can replace the score function without changing the dashboard contract.

## Stack

Frontend: React 19, Vite, Tailwind CSS, React Leaflet, Recharts, Lucide

Backend: FastAPI, Pydantic, PyMongo, MongoDB Atlas

## Run frontend

```bash
npm install
npm run dev
```

Optional API override:

```bash
VITE_API_URL=http://localhost:8000
```

## Run backend

```bash
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

Environment variables:

- `MONGO_URI` — MongoDB Atlas connection string
- `FRONTEND_ORIGIN` — deployed frontend origin; leave unset for demo wildcard CORS

## SIH demo flow

1. Open **Command** and show the NER risk overview.
2. Click a red zone on the GIS map and explain the risk index inputs.
3. Open **Early Warning** and show rainfall-driven risk escalation.
4. Trigger **Broadcast evacuation warning** to demonstrate the response action.
5. Open **Incidents → New report**, capture GPS and attach evidence, then transmit it.
6. Return to **Incidents** and show the geo-tagged report in the incident queue.
7. Open **Response** and demonstrate prioritised operational actions.
8. Finish with **Analytics** and explain how the validated ML model will plug into the inference layer.

## Problem statement mapping

PS 26001 asks for real-time risk severity, GIS, weather-linked forecasts, emergency prioritisation, geo-tagged reporting, AI/ML readiness, alerts and scalable cloud architecture. The current prototype demonstrates the software workflow and keeps external integrations clearly separated so they can be connected to authorised IMD, satellite, sensor and historical datasets.
