import os
from fastapi import APIRouter, Request
from services.conversation_service import ConversationService
from services.supabase_service import SupabaseService
from services.elevenlabs_service import ElevenLabsService
from models.input import ConversationInput

router = APIRouter()

# Initialize services with API keys from environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

supabase_service = SupabaseService(SUPABASE_URL, SUPABASE_KEY)
elevenlabs_service = ElevenLabsService(ELEVENLABS_API_KEY)
conversation_service = ConversationService(supabase_service, elevenlabs_service)

@router.post("/api/conversation/start")
def start_conversation():
    # Placeholder for conversation start logic
    return {"message": "Conversation started."}

@router.post("/api/conversation/message")
def handle_message(message: str):
    # Placeholder for conversation message handling logic
    return {"message": "Message received."}

@router.post("/api/conversation/converse")
async def converse(input_data: ConversationInput, request: Request):
    tenant_id = request.headers.get("x-tenant-id")
    if not tenant_id:
        return {"error": "Missing tenant ID"}
    return await conversation_service.process_conversation(input_data, tenant_id)
