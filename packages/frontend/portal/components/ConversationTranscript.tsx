// packages/frontend/portal/components/ConversationTranscript.tsx
import React from 'react';
import { Bot, User } from 'lucide-react';

// We will use the Card component from our shared UI library
import { Card, CardContent } from '@leadspark/ui/components/Card';
import { Button } from '@leadspark/ui/components/Button';

// Corrected import path for ConversationMessage type
import { type ConversationMessage } from '../../../common/types';

interface ConversationTranscriptProps {
  messages: ConversationMessage[];
  onTransferToHuman?: () => void;
  // A boolean to indicate if the conversation is ongoing
  isLive: boolean;
}

const ConversationTranscript: React.FC<ConversationTranscriptProps> = ({
  messages,
  onTransferToHuman,
  isLive,
}) => {
  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-lg p-4 shadow-sm">
      <div className="flex-grow overflow-y-auto space-y-4 pr-2">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 italic">
            No conversation history.
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {/* AI Avatar */}
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 shadow-sm">
                  <Bot size={18} />
                </div>
              )}

              {/* Message Bubble */}
              <Card
                className={`max-w-xs md:max-w-md ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white text-gray-800 rounded-tl-none shadow-md'
                }`}
              >
                <CardContent className="p-3">
                  <p className="text-sm">{message.content}</p>
                </CardContent>
              </Card>

              {/* User Avatar */}
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 text-gray-600 shadow-sm">
                  <User size={18} />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Action Button */}
      {isLive && onTransferToHuman && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Button
            variant="primary"
            className="w-full bg-red-500 hover:bg-red-600 text-white"
            onClick={onTransferToHuman}
          >
            Transfer to Human
          </Button>
        </div>
      )}
    </div>
  );
};

export default ConversationTranscript;