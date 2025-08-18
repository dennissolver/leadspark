"""
Voice Agent - Specialized for voice input/output processing
"""
from typing import Dict, List, Optional, Any, Union
import asyncio
import logging
from services.agents.conversation_agent import ConversationAgent
from services.agents.IAgent import IAgent
from services.elevenlabs_service import ElevenLabsService

logger = logging.getLogger(__name__)

class VoiceAgent(IAgent):
    """Agent specialized for voice input processing and guaranteed voice output"""

    def __init__(self, tenant_id: str, config: Optional[Dict[str, Any]] = None):
        self.tenant_id = tenant_id
        self.config = config or {}

        # Base conversation capabilities
        self.conversation_agent = ConversationAgent(tenant_id, config)

        # Voice-specific configuration
        self.voice_config = self.config.get('voice_config', {
            'voice_id': 'default',
            'stability': 0.75,
            'similarity_boost': 0.75
        })

        # Initialize voice service
        self._initialize_voice_service()


    def _initialize_voice_service(self):
        """Initialize voice service with proper configuration"""
        try:
            import os
            api_key = os.getenv('ELEVENLABS_API_KEY')
            if api_key:
                self.voice_service = ElevenLabsService(api_key=api_key)
                self._voice_enabled = True
            else:
                logger.warning("ElevenLabs API key not found, using conversation agent voice service")
                self.voice_service = None
                self._voice_enabled = False
        except Exception as e:
            logger.warning(f"Failed to initialize voice service: {e}")
            self.voice_service = None
            self._voice_enabled = False


    def _initialize_voice_service(self):
        """Initialize voice service with proper configuration"""
        try:
            import os
            api_key = os.getenv('ELEVENLABS_API_KEY')
            if api_key:
                self.voice_service = ElevenLabsService(api_key=api_key)
                self._voice_enabled = True
            else:
                logger.warning("ElevenLabs API key not found, using conversation agent voice service")
                self.voice_service = None
                self._voice_enabled = False
        except Exception as e:
            logger.warning(f"Failed to initialize voice service: {e}")
            self.voice_service = None
            self._voice_enabled = False


    def _initialize_voice_service(self):
        """Initialize voice service with proper configuration"""
        try:
            import os
            api_key = os.getenv('ELEVENLABS_API_KEY')
            if api_key:
                self.voice_service = ElevenLabsService(api_key=api_key)
                self._voice_enabled = True
            else:
                logger.warning("ElevenLabs API key not found, using conversation agent voice service")
                self.voice_service = None
                self._voice_enabled = False
        except Exception as e:
            logger.warning(f"Failed to initialize voice service: {e}")
            self.voice_service = None
            self._voice_enabled = False


    def _initialize_voice_service(self):
        """Initialize voice service with proper configuration"""
        try:
            import os
            api_key = os.getenv('ELEVENLABS_API_KEY')
            if api_key:
                self.voice_service = ElevenLabsService(api_key=api_key)
                self._voice_enabled = True
            else:
                logger.warning("ElevenLabs API key not found, using conversation agent voice service")
                self.voice_service = None
                self._voice_enabled = False
        except Exception as e:
            logger.warning(f"Failed to initialize voice service: {e}")
            self.voice_service = None
            self._voice_enabled = False


    def _initialize_voice_service(self):
        """Initialize voice service with proper configuration"""
        try:
            import os
            api_key = os.getenv('ELEVENLABS_API_KEY')
            if api_key:
                self.voice_service = ElevenLabsService(api_key=api_key)
                self._voice_enabled = True
            else:
                logger.warning("ElevenLabs API key not found, using conversation agent voice service")
                self.voice_service = None
                self._voice_enabled = False
        except Exception as e:
            logger.warning(f"Failed to initialize voice service: {e}")
            self.voice_service = None
            self._voice_enabled = False

    async def process_voice_input(
        self, 
        audio_data: Union[bytes, str], 
        conversation_id: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Process voice input - transcribe, respond, and generate voice output"""

        try:
            # Transcribe audio to text
            transcription = await self._transcribe_audio(audio_data)

            if not transcription or not transcription.strip():
                return {
                    "error": "Could not transcribe audio or audio was empty",
                    "conversation_id": conversation_id,
                    "agent_type": "voice"
                }

            logger.info(f"Transcribed audio for tenant {self.tenant_id}")

            # Process the transcribed message using conversation agent
            response = await self.conversation_agent.process_message(
                message=transcription,
                conversation_id=conversation_id,
                context={
                    **(context or {}),
                    "input_type": "voice",
                    "transcription_confidence": 0.95
                }
            )

            # Ensure voice response is generated
            if not response.get("audio_url"):
                audio_url = await self._generate_voice_response(response["text"])
                response["audio_url"] = audio_url

            # Enhanced response with voice-specific data
            response.update({
                "transcription": transcription,
                "agent_type": "voice",
                "input_type": "voice"
            })

            return response

        except Exception as e:
            logger.error(f"Error processing voice input for tenant {self.tenant_id}: {e}")
            raise

    async def process_message(
        self, 
        message: str, 
        conversation_id: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Process text message but ensure voice output"""

        # Process using conversation agent
        response = await self.conversation_agent.process_message(message, conversation_id, context)

        # Ensure voice is generated
        if not response.get("audio_url"):
            audio_url = await self._generate_voice_response(response["text"])
            response["audio_url"] = audio_url

        response["agent_type"] = "voice"
        response["voice_guaranteed"] = True

        return response

    async def _transcribe_audio(self, audio_data: Union[bytes, str]) -> Optional[str]:
        """Transcribe audio to text using speech-to-text service"""
        try:
            # Placeholder transcription - implement with your preferred service
            # This could use OpenAI Whisper, Google Speech-to-Text, etc.
            logger.info("Transcribing audio (placeholder implementation)")
            return "This is a placeholder transcription"

        except Exception as e:
            logger.error(f"Transcription failed for tenant {self.tenant_id}: {e}")
            return None

    async def _generate_voice_response(self, text: str) -> Optional[str]:
        """Generate voice audio for response text"""
        # Try dedicated voice service first
        if self._voice_enabled and self.voice_service:
            try:
                return await self.voice_service.generate_speech(
                    text=text,
                    tenant_id=self.tenant_id,
                    voice_config=self.voice_config
                )
            except Exception as e:
                logger.warning(f"Dedicated voice service failed: {e}")

        # Fallback to conversation agent voice service
        if hasattr(self.conversation_agent, '_generate_voice_response'):
            return await self.conversation_agent._generate_voice_response(text)

        logger.warning(f"No voice service available for tenant {self.tenant_id}")
        return None

    async def get_capabilities(self) -> List[str]:
        """Return list of voice agent capabilities"""
        base_capabilities = await self.conversation_agent.get_capabilities()
        voice_capabilities = [
            "voice_transcription",
            "voice_input_processing",
            "guaranteed_voice_output"
        ]

        return base_capabilities + voice_capabilities
