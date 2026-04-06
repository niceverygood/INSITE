"""Vercel serverless entry point — backend service."""
import sys
import os

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app  # noqa: E402

# Vercel expects `app` or `handler` at module level — FastAPI works as ASGI app
