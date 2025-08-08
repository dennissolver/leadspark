// pages/api/test-ai-config.js
import { supabase } from '../../lib/supabaseClient';

// Mock LLM service - replace with actual LLM integrations
const mockLLMService = {
  async callGPT4(prompt, config) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      response: `This is a test response using ${config.conversationStyle} style. The AI would respond in ${config.responseLength} format with confidence level based on your settings.`,
      confidence: Math.random() * 0.4 + 0.6, // Random confidence between 0.6-1.0
      model: config.primaryLLM,
      tokens_used: Math.floor(Math.random() * 100) + 50
    };
  },

  async callClaude(prompt, config) {
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      response: `Claude's interpretation: Following your ${config.conversationStyle} conversation style, here's how I would handle this scenario with ${config.responseLength} detail level.`,
      confidence: Math.random() * 0.3 + 0.7,
      model: config.fallbackLLM,
      tokens_used: Math.floor(Math.random() * 80) + 40
    };
  },

  async performConsensus(responses, strategy) {
    if (strategy === 'majority') {
      // Simple majority vote simulation
      const highestConfidence = responses.reduce((max, curr) =>
        curr.confidence > max.confidence ? curr : max
      );
      return {
        consensusResponse: highestConfidence.response,
        consensusConfidence: highestConfidence.confidence,
        participatingModels: responses.map(r => r.model),
        strategy: 'majority'
      };
    }

    if (strategy === 'weighted') {
      // Weighted average simulation
      const totalWeight = responses.reduce((sum, r) => sum + r.confidence, 0);
      const weightedResponse = responses[0].response; // Simplified
      return {
        consensusResponse: `${weightedResponse} [Weighted consensus from ${responses.length} models]`,
        consensusConfidence: totalWeight / responses.length,
        participatingModels: responses.map(r => r.model),
        strategy: 'weighted'
      };
    }

    // Default to first response
    return {
      consensusResponse: responses[0].response,
      consensusConfidence: responses[0].confidence,
      participatingModels: [responses[0].model],
      strategy: strategy
    };
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, config } = req.body;

    if (!prompt || !config) {
      return res.status(400).json({ error: 'Missing prompt or config' });
    }

    // Validate the prompt
    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid prompt' });
    }

    // Build the full prompt with system prompt
    const fullPrompt = `${config.systemPrompt || 'You are a helpful AI assistant.'}\n\nUser: ${prompt}`;

    let result;

    if (config.llmConsensusEnabled && config.llmConsensusEnabled === true) {
      // Perform consensus between multiple LLMs
      console.log('Testing with LLM consensus enabled...');

      const responses = await Promise.all([
        mockLLMService.callGPT4(fullPrompt, config),
        mockLLMService.callClaude(fullPrompt, config)
      ]);

      // Filter responses by confidence threshold
      const validResponses = responses.filter(r =>
        r.confidence >= (config.confidenceThreshold || 0.7)
      );

      if (validResponses.length === 0) {
        return res.status(200).json({
          response: "No responses met the confidence threshold. Please adjust your settings and try again.",
          confidence: 0,
          consensus: null,
          warning: "Low confidence responses filtered out"
        });
      }

      const consensus = await mockLLMService.performConsensus(
        validResponses,
        config.llmConsensusStrategy || 'majority'
      );

      result = {
        response: consensus.consensusResponse,
        confidence: consensus.consensusConfidence,
        consensus: {
          strategy: consensus.strategy,
          models: consensus.participatingModels,
          totalResponses: responses.length,
          validResponses: validResponses.length
        },
        config_used: {
          systemPrompt: config.systemPrompt ? 'Custom' : 'Default',
          style: config.conversationStyle,
          responseLength: config.responseLength,
          consensusEnabled: true,
          consensusStrategy: config.llmConsensusStrategy,
          confidenceThreshold: config.confidenceThreshold
        }
      };
    } else {
      // Single LLM response
      console.log('Testing with single LLM...');

      const response = await mockLLMService.callGPT4(fullPrompt, config);

      result = {
        response: response.response,
        confidence: response.confidence,
        consensus: null,
        config_used: {
          systemPrompt: config.systemPrompt ? 'Custom' : 'Default',
          style: config.conversationStyle,
          responseLength: config.responseLength,
          model: response.model,
          tokens: response.tokens_used,
          consensusEnabled: false
        }
      };
    }

    // Add metadata about the test
    result.metadata = {
      tested_at: new Date().toISOString(),
      test_prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      response_time_ms: Math.floor(Math.random() * 2000) + 500 // Mock response time
    };

    console.log('AI Configuration test completed:', {
      consensusEnabled: config.llmConsensusEnabled,
      confidence: result.confidence,
      responseLength: result.response.length
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error('Error testing AI configuration:', error);

    return res.status(500).json({
      error: 'Failed to test AI configuration',
      details: error.message,
      suggestion: 'Please check your configuration settings and try again'
    });
  }
}

// Helper function to validate AI config (can be expanded)
function validateAIConfig(config) {
  const errors = [];

  if (!config.systemPrompt || config.systemPrompt.trim().length < 10) {
    errors.push('System prompt should be at least 10 characters long');
  }

  if (config.maxConversationTurns && (config.maxConversationTurns < 1 || config.maxConversationTurns > 50)) {
    errors.push('Max conversation turns should be between 1 and 50');
  }

  if (config.confidenceThreshold && (config.confidenceThreshold < 0.1 || config.confidenceThreshold > 1.0)) {
    errors.push('Confidence threshold should be between 0.1 and 1.0');
  }

  return errors;
}