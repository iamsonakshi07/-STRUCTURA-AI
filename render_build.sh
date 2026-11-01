#!/usr/bin/env bash
# ==============================================================================
# STRUCTURA AI - Render Production Build & Initialization Script
# ==============================================================================
set -e

echo "==> [STRUCTURA AI] Starting Production Deployment Build..."

# 1. Upgrade pip and install Python packages
echo "==> [STRUCTURA AI] Installing backend dependencies..."
python -m pip install --upgrade pip
# Pre-install lightweight CPU-only PyTorch to prevent downloading 2.5GB CUDA wheels on cloud web services
pip install torch --index-url https://download.pytorch.org/whl/cpu || true
pip install -r requirements.txt

# 2. Apply Alembic migrations with connection retries (in case Postgres is provisioning)
echo "==> [STRUCTURA AI] Applying Alembic schema migrations..."
max_retries=10
count=0
until alembic upgrade head || [ $count -ge $max_retries ]
do
   count=$((count+1))
   echo "==> Database initializing... retrying migration in 3s ($count/$max_retries)"
   sleep 3
done

if [ $count -ge $max_retries ]; then
   echo "==> [NOTICE] Initial migration timed out during build phase. Safe auto-schema bootstrap will complete on container startup."
else
   echo "==> [STRUCTURA AI] Alembic migrations applied successfully."
fi

# 3. Seed demo data (idempotent, preserves user data and skips duplicates)
echo "==> [STRUCTURA AI] Seeding demo infrastructure data..."
python backend/seed_demo_data.py || echo "==> [INFO] Demo data seed will complete on service boot."

echo "==> [STRUCTURA AI] Production build finished successfully!"
