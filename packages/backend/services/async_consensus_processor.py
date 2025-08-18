"""
Async Consensus Processor
Handles the actual LLM orchestration and consensus processing
"""

import asyncio
import logging
import httpx
from datetime import datetime
from typing import Dict, Any, Optional

from models.consensus_models import ConsensusRequest, ConsensusResult
from .llm_consensus_service import LLMConsensusService, ConsensusStrategy
from .supabase_service import SupabaseService
from .notification_service import NotificationService

logger = logging.getLogger(__name__)


class AsyncConsensusProcessor:
    """
    Async workflow that orchestrates LLM calls and consensus processing
    """

    def __init__(self):
        self.consensus_service = LLMConsensusService()
        self.supabase_service = SupabaseService()
        self.notification_service = NotificationService()

    async def process_consensus_request(self, request_id: str, request: ConsensusRequest):
        """
        C) Process consensus request asynchronously
        """
        try:
            # Update status to "processing"
            await self.supabase_service.update_consensus_request_status(
                request_id, "processing"
            )

            # Send real-time notification
            if request.user_id:
                await self.notification_service.send_realtime_notification({
                    'type': 'consensus_started',
                    'request_id': request_id,
                    'user_id': request.user_id,
                    'message': 'Processing consensus request with multiple AI models'
                })

            logger.info(f"🚀 Starting async consensus processing for {request_id}")
            start_time = datetime.utcnow()

            # D) Send to LLMs and wait for responses/timeouts
            consensus_result = await self._orchestrate_llm_consensus(request_id, request)

            end_time = datetime.utcnow()
            processing_time = (end_time - start_time).total_seconds()

            # Prepare final result
            result = ConsensusResult(
                request_id=request_id,
                status="completed",
                consensus_response=consensus_result.get('consensus_response'),
                consensus_confidence=consensus_result.get('consensus_confidence'),
                participating_models=consensus_result.get('participating_models', []),
                total_responses=consensus_result.get('total_responses', 0),
                strategy=consensus_result.get('strategy'),
                processing_time=processing_time,
                metadata=consensus_result.get('metadata', {}),
                created_at=start_time.isoformat(),
                completed_at=end_time.isoformat()
            )

            # E) Store final result and notify frontend
            await self._finalize_consensus_result(request_id, result, request)

        except Exception as e:
            logger.error(f"Error processing consensus request {request_id}: {e}")

            # Store error result
            error_result = ConsensusResult(
                request_id=request_id,
                status="failed",
                error=str(e),
                created_at=datetime.utcnow().isoformat()
            )

            await self._finalize_consensus_result(request_id, error_result, request)

    async def _orchestrate_llm_consensus(self, request_id: str, request: ConsensusRequest) -> Dict[str, Any]:
        """
        D) Orchestrate LLM calls with proper timeout handling and progress updates
        """
        try:
            # Convert string strategy to enum
            strategy = ConsensusStrategy(request.strategy)

            # Prepare config with extended timeout for async processing
            config = request.config or {}
            config['timeout_seconds'] = 150  # Longer timeout for async

            # Send progress update
            if request.user_id:
                await self.notification_service.send_realtime_notification({
                    'type': 'consensus_progress',
                    'request_id': request_id,
                    'user_id': request.user_id,
                    'progress': {'stage': 'llm_calls', 'message': 'Sending requests to AI models...'}
                })

            # Get consensus with progress monitoring
            result = await self._get_consensus_with_progress(
                request_id=request_id,
                prompt=request.prompt,
                task_type=request.task_type,
                strategy=strategy,
                config=config,
                user_id=request.user_id
            )

            return result

        except Exception as e:
            logger.error(f"Error in LLM consensus orchestration: {e}")
            raise

    async def _get_consensus_with_progress(
            self,
            request_id: str,
            prompt: str,
            task_type: str,
            strategy: ConsensusStrategy,
            config: Dict[str, Any],
            user_id: Optional[str]
    ) -> Dict[str, Any]:
        """
        Get consensus with real-time progress updates
        """
        try:
            # Override the consensus service to add progress callbacks
            original_get_all_responses = self.consensus_service._get_all_model_responses

            async def progress_aware_get_responses(prompt, task_type, config):
                # Send progress update
                if user_id:
                    await self.notification_service.send_realtime_notification({
                        'type': 'consensus_progress',
                        'request_id': request_id,
                        'user_id': user_id,
                        'progress': {
                            'stage': 'model_responses',
                            'message': f'Collecting responses from {len(config.get("models", []))} AI models...'
                        }
                    })

                # Call original method
                responses = await original_get_all_responses(prompt, task_type, config)

                # Send another progress update
                if user_id:
                    await self.notification_service.send_realtime_notification({
                        'type': 'consensus_progress',
                        'request_id': request_id,
                        'user_id': user_id,
                        'progress': {
                            'stage': 'consensus_calculation',
                            'message': f'Processing consensus from {len(responses)} successful responses...'
                        }
                    })

                return responses

            # Temporarily override the method
            self.consensus_service._get_all_model_responses = progress_aware_get_responses

            # Get consensus
            result = await self.consensus_service.get_consensus_response(
                prompt=prompt,
                task_type=task_type,
                strategy=strategy,
                config=config
            )

            # Restore original method
            self.consensus_service._get_all_model_responses = original_get_all_responses

            return result

        except Exception as e:
            logger.error(f"Error getting consensus with progress: {e}")
            raise

    async def _finalize_consensus_result(
            self,
            request_id: str,
            result: ConsensusResult,
            original_request: ConsensusRequest
    ):
        """
        E) Store result and send response back to frontend
        """
        try:
            # Store final result in database
            await self.supabase_service.store_consensus_result(request_id, result.dict())

            # Update request status
            await self.supabase_service.update_consensus_request_status(
                request_id,
                result.status,
                result=result.dict()
            )

            # Send callback notification if URL provided
            if original_request.callback_url:
                await self._send_callback_notification(
                    original_request.callback_url,
                    result
                )

            # Send real-time notification (WebSocket, SSE, etc.)
            await self._send_realtime_notification(
                original_request.user_id,
                original_request.tenant_id,
                result
            )

            logger.info(f"✅ Consensus request {request_id} completed successfully")

        except Exception as e:
            logger.error(f"Error finalizing consensus result {request_id}: {e}")

    async def _send_callback_notification(self, callback_url: str, result: ConsensusResult):
        """
        Send HTTP callback to provided URL
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    callback_url,
                    json=result.dict(),
                    timeout=10.0,
                    headers={"Content-Type": "application/json"}
                )
                logger.info(f"✅ Callback sent to {callback_url}: {response.status_code}")
        except Exception as e:
            logger.error(f"❌ Failed to send callback to {callback_url}: {e}")

    async def _send_realtime_notification(
            self,
            user_id: Optional[str],
            tenant_id: Optional[str],
            result: ConsensusResult
    ):
        """
        Send real-time notification via WebSocket/SSE
        """
        try:
            notification_type = 'consensus_completed' if result.status == 'completed' else 'consensus_failed'

            notification_data = {
                'type': notification_type,
                'request_id': result.request_id,
                'status': result.status,
                'user_id': user_id,
                'tenant_id': tenant_id,
                'data': result.dict(),
                'timestamp': datetime.utcnow().isoformat()
            }

            # Send via your real-time notification system
            await self.notification_service.send_realtime_notification(notification_data)

            logger.info(f"✅ Real-time notification sent for {result.request_id}")

        except Exception as e:
            logger.error(f"❌ Failed to send real-time notification: {e}")