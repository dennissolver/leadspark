// packages/frontend/admin-portal/pages/widget-demo.tsx
// Demo page to test the chat widget functionality

import React, { useState, useEffect } from 'react';
import Head from 'next/head';

export default function WidgetDemo() {
  const [widgetStatus, setWidgetStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [tenantId, setTenantId] = useState('demo-tenant-001');

  useEffect(() => {
    // Check if widget is loaded
    const checkWidget = () => {
      if (typeof window !== 'undefined' && window.LeadSparkWidget) {
        setWidgetStatus('loaded');
      } else {
        // Keep checking for a few seconds
        setTimeout(checkWidget, 500);
      }
    };

    checkWidget();
  }, []);

  const reloadWidget = () => {
    // Remove existing widget
    const existingContainer = document.getElementById('leadspark-widget-container');
    if (existingContainer) {
      existingContainer.remove();
    }

    // Remove existing script
    const existingScript = document.querySelector('script[src*="widget"]');
    if (existingScript) {
      existingScript.remove();
    }

    setWidgetStatus('loading');

    // Reload the page to reinitialize
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const testWidgetAPI = () => {
    if (window.LeadSparkWidget && widgetStatus === 'loaded') {
      try {
        // Create a new widget instance for testing
        const testWidget = new window.LeadSparkWidget({
          tenantId: tenantId,
          apiUrl: process.env.NODE_ENV === 'development'
            ? 'http://localhost:8000'
            : 'https://your-backend.render.com'
        });

        // Show the widget
        setTimeout(() => {
          testWidget.show();
        }, 1000);

        alert('Widget API test initiated! Check the console for logs.');
      } catch (error) {
        console.error('Widget API test failed:', error);
        alert('Widget API test failed. Check console for details.');
      }
    } else {
      alert('Widget not loaded yet. Please wait or reload the page.');
    }
  };

  return (
    <>
      <Head>
        <title>LeadSpark Widget Demo</title>
        <meta name="leadspark-tenant-id" content={tenantId} />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            LeadSpark Widget Demo
          </h1>

          {/* Widget Status */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Widget Status</h2>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                widgetStatus === 'loaded'
                  ? 'bg-green-100 text-green-800'
                  : widgetStatus === 'loading'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {widgetStatus === 'loaded' && '✅ Widget Loaded'}
                {widgetStatus === 'loading' && '⏳ Widget Loading...'}
                {widgetStatus === 'error' && '❌ Widget Error'}
              </div>

              <button
                onClick={reloadWidget}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Reload Widget
              </button>

              <button
                onClick={testWidgetAPI}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                disabled={widgetStatus !== 'loaded'}
              >
                Test Widget API
              </button>
            </div>
          </div>

          {/* Configuration */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tenant ID
                </label>
                <input
                  type="text"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter tenant ID"
                />
              </div>

              <div className="text-sm text-gray-600">
                <p><strong>API URL:</strong> {process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : 'https://your-backend.render.com'}</p>
                <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">How to Test</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Ensure your backend is running on port 8000 (development)</li>
              <li>Check that the widget status shows "✅ Widget Loaded"</li>
              <li>Look for the chat widget button in the bottom-right corner</li>
              <li>Click the chat button to open the widget</li>
              <li>Type a message and press Enter to test the conversation</li>
              <li>Check the browser console for detailed logs</li>
            </ol>
          </div>

          {/* Debugging Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Debugging Information</h2>
            <div className="bg-gray-100 p-4 rounded text-sm font-mono">
              <div>Window.LeadSparkWidget: {typeof window !== 'undefined' && window.LeadSparkWidget ? '✅ Available' : '❌ Not Available'}</div>
              <div>Current URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
              <div>User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}</div>
              <div>Widget Scripts: {typeof document !== 'undefined' ? document.querySelectorAll('script[src*="widget"]').length : 'N/A'}</div>
            </div>

            {typeof window !== 'undefined' && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    console.log('=== Widget Debug Info ===');
                    console.log('LeadSparkWidget:', window.LeadSparkWidget);
                    console.log('Widget scripts:', document.querySelectorAll('script[src*="widget"]'));
                    console.log('Widget containers:', document.querySelectorAll('[id*="leadspark"]'));
                    console.log('Meta tags:', document.querySelectorAll('meta[name*="leadspark"]'));
                    alert('Debug info logged to console');
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                >
                  Log Debug Info
                </button>
              </div>
            )}
          </div>

          {/* Example Implementation */}
          <div className="bg-white rounded-lg shadow p-6 mt-8">
            <h2 className="text-xl font-semibold mb-4">Example Implementation</h2>
            <p className="text-gray-700 mb-4">
              Here's how to embed the widget on any website:
            </p>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`<!-- Basic embedding -->
<script
  src="https://your-domain.com/widget/widget-standalone.js"
  data-tenant-id="${tenantId}"
  async>
</script>

<!-- Or with meta tag -->
<meta name="leadspark-tenant-id" content="${tenantId}">
<script src="https://your-domain.com/widget/widget-standalone.js" async></script>`}
            </pre>
          </div>
        </div>
      </div>
    </>
  );
}