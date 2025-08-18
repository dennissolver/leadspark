"""
Notification Service
Handles various notification channels: email, Slack, webhooks, SMS, WebSocket, etc.
"""

import asyncio
import logging
import json
import os
from typing import Dict, List, Optional, Any
from datetime import datetime
import httpx
from fastapi import HTTPException

logger = logging.getLogger(__name__)


# Keep your existing function for backward compatibility
async def send_notification(tenant_id: str, message: str, channel: str = "email"):
    try:
        return {"status": "queued", "message": f"Notification for {tenant_id} via {channel}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Notification failed: {str(e)}")


class NotificationService:
    """
    Multi-channel notification service for lead alerts, handoffs, and system notifications
    Enhanced with real-time WebSocket/SSE support for async consensus workflow
    """

    def __init__(self):
        self.logger = logger

        # Load configuration from environment
        self.slack_webhook_url = os.getenv("SLACK_WEBHOOK_URL")
        self.slack_bot_token = os.getenv("SLACK_BOT_TOKEN")

        # Email configuration (simplified for now)
        self.email_enabled = bool(os.getenv("EMAIL_USER"))

        # WebSocket connection manager (will be set by main app)
        self.websocket_manager = None

        # Default notification channels
        self.default_channels = {
            'email': self.email_enabled,
            'slack': bool(self.slack_webhook_url or self.slack_bot_token),
            'webhook': False,
            'sms': False,
            'websocket': True  # Always available for real-time updates
        }

    def set_websocket_manager(self, manager):
        """Set WebSocket connection manager from main app"""
        self.websocket_manager = manager

    # ============================================================================
    # NEW METHODS FOR REAL-TIME ASYNC CONSENSUS NOTIFICATIONS
    # ============================================================================

    async def send_realtime_notification(self, notification_data: Dict[str, Any]) -> bool:
        """
        Send real-time notification via WebSocket/SSE
        """
        try:
            # Add timestamp if not present
            if 'timestamp' not in notification_data:
                notification_data['timestamp'] = datetime.utcnow().isoformat()

            # Log the notification
            notification_type = notification_data.get('type', 'unknown')
            user_id = notification_data.get('user_id')
            self.logger.info(f"📡 Sending real-time notification: {notification_type} to user {user_id}")

            # Send via WebSocket if manager is available
            if self.websocket_manager and user_id:
                await self.websocket_manager.send_to_user(user_id, notification_data)
                return True

            # Fallback: Log the notification
            self.logger.info(
                f"📝 WebSocket not available, logging notification: {json.dumps(notification_data, indent=2)}")
            return True

        except Exception as e:
            self.logger.error(f"❌ Error sending real-time notification: {e}")
            return False

    async def notify_consensus_queued(self, request_id: str, user_id: str, queue_position: int) -> bool:
        """Send notification when consensus request is queued"""
        notification_data = {
            'type': 'consensus_queued',
            'request_id': request_id,
            'user_id': user_id,
            'data': {
                'queue_position': queue_position,
                'estimated_wait': f"{queue_position * 2} minutes",
                'message': f'Your consensus request is queued at position {queue_position}'
            }
        }

        return await self.send_realtime_notification(notification_data)

    async def notify_consensus_started(self, request_id: str, user_id: str, models: List[str]) -> bool:
        """Send notification when consensus processing starts"""
        notification_data = {
            'type': 'consensus_started',
            'request_id': request_id,
            'user_id': user_id,
            'data': {
                'models': models,
                'model_count': len(models),
                'message': f'Processing consensus with {len(models)} AI models: {", ".join(models)}'
            }
        }

        return await self.send_realtime_notification(notification_data)

    async def notify_consensus_progress(self, request_id: str, user_id: str, progress: Dict[str, Any]) -> bool:
        """Send progress update for consensus processing"""
        notification_data = {
            'type': 'consensus_progress',
            'request_id': request_id,
            'user_id': user_id,
            'data': {
                'progress': progress,
                'message': progress.get('message', 'Processing consensus...')
            }
        }

        return await self.send_realtime_notification(notification_data)

    async def notify_consensus_completed(self, request_id: str, user_id: str, result: Dict[str, Any]) -> bool:
        """Send notification when consensus is completed"""
        confidence = result.get('consensus_confidence', 0)
        models_used = result.get('participating_models', [])

        notification_data = {
            'type': 'consensus_completed',
            'request_id': request_id,
            'user_id': user_id,
            'data': {
                'confidence': confidence,
                'models_used': models_used,
                'processing_time': result.get('processing_time'),
                'message': f'Consensus completed with {confidence:.1%} confidence from {len(models_used)} models'
            }
        }

        return await self.send_realtime_notification(notification_data)

    async def notify_consensus_failed(self, request_id: str, user_id: str, error: str) -> bool:
        """Send notification when consensus fails"""
        notification_data = {
            'type': 'consensus_failed',
            'request_id': request_id,
            'user_id': user_id,
            'data': {
                'error': error,
                'message': f'Consensus processing failed: {error}'
            }
        }

        return await self.send_realtime_notification(notification_data)

    # ============================================================================
    # EXISTING METHODS (UNCHANGED)
    # ============================================================================

    async def notify_agent_handoff(
            self,
            tenant_id: str,
            conversation_id: str,
            handoff_reason: str,
            qualification_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Notify human agents about conversation handoff
        """
        try:
            score = qualification_data.get('score', 0)
            signals = qualification_data.get('signals', [])

            # Determine urgency based on qualification score
            if score >= 80:
                urgency = "🔥 HIGH PRIORITY"
            elif score >= 60:
                urgency = "⚡ MEDIUM PRIORITY"
            else:
                urgency = "📝 STANDARD"

            message = f"""
{urgency} LEAD HANDOFF

Conversation ID: {conversation_id}
Tenant: {tenant_id}
Qualification Score: {score}/100
Handoff Reason: {handoff_reason}

Detected Signals:
{chr(10).join(f'• {signal}' for signal in signals[:5])}

Action Required: Contact lead immediately
            """.strip()

            # Log the notification (since we don't have full email/Slack setup yet)
            logger.info(f"HANDOFF NOTIFICATION: {message}")

            # Use your existing function for backward compatibility
            result = await send_notification(
                tenant_id=tenant_id,
                message=message,
                channel="alert"
            )

            return {
                'success': True,
                'notification_sent': True,
                'handoff_reason': handoff_reason,
                'qualification_score': score,
                'result': result
            }

        except Exception as e:
            logger.error(f"Error sending handoff notification: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    async def notify_immediate_handoff(
            self,
            tenant_id: str,
            conversation_id: str,
            summary: str,
            priority: str = 'urgent'
    ) -> Dict[str, Any]:
        """
        Send immediate handoff notification for high-value leads
        """
        try:
            message = f"""
🚨 HIGH-VALUE LEAD ALERT 🚨

A qualified lead requires IMMEDIATE attention!

Conversation: {conversation_id}
Tenant: {tenant_id}
Priority: {priority.upper()}

Summary: {summary}

⏰ RESPONSE REQUIRED: Within 5 minutes
            """.strip()

            logger.info(f"IMMEDIATE HANDOFF: {message}")

            result = await send_notification(
                tenant_id=tenant_id,
                message=message,
                channel="urgent"
            )

            return {
                'success': True,
                'notification_sent': True,
                'priority': priority,
                'result': result
            }

        except Exception as e:
            logger.error(f"Error sending immediate handoff notification: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    async def notify_standard_handoff(
            self,
            tenant_id: str,
            conversation_id: str,
            summary: str
    ) -> Dict[str, Any]:
        """
        Send standard handoff notification
        """
        try:
            message = f"""
📋 LEAD HANDOFF NOTIFICATION

Conversation: {conversation_id}
Tenant: {tenant_id}

Summary: {summary}

📞 Action: Follow up within 24 hours
            """.strip()

            logger.info(f"STANDARD HANDOFF: {message}")

            result = await send_notification(
                tenant_id=tenant_id,
                message=message,
                channel="standard"
            )

            return {
                'success': True,
                'notification_sent': True,
                'result': result
            }

        except Exception as e:
            logger.error(f"Error sending standard handoff notification: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    async def add_to_nurture_sequence(
            self,
            tenant_id: str,
            conversation_id: str
    ) -> Dict[str, Any]:
        """
        Add lead to nurture sequence
        """
        try:
            message = f"""
🌱 NURTURE SEQUENCE

Lead added to automated nurture sequence.

Conversation: {conversation_id}
Tenant: {tenant_id}

Next Actions:
• Automated follow-up emails will be sent
• Lead will be contacted in 3-5 business days
            """.strip()

            logger.info(f"NURTURE SEQUENCE: {message}")

            result = await send_notification(
                tenant_id=tenant_id,
                message=message,
                channel="nurture"
            )

            return {
                'success': True,
                'notification_sent': True,
                'result': result
            }

        except Exception as e:
            logger.error(f"Error adding to nurture sequence: {e}")
            return {
                'success': False,
                'error': str(e)
            }