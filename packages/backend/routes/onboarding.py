from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from services.supabase_service import supabase, get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class OnboardingRequest(BaseModel):
    company_name: str
    user_id: str
    email: str

@router.post("/tenant")
async def onboard_tenant(request: Request, data: OnboardingRequest):
    try:
        tenant_id = request.state.tenant_id
        if not tenant_id:
            logger.error("No tenant_id found in request.state")
            raise HTTPException(status_code=403, detail="Tenant ID not provided")
        user = get_current_user(request)
        created_by = user.id if user else None
        if not created_by:
            logger.error("No authenticated user found")
            raise HTTPException(status_code=401, detail="User not authenticated")
        logger.debug(f"Inserting tenant: {data.company_name}, tenant_id: {tenant_id}, created_by: {created_by}")
        response = supabase.table("tenants").insert({
            "name": data.company_name,
            "id": tenant_id,
            "created_by": created_by,
            "config_json": "{}",
            "subscription_status": "trialing"
        }).execute()
        if not response.data:
            logger.error("Supabase insert failed: no data returned")
            raise HTTPException(status_code=500, detail="Failed to create tenant")
        return {"tenant_id": response.data[0]["id"], "message": "Tenant created successfully"}
    except Exception as e:
        logger.error(f"Error in onboard_tenant: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
