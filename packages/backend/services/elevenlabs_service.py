import httpx
import os

async def synthesize_speech(text: str) -> str:
    api_key = os.getenv("ELEVENLABS_API_KEY")
    url = "https://api.elevenlabs.io/v1/text-to-speech"
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json"
    }
    payload = {
        "text": text,
        "voice": "Rachel"
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json().get("audio_url")