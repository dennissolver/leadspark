from typing import List, Dict, Optional, Any


def build_prompt(user_input: str, history: List[dict]) -> str:
    intro = "You are Jess, a helpful property investment assistant for Property Friends."
    context = "\n".join([f"User: {turn['user']}\nJess: {turn['jess']}" for turn in history])
    return f"{intro}\n{context}\nUser: {user_input}\nJess:"


class PromptBuilder:
    """PromptBuilder class for agent integration"""

    def __init__(self):
        self.system_prompt = "You are Jess, a helpful property investment assistant for Property Friends."

    async def build_conversation_prompt(
            self,
            message: str,
            conversation_history: List[Dict] = None,
            knowledge_base: List[Dict] = None,
            tenant_config: Dict[str, Any] = None,
            additional_context: Dict[str, Any] = None
    ) -> str:
        """Build a conversation prompt using existing logic"""

        # Convert conversation_history to your format
        history = []
        if conversation_history:
            user_msg = ""
            for msg in conversation_history[-10:]:  # Last 10 messages
                if msg.get('role') == 'user':
                    user_msg = msg.get('content', '')
                elif msg.get('role') == 'assistant' and user_msg:
                    jess_msg = msg.get('content', '')
                    history.append({'user': user_msg, 'jess': jess_msg})
                    user_msg = ""

        # Add knowledge base context if available
        if knowledge_base:
            kb_context = "\n".join([
                f"Reference: {entry.get('content', '')[:100]}..."
                for entry in knowledge_base[:2]
            ])
            enhanced_intro = f"{self.system_prompt}\n\nRelevant information:\n{kb_context}"
        else:
            enhanced_intro = self.system_prompt

        # Use your existing logic
        context = "\n".join([f"User: {turn['user']}\nJess: {turn['jess']}" for turn in history])

        if context:
            return f"{enhanced_intro}\n{context}\nUser: {message}\nJess:"
        else:
            return f"{enhanced_intro}\nUser: {message}\nJess:"