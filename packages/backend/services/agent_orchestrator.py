"""
Enhanced Agent Orchestrator - Routes between different agent types
"""
from typing import Dict, Any, Optional, Type, Union, List
import asyncio
import logging
from datetime import datetime
import json

from .conversation_service import ConversationService
from .llm_consensus_service import LLMConsensusService, ConsensusStrategy
from .supabase_service import SupabaseService
from .notification_service import NotificationService

logger = logging.getLogger(__name__)


class AgentOrchestrator:
    """
    High-level orchestrator that coordinates conversation agents and consensus systems
    for complex multi-step workflows
    """

    def __init__(self):
        self.conversation_service = ConversationService()
        self.consensus_service = LLMConsensusService()
        self.supabase_service = SupabaseService()
        self.notification_service = NotificationService()

    async def handle_complex_conversation(
            self,
            tenant_id: str,
            conversation_id: str,
            user_message: str,
            config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Handle complex conversations that may require consensus from multiple models
        """
        try:
            # Check if this requires consensus (complex questions, high-stakes decisions)
            consensus_needed = await self._should_use_consensus(user_message, config)

            if consensus_needed:
                # Use consensus for complex responses
                return await self._handle_with_consensus(
                    tenant_id, conversation_id, user_message, config
                )
            else:
                # Use standard conversation agent
                return await self.conversation_service.continue_conversation(
                    tenant_id, conversation_id, user_message, config
                )

        except Exception as e:
            logger.error(f"Error in complex conversation handling: {e}")
            raise

    async def _should_use_consensus(self, user_message: str, config: Dict[str, Any]) -> bool:
        """
        Determine if a message requires consensus from multiple models
        """
        # Consensus triggers
        consensus_triggers = [
            'pricing', 'cost', 'budget', 'price',
            'security', 'compliance', 'enterprise',
            'integration', 'technical', 'architecture',
            'contract', 'legal', 'terms',
            'roi', 'return on investment', 'business case'
        ]

        # Check for complex topics
        has_complex_topic = any(trigger in user_message.lower() for trigger in consensus_triggers)

        # Check configuration preference
        always_consensus = config.get('always_use_consensus', False)
        consensus_threshold = config.get('consensus_message_length', 100)

        # Long messages might benefit from consensus
        is_long_message = len(user_message) > consensus_threshold

        return has_complex_topic or always_consensus or is_long_message

    async def _handle_with_consensus(
            self,
            tenant_id: str,
            conversation_id: str,
            user_message: str,
            config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Handle conversation using consensus from multiple models
        """
        try:
            # Get conversation context
            history = await self.conversation_service.get_conversation_history(conversation_id)

            # Build enhanced prompt for consensus
            consensus_prompt = self._build_consensus_prompt(user_message, history, config)

            # Get consensus response
            consensus_strategy = ConsensusStrategy(config.get('consensus_strategy', 'weighted'))
            consensus_result = await self.consensus_service.get_consensus_response(
                prompt=consensus_prompt,
                task_type='conversation',
                strategy=consensus_strategy,
                config=config
            )

            # Store user message
            await self.supabase_service.add_conversation_message(
                conversation_id=conversation_id,
                role='user',
                content=user_message,
                metadata={'type': 'text', 'consensus_used': True}
            )

            # Process consensus response
            response_text = consensus_result['consensus_response']
            confidence = consensus_result['consensus_confidence']

            # Convert to audio if needed
            audio_url = None
            if config.get('voice_enabled', False):
                from .elevenlabs_service import ElevenLabsService
                elevenlabs = ElevenLabsService()
                audio_url = await elevenlabs.text_to_speech(
                    text=response_text,
                    voice_id=config.get('voice_id'),
                    tenant_id=tenant_id
                )

            # Store consensus response
            await self.supabase_service.add_conversation_message(
                conversation_id=conversation_id,
                role='assistant',
                content=response_text,
                audio_url=audio_url,
                metadata={
                    'consensus_strategy': consensus_result['strategy'],
                    'consensus_confidence': confidence,
                    'participating_models': consensus_result['participating_models'],
                    'total_responses': consensus_result['total_responses']
                }
            )

            # Analyze qualification with consensus
            qualification_status = await self._analyze_qualification_with_consensus(
                conversation_id, user_message, response_text, config
            )

            return {
                'response': response_text,
                'audio_url': audio_url,
                'consensus_result': consensus_result,
                'qualification_status': qualification_status,
                'conversation_id': conversation_id
            }

        except Exception as e:
            logger.error(f"Error handling consensus conversation: {e}")
            # Fallback to standard conversation
            return await self.conversation_service.continue_conversation(
                tenant_id, conversation_id, user_message, config
            )

    def _build_consensus_prompt(
            self,
            user_message: str,
            history: List[Dict],
            config: Dict[str, Any]
    ) -> str:
        """
        Build enhanced prompt for consensus analysis
        """
        # Get recent conversation context
        recent_history = history[-6:] if len(history) > 6 else history

        history_text = ""
        for msg in recent_history:
            role = msg.get('role', 'unknown')
            content = msg.get('content', '')
            history_text += f"{role.title()}: {content}\n"

        return f"""
        You are Jess, an AI sales assistant for {config.get('company_name', 'our company')}.

        Conversation History:
        {history_text}

        User's Current Message: {user_message}

        This message has been flagged for consensus analysis due to its complexity or importance.

        Please provide a thoughtful, accurate response that:
        1. Addresses the user's question comprehensively
        2. Maintains the conversation flow toward lead qualification
        3. Provides accurate information about our services/pricing if asked
        4. Suggests next steps when appropriate

        Company Context:
        - Industry: {config.get('industry', 'Technology')}
        - Target Budget: ${config.get('min_budget', 5000)}+ monthly
        - Services: {config.get('services_description', 'Business solutions')}

        Respond as Jess with your {config.get('conversation_style', 'professional and friendly')} tone.
        """

    async def _analyze_qualification_with_consensus(
            self,
            conversation_id: str,
            user_message: str,
            assistant_response: str,
            config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Use consensus to analyze qualification signals
        """
        try:
            qualification_prompt = f"""
            Analyze this sales conversation exchange for B2B lead qualification signals.

            User Message: {user_message}
            Assistant Response: {assistant_response}

            Evaluate based on BANT criteria:
            - Budget: Evidence of ${config.get('min_budget', 5000)}+ monthly budget
            - Authority: Decision making power indicators
            - Need: Clear business need for our services
            - Timeline: Project timeline and urgency

            Provide analysis as JSON:
            {{
                "score": <0-100>,
                "budget_signals": ["specific budget indicators"],
                "authority_signals": ["decision-making indicators"],
                "need_signals": ["business need indicators"],
                "timeline_signals": ["timeline/urgency indicators"],
                "recommendation": "<continue|qualify_further|book_call|transfer>",
                "confidence": "<low|medium|high>"
            }}
            """

            # Use consensus for qualification analysis
            consensus_result = await self.consensus_service.get_consensus_response(
                prompt=qualification_prompt,
                task_type='qualification',
                strategy=ConsensusStrategy.BEST_OF_N,
                config=config
            )

            # Parse qualification data
            try:
                qualification_data = json.loads(consensus_result['consensus_response'])
            except json.JSONDecodeError:
                qualification_data = {
                    'score': 50,
                    'recommendation': 'continue',
                    'confidence': 'medium'
                }

            # Store qualification analysis
            await self.supabase_service.update_conversation_qualification(
                conversation_id=conversation_id,
                qualification_data=qualification_data
            )

            return qualification_data

        except Exception as e:
            logger.error(f"Error in consensus qualification analysis: {e}")
            return {
                'score': 50,
                'recommendation': 'continue',
                'confidence': 'low',
                'error': str(e)
            }

    async def orchestrate_lead_handoff(
            self,
            tenant_id: str,
            conversation_id: str,
            config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Orchestrate complex lead handoff process using multiple agents
        """
        try:
            # Get conversation summary using consensus
            summary_result = await self._generate_lead_summary_with_consensus(
                conversation_id, config
            )

            # Determine best handoff strategy
            handoff_strategy = await self._determine_handoff_strategy(
                summary_result, config
            )

            # Execute handoff
            handoff_result = await self._execute_handoff(
                tenant_id, conversation_id, handoff_strategy, summary_result
            )

            return {
                'summary': summary_result,
                'handoff_strategy': handoff_strategy,
                'handoff_result': handoff_result
            }

        except Exception as e:
            logger.error(f"Error orchestrating lead handoff: {e}")
            raise

    async def _generate_lead_summary_with_consensus(
            self,
            conversation_id: str,
            config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate comprehensive lead summary using consensus
        """
        history = await self.conversation_service.get_conversation_history(conversation_id)

        summary_prompt = f"""
        Create a comprehensive lead summary for sales team handoff:

        Conversation: {json.dumps(history, indent=2)}

        Provide structured summary:
        {{
            "lead_quality": "<hot|warm|cold>",
            "qualification_score": <0-100>,
            "key_needs": ["identified business needs"],
            "budget_indicators": ["budget-related signals"],
            "decision_makers": ["identified decision makers"],
            "timeline": "project timeline if mentioned",
            "objections": ["concerns or objections raised"],
            "next_steps": ["recommended next actions"],
            "priority": "<high|medium|low>",
            "summary": "executive summary for sales team"
        }}
        """

        return await self.consensus_service.get_consensus_response(
            prompt=summary_prompt,
            task_type='analysis',
            strategy=ConsensusStrategy.WEIGHTED,
            config=config
        )

    async def _determine_handoff_strategy(
            self,
            summary_result: Dict[str, Any],
            config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Determine the best handoff strategy based on lead analysis
        """
        try:
            summary_data = json.loads(summary_result['consensus_response'])
            qualification_score = summary_data.get('qualification_score', 50)
            lead_quality = summary_data.get('lead_quality', 'warm')

            if qualification_score >= 80 or lead_quality == 'hot':
                return {
                    'strategy': 'immediate_handoff',
                    'priority': 'high',
                    'recommended_action': 'Schedule call within 24 hours'
                }
            elif qualification_score >= 60 or lead_quality == 'warm':
                return {
                    'strategy': 'standard_handoff',
                    'priority': 'medium',
                    'recommended_action': 'Follow up within 3 days'
                }
            else:
                return {
                    'strategy': 'nurture_sequence',
                    'priority': 'low',
                    'recommended_action': 'Add to nurture campaign'
                }
        except Exception as e:
            logger.error(f"Error determining handoff strategy: {e}")
            return {
                'strategy': 'standard_handoff',
                'priority': 'medium',
                'recommended_action': 'Manual review required'
            }

    async def _execute_handoff(
            self,
            tenant_id: str,
            conversation_id: str,
            handoff_strategy: Dict[str, Any],
            summary_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute the determined handoff strategy
        """
        try:
            strategy = handoff_strategy['strategy']
            priority = handoff_strategy['priority']

            # Update conversation status
            await self.supabase_service.update_conversation_status(
                conversation_id=conversation_id,
                status='handed_off',
                handoff_strategy=strategy,
                handoff_priority=priority
            )

            # Create lead record if high priority
            if priority == 'high':
                lead_data = await self._extract_lead_data_from_summary(summary_result)
                lead_id = await self.supabase_service.create_lead({
                    'tenant_id': tenant_id,
                    'conversation_id': conversation_id,
                    'status': 'hot_lead',
                    'priority': priority,
                    **lead_data
                })

            # Send notifications based on strategy
            if strategy == 'immediate_handoff':
                await self.notification_service.notify_immediate_handoff(
                    tenant_id=tenant_id,
                    conversation_id=conversation_id,
                    summary=summary_result['consensus_response'],
                    priority='urgent'
                )
            elif strategy == 'standard_handoff':
                await self.notification_service.notify_standard_handoff(
                    tenant_id=tenant_id,
                    conversation_id=conversation_id,
                    summary=summary_result['consensus_response']
                )
            else:
                # Nurture sequence
                await self.notification_service.add_to_nurture_sequence(
                    tenant_id=tenant_id,
                    conversation_id=conversation_id
                )

            return {
                'success': True,
                'strategy_executed': strategy,
                'notifications_sent': True,
                'next_action': handoff_strategy['recommended_action']
            }

        except Exception as e:
            logger.error(f"Error executing handoff: {e}")
            return {
                'success': False,
                'error': str(e),
                'strategy_executed': 'none'
            }

    async def _extract_lead_data_from_summary(self, summary_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract structured lead data from consensus summary
        """
        try:
            summary_data = json.loads(summary_result['consensus_response'])

            return {
                'qualification_score': summary_data.get('qualification_score', 50),
                'lead_quality': summary_data.get('lead_quality', 'warm'),
                'key_needs': summary_data.get('key_needs', []),
                'budget_indicators': summary_data.get('budget_indicators', []),
                'timeline': summary_data.get('timeline', 'unknown'),
                'next_steps': summary_data.get('next_steps', []),
                'summary': summary_data.get('summary', ''),
                'created_at': datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error extracting lead data: {e}")
            return {
                'qualification_score': 50,
                'lead_quality': 'unknown',
                'summary': 'Error processing lead data',
                'created_at': datetime.utcnow().isoformat()
            }

    async def analyze_conversation_performance(
            self,
            tenant_id: str,
            time_period: str = '7d'
    ) -> Dict[str, Any]:
        """
        Analyze conversation performance using consensus for insights
        """
        try:
            # Get conversation data for period
            conversations = await self.supabase_service.get_conversations_for_period(
                tenant_id=tenant_id,
                period=time_period
            )

            if not conversations:
                return {
                    'error': 'No conversations found for the specified period',
                    'period': time_period
                }

            # Analyze using consensus
            analysis_prompt = f"""
            Analyze conversation performance data for insights and recommendations:

            Conversation Data: {json.dumps(conversations[:10], indent=2)}  # Limit for prompt size

            Provide analysis as JSON:
            {{
                "total_conversations": {len(conversations)},
                "conversion_insights": {{
                    "high_quality_leads": <count>,
                    "conversion_rate": <percentage>,
                    "average_qualification_score": <0-100>
                }},
                "performance_insights": {{
                    "most_effective_strategies": ["strategy1", "strategy2"],
                    "common_objections": ["objection1", "objection2"],
                    "drop_off_points": ["point1", "point2"]
                }},
                "recommendations": {{
                    "immediate_actions": ["action1", "action2"],
                    "strategy_improvements": ["improvement1", "improvement2"],
                    "training_focus_areas": ["area1", "area2"]
                }},
                "trend_analysis": {{
                    "improving_metrics": ["metric1", "metric2"],
                    "declining_metrics": ["metric1", "metric2"]
                }}
            }}
            """

            analysis_result = await self.consensus_service.get_consensus_response(
                prompt=analysis_prompt,
                task_type='analysis',
                strategy=ConsensusStrategy.WEIGHTED,
                config={'task_config': {'analysis_type': 'performance'}}
            )

            return {
                'period': time_period,
                'analysis': analysis_result,
                'raw_data_count': len(conversations)
            }

        except Exception as e:
            logger.error(f"Error analyzing conversation performance: {e}")
            return {
                'error': str(e),
                'period': time_period
            }

    # Utility methods for integration with existing APIs
    async def get_agent_status(self, tenant_id: str) -> Dict[str, Any]:
        """Get status of all agents for a tenant"""
        try:
            return {
                'conversation_agent': 'active',
                'consensus_service': 'active',
                'models_available': list(self.consensus_service._model_agents.keys()) if hasattr(self.consensus_service,
                                                                                                 '_model_agents') else [],
                'last_activity': datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error getting agent status: {e}")
            return {
                'conversation_agent': 'error',
                'consensus_service': 'error',
                'error': str(e)
            }

    async def update_agent_config(self, tenant_id: str, new_config: Dict[str, Any]) -> Dict[str, Any]:
        """Update agent configuration for a tenant"""
        try:
            # Validate configuration
            validated_config = self._validate_agent_config(new_config)

            # Store new configuration
            await self.supabase_service.update_tenant_agent_config(tenant_id, validated_config)

            return {
                'success': True,
                'updated_config': validated_config,
                'message': 'Agent configuration updated successfully'
            }

        except Exception as e:
            logger.error(f"Error updating agent config: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    def _validate_agent_config(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Validate agent configuration parameters"""
        validated = {}

        # Conversation style validation
        valid_styles = ['professional', 'friendly', 'casual', 'formal', 'consultative']
        if 'conversation_style' in config:
            style = config['conversation_style']
            validated['conversation_style'] = style if style in valid_styles else 'professional'

        # Consensus strategy validation
        valid_strategies = ['weighted', 'unanimous', 'best_of_n', 'hierarchical']
        if 'consensus_strategy' in config:
            strategy = config['consensus_strategy']
            validated['consensus_strategy'] = strategy if strategy in valid_strategies else 'weighted'

        # Numeric validations
        if 'min_budget' in config:
            validated['min_budget'] = max(1000, int(config['min_budget']))

        if 'confidence_threshold' in config:
            validated['confidence_threshold'] = max(0.1, min(1.0, float(config['confidence_threshold'])))

        if 'max_timeline' in config:
            validated['max_timeline'] = max(1, min(24, int(config['max_timeline'])))

        # Boolean validations
        for bool_field in ['voice_enabled', 'debug_mode', 'always_use_consensus']:
            if bool_field in config:
                validated[bool_field] = bool(config[bool_field])

        # String validations
        for string_field in ['company_name', 'industry', 'services_description']:
            if string_field in config and config[string_field]:
                validated[string_field] = str(config[string_field])[:200]  # Limit length

        return validated