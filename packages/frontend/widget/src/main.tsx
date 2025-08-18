import React from 'react';
import { createRoot } from 'react-dom/client';
import useJessIntegration from './hooks/useJessIntegration';
import { ChatWidget } from './components/ChatWidget'; // Import the main ChatWidget component

function WidgetApp() {
  // Plug-in the Jess voice + backend + Supabase connection
  // The logic inside this hook will be used by the ChatWidget
  useJessIntegration();

  return (
    // Render the main ChatWidget component
    <ChatWidget />
  );
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<WidgetApp />);
}
