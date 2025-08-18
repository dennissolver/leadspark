// packages/frontend/portal/components/Sidebar.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSupabase } from '@leadspark/common/src/utils/supabase/useSupabase'; // Corrected import path

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  badge?: number;
}

const Sidebar: React.FC = () => {
  const router = useRouter();
  const { user, signOut } = useSupabase();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Leads', href: '/leads', icon: '👥', badge: 5 }, // Example badge count
    { name: 'Knowledge Base', href: '/knowledge-base', icon: '📚' },
    { name: 'Settings', href: '/settings', icon: '⚙️' },
  ];

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (!error) {
        router.push('/login'); // ✅ Client-side redirect via Next.js
      } else {
        console.error('Error signing out:', error);
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (href: string) =>
    router.pathname === href || router.pathname.startsWith(href + '/');

  return (
    <div className="w-64 bg-white shadow-lg h-full flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⚡</span>
            {!isCollapsed && <span className="text-xl font-bold text-blue-600">LeadSpark</span>}
          </div>
          <button
            className="p-1 rounded hover:bg-gray-100"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {!isCollapsed && (
                  <>
                    <span className="font-medium">{item.name}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Quick Stats */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">Quick Stats</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Leads</span>
              <span className="font-medium">24</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">This Week</span>
              <span className="font-medium">7</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Converted</span>
              <span className="font-medium">3</span>
            </div>
          </div>
        </div>
      )}

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {user?.user_metadata?.full_name || 'User'}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {user?.email || 'user@example.com'}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {!isCollapsed && (
            <>
              <Link
                href="/settings"
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 p-2 rounded hover:bg-gray-100"
              >
                <span>⚙️</span>
                <span>Settings</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 p-2 rounded hover:bg-gray-100 w-full text-left"
              >
                <span>↗️</span>
                <span>Sign Out</span>
              </button>
            </>
          )}
          {isCollapsed && (
            <button
              onClick={handleSignOut}
              className="w-full p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Sign Out"
            >
              ↗️
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;