from models.input import ConversationInput
from services.elevenlabs_service import synthesize_speech
from services.supabase_service import save_conversation
from utils.prompt_builder import build_prompt

async def process_conversation(data: ConversationInput, tenant_id: str):
    prompt = build_prompt(data.userInput, data.conversationHistory)
    audio_url = await synthesize_speech(prompt)
    await save_conversation(tenant_id, data.userInput, prompt)
    return {"audioUrl": audio_url}