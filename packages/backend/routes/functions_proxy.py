from fastapi import APIRouter, HTTPException, Request
import os
import httpx
from typing import Optional, Dict, Any

router = APIRouter()

# Your Supabase project ref (e.g., gpzezpfrmvywplrcesnt)
SUPABASE_REF = os.getenv("SUPABASE_REF", "gpzezpfrmvywplrcesnt")
BASE = f"https://{SUPABASE_REF}.functions.supabase.co"

# Optional now (handy when you enable JWT verification on functions later)
API_KEY = os.getenv("SUPABASE_KEY")

async def _call(fn: str, payload: Dict[str, Any], auth: Optional[str] = None) -> Dict[str, Any]:
    url = f"{BASE}/{fn}"
    headers = {"Content-Type": "application/json"}

    # Forward caller's Authorization header if present; else fall back to service key
    if auth:
        headers["Authorization"] = auth
    elif API_KEY:
        headers["apikey"] = API_KEY
        headers["Authorization"] = f"Bearer {API_KEY}"

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(url, json=payload, headers=headers)

    if r.status_code >= 400:
        raise HTTPException(status_code=r.status_code, detail=r.text)

    try:
        return r.json()
    except Exception:
        # In case the function returns non-JSON text
        return {"raw": r.text}

@router.post("/functions/book-discovery-call")
async def book_discovery_call(req: Request):
    data = await req.json()
    auth = req.headers.get("authorization")  # e.g., "Bearer <JWT>"
    return await _call("bookDiscoveryCall", data, auth)

@router.post("/functions/transfer-conversation")
async def transfer_conversation(req: Request):
    data = await req.json()
    auth = req.headers.get("authorization")
    return await _call("transferConversation", data, auth)
