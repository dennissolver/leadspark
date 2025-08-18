"""
Enhanced Conversation Service with Phidata Integration
Handles voice conversation orchestration, lead qualification, and handoff logic
"""

import asyncio
import logging
import json
from typing import Dict, List, Optional, Any
from datetime import datetime

from phi.agent import Agent
from phi.model.openai import OpenAIChat
from phi.model.anthropic import Claude  # Correct class name
from phi.model.groq import Groq  # Correct class name
from phi.tools.duckduckgo import DuckDuckGo  # FIXED: Correct import name
from phi.storage.agent.postgres import PgAgentStorage

# Your existing imports
from .supabase_service import SupabaseService
from .notification_service import NotificationService

logger = logging.getLogger(__name__)


class PromptBuilder:
    """
    Simple prompt builder utility class
    """

    def __init__(self):
        pass

    def build_conversation_prompt(self, context: str, config: Dict[str, Any]) -> str:
        """Build a conversation prompt with context"""
        return f"""
        {context}

        Configuration: {json.dumps(config, indent=2)}

        Please respond naturally and helpfully.
        """

    def build_qualification_prompt(self, conversation: str, criteria: Dict[str, Any]) -> str:
        """Build a qualification analysis prompt"""
        return f"""
        Analyze this conversation for qualification signals:

        {conversation}

        Criteria: {json.dumps(criteria, indent=2)}

        Provide analysis as JSON.
        """


class ElevenLabsService:
    """
    Simplified ElevenLabs service for text-to-speech
    """

    def __init__(self):
        self.api_key = None  # Will be set from config
        self.logger = logger

    async def text_to_speech(
            self,
            text: str,
            voice_id: Optional[str] = None,
            tenant_id: Optional[str] = None
    ) -> Optional[str]:
        """
        Convert text to speech (placeholder implementation)
        """
        # For now, just log and return None
        # In production, this would call ElevenLabs API
        self.logger.info(f"TTS request: {text[:50]}...")

        # Return None since we don't have actual TTS setup yet
        return None


class ConversationService:
    """
    Enhanced conversation service using Phidata for intelligent agent orchestration
    """

    def __init__(self):
        # Initialize existing services
        self.supabase_service = SupabaseService()
        self.elevenlabs_service = ElevenLabsService()
        self.notification_service = NotificationService()
        self.prompt_builder = PromptBuilder()

        # Cache for tenant-specific agents
        self._agent_cache: Dict[str, Agent] = {}

    def _get_agent_for_tenant(self, tenant_id: str, config: Dict[str, Any]) -> Agent:
        """Get or create a Phidata agent for specific tenant"""

        cache_key = f"{tenant_id}_{hash(json.dumps(config, sort_keys=True))}"

        if cache_key in self._agent_cache:
            return self._agent_cache[cache_key]

        # Agent storage for conversation memory
        agent_storage = None
        if hasattr(self.supabase_service, 'get_database_url'):
            try:
                agent_storage = PgAgentStorage(
                    table_name=f"agent_sessions_{tenant_id}",
                    db_url=self.supabase_service.get_database_url()
                )
            except Exception as e:
                logger.warning(f"Could not setup agent storage: {e}")
                agent_storage = None

        # Create the conversation agent
        agent = Agent(
            name=f"LeadSpark Agent - {config.get('company_name', tenant_id)}",
            model=self._get_model_for_config(config),
            tools=[DuckDuckGo()],  # FIXED: Correct class name
            storage=agent_storage,
            description=f"""
            You are Jess, an intelligent AI sales assistant for {config.get('company_name', 'our company')}.

            Your role:
            1. Engage website visitors in natural conversation
            2. Qualify leads based on their needs and budget
            3. Book discovery calls for qualified prospects
            4. Provide helpful information about our services
            5. Transfer to human agents when needed

            Conversation Style: {config.get('conversation_style', 'professional and friendly')}

            Lead Qualification Criteria:
            - Budget: ${config.get('min_budget', 5000)}+ per month
            - Decision making authority: Yes/No
            - Timeline: Within {config.get('max_timeline', 6)} months
            - Company size: {config.get('target_company_size', '10+')} employees

            Always be helpful, concise, and guide the conversation toward qualification.
            """,
            instructions=[
                "Start conversations with a warm greeting",
                "Ask open-ended questions to understand their business needs",
                "Listen for qualification signals (budget, authority, need, timeline)",
                "Suggest booking a discovery call for qualified leads",
                "Be transparent that you're an AI assistant",
                "Transfer to human if requested or for complex issues"
            ],
            markdown=True,
            show_tool_calls=config.get('debug_mode', False),
            debug_mode=config.get('debug_mode', False)
        )

        # Cache the agent
        self._agent_cache[cache_key] = agent
        return agent

    def _get_model_for_config(self, config: Dict[str, Any]) -> Any:
        """Get appropriate model based on tenant configuration"""

        model_preference = config.get('primary_llm', 'gpt-4')

        try:
            if model_preference.startswith('gpt'):
                return OpenAIChat(
                    id=model_preference,
                    api_key=config.get('openai_api_key') or self._get_default_api_key('openai'),
                    temperature=config.get('temperature', 0.7)
                )
            elif model_preference.startswith('claude'):
                return Claude(  # Correct class name
                    id=model_preference,
                    api_key=config.get('anthropic_api_key') or self._get_default_api_key('anthropic'),
                    temperature=config.get('temperature', 0.7)
                )
            else:
                # Default to GPT-4
                return OpenAIChat(
                    id="gpt-4",
                    api_key=self._get_default_api_key('openai'),
                    temperature=0.7
                )
        except Exception as e:
            logger.warning(f"Error setting up model {model_preference}: {e}")
            # Fallback to basic OpenAI
            return OpenAIChat(
                id="gpt-3.5-turbo",
                api_key=self._get_default_api_key('openai'),
                temperature=0.7
            )

    def _get_default_api_key(self, provider: str) -> str:
        """Get default API keys from environment"""
        import os

        if provider == 'openai':
            return os.getenv("OPENAI_API_KEY", "")
        elif provider == 'anthropic':
            return os.getenv("ANTHROPIC_API_KEY", "")
        else:
            return ""

    async def start_conversation(
            self,
            tenant_id: str,
            visitor_data: Dict[str, Any],
            config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Start a new conversation with a website visitor using Phidata agent
        """
        try:
            # Get tenant-specific agent
            agent = self._get_agent_for_tenant(tenant_id, config)

            # Create conversation record
            conversation_data = {
                'tenant_id': tenant_id,
                'visitor_ip': visitor_data.get('ip_address'),
                'referrer': visitor_data.get('referrer'),
                'user_agent': visitor_data.get('user_agent'),
                'status': 'active',
                'started_at': datetime.utcnow().isoformat()
            }

            conversation_id = await self.supabase_service.create_conversation(conversation_data)

            # Generate personalized greeting using Phidata agent
            context = f"""
            Visitor Context:
            - Referrer: {visitor_data.get('referrer', 'Direct')}
            - Location: {visitor_data.get('location', 'Unknown')}
            - Time: {datetime.now().strftime('%A %I:%M %p')}

            Start a conversation with this website visitor. Be warm, professional, and introduce yourself as Jess.
            """

            # Get response from Phidata agent
            response = agent.run(context)

            # Convert to audio if voice is enabled
            audio_url = None
            if config.get('voice_enabled', False):
                audio_url = await self.elevenlabs_service.text_to_speech(
                    text=response.content,
                    voice_id=config.get('voice_id'),
                    tenant_id=tenant_id
                )

            # Store initial exchange
            await self.supabase_service.add_conversation_message(
                conversation_id=conversation_id,
                role='assistant',
                content=response.content,
                audio_url=audio_url,
                metadata={
                    'type': 'greeting',
                    'agent_session': agent.session_id if hasattr(agent, 'session_id') else None,
                    'model_used': config.get('primary_llm', 'gpt-4')
                }
            )

            return {
                'conversation_id': conversation_id,
                'response': response.content,
                'audio_url': audio_url,
                'agent_session_id': agent.session_id if hasattr(agent, 'session_id') else None
            }

        except Exception as e:
            logger.error(f"Error starting conversation for tenant {tenant_id}: {e}")
            raise

    async def continue_conversation(
            self,
            tenant_id: str,
            conversation_id: str,
            user_message: str,
            config: Dict[str, Any],
            message_type: str = 'text'
    ) -> Dict[str, Any]:
        """
        Continue an existing conversation using Phidata agent
        """
        try:
            # Get tenant-specific agent
            agent = self._get_agent_for_tenant(tenant_id, config)

            # Store user message
            await self.supabase_service.add_conversation_message(
                conversation_id=conversation_id,
                role='user',
                content=user_message,
                metadata={'type': message_type}
            )

            # Get conversation history for context
            history = await self.supabase_service.get_conversation_history(conversation_id)

            # Build context-aware prompt for the agent
            context_prompt = self._build_conversation_context(
                user_message=user_message,
                conversation_history=history,
                config=config
            )

            # Get agent response using Phidata
            response = agent.run(context_prompt)

            # Analyze for qualification signals
            qualification_status = await self._analyze_qualification_with_agent(
                agent=agent,
                conversation_id=conversation_id,
                latest_exchange={'user': user_message, 'assistant': response.content},
                config=config
            )

            # Convert to audio if needed
            audio_url = None
            if config.get('voice_enabled', False):
                audio_url = await self.elevenlabs_service.text_to_speech(
                    text=response.content,
                    voice_id=config.get('voice_id'),
                    tenant_id=tenant_id
                )

            # Store assistant response
            await self.supabase_service.add_conversation_message(
                conversation_id=conversation_id,
                role='assistant',
                content=response.content,
                audio_url=audio_url,
                metadata={
                    'qualification_score': qualification_status.get('score', 0),
                    'detected_signals': qualification_status.get('signals', []),
                    'model_used': config.get('primary_llm', 'gpt-4')
                }
            )

            # Check if handoff is needed
            handoff_decision = await self._check_handoff_criteria(
                tenant_id=tenant_id,
                conversation_id=conversation_id,
                qualification_status=qualification_status,
                user_message=user_message,
                config=config
            )

            return {
                'response': response.content,
                'audio_url': audio_url,
                'qualification_status': qualification_status,
                'handoff_decision': handoff_decision,
                'conversation_id': conversation_id
            }

        except Exception as e:
            logger.error(f"Error continuing conversation {conversation_id}: {e}")
            raise

    def _build_conversation_context(
            self,
            user_message: str,
            conversation_history: List[Dict],
            config: Dict[str, Any]
    ) -> str:
        """Build context-aware prompt for the agent"""

        # Get recent conversation context (last 5 exchanges)
        recent_history = conversation_history[-10:] if len(conversation_history) > 10 else conversation_history

        history_text = ""
        for msg in recent_history:
            role = msg.get('role', 'unknown')
            content = msg.get('content', '')
            history_text += f"{role.title()}: {content}\n"

        context_prompt = f"""
        Conversation History:
        {history_text}

        User's Latest Message: {user_message}

        Instructions:
        1. Respond naturally to the user's message
        2. Keep the conversation flowing toward lead qualification
        3. Look for BANT signals (Budget, Authority, Need, Timeline)
        4. If you detect strong qualification signals, guide toward booking a discovery call
        5. If the user requests to speak to a human, acknowledge and prepare for handoff

        Qualification Criteria:
        - Budget: ${config.get('min_budget', 5000)}+ monthly
        - Authority: Decision-making power
        - Need: Clear business need for our services
        - Timeline: Within {config.get('max_timeline', 6)} months

        Respond as Jess, maintaining your {config.get('conversation_style', 'professional and friendly')} tone.
        """

        return context_prompt

    async def _analyze_qualification_with_agent(
            self,
            agent: Agent,
            conversation_id: str,
            latest_exchange: Dict[str, str],
            config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Use Phidata agent to analyze conversation for lead qualification signals
        """
        try:
            # Get full conversation history
            history = await self.supabase_service.get_conversation_history(conversation_id)

            # Create a specialized qualification analysis prompt
            qual_prompt = f"""
            Analyze this sales conversation for B2B lead qualification signals using BANT criteria.

            Recent exchange:
            User: {latest_exchange['user']}
            Assistant: {latest_exchange['assistant']}

            Qualification Criteria:
            - Budget: Evidence of ${config.get('min_budget', 5000)}+ monthly budget
            - Authority: Decision making power mentioned
            - Need: Clear business need identified  
            - Timeline: Urgency within {config.get('max_timeline', 6)} months

            Based on the conversation, provide a qualification assessment as JSON:
            {{
                "score": <0-100 score>,
                "signals": ["list of detected qualification signals"],
                "recommendation": "<continue|qualify_further|book_call|transfer>",
                "confidence": "<low|medium|high>",
                "budget_signals": ["specific budget-related signals"],
                "authority_signals": ["decision-making indicators"],
                "need_signals": ["business need indicators"],
                "timeline_signals": ["urgency indicators"]
            }}

            Focus only on explicit signals mentioned in the conversation.
            """

            # Use the same agent to analyze qualification
            qual_response = agent.run(qual_prompt)

            # Parse JSON response
            try:
                qualification_data = json.loads(qual_response.content)
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                qualification_data = {
                    'score': 25,  # Default low score
                    'signals': [],
                    'recommendation': 'continue',
                    'confidence': 'low',
                    'budget_signals': [],
                    'authority_signals': [],
                    'need_signals': [],
                    'timeline_signals': []
                }

            # Update conversation with qualification data
            await self.supabase_service.update_conversation_qualification(
                conversation_id=conversation_id,
                qualification_data=qualification_data
            )

            return qualification_data

        except Exception as e:
            logger.error(f"Error analyzing qualification: {e}")
            return {
                'score': 0,
                'signals': [],
                'recommendation': 'continue',
                'confidence': 'error'
            }

    async def _check_handoff_criteria(
            self,
            tenant_id: str,
            conversation_id: str,
            qualification_status: Dict[str, Any],
            user_message: str,
            config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Determine if conversation should be handed off to human agent
        """
        handoff_triggers = [
            'speak to a human',
            'talk to someone',
            'human agent',
            'real person',
            'transfer me',
            'escalate',
            'manager',
            'supervisor'
        ]

        # Check explicit handoff requests
        explicit_request = any(trigger in user_message.lower() for trigger in handoff_triggers)

        # Check qualification score for automatic handoff
        high_qualification = qualification_status.get('score', 0) >= config.get('handoff_qualification_threshold', 75)

        # Check for complex questions that need human intervention
        complex_indicators = ['pricing', 'contract', 'custom', 'enterprise', 'integration', 'security', 'compliance']
        complex_question = any(indicator in user_message.lower() for indicator in complex_indicators)

        should_handoff = explicit_request or (high_qualification and complex_question)

        handoff_decision = {
            'should_handoff': should_handoff,
            'reason': 'explicit_request' if explicit_request else 'qualified_complex' if (
                    high_qualification and complex_question) else 'none',
            'qualification_score': qualification_status.get('score', 0),
            'explicit_request': explicit_request,
            'complex_question': complex_question
        }

        if should_handoff:
            # Notify human agents
            await self.notification_service.notify_agent_handoff(
                tenant_id=tenant_id,
                conversation_id=conversation_id,
                handoff_reason=handoff_decision['reason'],
                qualification_data=qualification_status
            )

            # Update conversation status
            await self.supabase_service.update_conversation_status(
                conversation_id=conversation_id,
                status='awaiting_human'
            )

        return handoff_decision

    async def end_conversation(
            self,
            tenant_id: str,
            conversation_id: str,
            config: Dict[str, Any],
            reason: str = 'completed'
    ) -> Dict[str, Any]:
        """
        End conversation and generate summary using Phidata agent
        """
        try:
            # Update conversation status
            await self.supabase_service.update_conversation_status(
                conversation_id=conversation_id,
                status='completed',
                ended_at=datetime.utcnow().isoformat(),
                end_reason=reason
            )

            # Get conversation history
            history = await self.supabase_service.get_conversation_history(conversation_id)

            # Create a summary agent
            try:
                summary_agent = Agent(
                    name="Conversation Summary Agent",
                    model=OpenAIChat(
                        id="gpt-3.5-turbo",
                        api_key=self._get_default_api_key('openai')
                    ),
                    description="Conversation summarization specialist for sales team review"
                )

                summary_prompt = f"""
                Summarize this sales conversation for team review:

                {json.dumps(history, indent=2)}

                Provide a structured summary including:
                1. Lead Quality Assessment (High/Medium/Low)
                2. Key Business Needs Identified
                3. Budget/Authority/Timeline Signals Detected
                4. Recommended Next Steps
                5. Notable Quotes or Objections
                6. Overall Conversation Rating (1-5 stars)

                Keep it concise but actionable for the sales team.
                """

                summary_response = summary_agent.run(summary_prompt)
                summary_content = summary_response.content
            except Exception as e:
                logger.error(f"Error generating summary: {e}")
                summary_content = f"Summary generation failed: {str(e)}"

            # Store summary
            await self.supabase_service.add_conversation_summary(
                conversation_id=conversation_id,
                summary=summary_content
            )

            return {
                'conversation_id': conversation_id,
                'status': 'completed',
                'summary': summary_content
            }

        except Exception as e:
            logger.error(f"Error ending conversation {conversation_id}: {e}")
            raise

    # Keep your existing methods for backward compatibility
    async def get_conversation_history(self, conversation_id: str) -> List[Dict[str, Any]]:
        """Get conversation history (existing method)"""
        return await self.supabase_service.get_conversation_history(conversation_id)

    async def generate_response(self, prompt: str, context: Dict[str, Any] = None) -> str:
        """Generate response (existing method - now using Phidata)"""
        # Simple fallback for existing API compatibility
        config = context or {}
        tenant_id = config.get('tenant_id', 'default')

        try:
            agent = self._get_agent_for_tenant(tenant_id, config)
            response = agent.run(prompt)
            return response.content
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return f"Error generating response: {str(e)}"