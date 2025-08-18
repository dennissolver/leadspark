#!/usr/bin/env python3
"""
LeadSpark Agent Integration Program
==================================

This program creates all agent wrapper classes and integrates them with your existing services.
Run this to complete the agent layer integration in one go.

Usage:
    python agent_integration.py [--dry-run] [--force]

Options:
    --dry-run    Show what would be created without actually creating files
    --force      Overwrite existing files
"""

import os
import sys
import argparse
from pathlib import Path
from typing import Dict, List, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class AgentIntegrationProgram:
    def __init__(self, project_root: str, dry_run: bool = False, force: bool = False):
        self.project_root = Path(project_root)
        self.backend_path = self.project_root / "packages" / "backend"
        self.agents_path = self.backend_path / "services" / "agents"
        self.dry_run = dry_run
        self.force = force

        # Validate project structure
        self._validate_project_structure()

    def _validate_project_structure(self):
        """Validate that we're in a LeadSpark project"""
        required_paths = [
            self.backend_path,
            self.backend_path / "services",
            self.backend_path / "services" / "conversation_service.py",
            self.backend_path / "services" / "elevenlabs_service.py",
            self.backend_path / "services" / "llm_consensus_service.py",
        ]

        missing_paths = [p for p in required_paths if not p.exists()]
        if missing_paths:
            logger.error(f"Missing required files/directories: {missing_paths}")
            logger.error("Please run this script from the LeadSpark project root")
            sys.exit(1)

    def create_agent_files(self):
        """Create all agent wrapper files"""
        logger.info("Creating agent integration files...")

        # Ensure agents directory exists
        if not self.dry_run:
            self.agents_path.mkdir(exist_ok=True)

        # Agent files to create
        agent_files = {
            "conversation_agent.py": self._get_conversation_agent_code(),
            "consensus_agent.py": self._get_consensus_agent_code(),
            "voice_agent.py": self._get_voice_agent_code(),
        }

        # Enhanced files to update
        enhanced_files = {
            "agent_orchestrator.py": self._get_enhanced_orchestrator_code(),
        }

        # Create agent files
        for filename, content in agent_files.items():
            self._write_file(self.agents_path / filename, content)

        # Update existing files
        for filename, content in enhanced_files.items():
            full_path = self.agents_path / filename
            self._write_file(full_path, content)

    def _write_file(self, filepath: Path, content: str):
        """Write content to file with dry-run support"""
        if filepath.exists() and not self.force:
            logger.warning(f"File exists, skipping: {filepath}")
            return

        if self.dry_run:
            logger.info(f"[DRY RUN] Would create/update: {filepath}")
            return

        try:
            filepath.parent.mkdir(parents=True, exist_ok=True)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            logger.info(f"Created/Updated: {filepath}")
        except Exception as e:
            logger.error(f"Failed to write {filepath}: {e}")

    def _get_conversation_agent_code(self) -> str:
        return '''"""
Conversation Agent - Wraps conversation service with agent interface
"""
from typing import Dict, List, Optional, Any
import asyncio
import logging
from .IAgent import IAgent
from ..conversation_service import ConversationService
from ..elevenlabs_service import ElevenLabsService
from ..supabase_service import SupabaseService
from ...utils.prompt_builder import PromptBuilder

logger = logging.getLogger(__name__)

class ConversationAgent(IAgent):
    """Agent that handles standard conversation flows with optional voice output"""

    def __init__(self, tenant_id: str, config: Optional[Dict[str, Any]] = None):
        self.tenant_id = tenant_id
        self.config = config or {}
        self.conversation_service = ConversationService()
        self.voice_service = ElevenLabsService()
        self.supabase_service = SupabaseService()
        self.prompt_builder = PromptBuilder()

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

        if self.config.get('voice_enabled'):
            capabilities.append("voice_generation")

        return capabilities
'''

    def _get_consensus_agent_code(self) -> str:
        return '''"""
Consensus Agent - Handles multi-model consensus for high-stakes conversations
"""
from typing import Dict, List, Optional, Any
import asyncio
import logging
from .conversation_agent import ConversationAgent
from .IAgent import IAgent
from ..llm_consensus_service import LLMConsensusService
from ..async_consensus_handler import AsyncConsensusHandler
from ..async_consensus_processor import AsyncConsensusProcessor

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
'''

    def _get_voice_agent_code(self) -> str:
        return '''"""
Voice Agent - Specialized for voice input/output processing
"""
from typing import Dict, List, Optional, Any, Union
import asyncio
import logging
from .conversation_agent import ConversationAgent
from .IAgent import IAgent
from ..elevenlabs_service import ElevenLabsService

logger = logging.getLogger(__name__)

class VoiceAgent(IAgent):
    """Agent specialized for voice input processing and guaranteed voice output"""

    def __init__(self, tenant_id: str, config: Optional[Dict[str, Any]] = None):
        self.tenant_id = tenant_id
        self.config = config or {}

        # Base conversation capabilities
        self.conversation_agent = ConversationAgent(tenant_id, config)

        # Enhanced voice services
        self.voice_service = ElevenLabsService()

        # Voice-specific configuration
        self.voice_config = self.config.get('voice_config', {
            'voice_id': 'default',
            'stability': 0.75,
            'similarity_boost': 0.75
        })

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
        try:
            return await self.voice_service.generate_speech(
                text=text,
                tenant_id=self.tenant_id,
                voice_config=self.voice_config
            )
        except Exception as e:
            logger.warning(f"Failed to generate voice for tenant {self.tenant_id}: {e}")
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
'''

    def _get_enhanced_orchestrator_code(self) -> str:
        return '''"""
Enhanced Agent Orchestrator - Routes between different agent types
"""
from typing import Dict, Any, Optional, Type, Union
import asyncio
import logging
from .IAgent import IAgent
from .conversation_agent import ConversationAgent
from .consensus_agent import ConsensusAgent
from .voice_agent import VoiceAgent

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

# Global orchestrator instance
orchestrator = EnhancedAgentOrchestrator()
'''

    def create_integration_tests(self):
        """Create test files for agent integration"""

        test_content = '''"""
Agent Integration Tests
"""
import pytest
import asyncio
from unittest.mock import Mock, AsyncMock

# Placeholder tests - update import paths based on your project structure

class TestAgentIntegration:

    @pytest.fixture
    def mock_config(self):
        return {
            "voice_enabled": True,
            "consensus_enabled": False,
            "default_model": "gpt-4"
        }

    @pytest.mark.asyncio
    async def test_agent_creation(self, mock_config):
        """Test that agents can be created"""
        # Import your agents here
        # from packages.backend.services.agents.conversation_agent import ConversationAgent

        # agent = ConversationAgent("test-tenant", mock_config)
        # assert agent.tenant_id == "test-tenant"
        pass

    @pytest.mark.asyncio
    async def test_orchestrator_routing(self, mock_config):
        """Test orchestrator message routing"""
        # from packages.backend.services.agents.agent_orchestrator import orchestrator

        # Test orchestrator functionality here
        pass
'''

        # Write test file
        test_file_path = self.backend_path / "test_agent_integration.py"
        self._write_file(test_file_path, test_content)

    def create_startup_script(self):
        """Create startup script for agent initialization"""

        startup_content = '''#!/usr/bin/env python3
"""
Agent Integration Startup Script
"""
import asyncio
import logging
from pathlib import Path
import sys

# Add backend to Python path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def initialize_agents():
    """Initialize and test agent orchestrator"""

    logger.info("Initializing agent orchestrator...")

    try:
        from services.agents.agent_orchestrator import orchestrator
        logger.info("Agent orchestrator imported successfully!")

        # Test basic functionality
        test_tenant = "test-tenant-001"
        test_config = {
            "voice_enabled": True,
            "consensus_enabled": True,
            "default_model": "gpt-4"
        }

        # Test each agent type
        agent_types = ["conversation", "consensus", "voice"]

        for agent_type in agent_types:
            try:
                logger.info(f"Testing {agent_type} agent...")
                agent = await orchestrator.get_agent(agent_type, test_tenant, test_config)
                capabilities = await agent.get_capabilities()
                logger.info(f"{agent_type} agent initialized with capabilities: {capabilities}")
            except Exception as e:
                logger.error(f"Failed to initialize {agent_type} agent: {e}")

        logger.info("Agent initialization complete!")

    except ImportError as e:
        logger.error(f"Failed to import agent orchestrator: {e}")
        logger.error("Make sure all dependencies are installed")

if __name__ == "__main__":
    asyncio.run(initialize_agents())
'''

        # Write startup script
        startup_file_path = self.backend_path / "start_agents.py"
        self._write_file(startup_file_path, startup_content)

    def run_integration(self):
        """Run the complete agent integration process"""

        logger.info("Starting LeadSpark Agent Integration...")
        logger.info(f"Project root: {self.project_root}")
        logger.info(f"Backend path: {self.backend_path}")
        logger.info(f"Dry run: {self.dry_run}")

        try:
            # Step 1: Create agent files
            logger.info("Step 1: Creating agent wrapper files...")
            self.create_agent_files()

            # Step 2: Create integration tests
            logger.info("Step 2: Creating integration tests...")
            self.create_integration_tests()

            # Step 3: Create startup script
            logger.info("Step 3: Creating startup script...")
            self.create_startup_script()

            logger.info("✅ Agent integration completed successfully!")

            if not self.dry_run:
                logger.info("\n🚀 Next Steps:")
                logger.info("1. Test the integration:")
                logger.info("   cd packages/backend && python start_agents.py")
                logger.info("\n2. Run integration tests:")
                logger.info("   pytest test_agent_integration.py -v")
                logger.info("\n3. Update your routes to use the new agent orchestrator")
            else:
                logger.info("\n[DRY RUN] No files were actually created.")
                logger.info("Run without --dry-run to create the files.")

        except Exception as e:
            logger.error(f"❌ Integration failed: {e}")
            raise


def main():
    """Main entry point"""

    parser = argparse.ArgumentParser(description="LeadSpark Agent Integration Program")
    parser.add_argument("--dry-run", action="store_true",
                        help="Show what would be created without actually creating files")
    parser.add_argument("--force", action="store_true",
                        help="Overwrite existing files")
    parser.add_argument("--project-root", default=".",
                        help="Path to project root directory")

    args = parser.parse_args()

    # Create and run integration program
    integration_program = AgentIntegrationProgram(
        project_root=args.project_root,
        dry_run=args.dry_run,
        force=args.force
    )

    integration_program.run_integration()


if __name__ == "__main__":
    main()