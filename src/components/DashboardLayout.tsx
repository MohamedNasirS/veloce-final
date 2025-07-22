import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Badge } from './ui/badge';
import { Bell } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface SidebarItem {
  label: string;
  path: string;
  icon: string;
}

interface Notification {
  id: string;
  type: 'BID_LIVE' | 'BID_CLOSED';
  message: string;
  bidId: string;
  timestamp: string;
}

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const socket: Socket = io(`${import.meta.env.VITE_API_URL}`);

    socket.on('connect', () => {
      console.log('DashboardLayout connected to WebSocket server!');
    });

    const handleNotification = (notification: Notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 20));
      setUnreadCount(prev => prev + 1);
    };

    socket.on('notification', handleNotification);

    return () => {
      console.log('DashboardLayout disconnecting WebSocket.');
      socket.off('notification', handleNotification);
      socket.disconnect();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  const getSidebarItems = (): SidebarItem[] => {
    switch (user?.role) {
      case 'waste_generator':
        return [
          { label: 'Dashboard', path: '/dashboard/waste_generator', icon: '🏠' },
          { label: 'Create Bid', path: '/dashboard/waste_generator/create-bid', icon: '➕' },
          { label: 'My Bids', path: '/dashboard/waste_generator/my-bids', icon: '📋' },
          { label: 'Gate Passes', path: '/dashboard/waste_generator/gate-passes', icon: '🎫' },
        ];
      case 'recycler':
      case 'aggregator':
        return [
          { label: 'Dashboard', path: `/dashboard/${user.role}`, icon: '🏠' },
          { label: 'Live Bids', path: `/live-bids`, icon: '🔴' },
          { label: 'Participated', path: `/dashboard/${user.role}/participated`, icon: '📊' },
        ];
      case 'admin':
        return [
          { label: 'Dashboard', path: '/dashboard/admin', icon: '🏠' },
          { label: 'Users', path: '/dashboard/admin/users', icon: '👥' },
          { label: 'Bids', path: '/dashboard/admin/bids', icon: '📋' },
          { label: 'Winner Selection', path: '/dashboard/admin/winner-selection', icon: '🏆' }, // Added for admin
          { label: 'Gate Passes', path: '/dashboard/admin/gate-passes', icon: '🎫' }, // Added for admin
        ];
      default:
        return [];
    }
  };

  const sidebarItems = getSidebarItems();

  const handleNotificationClick = (notification: Notification) => {
    navigate(`/bid/${notification.bidId}`);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-lg transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <h2 className="text-lg font-semibold capitalize">
                  {user?.role?.replace('_', ' ')} Dashboard
                </h2>
                <p className="text-sm text-gray-600">{user?.name}</p>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
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
            <li>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="w-full flex items-center space-x-3 p-2 rounded-lg transition-colors text-gray-600 hover:bg-gray-100 relative justify-start">
                    <Bell className="h-5 w-5" />
                    {sidebarOpen && <span>Notifications</span>}
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="absolute top-1 right-1 h-5 w-5 flex items-center justify-center p-0">{unreadCount}</Badge>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <div className="p-1">
                    <div className="flex justify-between items-center mb-2 px-3 pt-2">
                      <h4 className="font-medium leading-none">Notifications</h4>
                      {unreadCount > 0 && (
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setUnreadCount(0)}>
                          Mark all as read
                        </Button>
                      )}
                    </div>
                    {notifications.length > 0 ? (
                      <div className="space-y-1 max-h-80 overflow-y-auto">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className="text-sm p-3 hover:bg-gray-100 rounded-md cursor-pointer"
                            onClick={() => handleNotificationClick(notif)}
                          >
                            <p className="font-medium">{notif.type === 'BID_LIVE' ? '🟢 New Bid Live' : '🔴 Bid Closed'}</p>
                            <p className="text-gray-600">{notif.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notif.timestamp).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 p-3 text-center">You have no new notifications.</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t mt-auto">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-start space-x-3 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={handleLogout}
          >
            <span className="text-lg">🚪</span>
            {sidebarOpen && <span>Sign Out</span>}
          </Button>
        </div>
      </div>

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