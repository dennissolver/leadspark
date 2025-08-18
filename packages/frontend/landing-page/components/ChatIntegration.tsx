import React, { useState } from 'react';

interface ChatBubbleProps {
  avatarUrl?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'sm' | 'md' | 'lg';
  isActive?: boolean;
  hasNotification?: boolean;
  notificationCount?: number;
  onClick?: () => void;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  avatarUrl = '/assets/avatar.png',
  position = 'bottom-right',
  size = 'lg',
  isActive = false,
  hasNotification = false,
  notificationCount = 0,
  onClick
}) => {
  const [imageError, setImageError] = useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const getFallbackSvg = () => {
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' fill='%236366f1'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='white' font-size='20'%3EAI%3C/text%3E%3C/svg%3E";
  };

  return (
    <div className={`fixed z-50 ${positionClasses[position]}`}>
      <button
        onClick={onClick}
        className={`relative ${sizeClasses[size]} rounded-full border-2 border-white shadow-lg transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-500/30 bg-white hover:bg-gray-50 ${
          isActive ? 'ring-4 ring-blue-500/50' : ''
        }`}
        aria-label="Open AI Chat"
      >
        {/* Avatar Image */}
        <img
          src={imageError ? getFallbackSvg() : avatarUrl}
          alt="AI Assistant"
          className="w-full h-full object-cover rounded-full"
          onError={handleImageError}
        />

        {/* Pulse Animation Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-blue-500 animate-pulse opacity-60"></div>

        {/* Notification Badge */}
        {hasNotification && (
          <div className="absolute -top-2 -right-2 min-w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold px-1">
            {notificationCount > 99 ? '99+' : notificationCount || '!'}
          </div>
        )}

        {/* Active State Indicator */}
        {isActive && (
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
        )}
      </button>
    </div>
  );
};

export const ChatIntegration: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleChatToggle = () => {
    setIsOpen(!isOpen);
    console.log('Landing page chat toggled:', !isOpen);
  };

  return (
    <ChatBubble
      avatarUrl="/assets/avatar.png"
      position="bottom-right"
      size="lg"
      isActive={isOpen}
      hasNotification={false}
      onClick={handleChatToggle}
    />
  );
};
