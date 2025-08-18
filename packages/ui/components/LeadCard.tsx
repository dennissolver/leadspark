// packages/ui/components/LeadCard.tsx
import * as React from 'react';
import { cn } from '../utils';
import { Card } from './Card';
import { CardContent } from './CardContent';
import { CardHeader } from './CardHeader';
import { CardTitle } from './CardTitle';

interface ConsensusData {
  leadScore: number;
  confidence: number;
  recommendation: 'High Priority' | 'Medium Priority' | 'Low Priority' | 'Disqualified';
  reasoning: string;
  actionItems: string[];
  processingTime: number;
  timestamp: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface Lead {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string | null;
  status?: string;
  company?: string;
  consensusData?: ConsensusData;
}

interface LeadCardProps {
  lead?: Lead;
  // legacy props (kept for compatibility)
  name?: string;
  email?: string;
  onAction?: (action: string, leadId: string) => void;
  showConsensus?: boolean;
}

const Badge: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', className)}>
    {children}
  </span>
);

const Progress: React.FC<{ value: number; className?: string }> = ({ value, className }) => (
  <div className={cn('w-full bg-gray-200 rounded-full h-2', className)}>
    <div className="h-2 rounded-full transition-all duration-300 bg-blue-600" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);

const scoreColor = (score: number) => {
  if (score >= 8) return 'text-green-600 bg-green-50';
  if (score >= 6) return 'text-yellow-600 bg-yellow-50';
  if (score >= 4) return 'text-orange-600 bg-orange-50';
  return 'text-red-600 bg-red-50';
};

const priorityColor = (rec: ConsensusData['recommendation']) => {
  switch (rec) {
    case 'High Priority': return 'bg-red-100 text-red-800 border-red-200';
    case 'Medium Priority': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Low Priority': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function LeadCard({ lead, name, email, onAction, showConsensus = true }: LeadCardProps) {
  const leadData: Lead = lead || { id: 'legacy', name: name || '', email: email || '' };
  const displayName = leadData.name || `${leadData.first_name ?? ''} ${leadData.last_name ?? ''}`.trim();
  const { consensusData } = leadData;

  // Basic card
  if (!consensusData || !showConsensus) {
    return (
      <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-gray-900">{displayName}</p>
              <p className="text-gray-600 text-sm">{leadData.email}</p>
              {leadData.phone && <p className="text-gray-500 text-xs">{leadData.phone}</p>}
            </div>
            {leadData.status && <Badge className="bg-blue-100 text-blue-800">{leadData.status}</Badge>}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Enhanced card
  return (
    <Card className="mb-4 hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{displayName}</CardTitle>
            <p className="text-sm text-gray-600">{leadData.email}</p>
            {leadData.company && <p className="text-xs text-gray-500">{leadData.company}</p>}
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Badge className={priorityColor(consensusData.recommendation)}>{consensusData.recommendation}</Badge>
            <div className="text-right">
              <div className={cn('text-2xl font-bold px-2 py-1 rounded', scoreColor(consensusData.leadScore))}>
                {consensusData.leadScore}/10
              </div>
              <div className="text-xs text-gray-500">{consensusData.confidence}% confident</div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {consensusData.status === 'processing' && (
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
              <span className="text-sm">AI analyzing lead...</span>
            </div>
          )}

          {consensusData.status === 'completed' && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Lead Quality Score</span>
                  <span className="font-medium">{consensusData.leadScore}/10</span>
                </div>
                <Progress value={consensusData.leadScore * 10} />
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">AI Insight:</span> {consensusData.reasoning}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2 text-gray-700">Recommended Actions:</h4>
                <ul className="space-y-1">
                  {consensusData.actionItems.slice(0, 2).map((action, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start">
                      <span className="text-blue-500 mr-2">•</span>{action}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {consensusData.leadScore >= 7 && (
                  <button onClick={() => onAction?.('schedule_call', leadData.id)}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors">
                    📞 Schedule Call
                  </button>
                )}
                <button onClick={() => onAction?.('view_details', leadData.id)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors">
                  📊 View Analysis
                </button>
                {consensusData.leadScore >= 6 && (
                  <button onClick={() => onAction?.('send_proposal', leadData.id)}
                    className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors">
                    📝 Send Proposal
                  </button>
                )}
                {consensusData.leadScore < 6 && (
                  <button onClick={() => onAction?.('add_to_nurture', leadData.id)}
                    className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors">
                    🌱 Add to Nurture
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                <span>4 AI models analyzed</span>
                <span>⚡ {consensusData.processingTime}s processing</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
