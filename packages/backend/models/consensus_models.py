"""
Pydantic models for async consensus workflow
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel
from datetime import datetime

class ConsensusRequest(BaseModel):
    """Request model for consensus submission"""
    prompt: str
    task_type: str = "general"
    strategy: str = "weighted"
    config: Optional[Dict[str, Any]] = None
    callback_url: Optional[str] = None
    user_id: Optional[str] = None
    tenant_id: Optional[str] = None
    priority: str = "normal"  # normal, high, urgent

class ConsensusResponse(BaseModel):
    """Immediate acknowledgment response"""
    request_id: str
    status: str  # "pending", "queued", "processing", "completed", "failed"
    estimated_completion: Optional[str] = None
    message: str = "Request received and queued for processing"
    queue_position: Optional[int] = None

class ConsensusResult(BaseModel):
    """Final consensus result"""
    request_id: str
    status: str
    consensus_response: Optional[str] = None
    consensus_confidence: Optional[float] = None
    participating_models: List[str] = []
    total_responses: int = 0
    strategy: Optional[str] = None
    processing_time: Optional[float] = None
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None
    completed_at: Optional[str] = None

class ConsensusStatus(BaseModel):
    """Status check response"""
    request_id: str
    status: str
    progress: Optional[Dict[str, Any]] = None  # {"models_completed": 2, "total_models": 4}
    estimated_remaining: Optional[int] = None  # seconds
    last_updated: Optional[str] = None

class WebSocketMessage(BaseModel):
    """WebSocket notification message"""
    type: str  # "consensus_update", "consensus_complete"
    request_id: str
    data: Dict[str, Any]
    timestamp: str