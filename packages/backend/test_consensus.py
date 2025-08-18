# Create test_all_models.py
import asyncio
from services.llm_consensus_service import LLMConsensusService, ConsensusStrategy


async def test_all_four_models():
    print("🧠 Testing All 4 LLM Models (GPT-4, Claude, Grok, Gemini)...")
    service = LLMConsensusService()

    # Check which models are available
    available = list(service._model_agents.keys())
    print(f"Available models: {available}")

    prompt = '''
    A potential customer says: \"We have a 50-person sales team spending $12k monthly on Salesforce, but our lead conversion is only 3%. We need a better solution within 2 months and have budget approval from our CEO.\"

    Analyze this for BANT qualification and recommend next steps.
    '''

    try:
        result = await service.get_consensus_response(
            prompt=prompt,
            task_type='qualification',
            strategy=ConsensusStrategy.WEIGHTED
        )

        print('\n🎯 MULTI-MODEL CONSENSUS RESULT:')
        print(f'Strategy: {result["strategy"]}')
        print(f'Confidence: {result["consensus_confidence"]:.2f}')
        print(f'Models Used: {result["participating_models"]}')
        print(f'Total Responses: {result["total_responses"]}')
        print(f'\nConsensus Response: {result["consensus_response"][:400]}...')

        if len(result["participating_models"]) == 4:
            print('\n🎉 SUCCESS: All 4 models participated!')

    except Exception as e:
        print(f'❌ Error: {e}')


if __name__ == "__main__":
    asyncio.run(test_all_four_models())