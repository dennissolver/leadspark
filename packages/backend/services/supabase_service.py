import os
from supabase import create_client

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(supabase_url, supabase_key)

async def save_conversation(tenant_id: str, user_input: str, prompt: str):
    return supabase.table("conversations").insert({
        "tenant_id": tenant_id,
        "user_input": user_input,
        "system_prompt": prompt
    }).execute()