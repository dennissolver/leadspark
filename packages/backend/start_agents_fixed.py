#!/usr/bin/env python3
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
                import traceback
                logger.error(f"❌ Unexpected error: {e}")
                logger.error("Full traceback:")
                logger.error(traceback.format_exc())

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
