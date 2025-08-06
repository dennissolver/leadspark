from fastapi import APIRouter, Request
from services.conversation_service import process_conversation
from models.input import ConversationInput

router = APIRouter()

@router.post("/")
async def converse(input_data: ConversationInput, request: Request):
    tenant_id = request.headers.get("x-tenant-id")
    if not tenant_id:
        return {"error": "Missing tenant ID"}
    return await process_conversation(input_data, tenant_id)