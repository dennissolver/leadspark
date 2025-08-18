"""
Consensus Agent - Handles multi-model consensus for high-stakes conversations
"""
from typing import Dict, List, Optional, Any
import asyncio
import logging
from services.agents.conversation_agent import ConversationAgent
from services.agents.IAgent import IAgent
from services.llm_consensus_service import LLMConsensusService
from services.async_consensus_handler import AsyncConsensusHandler
from services.async_consensus_processor import AsyncConsensusProcessor

logger = logging.getLogger(__name__)

class ConsensusAgent(IAgent):
    """Agent that uses multiple AI models to reach consensus on responses"""

    def __init__(self, tenant_id: str, config: Optional[Dict[str, Any]] = None):
        self.tenant_id = tenant_id
        self.config = config or {}

        # Initialize services
        self.llm_consensus_service = LLMConsensusService()
        self.consensus_handler = AsyncConsensusHandler()
        self.consensus_processor = AsyncConsensusProcessor()

        # Fallback to conversation agent
        self.fallback_agent = ConversationAgent(tenant_id, config)

        # Default consensus models
        self.consensus_models = self.config.get('consensus_models', [
            'gpt-4',
            'claude-3-sonnet',
            'gemini-pro'
        ])

        # Consensus settings
        self.confidence_threshold = self.config.get('confidence_threshold', 0.75)
        self.max_consensus_time = self.config.get('max_consensus_time', 30)

    async def process_message(
        self, 
        message: str, 
        conversation_id: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Process message using multi-model consensus"""

        try:
            # Check if consensus is enabled for this tenant
            if not self.config.get('consensus_enabled', False):
                logger.info(f"Consensus disabled for tenant {self.tenant_id}, falling back")
                return await self.fallback_agent.process_message(message, conversation_id, context)

            # Get consensus response from multiple models
            consensus_result = await self.llm_consensus_service.get_consensus_response(
                message, 
                models=self.consensus_models
            )

            # Analyze consensus quality
            consensus_analysis = await self._analyze_consensus_quality(consensus_result)

            # Use consensus if confidence is high enough
            if consensus_analysis['confidence'] >= self.confidence_threshold:
                final_response = consensus_result['consensus']
                logger.info(f"Using consensus response (confidence: {consensus_analysis['confidence']:.2f})")
            else:
                logger.warning(f"Low consensus confidence, using fallback")
                return await self.fallback_agent.process_message(message, conversation_id, context)

            # Store consensus conversation
            await self.fallback_agent.conversation_service.store_message(
                conversation_id=conversation_id,
                user_message=message,
                assistant_message=final_response,
                tenant_id=self.tenant_id,
                metadata={
                    "agent_type": "consensus",
                    "consensus_confidence": consensus_analysis['confidence'],
                    "models_used": self.consensus_models,
                    "individual_responses": consensus_result['individual_responses'],
                    "context": context
                }
            )

            # Generate voice if enabled
            audio_url = None
            if self.config.get('voice_enabled', True):
                audio_url = await self.fallback_agent._generate_voice_response(final_response)

            return {
                "text": final_response,
                "audio_url": audio_url,
                "conversation_id": conversation_id,
                "agent_type": "consensus",
                "consensus_data": {
                    "confidence": consensus_analysis['confidence'],
                    "models_used": self.consensus_models,
                    "individual_responses": consensus_result['individual_responses']
                },
                "capabilities": await self.get_capabilities()
            }

        except Exception as e:
            logger.error(f"Error in consensus processing for tenant {self.tenant_id}: {e}")
            return await self.fallback_agent.process_message(message, conversation_id, context)

    async def _analyze_consensus_quality(self, consensus_result: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze the quality and agreement of consensus responses"""
        responses = consensus_result.get('individual_responses', [])

        if len(responses) < 2:
            return {"confidence": 0.0, "agreement_score": 0.0}

        # Simple consensus analysis - calculate agreement
        all_words = []
        for response in responses:
            all_words.extend(response.lower().split())

        # Calculate word overlap
        unique_words = set(all_words)
        common_words = []

        for word in unique_words:
            count = all_words.count(word)
            if count >= len(responses) // 2:
                common_words.append(word)

        agreement_score = len(common_words) / len(unique_words) if unique_words else 0
        confidence = min(agreement_score * 1.2, 1.0)  # Boost confidence slightly

        return {
            "confidence": confidence,
            "agreement_score": agreement_score,
            "common_keywords": common_words[:10]  # Top 10 common words
        }

    async def get_capabilities(self) -> List[str]:
        """Return list of consensus agent capabilities"""
        base_capabilities = await self.fallback_agent.get_capabilities()
        consensus_capabilities = [
            "multi_model_consensus",
            "response_analysis",
            "confidence_scoring",
            "fallback_handling"
        ]

        return base_capabilities + consensus_capabilities
