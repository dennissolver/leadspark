import React from 'react';
import ReactDOM from 'react-dom/client';
import { useJessIntegration } from './hooks/useJessIntegration';
import AvatarAnimation from './components/AvatarAnimation';
import ConversationWindow from './components/ConversationWindow';

function WidgetApp() {
  useJessIntegration(); // 🔌 Plug-in the Jess voice + backend + Supabase connection

  return (
    <div>
      <AvatarAnimation />
      <ConversationWindow />
    </div>
  );
}

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(<WidgetApp />);
}
