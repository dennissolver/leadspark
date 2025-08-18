// ============================================================================
// ENHANCED LEAD DETAIL PAGE (packages/frontend/portal/pages/leads/[leadId].tsx)
// ============================================================================

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/layout';
import { useSupabase } from '@leadspark/common/src/utils/supabase/useSupabase';

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
  investment_goals: string | null;
  notes: string | null;
  company?: string;
  consensusData?: ConsensusData;
}

interface ConsensusData {
  leadScore: number;
  confidence: number;
  recommendation: string;
  reasoning: string;
  actionItems: string[];
  processingTime: number;
  timestamp: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  modelInsights?: ModelInsight[];
}

interface ModelInsight {
  model: string;
  score: number;
  confidence: number;
  reasoning: string;
  alternatives: string[];
}

const getTenantId = (user: any): string | undefined =>
  user?.user_metadata?.tenant_id ?? user?.app_metadata?.tenant_id ?? user?.tenant_id;

const LeadDetailPage: React.FC = () => {
  const { user, supabase } = useSupabase();
  const router = useRouter();
  const { leadId } = router.query as { leadId?: string };

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consensusLoading, setConsensusLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'consensus' | 'actions'>('details');

  const tenantId = getTenantId(user);

  useEffect(() => {
    const fetchLead = async () => {
      if (!leadId || !supabase) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('id', leadId)
          .single();

        if (error) throw error;

        setLead(data);

        // Try to fetch existing consensus data
        await fetchConsensusData(leadId as string);

      } catch (err: any) {
        setError(err?.message ?? 'Failed to load lead');
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [leadId, supabase]);

  const fetchConsensusData = async (leadId: string) => {
    try {
      const token = await supabase?.auth.getSession().then(s => s.data.session?.access_token);

      const response = await fetch(`http://localhost:8000/api/api/consensus/history?leadId=${leadId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const consensusHistory = await response.json();
        if (consensusHistory.length > 0) {
          const latestConsensus = consensusHistory[0];
          setLead(prev => prev ? {
            ...prev,
            consensusData: transformConsensusResult(latestConsensus)
          } : null);
        }
      }
    } catch (error) {
      console.error('Error fetching consensus data:', error);
    }
  };

  const requestConsensusAnalysis = async () => {
    if (!lead || !supabase) return;

    setConsensusLoading(true);

    try {
      const token = await supabase.auth.getSession().then(s => s.data.session?.access_token);

      const response = await fetch('http://localhost:8000/api/api/consensus/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: `Rate this business lead: ${lead.first_name} ${lead.last_name} from ${lead.company || 'Unknown Company'}, email ${lead.email}. Investment goals: ${lead.investment_goals || 'Not specified'}. Status: ${lead.status}`,
          task_type: 'qualification',
          strategy: 'weighted',
          priority: 'normal'
        })
      });

      if (response.ok) {
        const result = await response.json();

        // Set processing status
        setLead(prev => prev ? {
          ...prev,
          consensusData: {
            status: 'processing',
            leadScore: 0,
            confidence: 0,
            recommendation: 'Processing...',
            reasoning: 'AI models are analyzing this lead...',
            actionItems: [],
            processingTime: 0,
            timestamp: new Date().toISOString()
          }
        } : null);

        // Poll for results
        pollForConsensusResult(result.request_id);
      }
    } catch (error) {
      console.error('Error requesting consensus analysis:', error);
    } finally {
      setConsensusLoading(false);
    }
  };

  const pollForConsensusResult = async (requestId: string) => {
    const maxAttempts = 30; // 30 attempts = 1 minute
    let attempts = 0;

    const poll = async () => {
      try {
        const token = await supabase?.auth.getSession().then(s => s.data.session?.access_token);

        const response = await fetch(`http://localhost:8000/api/api/consensus/result/${requestId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();

          if (result.status === 'completed') {
            setLead(prev => prev ? {
              ...prev,
              consensusData: transformConsensusResult(result)
            } : null);
            return;
          } else if (result.status === 'failed') {
            setLead(prev => prev ? {
              ...prev,
              consensusData: {
                status: 'failed',
                leadScore: 0,
                confidence: 0,
                recommendation: 'Analysis Failed',
                reasoning: 'Unable to complete analysis. Please try again.',
                actionItems: [],
                processingTime: 0,
                timestamp: new Date().toISOString()
              }
            } : null);
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000); // Poll every 2 seconds
        } else {
          // Timeout
          setLead(prev => prev ? {
            ...prev,
            consensusData: {
              status: 'failed',
              leadScore: 0,
              confidence: 0,
              recommendation: 'Timeout',
              reasoning: 'Analysis timed out. Please try again.',
              actionItems: [],
              processingTime: 0,
              timestamp: new Date().toISOString()
            }
          } : null);
        }
      } catch (error) {
        console.error('Error polling for consensus result:', error);
      }
    };

    poll();
  };

  const executeAction = async (action: string) => {
    if (!lead) return;

    switch (action) {
      case 'schedule_call':
        // Integrate with your scheduling system
        alert(`Scheduling call with ${lead.first_name} ${lead.last_name}`);
        break;
      case 'send_proposal':
        alert(`Sending proposal to ${lead.email}`);
        break;
      case 'update_status':
        // Update lead status based on consensus
        const newStatus = lead.consensusData?.leadScore >= 7 ? 'qualified' : 'nurture';
        try {
          await supabase?.from('leads').update({ status: newStatus }).eq('id', lead.id);
          setLead(prev => prev ? { ...prev, status: newStatus } : null);
        } catch (error) {
          console.error('Error updating lead status:', error);
        }
        break;
    }
  };

  if (loading) {
    return (
      <Layout title="Lead Details">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !lead) {
    return (
      <Layout title="Lead Details">
        <Head>
          <title>Lead Details - LeadSpark Portal</title>
        </Head>
        <div className="container mx-auto max-w-4xl px-4 py-6">
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-red-700">
            {error || 'Lead not found.'}
          </div>
          <button onClick={() => router.back()} className="text-blue-600 underline">
            ← Back
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Lead Details">
      <Head>
        <title>{lead.first_name} {lead.last_name} - LeadSpark Portal</title>
      </Head>

      <div className="container mx-auto max-w-6xl px-4 py-6">
        <button onClick={() => router.back()} className="mb-4 text-sm text-blue-600 underline hover:text-blue-800">
          ← Back to Dashboard
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {lead.first_name} {lead.last_name}
              </h1>
              <p className="text-gray-600">{lead.email}</p>
              {lead.company && (
                <p className="text-gray-500">{lead.company}</p>
              )}
            </div>

            {/* Consensus Score Display */}
            {lead.consensusData && lead.consensusData.status === 'completed' && (
              <div className="text-right">
                <div className="text-4xl font-bold text-blue-600">
                  {lead.consensusData.leadScore}/10
                </div>
                <div className="text-sm text-gray-500">
                  {lead.consensusData.confidence}% confidence
                </div>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  lead.consensusData.leadScore >= 8 ? 'bg-green-100 text-green-800' :
                  lead.consensusData.leadScore >= 6 ? 'bg-yellow-100 text-yellow-800' :
                  lead.consensusData.leadScore >= 4 ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {lead.consensusData.recommendation}
                </div>
              </div>
            )}

            {/* Request Analysis Button */}
            {!lead.consensusData && (
              <button
                onClick={requestConsensusAnalysis}
                disabled={consensusLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {consensusLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Analyzing...
                  </div>
                ) : (
                  '🤖 Analyze with AI'
                )}
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {['details', 'consensus', 'actions'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">Contact Information</div>
                    <div className="space-y-2">
                      <div><strong>Email:</strong> {lead.email}</div>
                      <div><strong>Phone:</strong> {lead.phone || '—'}</div>
                      <div><strong>Status:</strong> <span className="capitalize">{lead.status}</span></div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">Lead Information</div>
                    <div className="space-y-2">
                      <div><strong>Created:</strong> {new Date(lead.created_at).toLocaleString()}</div>
                      <div><strong>Company:</strong> {lead.company || '—'}</div>
                    </div>
                  </div>
                </div>

                {lead.investment_goals && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-blue-700 mb-2">Investment Goals</div>
                    <div className="text-gray-700">{lead.investment_goals}</div>
                  </div>
                )}

                {lead.notes && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Notes</div>
                    <div className="text-gray-700 whitespace-pre-wrap">{lead.notes}</div>
                  </div>
                )}
              </div>
            )}

            {/* Consensus Tab */}
            {activeTab === 'consensus' && (
              <div className="space-y-6">
                {!lead.consensusData ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="text-gray-400 text-6xl mb-4">🤖</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Analysis Available</h3>
                    <p className="text-gray-600 mb-4">Run an AI consensus analysis to get detailed insights about this lead.</p>
                    <button
                      onClick={requestConsensusAnalysis}
                      disabled={consensusLoading}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {consensusLoading ? 'Analyzing...' : 'Start AI Analysis'}
                    </button>
                  </div>
                ) : lead.consensusData.status === 'processing' ? (
                  <div className="text-center py-12 bg-blue-50 rounded-lg">
                    <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <h3 className="text-lg font-medium text-blue-900 mb-2">AI Analysis in Progress</h3>
                    <p className="text-blue-700">Our AI models are analyzing this lead. This usually takes 30-60 seconds.</p>
                  </div>
                ) : lead.consensusData.status === 'failed' ? (
                  <div className="text-center py-12 bg-red-50 rounded-lg">
                    <div className="text-red-400 text-6xl mb-4">⚠️</div>
                    <h3 className="text-lg font-medium text-red-900 mb-2">Analysis Failed</h3>
                    <p className="text-red-700 mb-4">{lead.consensusData.reasoning}</p>
                    <button
                      onClick={requestConsensusAnalysis}
                      className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Retry Analysis
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Consensus Summary */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Consensus Summary</h3>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600">{lead.consensusData.leadScore}/10</div>
                          <div className="text-sm text-gray-600">Overall Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600">{lead.consensusData.confidence}%</div>
                          <div className="text-sm text-gray-600">Confidence</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">{lead.consensusData.recommendation}</div>
                          <div className="text-sm text-gray-600">Priority</div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-gray-700"><strong>Key Insight:</strong> {lead.consensusData.reasoning}</p>
                      </div>
                    </div>

                    {/* Model Insights */}
                    {lead.consensusData.modelInsights && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Individual Model Analysis</h3>
                        <div className="grid gap-4">
                          {lead.consensusData.modelInsights.map((insight, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium text-gray-900">{insight.model}</h4>
                                <div className="text-right">
                                  <span className="text-lg font-bold">{insight.score}/10</span>
                                  <span className="text-sm text-gray-500 ml-2">({insight.confidence}%)</span>
                                </div>
                              </div>
                              <p className="text-gray-700 text-sm mb-2">{insight.reasoning}</p>
                              {insight.alternatives.length > 0 && (
                                <details className="text-sm">
                                  <summary className="cursor-pointer text-blue-600">Alternative perspectives</summary>
                                  <ul className="mt-2 space-y-1 text-gray-600">
                                    {insight.alternatives.map((alt, i) => (
                                      <li key={i}>• {alt}</li>
                                    ))}
                                  </ul>
                                </details>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Processing Info */}
                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Analysis completed in {lead.consensusData.processingTime} seconds</span>
                        <span>{new Date(lead.consensusData.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions Tab */}
            {activeTab === 'actions' && (
              <div className="space-y-6">
                {lead.consensusData && lead.consensusData.status === 'completed' ? (
                  <>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Actions</h3>
                      <div className="space-y-3">
                        {lead.consensusData.actionItems.map((action, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                            <div className="flex items-center">
                              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                                {index + 1}
                              </span>
                              <span className="text-gray-700">{action}</span>
                            </div>
                            <button
                              onClick={() => executeAction('schedule_call')}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                            >
                              Execute
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {lead.consensusData.leadScore >= 7 && (
                          <button
                            onClick={() => executeAction('schedule_call')}
                            className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 text-left"
                          >
                            <div className="text-green-600 text-2xl mb-2">📞</div>
                            <div className="font-medium text-green-800">Schedule Call</div>
                            <div className="text-sm text-green-600">High priority lead</div>
                          </button>
                        )}

                        {lead.consensusData.leadScore >= 6 && (
                          <button
                            onClick={() => executeAction('send_proposal')}
                            className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 text-left"
                          >
                            <div className="text-purple-600 text-2xl mb-2">📝</div>
                            <div className="font-medium text-purple-800">Send Proposal</div>
                            <div className="text-sm text-purple-600">Qualified lead</div>
                          </button>
                        )}

                        <button
                          onClick={() => executeAction('update_status')}
                          className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 text-left"
                        >
                          <div className="text-blue-600 text-2xl mb-2">🔄</div>
                          <div className="font-medium text-blue-800">Update Status</div>
                          <div className="text-sm text-blue-600">Based on AI analysis</div>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="text-gray-400 text-6xl mb-4">🎯</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Actions Available</h3>
                    <p className="text-gray-600">Complete an AI analysis to get personalized action recommendations.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Helper function to transform consensus API response
function transformConsensusResult(rawResult: any): ConsensusData {
  const { consensus_result, processing_time_seconds, timestamp } = rawResult;

  return {
    leadScore: consensus_result?.consensus_response || 0,
    confidence: Math.round((consensus_result?.consensus_confidence || 0) * 100),
    recommendation: getRecommendation(consensus_result?.consensus_response || 0),
    reasoning: extractMainReasoning(consensus_result?.metadata?.all_responses || []),
    actionItems: generateActionItems(consensus_result?.consensus_response || 0),
    processingTime: processing_time_seconds || 0,
    timestamp: timestamp || new Date().toISOString(),
    status: 'completed',
    modelInsights: consensus_result?.metadata?.all_responses?.map(transformModelResponse) || []
  };
}

function transformModelResponse(response: any): ModelInsight {
  return {
    model: response.model || 'Unknown',
    score: typeof response.response === 'number' ? response.response : extractScoreFromText(response.response),
    confidence: Math.round((response.confidence || 0) * 100),
    reasoning: response.reasoning || 'No reasoning provided',
    alternatives: response.alternatives || []
  };
}

function extractScoreFromText(text: string): number {
  const match = text.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 5;
}

function getRecommendation(score: number): string {
  if (score >= 8) return 'High Priority';
  if (score >= 6) return 'Medium Priority';
  if (score >= 4) return 'Low Priority';
  return 'Disqualified';
}

function extractMainReasoning(responses: any[]): string {
  if (!responses || responses.length === 0) return 'Analysis pending...';

  const bestResponse = responses.reduce((best, current) =>
    (current.confidence || 0) > (best.confidence || 0) ? current : best
  );

  return bestResponse.reasoning || 'Strong lead indicators identified';
}

function generateActionItems(score: number): string[] {
  if (score >= 8) {
    return [
      'Schedule discovery call within 24 hours',
      'Prepare enterprise solution demo',
      'Send pricing proposal',
      'Assign senior sales rep'
    ];
  }
  if (score >= 6) {
    return [
      'Schedule qualification call within 48 hours',
      'Send case studies and testimonials',
      'Verify budget and timeline'
    ];
  }
  return [
    'Add to nurturing sequence',
    'Send educational content',
    'Re-qualify in 30 days'
  ];
}

export default LeadDetailPage;