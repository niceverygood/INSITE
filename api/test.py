"""Minimal test function to verify Vercel Python runtime works."""
from fastapi import FastAPI

app = FastAPI()

@app.get("/api/test")
async def test():
    return {"status": "ok", "message": "Python function is working!"}
