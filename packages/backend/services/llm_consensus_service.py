"""
Enhanced LLM Consensus Service with Phidata Integration
Orchestrates multiple LLM models to reach consensus on responses and decisions
"""

import asyncio
import logging
import json
import statistics
from typing import Dict, List, Optional, Any
from datetime import datetime
from enum import Enum

from phi.agent import Agent
from phi.model.openai import OpenAIChat
from phi.model.anthropic import Claude
from phi.model.xai import xAI
from phi.model.google import Gemini

from .supabase_service import SupabaseService

logger = logging.getLogger(__name__)


class ConsensusStrategy(Enum):
    """Available consensus strategies"""
    MAJORITY = "majority"
    WEIGHTED = "weighted"
    UNANIMOUS = "unanimous"
    BEST_OF_N = "best_of_n"
    HIERARCHICAL = "hierarchical"


class LLMConsensusService:
    """
    Enhanced consensus service that coordinates multiple LLM models using Phidata
    to make better decisions and generate higher quality responses
    """

    def __init__(self):
        self.supabase_service = SupabaseService()

        # Default configuration - using strings instead of enums for initialization
        self.default_config = {
            'models': ['gpt-4', 'claude-3-sonnet', 'grok-2', 'gemini-2.5-flash'],
            'strategy': 'weighted',  # Will convert to enum later
            'confidence_threshold': 0.7,
            'max_iterations': 3,
            'timeout_seconds': 45,
            'voting_weights': {
                'gpt-4': 0.3,
                'claude-3-sonnet': 0.3,
                'grok-2': 0.2,
                'gemini-2.5-flash': 0.2
            }
        }

        # Initialize model agents
        self._model_agents: Dict[str, Agent] = {}
        self._setup_model_agents()

    def _get_api_key(self, env_name: str) -> str:
        """Get API key from environment"""
        import os
        key = os.getenv(env_name, "")
        if key:
            logger.debug(f"✅ Found {env_name}")
        else:
            logger.debug(f"❌ Missing {env_name}")
        return key

    def _setup_model_agents(self):
        """Initialize individual model agents using Phidata"""

        # OpenAI GPT-4
        try:
            openai_key = self._get_api_key("OPENAI_API_KEY")
            if openai_key:
                self._model_agents['gpt-4'] = Agent(
                    name="GPT-4 Consensus Agent",
                    model=OpenAIChat(
                        id="gpt-4",
                        api_key=openai_key,
                        temperature=0.7
                    ),
                    description="OpenAI GPT-4 for high-quality reasoning and analysis"
                )
                logger.info("✅ GPT-4 agent initialized successfully")
            else:
                logger.warning("❌ OPENAI_API_KEY not found")
        except Exception as e:
            logger.warning(f"❌ Failed to initialize GPT-4 agent: {e}")

        # Anthropic Claude
        try:
            anthropic_key = self._get_api_key("ANTHROPIC_API_KEY")
            if anthropic_key:
                self._model_agents['claude-3-sonnet'] = Agent(
                    name="Claude Sonnet Consensus Agent",
                    model=Claude(
                        id="claude-3-5-sonnet-20241022",
                        api_key=anthropic_key,
                        temperature=0.7
                    ),
                    description="Anthropic Claude for nuanced understanding and safety"
                )
                logger.info("✅ Claude agent initialized successfully")
            else:
                logger.warning("❌ ANTHROPIC_API_KEY not found")
        except Exception as e:
            logger.warning(f"❌ Failed to initialize Claude agent: {e}")

        # xAI Grok - FIXED MODEL ID
        try:
            grok_key = self._get_api_key("GROK_API_KEY")
            if grok_key:
                self._model_agents['grok-2'] = Agent(  # FIXED: Use grok-2
                    name="Grok 2 Consensus Agent",
                    model=xAI(
                        id="grok-2",  # FIXED: This should work
                        api_key=grok_key,
                        temperature=0.7
                    ),
                    description="xAI Grok 2 for truth-seeking analysis and reasoning"
                )
                logger.info("✅ xAI Grok 2 agent initialized successfully")
            else:
                logger.warning("❌ GROK_API_KEY not found")
        except Exception as e:
            logger.warning(f"❌ Failed to initialize Grok agent: {e}")

        # Google Gemini
        try:
            gemini_key = self._get_api_key("GEMINI_API_KEY")
            if gemini_key:
                self._model_agents['gemini-2.5-flash'] = Agent(
                    name="Gemini Flash Consensus Agent",
                    model=Gemini(
                        id="gemini-2.5-flash",
                        api_key=gemini_key,
                        temperature=0.7
                    ),
                    description="Google Gemini 2.5 Flash for comprehensive analysis"
                )
                logger.info("✅ Gemini agent initialized successfully")
            else:
                logger.warning("❌ GEMINI_API_KEY not found")
        except Exception as e:
            logger.warning(f"❌ Failed to initialize Gemini agent: {e}")

        # Log summary of available models
        available_models = list(self._model_agents.keys())
        logger.info(f"🤖 Available models for consensus: {available_models}")

    async def get_consensus_response(
            self,
            prompt: str,
            task_type: str = "general",
            strategy: ConsensusStrategy = None,
            config: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Get consensus response from multiple models using Phidata agents
        """
        config = {**self.default_config, **(config or {})}

        # Convert string strategy to enum if needed
        if strategy is None:
            strategy_str = config.get('strategy', 'weighted')
            try:
                strategy = ConsensusStrategy(strategy_str)
            except ValueError:
                strategy = ConsensusStrategy.WEIGHTED

        try:
            # Get responses from all available models
            model_responses = await self._get_all_model_responses(prompt, task_type, config)

            if not model_responses:
                logger.warning("No model responses received, falling back to single model")
                return await self._fallback_single_model(prompt, task_type)

            # Apply consensus strategy
            consensus_result = await self._apply_consensus_strategy(
                model_responses,
                strategy,
                task_type,
                config
            )

            # Log consensus decision for analysis (ignore errors)
            try:
                await self._log_consensus_decision(
                    prompt=prompt,
                    model_responses=model_responses,
                    consensus_result=consensus_result,
                    task_type=task_type
                )
            except Exception as log_error:
                logger.debug(f"Consensus logging failed (non-critical): {log_error}")

            return consensus_result

        except Exception as e:
            logger.error(f"Error getting consensus response: {e}")
            # Fallback to single best model
            return await self._fallback_single_model(prompt, task_type)

    async def _get_all_model_responses(
            self,
            prompt: str,
            task_type: str,
            config: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Get responses from all configured models concurrently using Phidata agents"""

        # Enhance prompt with task-specific instructions
        enhanced_prompt = self._enhance_prompt_for_task(prompt, task_type, config)

        # Create tasks for concurrent execution - only use available models
        tasks = []
        available_models = [model for model in config.get('models', self.default_config['models'])
                            if model in self._model_agents]

        logger.info(f"🚀 Running consensus with models: {available_models}")

        for model_name in available_models:
            task = self._get_model_response(model_name, enhanced_prompt)
            tasks.append(task)

        if not tasks:
            logger.warning("No model agents available for consensus")
            return []

        # Execute all models concurrently with timeout
        try:
            responses = await asyncio.wait_for(
                asyncio.gather(*tasks, return_exceptions=True),
                timeout=config['timeout_seconds']
            )

            # Filter out failed responses
            valid_responses = []
            for i, response in enumerate(responses):
                if not isinstance(response, Exception):
                    valid_responses.append(response)
                    logger.info(f"✅ {available_models[i]} responded successfully")
                else:
                    model_name = available_models[i] if i < len(available_models) else f"model_{i}"
                    logger.warning(f"❌ {model_name} failed: {response}")

            logger.info(f"📊 Consensus summary: {len(valid_responses)}/{len(available_models)} models responded")
            return valid_responses

        except asyncio.TimeoutError:
            logger.error("Consensus request timed out")
            return []

    async def _get_model_response(self, model_name: str, prompt: str) -> Dict[str, Any]:
        """Get response from a single Phidata agent with error handling"""
        start_time = datetime.utcnow()

        try:
            agent = self._model_agents[model_name]

            # Add structured response instructions
            structured_prompt = f"""
            {prompt}

            Please provide your response in the following JSON format:
            {{
                "response": "your main response to the prompt",
                "confidence": 0.85,
                "reasoning": "brief explanation of your reasoning",
                "alternatives": ["alternative perspective 1", "alternative perspective 2"]
            }}

            Ensure the JSON is valid and complete.
            """

            response = agent.run(structured_prompt)
            end_time = datetime.utcnow()

            # Parse structured response
            try:
                structured_response = json.loads(response.content)
            except json.JSONDecodeError:
                # Fallback for non-JSON responses
                structured_response = {
                    "response": response.content,
                    "confidence": 0.7,  # Default confidence
                    "reasoning": "Response not in structured format",
                    "alternatives": []
                }

            return {
                'model': model_name,
                'response': structured_response.get('response', response.content),
                'confidence': structured_response.get('confidence', 0.7),
                'reasoning': structured_response.get('reasoning', ''),
                'alternatives': structured_response.get('alternatives', []),
                'response_time': (end_time - start_time).total_seconds(),
                'timestamp': end_time.isoformat(),
                'raw_response': response.content
            }

        except Exception as e:
            logger.error(f"Error getting response from {model_name}: {e}")
            raise

    def _enhance_prompt_for_task(self, prompt: str, task_type: str, config: Dict[str, Any]) -> str:
        """Enhance prompt with task-specific instructions"""

        task_instructions = {
            'conversation': """
                Focus on natural, engaging conversation that moves toward lead qualification.
                Consider the user's emotional state and respond appropriately.
                """,
            'qualification': """
                Analyze for BANT criteria (Budget, Authority, Need, Timeline).
                Look for buying signals and decision-making indicators.
                """,
            'objection_handling': """
                Address concerns with empathy while maintaining sales momentum.
                Provide evidence-based responses and social proof when relevant.
                """,
            'booking': """
                Guide toward scheduling a discovery call or next step.
                Create urgency while remaining helpful and non-pushy.
                """,
            'analysis': """
                Provide detailed analysis with supporting evidence.
                Consider multiple perspectives and potential biases.
                """
        }

        task_instruction = task_instructions.get(task_type, "Respond helpfully and accurately.")

        return f"""
        {prompt}

        Task Context: {task_type}
        Special Instructions: {task_instruction}

        Configuration: {json.dumps(config.get('task_config', {}), indent=2)}
        """

    async def _apply_consensus_strategy(
            self,
            model_responses: List[Dict[str, Any]],
            strategy: ConsensusStrategy,
            task_type: str,
            config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Apply the specified consensus strategy to model responses"""

        if not model_responses:
            raise ValueError("No valid model responses to process")

        if strategy == ConsensusStrategy.MAJORITY:
            return await self._majority_consensus(model_responses)
        elif strategy == ConsensusStrategy.WEIGHTED:
            return await self._weighted_consensus(model_responses, config)
        elif strategy == ConsensusStrategy.UNANIMOUS:
            return await self._unanimous_consensus(model_responses)
        elif strategy == ConsensusStrategy.BEST_OF_N:
            return await self._best_of_n_consensus(model_responses)
        elif strategy == ConsensusStrategy.HIERARCHICAL:
            return await self._hierarchical_consensus(model_responses, task_type, config)
        else:
            # Default to weighted
            return await self._weighted_consensus(model_responses, config)

    async def _weighted_consensus(self, responses: List[Dict[str, Any]], config: Dict[str, Any]) -> Dict[str, Any]:
        """Weighted consensus based on model weights and confidence scores"""

        weights = config.get('voting_weights', self.default_config['voting_weights'])

        # Calculate weighted scores for each response
        weighted_responses = []
        for response in responses:
            model_weight = weights.get(response['model'], 0.25)  # Default equal weight for 4 models
            weighted_score = response['confidence'] * model_weight

            weighted_responses.append({
                **response,
                'weighted_score': weighted_score
            })

        # Sort by weighted score
        weighted_responses.sort(key=lambda x: x['weighted_score'], reverse=True)

        # Use top response as consensus
        top_response = weighted_responses[0]

        # Calculate overall confidence as weighted average
        total_weight = sum(weights.get(r['model'], 0.25) for r in responses)
        weighted_confidence = sum(
            r['confidence'] * weights.get(r['model'], 0.25)
            for r in responses
        ) / total_weight if total_weight > 0 else 0.5

        return {
            'consensus_response': top_response['response'],
            'consensus_confidence': weighted_confidence,
            'strategy': 'weighted',
            'participating_models': [r['model'] for r in responses],
            'total_responses': len(responses),
            'top_model': top_response['model'],
            'metadata': {
                'weighted_scores': [(r['model'], r['weighted_score']) for r in weighted_responses],
                'all_responses': responses
            }
        }

    async def _majority_consensus(self, responses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Simple majority voting based on response similarity"""

        # Group similar responses
        response_groups = self._group_similar_responses(responses)

        # Find largest group
        majority_group = max(response_groups, key=len)

        # Average confidence of majority group
        avg_confidence = statistics.mean([r['confidence'] for r in majority_group])

        # Select best response from majority group (highest confidence)
        best_response = max(majority_group, key=lambda x: x['confidence'])

        return {
            'consensus_response': best_response['response'],
            'consensus_confidence': avg_confidence,
            'strategy': 'majority',
            'participating_models': [r['model'] for r in majority_group],
            'total_responses': len(responses),
            'consensus_size': len(majority_group),
            'metadata': {
                'all_responses': responses,
                'response_groups': len(response_groups)
            }
        }

    async def _best_of_n_consensus(self, responses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Select the single best response based on confidence and quality metrics"""

        # Score each response based on multiple factors
        scored_responses = []
        for response in responses:
            # Base score is confidence
            score = response['confidence']

            # Boost score for longer, more detailed responses (within reason)
            response_length = len(response['response'])
            length_bonus = min(0.1, response_length / 1000)  # Max 10% bonus
            score += length_bonus

            # Boost score for responses with reasoning
            if response.get('reasoning') and len(response['reasoning']) > 20:
                score += 0.05

            # Boost score for responses with alternatives (shows thoughtfulness)
            if response.get('alternatives') and len(response['alternatives']) > 0:
                score += 0.03

            # Penalize very fast responses (might be superficial)
            if response.get('response_time', 10) < 2:
                score -= 0.02

            scored_responses.append({
                **response,
                'quality_score': score
            })

        # Select best response
        best_response = max(scored_responses, key=lambda x: x['quality_score'])

        return {
            'consensus_response': best_response['response'],
            'consensus_confidence': best_response['confidence'],
            'strategy': 'best_of_n',
            'participating_models': [r['model'] for r in responses],
            'total_responses': len(responses),
            'winning_model': best_response['model'],
            'metadata': {
                'quality_scores': [(r['model'], r['quality_score']) for r in scored_responses],
                'all_responses': responses
            }
        }

    async def _unanimous_consensus(self, responses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Require unanimous agreement or flag disagreement"""

        # Check if all responses are similar enough
        response_groups = self._group_similar_responses(responses, similarity_threshold=0.8)

        if len(response_groups) == 1:
            # Unanimous agreement
            all_responses = response_groups[0]
            avg_confidence = statistics.mean([r['confidence'] for r in all_responses])
            best_response = max(all_responses, key=lambda x: x['confidence'])

            return {
                'consensus_response': best_response['response'],
                'consensus_confidence': avg_confidence,
                'strategy': 'unanimous',
                'participating_models': [r['model'] for r in all_responses],
                'total_responses': len(responses),
                'unanimous': True,
                'metadata': {
                    'all_responses': responses
                }
            }
        else:
            # No consensus - flag for human review or use fallback
            return {
                'consensus_response': "Multiple models disagree on this response. Human review recommended.",
                'consensus_confidence': 0.3,
                'strategy': 'unanimous',
                'participating_models': [r['model'] for r in responses],
                'total_responses': len(responses),
                'unanimous': False,
                'metadata': {
                    'disagreement_groups': len(response_groups),
                    'all_responses': responses,
                    'requires_review': True
                }
            }

    async def _hierarchical_consensus(self, responses: List[Dict[str, Any]], task_type: str, config: Dict[str, Any]) -> \
    Dict[str, Any]:
        """Use model hierarchy based on task type expertise"""

        # Define model expertise for different tasks
        model_expertise = config.get('model_expertise', {
            'conversation': {'gpt-4': 0.9, 'claude-3-sonnet': 0.95, 'grok-beta': 0.85, 'gemini-2.5-flash': 0.85},
            'qualification': {'gpt-4': 0.95, 'claude-3-sonnet': 0.85, 'grok-beta': 0.9, 'gemini-2.5-flash': 0.9},
            'analysis': {'gpt-4': 0.9, 'claude-3-sonnet': 0.9, 'grok-beta': 0.95, 'gemini-2.5-flash': 0.95},
            'objection_handling': {'gpt-4': 0.85, 'claude-3-sonnet': 0.9, 'grok-beta': 0.8, 'gemini-2.5-flash': 0.85},
            'booking': {'gpt-4': 0.9, 'claude-3-sonnet': 0.85, 'grok-beta': 0.85, 'gemini-2.5-flash': 0.85}
        })

        expertise_scores = model_expertise.get(task_type, {})

        # Score responses based on model expertise and confidence
        hierarchical_scores = []
        for response in responses:
            expertise = expertise_scores.get(response['model'], 0.8)  # Default expertise
            hierarchical_score = response['confidence'] * expertise

            hierarchical_scores.append({
                **response,
                'hierarchical_score': hierarchical_score,
                'expertise_level': expertise
            })

        # Select response with highest hierarchical score
        best_response = max(hierarchical_scores, key=lambda x: x['hierarchical_score'])

        return {
            'consensus_response': best_response['response'],
            'consensus_confidence': best_response['confidence'],
            'strategy': 'hierarchical',
            'participating_models': [r['model'] for r in responses],
            'total_responses': len(responses),
            'selected_model': best_response['model'],
            'task_type': task_type,
            'metadata': {
                'hierarchical_scores': [(r['model'], r['hierarchical_score']) for r in hierarchical_scores],
                'expertise_levels': expertise_scores,
                'all_responses': responses
            }
        }

    def _group_similar_responses(self, responses: List[Dict[str, Any]], similarity_threshold: float = 0.7) -> List[
        List[Dict[str, Any]]]:
        """Group responses by similarity using simple keyword matching"""

        if not responses:
            return []

        groups = []

        for response in responses:
            response_text = response['response'].lower()
            response_words = set(response_text.split())

            # Find if this response belongs to an existing group
            assigned = False
            for group in groups:
                # Check similarity with first response in group
                group_text = group[0]['response'].lower()
                group_words = set(group_text.split())

                # Calculate Jaccard similarity
                intersection = len(response_words.intersection(group_words))
                union = len(response_words.union(group_words))
                similarity = intersection / union if union > 0 else 0

                if similarity >= similarity_threshold:
                    group.append(response)
                    assigned = True
                    break

            # Create new group if not assigned
            if not assigned:
                groups.append([response])

        return groups

    async def _fallback_single_model(self, prompt: str, task_type: str) -> Dict[str, Any]:
        """Fallback to single best model when consensus fails"""

        # Try models in order of preference
        fallback_models = ['gpt-4', 'claude-3-sonnet', 'gemini-2.5-flash', 'grok-beta']

        for fallback_model in fallback_models:
            if fallback_model in self._model_agents:
                try:
                    logger.info(f"🔄 Falling back to {fallback_model}")
                    response_data = await self._get_model_response(fallback_model, prompt)

                    return {
                        'consensus_response': response_data['response'],
                        'consensus_confidence': response_data['confidence'] * 0.8,  # Reduce confidence for fallback
                        'strategy': 'fallback_single',
                        'participating_models': [fallback_model],
                        'total_responses': 1,
                        'fallback_reason': 'consensus_failed',
                        'fallback_model': fallback_model,
                        'metadata': {
                            'all_responses': [response_data]
                        }
                    }

                except Exception as e:
                    logger.error(f"❌ Fallback model {fallback_model} also failed: {e}")
                    continue

        # Ultimate fallback
        return {
            'consensus_response': "I'm experiencing technical difficulties with all AI models. Please try again or contact support.",
            'consensus_confidence': 0.1,
            'strategy': 'error_fallback',
            'participating_models': [],
            'total_responses': 0,
            'fallback_reason': 'all_models_failed',
            'metadata': {
                'error': "All models failed to respond"
            }
        }

    async def _log_consensus_decision(
            self,
            prompt: str,
            model_responses: List[Dict[str, Any]],
            consensus_result: Dict[str, Any],
            task_type: str
    ):
        """Log consensus decision for analysis and improvement"""

        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'task_type': task_type,
            'prompt_length': len(prompt),
            'num_models': len(model_responses),
            'consensus_strategy': consensus_result['strategy'],
            'consensus_confidence': consensus_result['consensus_confidence'],
            'response_length': len(consensus_result['consensus_response']),
            'model_agreements': self._analyze_model_agreements(model_responses),
            'total_response_time': sum(r.get('response_time', 0) for r in model_responses)
        }

        # Store in database for analytics (ignore errors)
        try:
            await self.supabase_service.log_consensus_decision(log_data)
        except Exception as e:
            # Don't fail the whole operation if logging fails
            logger.debug(f"Failed to log consensus decision: {e}")

    def _analyze_model_agreements(self, responses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze how much models agreed with each other"""

        if len(responses) < 2:
            return {'agreement_score': 1.0, 'disagreements': 0}

        # Simple agreement analysis based on response grouping
        groups = self._group_similar_responses(responses)
        largest_group_size = max(len(group) for group in groups) if groups else 0

        agreement_score = largest_group_size / len(responses) if responses else 0
        disagreements = len(groups) - 1 if groups else 0

        return {
            'agreement_score': agreement_score,
            'disagreements': disagreements,
            'consensus_groups': len(groups),
            'largest_group_size': largest_group_size
        }

    # Keep existing methods for backward compatibility
    async def get_llm_response(self, prompt: str, model: str = "gpt-4") -> Dict[str, Any]:
        """Get response from single LLM (existing method)"""
        if model in self._model_agents:
            try:
                return await self._get_model_response(model, prompt)
            except Exception as e:
                logger.error(f"Error getting response from {model}: {e}")
                return {
                    'response': "Error generating response",
                    'confidence': 0.1,
                    'model': model,
                    'error': str(e)
                }
        else:
            logger.warning(f"Model {model} not available")
            return {
                'response': f"Model {model} not available",
                'confidence': 0.1,
                'model': model,
                'error': "Model not initialized"
            }

    async def compare_responses(self, responses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Compare multiple responses (existing method)"""
        if not responses:
            return {'error': 'No responses to compare'}

        # Use best_of_n consensus for comparison
        return await self._best_of_n_consensus(responses)