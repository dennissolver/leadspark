import httpx
import os

class ElevenLabsService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.elevenlabs.io/v1"
        self.headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json"
        }

    async def synthesize_speech(self, text: str) -> str:
        url = f"{self.base_url}/text-to-speech"
        payload = {
            "text": text,
            "voice": "Rachel"
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json().get("audio_url")
