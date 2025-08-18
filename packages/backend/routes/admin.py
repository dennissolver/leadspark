from fastapi import APIRouter, Request, HTTPException

router = APIRouter(prefix="/admin")

@router.get("/")
async def admin_overview(request: Request):
    if not request.state.tenant_id:
        raise HTTPException(status_code=403, detail="Tenant ID required")
    return {"message": f"Admin overview for tenant {request.state.tenant_id}"}