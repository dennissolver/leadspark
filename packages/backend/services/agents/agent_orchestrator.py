"""
Enhanced Agent Orchestrator - Routes between different agent types
"""
from typing import Dict, Any, Optional, Type, Union, List
import asyncio
import logging
from services.agents.IAgent import IAgent
from services.agents.conversation_agent import ConversationAgent
from services.agents.consensus_agent import ConsensusAgent
from services.agents.voice_agent import VoiceAgent

logger = logging.getLogger(__name__)

class EnhancedAgentOrchestrator:
    """Enhanced orchestrator that manages all agent types and routing"""

    def __init__(self):
        self.agent_registry: Dict[str, Type[IAgent]] = {
            'conversation': ConversationAgent,
            'consensus': ConsensusAgent,
            'voice': VoiceAgent
        }

        # Cache for active agents (tenant_id:agent_type -> agent instance)
        self.active_agents: Dict[str, IAgent] = {}

    async def get_agent(
        self,
        agent_type: str,
        tenant_id: str,
        config: Optional[Dict[str, Any]] = None
    ) -> IAgent:
        """Get or create an agent instance"""

        agent_key = f"{tenant_id}:{agent_type}"

        if agent_key not in self.active_agents:
            if agent_type not in self.agent_registry:
                logger.warning(f"Unknown agent type: {agent_type}, falling back to conversation")
                agent_type = 'conversation'

            agent_class = self.agent_registry[agent_type]
            self.active_agents[agent_key] = agent_class(tenant_id, config)
            logger.info(f"Created new agent: {agent_type} for tenant {tenant_id}")

        return self.active_agents[agent_key]

    async def route_message(
        self,
        message: str,
        conversation_id: str,
        tenant_id: str,
        agent_type: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
        config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Intelligently route message to appropriate agent"""

        try:
            # Determine agent type if not specified
            if not agent_type:
                agent_type = self._select_agent_type(message, context, config)

            logger.info(f"Routing to {agent_type} agent for tenant {tenant_id}")

            # Get the appropriate agent
            agent = await self.get_agent(agent_type, tenant_id, config)

            # Process the message
            response = await agent.process_message(message, conversation_id, context)

            # Add orchestrator metadata
            response["orchestrator_info"] = {
                "selected_agent": agent_type,
                "tenant_id": tenant_id
            }

            return response

        except Exception as e:
            logger.error(f"Agent orchestration error: {e}")
            # Fallback to conversation agent
            if agent_type != "conversation":
                logger.info("Falling back to conversation agent")
                return await self.route_message(
                    message, conversation_id, tenant_id, "conversation", context, config
                )
            raise

    async def process_voice_input(
        self,
        audio_data: Union[bytes, str],
        conversation_id: str,
        tenant_id: str,
        context: Optional[Dict[str, Any]] = None,
        config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Process voice input using voice agent"""

        try:
            voice_agent = await self.get_agent("voice", tenant_id, config)

            if hasattr(voice_agent, 'process_voice_input'):
                return await voice_agent.process_voice_input(audio_data, conversation_id, context)
            else:
                return {"error": "Voice processing not available"}

        except Exception as e:
            logger.error(f"Voice processing error: {e}")
            raise

    def _select_agent_type(
        self,
        message: str,
        context: Optional[Dict[str, Any]],
        config: Optional[Dict[str, Any]]
    ) -> str:
        """Intelligently select agent type based on message and context"""

        # Check context for explicit agent selection
        if context:
            if context.get("input_type") == "voice":
                return "voice"

            if context.get("use_consensus"):
                return "consensus"

        # Check config for agent preferences
        if config:
            if config.get("consensus_enabled"):
                return "consensus"

        # Default to conversation agent
        return "conversation"

    async def get_agent_capabilities(
        self,
        agent_type: str,
        tenant_id: str,
        config: Optional[Dict[str, Any]] = None
    ) -> List[str]:
        """Get capabilities of a specific agent type"""

        try:
            agent = await self.get_agent(agent_type, tenant_id, config)
            return await agent.get_capabilities()
        except Exception as e:
            logger.error(f"Failed to get capabilities for {agent_type}: {e}")
            return []

    async def get_orchestrator_status(self) -> Dict[str, Any]:
        """Get orchestrator status"""
        return {
            "active_agents": len(self.active_agents),
            "available_agent_types": list(self.agent_registry.keys()),
            "status": "active"
        }

    def cleanup_agent(self, tenant_id: str, agent_type: Optional[str] = None):
        """Clean up agent instances for memory management"""

        if agent_type:
            agent_key = f"{tenant_id}:{agent_type}"
            if agent_key in self.active_agents:
                del self.active_agents[agent_key]
                logger.info(f"Cleaned up {agent_type} agent for tenant {tenant_id}")
        else:
            # Clean up all agents for the tenant
            keys_to_remove = [k for k in self.active_agents.keys() if k.startswith(f"{tenant_id}:")]
            for key in keys_to_remove:
                del self.active_agents[key]
            logger.info(f"Cleaned up all agents for tenant {tenant_id}")

# Global orchestrator instance for the new agent system
orchestrator = EnhancedAgentOrchestrator()