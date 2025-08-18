# Create test_conversation.py
import asyncio
from services.conversation_service import ConversationService


async def test_conversation():
    print("Testing Full Conversation Service...")
    service = ConversationService()

    config = {
        'company_name': 'LeadSpark',
        'primary_llm': 'gpt-4',
        'conversation_style': 'professional and friendly',
        'min_budget': 5000
    }

    visitor = {
        'ip_address': '127.0.0.1',
        'referrer': 'google.com/search?q=sales+automation',
        'user_agent': 'Mozilla/5.0...'
    }

    try:
        # Start conversation
        result = await service.start_conversation('demo-tenant', visitor, config)
        print('✅ Conversation Started!')
        print(f'Conversation ID: {result["conversation_id"]}')
        print(f'Jess says: {result["response"]}')

        # Continue conversation
        conversation_id = result["conversation_id"]
        user_response = "We have a 20-person sales team and spend about $8k monthly on CRM tools, but our lead conversion is terrible."

        continue_result = await service.continue_conversation(
            'demo-tenant', conversation_id, user_response, config
        )

        print(f'\\n👤 User: {user_response}')
        print(f'🤖 Jess: {continue_result["response"]}')
        print(f'📊 Qualification Score: {continue_result["qualification_status"]["score"]}/100')

    except Exception as e:
        print(f'❌ Error: {e}')


if __name__ == "__main__":
    asyncio.run(test_conversation())