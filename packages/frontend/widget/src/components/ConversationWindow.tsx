import React, { useState, useRef, useEffect } from 'react';
import type { Message } from './ChatWidget';

interface ConversationWindowProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isTyping?: boolean;
  theme?: 'light' | 'dark';
  avatarUrl?: string;
}

export const ConversationWindow: React.FC<ConversationWindowProps> = ({
  messages,
  onSendMessage,
  isTyping = false,
  theme = 'light',
  avatarUrl = '/assets/avatar.png'
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const themeClasses = {
    light: {
      bg: 'bg-white',
      text: 'text-gray-900',
      input: 'bg-gray-100 border-gray-300 focus:border-blue-500',
      userBubble: 'bg-blue-600 text-white',
      aiBubble: 'bg-gray-100 text-gray-900',
      button: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    dark: {
      bg: 'bg-gray-900',
      text: 'text-white',
      input: 'bg-gray-800 border-gray-600 focus:border-blue-400',
      userBubble: 'bg-blue-600 text-white',
      aiBubble: 'bg-gray-800 text-white',
      button: 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  };

  const currentTheme = themeClasses[theme];

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex flex-col h-full ${currentTheme.bg}`}>
      {/* Header */}
      <div className={`flex items-center p-4 border-b ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}>
        <img
          src={avatarUrl}
          alt="AI Assistant"
          className="w-10 h-10 rounded-full mr-3"
          onError={(e) => {
            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' fill='%236366f1'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='white' font-size='20'%3EAI%3C/text%3E%3C/svg%3E";
          }}
        />
        <div>
          <h3 className={`font-semibold ${currentTheme.text}`}>AI Assistant</h3>
          <p className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
            {isTyping ? 'Typing...' : 'Online'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="flex items-end space-x-2 max-w-xs lg:max-w-md">
              {message.sender === 'ai' && (
                <img
                  src={avatarUrl}
                  alt="AI"
                  className="w-8 h-8 rounded-full"
                  onError={(e) => {
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' fill='%236366f1'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='white' font-size='20'%3EAI%3C/text%3E%3C/svg%3E";
                  }}
                />
              )}
              <div className="flex flex-col">
                <div
                  className={`px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? currentTheme.userBubble
                      : currentTheme.aiBubble
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                </div>
                <span className={`text-xs mt-1 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-end space-x-2">
              <img
                src={avatarUrl}
                alt="AI"
                className="w-8 h-8 rounded-full"
              />
              <div className={`px-4 py-2 rounded-lg ${currentTheme.aiBubble}`}>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className={`p-4 border-t ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}>
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className={`flex-1 px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${currentTheme.input}`}
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${currentTheme.button}`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};
