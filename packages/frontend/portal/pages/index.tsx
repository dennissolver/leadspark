import React from 'react';
import Link from 'next/link';

const PortalHome: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            LeadSpark Portal
          </h1>
          <p className="text-gray-600 mb-8">
            Welcome to your AI-powered lead management dashboard
          </p>

          <div className="space-y-4">
            <Link
              href="/login"
              className="block w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Sign In
            </Link>

            <Link
              href="/signup"
              className="block w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50 transition-colors font-medium"
            >
              Create Account
            </Link>

            <Link
              href="/dashboard"
              className="block w-full bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700 transition-colors font-medium"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalHome;
