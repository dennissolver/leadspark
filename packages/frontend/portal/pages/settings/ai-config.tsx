import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/layout';
import useSupabase from '../../hooks/useSupabase';
import styles from './ai-config.module.scss';

interface AIConfig {
  systemPrompt: string;
  conversationStyle: string;
  responseLength: string;
  llmConsensusEnabled: boolean;
  llmConsensusStrategy: string;
  primaryLLM: string;
  fallbackLLM: string;
  maxConversationTurns: number;
  confidenceThreshold: number;
}

const AIConfigPage: React.FC = () => {
  const router = useRouter();
  const { supabase, user } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<AIConfig>({
    systemPrompt: '',
    conversationStyle: 'professional',
    responseLength: 'medium',
    llmConsensusEnabled: false,
    llmConsensusStrategy: 'majority',
    primaryLLM: 'gpt-4',
    fallbackLLM: 'gpt-3.5-turbo',
    maxConversationTurns: 10,
    confidenceThreshold: 0.7
  });

  const [testMode, setTestMode] = useState(false);
  const [testPrompt, setTestPrompt] = useState('');
  const [testResponse, setTestResponse] = useState('');

  const conversationStyles = [
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'casual', label: 'Casual' },
    { value: 'formal', label: 'Formal' }
  ];

  const responseLengths = [
    { value: 'brief', label: 'Brief (1-2 sentences)' },
    { value: 'medium', label: 'Medium (2-4 sentences)' },
    { value: 'detailed', label: 'Detailed (4+ sentences)' }
  ];

  const llmOptions = [
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'claude-3-opus', label: 'Claude 3 Opus' },
    { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' }
  ];

  const consensusStrategies = [
    { value: 'majority', label: 'Majority Vote' },
    { value: 'weighted', label: 'Weighted Average' },
    { value: 'unanimous', label: 'Unanimous Agreement' }
  ];

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      // Load tenant configuration from Supabase
      const { data, error } = await supabase
        .from('tenants')
        .select('config_json')
        .eq('id', user?.tenant_id)
        .single();

      if (error) throw error;

      if (data?.config_json) {
        setConfig({ ...config, ...data.config_json });
      }
    } catch (error) {
      console.error('Error loading AI configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          config_json: config,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.tenant_id);

      if (error) throw error;

      // Show success message
      alert('AI configuration saved successfully!');
    } catch (error) {
      console.error('Error saving AI configuration:', error);
      alert('Failed to save configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const testConfiguration = async () => {
    if (!testPrompt.trim()) return;

    setTestMode(true);
    try {
      // Call backend API to test the configuration
      const response = await fetch('/api/test-ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: testPrompt,
          config: config
        })
      });

      const result = await response.json();
      setTestResponse(result.response || 'Test completed successfully');
    } catch (error) {
      setTestResponse('Error testing configuration. Please check your settings.');
    } finally {
      setTestMode(false);
    }
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all AI configuration to defaults? This cannot be undone.')) {
      setConfig({
        systemPrompt: 'You are a helpful AI assistant for a financial services company. Be professional, knowledgeable, and focus on gathering lead information.',
        conversationStyle: 'professional',
        responseLength: 'medium',
        llmConsensusEnabled: false,
        llmConsensusStrategy: 'majority',
        primaryLLM: 'gpt-4',
        fallbackLLM: 'gpt-3.5-turbo',
        maxConversationTurns: 10,
        confidenceThreshold: 0.7
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading AI configuration...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.aiConfigContainer}>
        <div className={styles.header}>
          <Link href="/settings" className={styles.backButton}>
            ← Back to Settings
          </Link>
          <h1 className={styles.title}>AI Configuration</h1>
          <p className={styles.subtitle}>
            Customize how your AI assistant behaves and responds to leads
          </p>
        </div>

        <div className={styles.configGrid}>
          <div className={styles.mainConfig}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>System Prompt</h2>
              <p className={styles.sectionDescription}>
                Define your AI assistant's personality, role, and primary objectives
              </p>
              <textarea
                className={styles.systemPromptTextarea}
                value={config.systemPrompt}
                onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                placeholder="Enter your system prompt here..."
                rows={6}
              />
              <div className={styles.promptTips}>
                <h4>Tips for effective system prompts:</h4>
                <ul>
                  <li>Be specific about your business and services</li>
                  <li>Define the desired conversation flow</li>
                  <li>Include key information to collect from leads</li>
                  <li>Set boundaries for what the AI should/shouldn't discuss</li>
                </ul>
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Conversation Settings</h2>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Conversation Style</label>
                  <select
                    className={styles.select}
                    value={config.conversationStyle}
                    onChange={(e) => setConfig({ ...config, conversationStyle: e.target.value })}
                  >
                    {conversationStyles.map(style => (
                      <option key={style.value} value={style.value}>{style.label}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Response Length</label>
                  <select
                    className={styles.select}
                    value={config.responseLength}
                    onChange={(e) => setConfig({ ...config, responseLength: e.target.value })}
                  >
                    {responseLengths.map(length => (
                      <option key={length.value} value={length.value}>{length.label}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Max Conversation Turns</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={config.maxConversationTurns}
                    onChange={(e) => setConfig({ ...config, maxConversationTurns: parseInt(e.target.value) })}
                    min="1"
                    max="50"
                  />
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>LLM Configuration</h2>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Primary LLM</label>
                  <select
                    className={styles.select}
                    value={config.primaryLLM}
                    onChange={(e) => setConfig({ ...config, primaryLLM: e.target.value })}
                  >
                    {llmOptions.map(llm => (
                      <option key={llm.value} value={llm.value}>{llm.label}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Fallback LLM</label>
                  <select
                    className={styles.select}
                    value={config.fallbackLLM}
                    onChange={(e) => setConfig({ ...config, fallbackLLM: e.target.value })}
                  >
                    {llmOptions.map(llm => (
                      <option key={llm.value} value={llm.value}>{llm.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.consensusSection}>
                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="llmConsensus"
                    checked={config.llmConsensusEnabled}
                    onChange={(e) => setConfig({ ...config, llmConsensusEnabled: e.target.checked })}
                  />
                  <label htmlFor="llmConsensus" className={styles.checkboxLabel}>
                    Enable LLM Consensus
                  </label>
                </div>
                <p className={styles.consensusDescription}>
                  Use multiple LLMs and combine their responses for improved accuracy
                </p>

                {config.llmConsensusEnabled && (
                  <div className={styles.consensusOptions}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Consensus Strategy</label>
                      <select
                        className={styles.select}
                        value={config.llmConsensusStrategy}
                        onChange={(e) => setConfig({ ...config, llmConsensusStrategy: e.target.value })}
                      >
                        {consensusStrategies.map(strategy => (
                          <option key={strategy.value} value={strategy.value}>{strategy.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Confidence Threshold</label>
                      <input
                        type="range"
                        className={styles.slider}
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={config.confidenceThreshold}
                        onChange={(e) => setConfig({ ...config, confidenceThreshold: parseFloat(e.target.value) })}
                      />
                      <span className={styles.sliderValue}>{config.confidenceThreshold}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.testSection}>
              <h3 className={styles.testTitle}>Test Configuration</h3>
              <textarea
                className={styles.testPrompt}
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder="Enter a test message to see how your AI will respond..."
                rows={3}
              />
              <button
                className={styles.testButton}
                onClick={testConfiguration}
                disabled={testMode || !testPrompt.trim()}
              >
                {testMode ? 'Testing...' : 'Test Response'}
              </button>

              {testResponse && (
                <div className={styles.testResponse}>
                  <h4>AI Response:</h4>
                  <p>{testResponse}</p>
                </div>
              )}
            </div>

            <div className={styles.actionsSection}>
              <button
                className={styles.saveButton}
                onClick={saveConfig}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>

              <button
                className={styles.resetButton}
                onClick={resetToDefaults}
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AIConfigPage;