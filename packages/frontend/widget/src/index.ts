import React from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '@leadspark/ui/components/Button';
import { Card } from '@leadspark/ui/components/Card';
import './styles/index.css'; // Assuming some global CSS

const Widget: React.FC = () => {
  return (
    <Card className="p-4 w-64">
      <Button className="w-full">Start Voice Assistant</Button>
    </Card>
  );
};

const initWidget = () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(<Widget />);
};

export { initWidget };