#!/usr/bin/env python3
"""
Fix Import Paths for Agent Integration
=====================================

This script fixes the relative import issues in the agent files
by updating them to use absolute imports that work with your project structure.
"""

import os
import sys
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def fix_agent_imports():
    """Fix import statements in all agent files"""

    # Get the backend directory
    backend_dir = Path(__file__).parent
    agents_dir = backend_dir / "services" / "agents"

    if not agents_dir.exists():
        logger.error(f"Agents directory not found: {agents_dir}")
        return False

    # Files to fix and their import replacements
    import_fixes = {
        "conversation_agent.py": {
            "from .IAgent import IAgent": "from services.agents.IAgent import IAgent",
            "from ..conversation_service import ConversationService": "from services.conversation_service import ConversationService",
            "from ..elevenlabs_service import ElevenLabsService": "from services.elevenlabs_service import ElevenLabsService",
            "from ..supabase_service import SupabaseService": "from services.supabase_service import SupabaseService",
            "from ...utils.prompt_builder import PromptBuilder": "from utils.prompt_builder import PromptBuilder",
        },
        "consensus_agent.py": {
            "from .conversation_agent import ConversationAgent": "from services.agents.conversation_agent import ConversationAgent",
            "from .IAgent import IAgent": "from services.agents.IAgent import IAgent",
            "from ..llm_consensus_service import LLMConsensusService": "from services.llm_consensus_service import LLMConsensusService",
            "from ..async_consensus_handler import AsyncConsensusHandler": "from services.async_consensus_handler import AsyncConsensusHandler",
            "from ..async_consensus_processor import AsyncConsensusProcessor": "from services.async_consensus_processor import AsyncConsensusProcessor",
        },
        "voice_agent.py": {
            "from .conversation_agent import ConversationAgent": "from services.agents.conversation_agent import ConversationAgent",
            "from .IAgent import IAgent": "from services.agents.IAgent import IAgent",
            "from ..elevenlabs_service import ElevenLabsService": "from services.elevenlabs_service import ElevenLabsService",
        },
        "agent_orchestrator.py": {
            "from .IAgent import IAgent": "from services.agents.IAgent import IAgent",
            "from .conversation_agent import ConversationAgent": "from services.agents.conversation_agent import ConversationAgent",
            "from .consensus_agent import ConsensusAgent": "from services.agents.consensus_agent import ConsensusAgent",
            "from .voice_agent import VoiceAgent": "from services.agents.voice_agent import VoiceAgent",
        }
    }

    # Apply fixes to each file
    for filename, fixes in import_fixes.items():
        file_path = agents_dir / filename

        if not file_path.exists():
            logger.warning(f"File not found, skipping: {file_path}")
            continue

        try:
            # Read the file
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Apply fixes
            original_content = content
            for old_import, new_import in fixes.items():
                content = content.replace(old_import, new_import)

            # Write back if changes were made
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                logger.info(f"Fixed imports in: {filename}")
            else:
                logger.info(f"No import fixes needed for: {filename}")

        except Exception as e:
            logger.error(f"Failed to fix imports in {filename}: {e}")
            return False

    return True


def create_fixed_startup_script():
    """Create a new startup script with proper import handling"""

    startup_content = '''#!/usr/bin/env python3
"""
Agent Integration Startup Script with Fixed Imports
"""
import asyncio
import logging
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
project_root = backend_dir.parent.parent
sys.path.insert(0, str(backend_dir))
sys.path.insert(0, str(project_root))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def initialize_agents():
    """Initialize and test agent orchestrator"""

    logger.info("Initializing agent orchestrator...")

    try:
        # Import with absolute path
        from services.agents.agent_orchestrator import orchestrator
        logger.info("✅ Agent orchestrator imported successfully!")

        # Test basic functionality
        test_tenant = "test-tenant-001"
        test_config = {
            "voice_enabled": True,
            "consensus_enabled": False,  # Start with False to avoid complex dependencies
            "default_model": "gpt-4"
        }

        # Test each agent type
        agent_types = ["conversation", "voice"]  # Start with simpler agents first

        for agent_type in agent_types:
            try:
                logger.info(f"Testing {agent_type} agent...")
                agent = await orchestrator.get_agent(agent_type, test_tenant, test_config)
                capabilities = await agent.get_capabilities()
                logger.info(f"✅ {agent_type} agent initialized with capabilities: {capabilities}")
            except Exception as e:
                logger.error(f"❌ Failed to initialize {agent_type} agent: {e}")
                logger.error(f"   Error details: {type(e).__name__}: {str(e)}")

        # Test consensus agent separately (might have more dependencies)
        try:
            logger.info("Testing consensus agent...")
            consensus_config = {**test_config, "consensus_enabled": True}
            consensus_agent = await orchestrator.get_agent("consensus", test_tenant, consensus_config)
            capabilities = await consensus_agent.get_capabilities()
            logger.info(f"✅ consensus agent initialized with capabilities: {capabilities}")
        except Exception as e:
            logger.warning(f"⚠️  Consensus agent not fully functional: {e}")
            logger.info("   This is normal if consensus dependencies aren't fully set up yet")

        logger.info("🎉 Agent initialization complete!")

        # Test a simple message routing
        try:
            logger.info("Testing message routing...")
            response = await orchestrator.route_message(
                message="Hello, this is a test message",
                conversation_id="test-conversation-001",
                tenant_id=test_tenant,
                agent_type="conversation",
                config=test_config
            )
            logger.info(f"✅ Message routing successful!")
            logger.info(f"   Response type: {response.get('agent_type')}")
            logger.info(f"   Has orchestrator info: {'orchestrator_info' in response}")

        except Exception as e:
            logger.warning(f"⚠️  Message routing test failed: {e}")
            logger.info("   This is normal if service dependencies aren't mocked")

    except ImportError as e:
        logger.error(f"❌ Failed to import agent orchestrator: {e}")
        logger.error("   Make sure the import paths are fixed")
        logger.info("   Try running: python fix_imports.py")
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    asyncio.run(initialize_agents())
'''

    # Write the new startup script
    backend_dir = Path(__file__).parent
    startup_file = backend_dir / "start_agents_fixed.py"

    with open(startup_file, 'w', encoding='utf-8') as f:
        f.write(startup_content)

    logger.info(f"Created fixed startup script: {startup_file}")
    return startup_file


def main():
    """Main function"""
    logger.info("Fixing agent import paths...")

    # Fix the import statements
    if fix_agent_imports():
        logger.info("✅ Import paths fixed successfully!")
    else:
        logger.error("❌ Failed to fix some import paths")
        return

    # Create new startup script
    startup_file = create_fixed_startup_script()

    logger.info("🎉 Import fixes complete!")
    logger.info(f"\nNow run: python {startup_file.name}")


if __name__ == "__main__":
    main()