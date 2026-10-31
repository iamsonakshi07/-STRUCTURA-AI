# STRUCTURA AI – Premium Frontend Platform

Autonomous Infrastructure Health Monitoring and Structural Integrity Prediction Platform.

## Technology Stack
- **Framework**: React 18, Vite
- **Styling**: Tailwind CSS (Dark industrial theme, midnight navy `#101B2D`, electric cyan `#00C2D1`)
- **3D Digital Twin**: Three.js, React Three Fiber (`@react-three/fiber`), Drei (`@react-three/drei`)
- **Charts & Graphs**: Recharts
- **GIS Map**: Leaflet, React Leaflet (RFC 7946 GeoJSON)
- **Icons & Micro-Interactions**: Lucide React, Framer Motion
- **Networking**: Axios client with JWT bearer interceptors & WebSocket alerts (`/ws/alerts`)

## Launching the Frontend
From the repository root:

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server will start at: `http://localhost:5173/`

## Launching the Backend (FastAPI)
From the repository root:

```bash
./venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

FastAPI interactive OpenAPI docs: `http://127.0.0.1:8000/api/v1/docs`

## Evaluation Demo Credentials
- **Admin**: `admin@structura.ai` / `AdminPass123!`
- **Lead Inspector**: `inspector@structura.ai` / `InspectorPass123!`
*(You can also click the User Profile avatar in the top right to switch persona on the fly).*

## Built Pages & Modules
1. **Overview Dashboard** (`/`) – Real-time KPI sparklines, health distribution donut, defect horizontal bar chart, 6-month health trend, asset cards, and incident feeds.
2. **Infrastructure Registry** (`/infrastructure`) – Complete asset CRUD with PostGIS geocoding, specs, and modal views.
3. **AI Defect Detection Studio** (`/vision`) – Drone imagery dropzone, interactive detection canvas with zoom & overlays, and defect localization cards.
4. **Interactive 3D Digital Twin** (`/digital-twin`) – Stylized 3D bridge with Three.js orbit controls, 4 inspection layers, and clickable defect markers with component drawers.
5. **Sensor Intelligence Center** (`/sensors`) – 200 Hz live vibration waveform with threshold lines, sensor cards, bridge placement schematic, and anomaly injection button.
6. **RUL Prediction Center** (`/rul`) – Gradient boosting degradation regressor, residual lifespan in years/months, component breakdown, and physical factor explanations.
7. **Risk Assessment Center** (`/risk`) – 0-100 composite structural health gauge, multi-modal weighted breakdown, and portfolio risk comparison.
8. **Geospatial Intelligence Map** (`/geospatial`) – Interactive Leaflet GIS map with RFC 7946 GeoJSON markers, risk classification coloring, and density heatmap.
9. **Inspection Reports** (`/reports`) – Standardized official inspection dossier with print & PDF export support.
10. **Alerts & Notifications** (`/alerts`) – Live WebSocket incident dispatch, severity filters, and resolution actions.
11. **Settings & System Health** (`/settings`) – Real-time service diagnostics, API endpoints, and user session management.
12. **AI Structural Copilot** – Floating assistant answering contextual questions on infrastructure risk and anomalies.
