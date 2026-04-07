"""Debug: show what path Vercel sends to the function."""
from fastapi import FastAPI, Request

app = FastAPI()

@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def debug(request: Request, path: str = ""):
    return {
        "path": path,
        "url": str(request.url),
        "method": request.method,
        "base_url": str(request.base_url),
        "root_path": request.scope.get("root_path", ""),
    }
