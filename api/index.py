"""Vercel serverless entry point for FastAPI backend."""
import sys
import os
import traceback

# Add backend directory to Python path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Set VERCEL env so database uses /tmp
os.environ.setdefault("VERCEL", "1")

try:
    from app.main import app  # noqa: E402
except Exception as e:
    # If main app fails to import, create a minimal debug app
    from fastapi import FastAPI
    app = FastAPI()

    error_detail = traceback.format_exc()

    @app.get("/{path:path}")
    @app.post("/{path:path}")
    async def debug_error(path: str = ""):
        return {
            "error": "App failed to start",
            "detail": str(e),
            "traceback": error_detail,
            "env_keys": [k for k in os.environ.keys() if k.startswith(("DATABASE", "VERCEL", "PYTHON"))],
            "python_path": sys.path[:5],
        }
