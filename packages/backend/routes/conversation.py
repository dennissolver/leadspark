from fastapi import APIRouter, Request, Depends
from typing import Dict, Any
from services.conversation_service import ConversationService

router = APIRouter()

@router.post("/conversations")
async def create_conversation(request: Request, data: Dict[str, Any]):
    service = ConversationService()
    return await service.create_conversation(request, data)
