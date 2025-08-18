import React, { useState, useEffect, useRef } from 'react';
import useJessIntegration from '../hooks/useJessIntegration';
import { ConversationWindow } from './ConversationWindow';
import { AvatarAnimation } from './AvatarAnimation';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isTyping?: boolean;
}

interface ChatWidgetProps {
  tenantId?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'light' | 'dark';
  avatarUrl?: string;
  initialMessage?: string;
  minimized?: boolean;
}

// Renamed and exported the component that was previously in widget-standalone.ts
export const WidgetApp: React.FC<{ config: ChatWidgetProps }> = ({ config }) => {
  useJessIntegration();

  const positionStyles = {
    position: 'fixed' as const,
    zIndex: 10000,
    [config.position?.includes('bottom') ? 'bottom' : 'top']: '20px',
    [config.position?.includes('right') ? 'right' : 'left']: '20px',
  };

  return (
    <div style={positionStyles}>
      <ChatWidget
        position={config.position}
        theme={config.primaryColor ? 'dark' : 'light'}
        avatarUrl="/assets/avatar.png"
        initialMessage="Hi! I'm your AI assistant. How can I help you today?"
        minimized={!config.autoShow}
      />
    </div>
  );
};


export const ChatWidget: React.FC<ChatWidgetProps> = ({
  tenantId,
  position = 'bottom-right',
  theme = 'light',
  avatarUrl = '/assets/avatar.png',
  initialMessage = "Hi! I'm your AI assistant. How can I help you today?",
  minimized = true
}) => {
  const [isOpen, setIsOpen] = useState(!minimized);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };

  const themeClasses = {
    light: 'bg-white text-gray-900 border-gray-200',
    dark: 'bg-gray-900 text-white border-gray-700'
  };

  useEffect(() => {
    if (isOpen && !hasInteracted && messages.length === 0) {
      // Add initial AI message
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        text: initialMessage,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, hasInteracted, messages.length, initialMessage]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  const handleSendMessage = async (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "Thanks for your message! I'm processing your request...",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 2000);
  };

  return (
    <div className={`fixed z-50 ${positionClasses[position]}`}>
      {/* Chat Window */}
      {isOpen && (
        <div className={`mb-4 w-96 h-[32rem] rounded-lg shadow-2xl border-2 overflow-hidden ${themeClasses[theme]}`}>
          <ConversationWindow
            messages={messages}
            onSendMessage={handleSendMessage}
            isTyping={isTyping}
            theme={theme}
            avatarUrl={avatarUrl}
          />
        </div>
      )}

      {/* Floating Chat Button */}
      <button
        onClick={toggleChat}
        className={`relative w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 ${
          isOpen ? 'rotate-180' : ''
        } ${themeClasses[theme]} border-2`}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          // Close icon
          <svg className="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        ) : (
          // Avatar with animation
          <div className="relative w-full h-full">
            <img
              src={avatarUrl}
              alt="AI Assistant"
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                // Fallback if avatar fails to load
                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' fill='%236366f1'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='white' font-size='20'%3EAI%3C/text%3E%3C/svg%3E";
              }}
            />

            {/* Pulse animation ring */}
            <div className="absolute inset-0 rounded-full border-2 border-blue-500 animate-pulse opacity-75"></div>

            {/* Notification badge for new messages */}
            {!isOpen && messages.length > 0 && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {messages.filter(m => m.sender === 'ai' && !hasInteracted).length}
              </div>
            )}
          </div>
        )}
      </button>
    </div>
  );
};
