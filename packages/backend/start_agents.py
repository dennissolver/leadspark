#!/usr/bin/env python3
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
