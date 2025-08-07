import os
from supabase import create_client

class SupabaseService:
    def __init__(self, supabase_url: str, supabase_key: str):
        self.supabase_url = supabase_url
        self.supabase_key = supabase_key
        self.supabase = create_client(supabase_url, supabase_key)

    async def save_conversation(self, tenant_id: str, user_input: str, prompt: str):
        return self.supabase.table("conversations").insert({
            "tenant_id": tenant_id,
            "user_input": user_input,
            "system_prompt": prompt
        }).execute()
