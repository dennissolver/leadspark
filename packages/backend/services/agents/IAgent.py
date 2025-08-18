# packages/backend/services/agents/IAgent.py
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

class IAgent(ABC):
    """Base interface for all agent implementations in LeadSpark."""

    @abstractmethod
    def __init__(self, tenant_id: str, config: Optional[Dict[str, Any]] = None):
        """Initialize agent with tenant ID and configuration."""
        pass

    @abstractmethod
    async def process_message(
        self,
        message: str,
        conversation_id: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Process a message and return response."""
        pass

    @abstractmethod
    async def get_capabilities(self) -> List[str]:
        """Return list of agent capabilities."""
        pass