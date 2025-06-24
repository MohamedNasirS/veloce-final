
import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';

interface SidebarItem {
  label: string;
  path: string;
  icon: string;
}

const DashboardLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const getSidebarItems = (): SidebarItem[] => {
    switch (user?.role) {
      case 'waste_generator':
        return [
          { label: 'Dashboard', path: '/dashboard/waste_generator', icon: '🏠' },
          { label: 'Create Bid', path: '/dashboard/waste_generator/create-bid', icon: '➕' },
          { label: 'My Bids', path: '/dashboard/waste_generator/my-bids', icon: '📋' },
          { label: 'Select Winner', path: '/dashboard/waste_generator/select-winner', icon: '🏆' },
          { label: 'Gate Passes', path: '/dashboard/waste_generator/gate-passes', icon: '🎫' },
        ];
      case 'recycler':
      case 'aggregator':
        return [
          { label: 'Dashboard', path: `/dashboard/${user.role}`, icon: '🏠' },
          { label: 'Live Bids', path: `/dashboard/${user.role}/live-bids`, icon: '🔴' },
          { label: 'Participated', path: `/dashboard/${user.role}/participated`, icon: '📊' },
          { label: 'Upload Proof', path: `/dashboard/${user.role}/upload-proof`, icon: '📸' },
        ];
      case 'admin':
        return [
          { label: 'Dashboard', path: '/dashboard/admin', icon: '🏠' },
          { label: 'Users', path: '/dashboard/admin/users', icon: '👥' },
          { label: 'Bids', path: '/dashboard/admin/bids', icon: '📋' },
          { label: 'Winner Selection', path: '/dashboard/admin/winner-selection', icon: '🏆' },
          { label: 'Logs', path: '/dashboard/admin/logs', icon: '📜' },
          { label: 'Documents', path: '/dashboard/admin/documents', icon: '📁' },
        ];
      default:
        return [];
    }
  };

  const sidebarItems = getSidebarItems();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-lg transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <h2 className="text-lg font-semibold capitalize">
                  {user?.role?.replace('-', ' ')} Dashboard
                </h2>
                <p className="text-sm text-gray-600">{user?.name}</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? '←' : '→'}
            </Button>
          </div>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">
              {sidebarItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
            </h1>
            <div className="flex items-center space-x-4">
              <Link to="/live-bids" className="text-green-600 hover:text-green-700 font-medium">
                Live Bids
              </Link>
              <Link to="/closed-bids" className="text-green-600 hover:text-green-700 font-medium">
                Closed Bids
              </Link>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
