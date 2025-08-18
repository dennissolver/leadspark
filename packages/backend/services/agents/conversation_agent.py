"""
Conversation Agent - Wraps conversation service with agent interface
"""
from typing import Dict, List, Optional, Any
import asyncio
import logging
from services.agents.IAgent import IAgent
from services.conversation_service import ConversationService
from services.elevenlabs_service import ElevenLabsService
from services.supabase_service import SupabaseService
from utils.prompt_builder import PromptBuilder

logger = logging.getLogger(__name__)

class ConversationAgent(IAgent):
    """Agent that handles standard conversation flows with optional voice output"""

    def __init__(self, tenant_id: str, config: Optional[Dict[str, Any]] = None):
        self.tenant_id = tenant_id
        self.config = config or {}
        self.conversation_service = ConversationService()
        self.supabase_service = SupabaseService()
        self.prompt_builder = PromptBuilder()

        # Initialize voice service with proper config
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
                logger.warning("ElevenLabs API key not found, voice features disabled")
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
                logger.warning("ElevenLabs API key not found, voice features disabled")
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
                logger.warning("ElevenLabs API key not found, voice features disabled")
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
                logger.warning("ElevenLabs API key not found, voice features disabled")
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
                logger.warning("ElevenLabs API key not found, voice features disabled")
                self.voice_service = None
                self._voice_enabled = False
        except Exception as e:
            logger.warning(f"Failed to initialize voice service: {e}")
            self.voice_service = None
            self._voice_enabled = False

    async def process_message(
        self, 
        message: str, 
        conversation_id: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process a conversation message and return response with optional voice
        """
        try:
            # Get conversation history for context
            conversation_history = await self.conversation_service.get_conversation_history(
                conversation_id, self.tenant_id, limit=10
            )

            # Get relevant knowledge base context
            kb_context = await self._get_knowledge_base_context(message)

            # Build enhanced prompt with context
            enhanced_prompt = await self.prompt_builder.build_conversation_prompt(
                message=message,
                conversation_history=conversation_history,
                knowledge_base=kb_context,
                tenant_config=self.config,
                additional_context=context
            )

            # Get LLM response using existing conversation service
            llm_response = await self.conversation_service.get_llm_response(
                enhanced_prompt,
                model=self.config.get('default_model', 'gpt-4'),
                tenant_id=self.tenant_id
            )

            # Store conversation in database
            await self.conversation_service.store_message(
                conversation_id=conversation_id,
                user_message=message,
                assistant_message=llm_response,
                tenant_id=self.tenant_id,
                metadata={
                    "agent_type": "conversation",
                    "kb_context_used": len(kb_context) > 0,
                    "model_used": self.config.get('default_model', 'gpt-4'),
                    "context": context
                }
            )

            # Generate voice if enabled
            audio_url = None
            if self.config.get('voice_enabled', True):
                audio_url = await self._generate_voice_response(llm_response)

            return {
                "text": llm_response,
                "audio_url": audio_url,
                "conversation_id": conversation_id,
                "agent_type": "conversation",
                "context_used": len(kb_context),
                "model_used": self.config.get('default_model', 'gpt-4'),
                "capabilities": await self.get_capabilities()
            }

        except Exception as e:
            logger.error(f"Error processing message for tenant {self.tenant_id}: {e}")
            raise

    async def _get_knowledge_base_context(self, message: str, limit: int = 3) -> List[Dict]:
        """Get relevant knowledge base entries for the message"""
        try:
            kb_entries = await self.supabase_service.search_knowledge_base(
                tenant_id=self.tenant_id,
                query=message,
                limit=limit
            )
            return kb_entries
        except Exception as e:
            logger.warning(f"Failed to get KB context: {e}")
            return []

    async def _generate_voice_response(self, text: str) -> Optional[str]:
        """Generate voice audio for response text"""
        if not self._voice_enabled or not self.voice_service:
            return None

        try:
            return await self.voice_service.generate_speech(
                text=text,
                tenant_id=self.tenant_id,
                voice_config=self.config.get('voice_config', {})
            )
        except Exception as e:
            logger.warning(f"Failed to generate voice: {e}")
            return None

    async def get_capabilities(self) -> List[str]:
        """Return list of agent capabilities"""
        capabilities = [
            "conversation",
            "knowledge_base_search",
            "context_awareness",
            "conversation_history"
        ]

        if self._voice_enabled and self.config.get('voice_enabled', True):
            capabilities.append("voice_generation")

        return capabilities
