#!/usr/bin/env python3
"""
STRUCTURA AI - Database Seeding Entry Point (Root Proxy).
Delegates to backend.seed_demo_data.seed_all()
"""
import sys
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.seed_demo_data import seed_all

if __name__ == "__main__":
    success = seed_all()
    sys.exit(0 if success else 1)
