"""
Async Consensus Request Handler
Handles incoming consensus requests and returns immediate acknowledgment
"""

import asyncio
import logging
import uuid
from datetime import datetime, timedelta
from fastapi import BackgroundTasks, HTTPException
from typing import Optional

from models.consensus_models import ConsensusRequest, ConsensusResponse
from .supabase_service import SupabaseService
from .notification_service import NotificationService

logger = logging.getLogger(__name__)


class AsyncConsensusHandler:
    """
    Handles incoming consensus requests and returns immediate acknowledgment
    """

    def __init__(self):
        self.supabase_service = SupabaseService()
        self.notification_service = NotificationService()

    async def submit_consensus_request(
            self,
            request: ConsensusRequest,
            background_tasks: BackgroundTasks
    ) -> ConsensusResponse:
        """
        A) Accept request and return immediate acknowledgment
        """
        try:
            # Generate unique request ID
            request_id = str(uuid.uuid4())

            # Calculate estimated completion based on priority
            estimated_minutes = self._get_estimated_completion_time(request.priority)
            estimated_completion = (datetime.utcnow() + timedelta(minutes=estimated_minutes)).isoformat()

            # Store request in database with "pending" status
            request_data = {
                'id': request_id,
                'prompt': request.prompt,
                'task_type': request.task_type,
                'strategy': request.strategy,
                'config': request.config or {},
                'callback_url': request.callback_url,
                'user_id': request.user_id,
                'tenant_id': request.tenant_id,
                'priority': request.priority,
                'status': 'pending',
                'created_at': datetime.utcnow().isoformat(),
                'estimated_completion': estimated_completion
            }

            # Store in consensus_requests table
            await self.supabase_service.create_consensus_request(request_data)

            # B) Queue async processing (fire-and-forget)
            background_tasks.add_task(
                self._queue_async_processing,
                request_id,
                request
            )

            # Get current queue position
            queue_position = await self._get_queue_position(request.priority)

            # Return immediate acknowledgment
            return ConsensusResponse(
                request_id=request_id,
                status="pending",
                estimated_completion=estimated_completion,
                message=f"Consensus request {request_id} queued for processing",
                queue_position=queue_position
            )

        except Exception as e:
            logger.error(f"Error submitting consensus request: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    def _get_estimated_completion_time(self, priority: str) -> int:
        """Calculate estimated completion time in minutes based on priority"""
        priority_times = {
            'urgent': 1,
            'high': 2,
            'normal': 3
        }
        return priority_times.get(priority, 3)

    async def _get_queue_position(self, priority: str) -> int:
        """Get current position in processing queue"""
        try:
            # Count pending/processing requests with same or higher priority
            count = await self.supabase_service.count_pending_consensus_requests(priority)
            return max(1, count)
        except Exception as e:
            logger.warning(f"Could not determine queue position: {e}")
            return 1

    async def _queue_async_processing(self, request_id: str, request: ConsensusRequest):
        """
        B) Send to async workflow endpoint (non-blocking)
        """
        try:
            # Update status to "queued"
            await self.supabase_service.update_consensus_request_status(
                request_id, "queued"
            )

            # Send notification that request was queued
            if request.user_id:
                await self.notification_service.send_realtime_notification({
                    'type': 'consensus_queued',
                    'request_id': request_id,
                    'user_id': request.user_id,
                    'message': 'Your consensus request has been queued for processing'
                })

            # Trigger async processing
            await self._trigger_async_consensus_workflow(request_id, request)

        except Exception as e:
            logger.error(f"Error queuing async processing for {request_id}: {e}")
            await self.supabase_service.update_consensus_request_status(
                request_id, "failed", error=str(e)
            )

            # Notify user of failure
            if request.user_id:
                await self.notification_service.send_realtime_notification({
                    'type': 'consensus_failed',
                    'request_id': request_id,
                    'user_id': request.user_id,
                    'error': str(e)
                })

    async def _trigger_async_consensus_workflow(self, request_id: str, request: ConsensusRequest):
        """
        Trigger the async consensus workflow
        In production, this would use Redis/Celery/SQS
        """
        try:
            # Import here to avoid circular imports
            from .async_consensus_processor import AsyncConsensusProcessor

            # Create async task for processing
            processor = AsyncConsensusProcessor()

            # Run in background task with priority handling
            if request.priority == 'urgent':
                # Process immediately
                asyncio.create_task(processor.process_consensus_request(request_id, request))
            else:
                # Add small delay for normal/high priority to manage load
                delay = 5 if request.priority == 'high' else 10
                asyncio.create_task(
                    self._delayed_processing(processor, request_id, request, delay)
                )

        except Exception as e:
            logger.error(f"Error triggering async workflow for {request_id}: {e}")
            raise

    async def _delayed_processing(self, processor, request_id: str, request: ConsensusRequest, delay: int):
        """Add controlled delay for load management"""
        await asyncio.sleep(delay)
        await processor.process_consensus_request(request_id, request)

    async def get_request_status(self, request_id: str) -> dict:
        """Get current status of a consensus request"""
        try:
            request_data = await self.supabase_service.get_consensus_request(request_id)

            if not request_data:
                raise HTTPException(status_code=404, detail="Request not found")

            return {
                'request_id': request_id,
                'status': request_data.get('status'),
                'created_at': request_data.get('created_at'),
                'updated_at': request_data.get('updated_at'),
                'estimated_completion': request_data.get('estimated_completion'),
                'result': request_data.get('result'),
                'error': request_data.get('error')
            }

        except Exception as e:
            logger.error(f"Error getting request status for {request_id}: {e}")
            raise HTTPException(status_code=500, detail=str(e))