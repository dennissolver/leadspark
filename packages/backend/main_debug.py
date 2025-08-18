from fastapi import FastAPI
from datetime import datetime

# Start with just basic FastAPI
app = FastAPI(
    title="LeadSpark AI API Debug",
    description="Testing imports one by one",
    version="2.0.0"
)

@app.get("/")
async def root():
    return {
        "message": "LeadSpark AI API - Debug Mode",
        "timestamp": datetime.utcnow().isoformat(),
        "status": "testing imports"
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main_debug:app", host="0.0.0.0", port=8000, reload=True)