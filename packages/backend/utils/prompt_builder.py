from typing import List

def build_prompt(user_input: str, history: List[dict]) -> str:
    intro = "You are Jess, a helpful property investment assistant for Property Friends."
    context = "\n".join([f"User: {turn['user']}\nJess: {turn['jess']}" for turn in history])
    return f"{intro}\n{context}\nUser: {user_input}\nJess:"