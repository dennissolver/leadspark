#!/usr/bin/env python3
"""
Agent Import Diagnostic Script
"""
import sys
import traceback
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
project_root = backend_dir.parent.parent
sys.path.insert(0, str(backend_dir))
sys.path.insert(0, str(project_root))


def test_import(module_name, import_statement):
    """Test a specific import and show detailed error if it fails"""
    print(f"\n🔍 Testing: {module_name}")
    print(f"   Import: {import_statement}")

    try:
        exec(import_statement)
        print(f"   ✅ SUCCESS: {module_name} imported successfully")
        return True
    except Exception as e:
        print(f"   ❌ FAILED: {module_name}")
        print(f"   Error: {e}")
        print(f"   Error Type: {type(e).__name__}")
        print("   Full Traceback:")
        traceback.print_exc()
        return False


def main():
    """Run diagnostic tests"""
    print("🔬 Agent Import Diagnostic")
    print("=" * 50)

    # Test imports in order of dependency
    tests = [
        ("IAgent", "from services.agents.IAgent import IAgent"),
        ("ConversationService", "from services.conversation_service import ConversationService"),
        ("ElevenLabsService", "from services.elevenlabs_service import ElevenLabsService"),
        ("SupabaseService", "from services.supabase_service import SupabaseService"),
        ("PromptBuilder", "from utils.prompt_builder import PromptBuilder"),
        ("ConversationAgent", "from services.agents.conversation_agent import ConversationAgent"),
        ("LLMConsensusService", "from services.llm_consensus_service import LLMConsensusService"),
        ("AsyncConsensusHandler", "from services.async_consensus_handler import AsyncConsensusHandler"),
        ("AsyncConsensusProcessor", "from services.async_consensus_processor import AsyncConsensusProcessor"),
        ("ConsensusAgent", "from services.agents.consensus_agent import ConsensusAgent"),
        ("VoiceAgent", "from services.agents.voice_agent import VoiceAgent"),
        ("AgentOrchestrator", "from services.agents.agent_orchestrator import orchestrator"),
    ]

    failed_tests = []

    for test_name, import_stmt in tests:
        if not test_import(test_name, import_stmt):
            failed_tests.append(test_name)
            break  # Stop at first failure to see the root cause

    print("\n" + "=" * 50)
    if failed_tests:
        print(f"❌ Failed imports: {failed_tests}")
        print("The error above shows the exact issue.")
    else:
        print("✅ All imports successful!")

        # Test orchestrator initialization
        print("\n🔍 Testing orchestrator initialization...")
        try:
            from services.agents.agent_orchestrator import orchestrator
            print("✅ Orchestrator imported successfully!")

            # Test agent creation
            print("\n🔍 Testing agent creation...")
            test_config = {"voice_enabled": True, "consensus_enabled": False}

            # This should trigger the actual error
            agent = orchestrator.get_agent("conversation", "test-tenant", test_config)
            print("✅ Agent creation test passed!")

        except Exception as e:
            print(f"❌ Orchestrator test failed: {e}")
            print("Full traceback:")
            traceback.print_exc()


if __name__ == "__main__":
    main()