# STRUCTURA AI – PostgreSQL Database Setup & Administration Guide

This guide provides step-by-step instructions for installing, configuring, migrating, seeding, and administering the **PostgreSQL** database for the **STRUCTURA AI** platform on **macOS**.

---

## Architecture Overview

STRUCTURA AI utilizes **PostgreSQL** as its primary production relational database with:
- **Driver**: `psycopg` (Psycopg 3 with binary optimizations)
- **ORM / Query Engine**: SQLAlchemy 2.0 with connection pooling
- **Migrations**: Alembic version control
- **Repository Layer**: `backend/app/repositories/`
- **Database Name**: `structura_ai`

---

## 1. How to Install PostgreSQL on macOS

You can run PostgreSQL natively using Homebrew or Postgres.app, or run it in Docker.

### Option A: Using Homebrew (Recommended for macOS)

1. Open your macOS Terminal and install PostgreSQL (version 16):
   ```bash
   brew install postgresql@16
   ```

2. Start the PostgreSQL background service:
   ```bash
   brew services start postgresql@16
   ```

3. Ensure the PostgreSQL binaries are in your PATH (if not already added):
   ```bash
   echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

4. Verify installation:
   ```bash
   psql --version
   ```

---

### Option B: Using Docker (Containerized)

If you prefer containerized PostgreSQL without local system installations:
```bash
# Run PostgreSQL container with persistent volume
docker run -d \
  --name structura_postgres_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=structura_ai \
  -p 5432:5432 \
  -v structura_pgdata:/var/lib/postgresql/data \
  postgres:16-alpine
```

Or start the complete multi-service stack with Docker Compose:
```bash
docker compose up -d db
```

---

## 2. How to Create the `structura_ai` Database

If running PostgreSQL locally on macOS:

1. Connect to the default PostgreSQL prompt:
   ```bash
   psql -U postgres
   # or on standard macOS Homebrew where default user is your username:
   psql postgres
   ```

2. Create the `structura_ai` database and dedicated user:
   ```sql
   -- Create database
   CREATE DATABASE structura_ai;

   -- Optional: Create dedicated user if you don't use 'postgres'
   CREATE USER postgres WITH ENCRYPTED PASSWORD 'postgres';
   GRANT ALL PRIVILEGES ON DATABASE structura_ai TO postgres;
   ALTER DATABASE structura_ai OWNER TO postgres;

   -- Exit psql
   \q
   ```

3. Quick one-line terminal alternative:
   ```bash
   createdb structura_ai
   ```

---

## 3. How to Configure `.env`

Copy the environment template and configure your connection credentials:

```bash
# In the project root:
cp .env.example .env
```

Open `.env` in your editor and verify or update the `DATABASE_URL`:

```env
# =================================================================
# STRUCTURA AI - Environment Configuration
# =================================================================

# Full Connection URL (PostgreSQL + Psycopg 3 driver)
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/structura_ai

# Individual Connection Parameters
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=structura_ai

# Connection Pool Settings
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=1800

# Security & Secrets
SECRET_KEY=structura-super-secret-key-change-in-production-2026-xyz
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Mode
DEMO_MODE=true
```

> [!NOTE]
> When running inside Docker, the backend container automatically connects via `POSTGRES_SERVER=db` using internal service networking.

---

## 4. How to Run Database Migrations (Alembic)

STRUCTURA AI uses Alembic for declarative database versioning.

1. Activate your Python virtual environment:
   ```bash
   source venv/bin/activate
   ```

2. Apply all migrations up to head:
   ```bash
   alembic upgrade head
   ```

3. View current migration revision:
   ```bash
   alembic current
   ```

4. View migration history:
   ```bash
   alembic history --verbose
   ```

5. (Optional) Roll back the last migration:
   ```bash
   alembic downgrade -1
   ```

6. Generate static SQL preview without executing:
   ```bash
   alembic upgrade head --sql
   ```

---

## 5. How to Seed Demo Data & Start the Backend

### Step 5.1: Run the Database Seeder
Populate the database with infrastructure assets, defects, IoT telemetry, and ML models:

```bash
python backend/seed_demo_data.py
```

This populates:
- **Users**: Admin (`admin@structura.ai` / `AdminPass123!`), Inspector (`inspector@structura.ai` / `InspectorPass123!`)
- **Infrastructure**: Bridge A, Highway Overpass B, Dam C
- **Defects**: Crack (Red), Corrosion (Orange), Rebar Exposure (Yellow), Foundation Shift (Purple)
- **Sensor Readings**: 90 vibration and acceleration telemetry rows
- **ML Predictions**: RUL forecasts and structural health scores
- **Alerts**: Active critical and high alerts

### Step 5.2: Start the FastAPI Backend
```bash
./venv/bin/uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

Verify backend health and database connectivity:
```bash
curl http://localhost:8000/health
```
Expected output:
```json
{
  "success": true,
  "message": "System operational",
  "data": {
    "status": "healthy",
    "database": "connected",
    "database_message": "Successfully connected to POSTGRESQL database",
    "database_details": {
      "dialect": "postgresql",
      "driver": "psycopg"
    }
  }
}
```

Interactive API documentation is accessible at:
- Swagger UI: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- ReDoc: [http://localhost:8000/api/v1/redoc](http://localhost:8000/api/v1/redoc)

---

## 6. How to Open PostgreSQL in the Terminal

Open the built-in VS Code or macOS terminal (`Control + \``) and connect directly:

```bash
# Connect to structura_ai as postgres user:
psql -U postgres -d structura_ai -h localhost
```

If connecting via Docker:
```bash
docker exec -it structura_postgres_db psql -U structura_admin -d structura_ai
```

---

## 7. How to List All Tables

Inside the `psql` interactive prompt:

```sql
-- 1. List all tables in the current database
\dt

-- 2. List tables with size, owner, and storage info
\dt+

-- 3. Show Alembic migration version table
SELECT * FROM alembic_version;
```

Expected table output:
```text
               List of relations
 Schema |      Name       | Type  |  Owner   
--------+-----------------+-------+----------
 public | alembic_version | table | postgres
 public | alerts          | table | postgres
 public | defects         | table | postgres
 public | infrastructure  | table | postgres
 public | predictions     | table | postgres
 public | sensor_readings | table | postgres
 public | users           | table | postgres
(7 rows)
```

---

## 8. How to View Records from Each Table

Inside `psql`:

```sql
-- Turn on expanded table display for readable multi-column formatting
\x auto

-- 1. Infrastructure Assets
SELECT id, name, infrastructure_type, location, construction_year, material_type FROM infrastructure;

-- 2. AI Detected Structural Defects (All 4 Categories)
SELECT id, infrastructure_id, defect_type, severity, confidence, detected_at FROM defects;

-- 3. IoT Sensor Telemetry & Anomaly Scores
SELECT id, infrastructure_id, sensor_id, vibration, acceleration, is_anomaly, timestamp 
FROM sensor_readings 
ORDER BY timestamp DESC 
LIMIT 10;

-- 4. Machine Learning RUL Predictions
SELECT id, infrastructure_id, predicted_rul, risk_level, confidence, health_score, prediction_date 
FROM predictions;

-- 5. Active System Alerts
SELECT id, infrastructure_id, alert_type, severity, status, message, created_at 
FROM alerts 
WHERE status = 'ACTIVE';

-- 6. User Accounts
SELECT id, name, email, role, is_active, created_at FROM users;
```

---

## 9. How to Insert, Update, and Query Records Safely

### A. Insert a New Monitored Asset
```sql
INSERT INTO infrastructure (
    name, infrastructure_type, location, latitude, longitude, 
    construction_year, material_type, created_at, updated_at
) VALUES (
    'Tunnel D – Cascades Mountain Bore', 'tunnel', 'Stevens Pass, WA', 
    47.7445, -121.0889, 1985, 'reinforced_concrete', NOW(), NOW()
) RETURNING id, name;
```

### B. Insert a New Defect Record
```sql
INSERT INTO defects (
    infrastructure_id, defect_type, severity, confidence, 
    image_path, processed_image_path, bounding_box, detected_at, created_at
) VALUES (
    1, 'foundation_shift', 'HIGH', 0.91, 
    'uploads/bridge_pier_scan.jpg', 'processed/annotated_bridge_pier_scan.jpg',
    '{"x1": 80, "y1": 320, "x2": 450, "y2": 460}', NOW(), NOW()
);
```

### C. Update Alert Status
```sql
UPDATE alerts 
SET status = 'RESOLVED' 
WHERE id = 1;
```

### D. Complex Diagnostic Query: High-Risk Assets with Active Critical Alerts
```sql
SELECT 
    i.id AS asset_id,
    i.name AS asset_name,
    i.infrastructure_type,
    p.health_score,
    p.risk_level,
    COUNT(d.id) AS total_defects,
    COUNT(a.id) AS critical_alerts
FROM infrastructure i
LEFT JOIN predictions p ON i.id = p.infrastructure_id
LEFT JOIN defects d ON i.id = d.infrastructure_id
LEFT JOIN alerts a ON i.id = a.infrastructure_id AND a.severity = 'CRITICAL' AND a.status = 'ACTIVE'
GROUP BY i.id, i.name, i.infrastructure_type, p.health_score, p.risk_level
ORDER BY p.health_score ASC;
```

---

## 10. How to Connect PostgreSQL with VS Code using Extensions

### Recommended Extension: **SQLTools** + **SQLTools PostgreSQL/Cockroach Driver**

1. In VS Code, open Extensions (`Cmd + Shift + X`).
2. Search and install:
   - **SQLTools** (`mtxr.sqltools`)
   - **SQLTools PostgreSQL/Cockroach Driver** (`mtxr.sqltools-driver-pg`)
3. Click the **SQLTools** icon on the VS Code Activity Bar (left sidebar).
4. Click **Add New Connection** and select **PostgreSQL**.
5. Fill in the connection settings:
   - **Connection Name**: `STRUCTURA AI (Local)`
   - **Server Address**: `localhost`
   - **Port**: `5432`
   - **Database Name**: `structura_ai`
   - **Username**: `postgres` (or `structura_admin` for Docker)
   - **Password**: `postgres` (or `structura_secure_pass_2026`)
6. Click **Test Connection** to confirm connectivity.
7. Click **Save Connection** and **Connect**.
8. You can now browse all tables, expand column definitions, view row data in tabs, and run SQL queries with autocomplete.

---

## Troubleshooting & Maintenance

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| `connection to server at "127.0.0.1", port 5432 failed` | PostgreSQL service not running | Run `brew services start postgresql@16` or `docker compose up -d db` |
| `database "structura_ai" does not exist` | Database not yet created | Run `createdb structura_ai` or `psql -U postgres -c "CREATE DATABASE structura_ai;"` |
| `password authentication failed for user "postgres"` | Incorrect password in `.env` | Update `POSTGRES_PASSWORD` in `.env` to match your local PostgreSQL password |
| `alembic: command not found` | Virtual environment inactive | Run `source venv/bin/activate` before executing Alembic commands |
| `fe_sendauth: no password supplied` | Password required by pg_hba.conf | Ensure password is included in `.env`: `postgresql+psycopg://user:password@localhost:5432/structura_ai` |
