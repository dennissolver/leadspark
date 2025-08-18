from fastapi import FastAPI
from datetime import datetime

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "minimal test", "timestamp": datetime.utcnow().isoformat()}

@app.get("/health")
async def health():
    return {"status": "ok"}