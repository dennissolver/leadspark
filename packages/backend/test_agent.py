# Create test_agent.py file
import asyncio
import os
from phi.agent import Agent
from phi.model.openai import OpenAIChat
from phi.tools.duckduckgo import DuckDuckGo


async def test_openai():
    print("Testing OpenAI GPT-4 Agent...")

    agent = Agent(
        name="Jess - OpenAI Sales Assistant",
        model=OpenAIChat(id="gpt-4", api_key=os.getenv("OPENAI_API_KEY")),
        tools=[DuckDuckGo()],
        description="Professional sales assistant for LeadSpark"
    )

    prompt = "A visitor just landed on our website from Google search for sales automation software. Introduce yourself and start qualifying them for our B2B sales platform."

    response = agent.run(prompt)
    print("🤖 OpenAI GPT-4 Response:")
    print(response.content)


if __name__ == "__main__":
    asyncio.run(test_openai())
