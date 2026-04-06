"""Vercel serverless entry point for FastAPI backend."""
import sys
import os

# Add backend directory to Python path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Set VERCEL env so database uses /tmp
os.environ.setdefault("VERCEL", "1")

from app.main import app  # noqa: E402
