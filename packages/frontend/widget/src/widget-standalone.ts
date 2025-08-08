import React from 'react';
import ReactDOM from 'react-dom/client';
import { useJessIntegration } from './hooks/useJessIntegration';
import AvatarAnimation from './components/AvatarAnimation';
import ConversationWindow from './components/ConversationWindow';

interface WidgetConfig {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor?: string;
  autoShow?: boolean;
  delay?: number;
}

function WidgetApp({ config }: { config: WidgetConfig }) {
  useJessIntegration();

  const positionStyles = {
    position: 'fixed' as const,
    zIndex: 10000,
    [config.position?.includes('bottom') ? 'bottom' : 'top']: '20px',
    [config.position?.includes('right') ? 'right' : 'left']: '20px',
  };

  return (
    <div style={positionStyles}>
      <AvatarAnimation />
      <ConversationWindow />
    </div>
  );
}

// Global widget interface
declare global {
  interface Window {
    LeadsparkWidget: {
      init: (config?: WidgetConfig) => void;
      show: () => void;
      hide: () => void;
      destroy: () => void;
    };
  }
}

class LeadsparkWidgetManager {
  private container: HTMLDivElement | null = null;
  private root: any = null;
  private config: WidgetConfig = {
    position: 'bottom-right',
    primaryColor: '#2563eb',
    autoShow: true,
    delay: 0
  };

  init(userConfig: WidgetConfig = {}) {
    this.config = { ...this.config, ...userConfig };

    if (this.config.autoShow) {
      if (this.config.delay && this.config.delay > 0) {
        setTimeout(() => this.show(), this.config.delay);
      } else {
        this.show();
      }
    }
  }

  show() {
    if (this.container) return; // Already shown

    // Create container
    this.container = document.createElement('div');
    this.container.id = 'leadspark-widget-container';
    document.body.appendChild(this.container);

    // Create React root and render
    this.root = ReactDOM.createRoot(this.container);
    this.root.render(React.createElement(WidgetApp, { config: this.config }));
  }

  hide() {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  destroy() {
    if (this.root) {
      this.root.unmount();
    }
    if (this.container) {
      document.body.removeChild(this.container);
      this.container = null;
      this.root = null;
    }
  }
}

// Initialize global widget
window.LeadsparkWidget = new LeadsparkWidgetManager();

// Auto-initialize if config is provided via data attributes
document.addEventListener('DOMContentLoaded', () => {
  const script = document.querySelector('script[src*="leadspark-widget"]');
  if (script) {
    const config: WidgetConfig = {
      position: script.getAttribute('data-position') as any || 'bottom-right',
      primaryColor: script.getAttribute('data-color') || '#2563eb',
      autoShow: script.getAttribute('data-auto-show') !== 'false',
      delay: parseInt(script.getAttribute('data-delay') || '0')
    };

    window.LeadsparkWidget.init(config);
  }
});