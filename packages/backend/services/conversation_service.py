from models.input import ConversationInput
from services.elevenlabs_service import ElevenLabsService
from services.supabase_service import SupabaseService
from utils.prompt_builder import build_prompt

class ConversationService:
    def __init__(self, supabase_service: SupabaseService, elevenlabs_service: ElevenLabsService):
        self.supabase_service = supabase_service
        self.elevenlabs_service = elevenlabs_service

    async def process_conversation(self, data: ConversationInput, tenant_id: str):
        prompt = build_prompt(data.userInput, data.conversationHistory)
        audio_url = await self.elevenlabs_service.synthesize_speech(prompt)
        await self.supabase_service.save_conversation(tenant_id, data.userInput, prompt)
        return {"audioUrl": audio_url}
