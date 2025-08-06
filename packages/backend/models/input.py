from pydantic import BaseModel
from typing import List, Optional

class ConversationTurn(BaseModel):
    user: str
    jess: str

class ConversationInput(BaseModel):
    userInput: str
    conversationHistory: Optional[List[ConversationTurn]] = []