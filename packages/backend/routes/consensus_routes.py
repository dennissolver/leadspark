"""
FastAPI routes for async consensus workflow
"""

from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends
from typing import List, Optional

from models.consensus_models import (
    ConsensusRequest,
    ConsensusResponse,
    ConsensusResult,
    ConsensusStatus
)
from services.async_consensus_handler import AsyncConsensusHandler
from services.supabase_service import SupabaseService, get_current_user

# Create router
router = APIRouter(prefix="/api/consensus", tags=["consensus"])

# Initialize services
consensus_handler = AsyncConsensusHandler()
supabase_service = SupabaseService()


@router.post("/submit", response_model=ConsensusResponse)
async def submit_consensus_request(
        request: ConsensusRequest,
        background_tasks: BackgroundTasks,
        current_user=Depends(get_current_user)
):
    """
    A) Submit consensus request - returns immediate acknowledgment

    - Accepts multi-LLM consensus request
    - Returns immediate response with request_id
    - Processes asynchronously in background
    """
    try:
        # Add user context if available
        if current_user and not request.user_id:
            request.user_id = current_user.id

        # Submit request and get immediate acknowledgment
        response = await consensus_handler.submit_consensus_request(request, background_tasks)

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{request_id}", response_model=ConsensusResult)
async def get_consensus_status(
        request_id: str,
        current_user=Depends(get_current_user)
):
    """
    Check current status of consensus request

    - Returns current processing status
    - Shows progress if still processing
    - Returns final result if completed
    """
    try:
        # Get request details
        request_data = await supabase_service.get_consensus_request(request_id)

        if not request_data:
            raise HTTPException(status_code=404, detail="Consensus request not found")

        # Check if user has access to this request
        if current_user and request_data.get('user_id') != current_user.id:
            # Allow access if user is admin or same tenant
            if (request_data.get('tenant_id') != getattr(current_user, 'tenant_id', None) and
                    not getattr(current_user, 'is_admin', False)):
                raise HTTPException(status_code=403, detail="Access denied")

        # Return status
        result_data = request_data.get('result', {})

        return ConsensusResult(
            request_id=request_id,
            status=request_data.get('status', 'unknown'),
            consensus_response=result_data.get('consensus_response'),
            consensus_confidence=result_data.get('consensus_confidence'),
            participating_models=result_data.get('participating_models', []),
            total_responses=result_data.get('total_responses', 0),
            strategy=result_data.get('strategy'),
            processing_time=result_data.get('processing_time'),
            error=request_data.get('error'),
            metadata=result_data.get('metadata', {}),
            created_at=request_data.get('created_at'),
            completed_at=result_data.get('completed_at')
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/result/{request_id}", response_model=ConsensusResult)
async def get_consensus_result(
        request_id: str,
        current_user=Depends(get_current_user)
):
    """
    Get final consensus result (alias for status endpoint)
    """
    return await get_consensus_status(request_id, current_user)


@router.get("/history", response_model=List[ConsensusResult])
async def get_consensus_history(
        limit: int = 20,
        offset: int = 0,
        status: Optional[str] = None,
        current_user=Depends(get_current_user)
):
    """
    Get user's consensus request history
    """
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Authentication required")

        # Get user's consensus history
        history = await supabase_service.get_user_consensus_history(
            user_id=current_user.id,
            limit=limit,
            offset=offset,
            status=status
        )

        # Convert to response models
        results = []
        for item in history:
            result_data = item.get('result', {})

            results.append(ConsensusResult(
                request_id=item['id'],
                status=item.get('status', 'unknown'),
                consensus_response=result_data.get('consensus_response'),
                consensus_confidence=result_data.get('consensus_confidence'),
                participating_models=result_data.get('participating_models', []),
                total_responses=result_data.get('total_responses', 0),
                strategy=result_data.get('strategy'),
                processing_time=result_data.get('processing_time'),
                error=item.get('error'),
                metadata=result_data.get('metadata', {}),
                created_at=item.get('created_at'),
                completed_at=result_data.get('completed_at')
            ))

        return results

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/cancel/{request_id}")
async def cancel_consensus_request(
        request_id: str,
        current_user=Depends(get_current_user)
):
    """
    Cancel a pending or processing consensus request
    """
    try:
        # Get request details
        request_data = await supabase_service.get_consensus_request(request_id)

        if not request_data:
            raise HTTPException(status_code=404, detail="Consensus request not found")

        # Check if user has access
        if current_user and request_data.get('user_id') != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")

        # Check if cancellable
        current_status = request_data.get('status')
        if current_status in ['completed', 'failed', 'cancelled']:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot cancel request with status: {current_status}"
            )

        # Update status to cancelled
        await supabase_service.update_consensus_request_status(
            request_id, "cancelled"
        )

        return {"message": f"Consensus request {request_id} cancelled successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/queue/status")
async def get_queue_status(current_user=Depends(get_current_user)):
    """
    Get current processing queue status
    """
    try:
        queue_stats = await supabase_service.get_consensus_queue_stats()

        return {
            "queue_length": queue_stats.get('total_pending', 0),
            "processing_count": queue_stats.get('currently_processing', 0),
            "estimated_wait_time": queue_stats.get('estimated_wait_minutes', 2),
            "last_completed": queue_stats.get('last_completed_at'),
            "average_processing_time": queue_stats.get('avg_processing_time_seconds', 60)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Health check endpoint
@router.get("/health")
async def consensus_health_check():
    """
    Health check for consensus service
    """
    try:
        # Test database connection
        await supabase_service.test_connection()

        # Test LLM service availability
        from services.llm_consensus_service import LLMConsensusService
        consensus_service = LLMConsensusService()
        available_models = list(consensus_service._model_agents.keys())

        return {
            "status": "healthy",
            "database": "connected",
            "available_models": available_models,
            "model_count": len(available_models),
            "timestamp": "2024-01-01T00:00:00Z"
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": "2024-01-01T00:00:00Z"
        }


@router.post("/test/public")
async def test_consensus_public():
    """
    Public test endpoint for consensus system - no authentication required
    Tests the multi-agent consensus workflow
    """
    try:
        from services.llm_consensus_service import LLMConsensusService
        from datetime import datetime
        import time

        start_time = time.time()

        # Create test request
        test_prompt = "Rate this business lead on a scale of 1-10: TechCorp CEO John Smith, $50k budget, needs enterprise CRM solution, timeline 3 months."

        # Get consensus service
        consensus_service = LLMConsensusService()

        # Run consensus using the correct method
        result = await consensus_service.get_consensus_response(
            prompt=test_prompt,
            task_type="qualification",
            strategy="weighted"
        )

        processing_time = time.time() - start_time

        return {
            "status": "success",
            "test_prompt": test_prompt,
            "consensus_result": result,
            "processing_time_seconds": round(processing_time, 2),
            "participating_models": list(consensus_service._model_agents.keys()),
            "timestamp": datetime.utcnow().isoformat(),
            "message": "✅ Multi-agent consensus test completed successfully!"
        }

    except Exception as e:
        import traceback
        from datetime import datetime
        return {
            "status": "error",
            "error": str(e),
            "traceback": traceback.format_exc(),
            "timestamp": datetime.utcnow().isoformat(),
            "message": "❌ Consensus test failed"
        }