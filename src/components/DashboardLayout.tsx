import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Badge } from './ui/badge';
import { Bell } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';
import axios from 'axios';

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
  isRead: boolean;
}

// 🔧 Setup Axios instance with credentials and base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Periodic user status check
  useEffect(() => {
    if (!user?.id) return;

    const checkUserStatus = async () => {
      try {
        const response = await api.get(`/api/admin/users`);
        const users = response.data;
        const currentUser = users.find((u: any) => u.id === user.id);

        if (currentUser && currentUser.status !== 'APPROVED') {
          console.log(`User status check: User ${user.id} status is ${currentUser.status}, logging out`);
          alert(`Your account status has been changed to ${currentUser.status.toLowerCase()}. You will be logged out.`);
          handleLogout();
        }
      } catch (error) {
        console.error('Failed to check user status:', error);
      }
    };

    // Only as fallback - check every 2 minutes (WebSocket should handle immediate updates)
    const statusCheckInterval = setInterval(checkUserStatus, 120000);

    return () => {
      clearInterval(statusCheckInterval);
    };
  }, [user?.id]);

  useEffect(() => {
    const saved = Cookies.get('notifications');
    if (saved) {
      try {
        const parsed: Notification[] = JSON.parse(saved);
        setNotifications(parsed);
        setUnreadCount(parsed.filter(n => !n.isRead).length);
      } catch (e) {
        console.warn('Failed to parse notifications cookie', e);
      }
    }

    // Optional: fetch missed notifications via API
    // api.get('/notifications')
    //   .then((res) => {
    //     const fetched = res.data as Notification[];
    //     setNotifications(fetched);
    //     setUnreadCount(fetched.filter(n => !n.isRead).length);
    //     Cookies.set('notifications', JSON.stringify(fetched), { expires: 1 / 24 });
    //   })
    //   .catch(err => console.error('Failed to fetch notifications', err));

    const socket: Socket = io(import.meta.env.VITE_API_URL, {
      transports: ['websocket'], // force only websocket
      withCredentials: true,
      autoConnect: true, // Connect immediately
      forceNew: true, // Force new connection to avoid caching issues
      timeout: 5000, // Reduce connection timeout
    });


    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    // ✅ Fallback UUID generator
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    const upsertNotification = (newNotif: Notification) => {
      setNotifications(prev => {
        const deduped = prev.filter(n => !(n.bidId === newNotif.bidId && n.type === newNotif.type));
        const updated = [newNotif, ...deduped].slice(0, 5);
        Cookies.set('notifications', JSON.stringify(updated), { expires: 1 / 24 });
        setUnreadCount(updated.filter(n => !n.isRead).length);
        return updated;
      });
    };

    socket.on('notification', (notif: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
      const newNotif: Notification = {
        ...notif,
        id: generateUUID(), // ✅ replaced crypto.randomUUID()
        timestamp: new Date().toISOString(),
        isRead: false,
      };
      upsertNotification(newNotif);
    });

    socket.on('bidUpdated', (bid: any) => {
      const isClosed = bid.status?.toLowerCase() === 'closed' || bid.status === 'CLOSED';
      const newNotif: Notification = {
        id: generateUUID(), // ✅ replaced crypto.randomUUID()
        type: isClosed ? 'BID_CLOSED' : 'BID_LIVE',
        message: isClosed
          ? `Auction for "${bid.lotName}" has been closed.`
          : `Auction for "${bid.lotName}" is now live!`,
        bidId: bid.id,
        timestamp: new Date().toISOString(),
        isRead: false,
      };
      upsertNotification(newNotif);
    });

    // ✅ Listen for user status changes with IMMEDIATE handling
    socket.on('userStatusChanged', (statusEvent: any) => {
      console.log('[IMMEDIATE] User status changed received:', statusEvent);

      // IMMEDIATE logout for pending or rejected status
      if (statusEvent.status === 'pending' || statusEvent.status === 'rejected') {
        console.log('[IMMEDIATE] Status is pending/rejected, logging out immediately');

        // Use immediate execution for logout
        alert(`Your account status has been changed to ${statusEvent.status}. You will be logged out immediately.`);
        handleLogout();

      } else if (statusEvent.status === 'approved') {
        console.log('[IMMEDIATE] Status approved, showing notification');
        // Show a positive notification for approval
        const approvalNotif: Notification = {
          id: generateUUID(),
          type: 'BID_LIVE', // Reuse existing type for positive notification
          message: 'Your account has been approved! You can now access all features.',
          bidId: 'system',
          timestamp: new Date().toISOString(),
          isRead: false,
        };
        upsertNotification(approvalNotif);
      }
    });

    // ✅ Authenticate user with WebSocket immediately after connection
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      if (user?.id) {
        console.log('Authenticating user immediately:', user.id, user.role);
        socket.emit('authenticate', { userId: user.id, userRole: user.role });
        console.log('User authenticated with WebSocket:', user.id, user.role);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]); // Add user.id as dependency to reconnect when user changes

  const handleLogout = async () => {
    try {
      await logout();
      Cookies.remove('notifications');
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(updated);
    setUnreadCount(0);
    Cookies.set('notifications', JSON.stringify(updated), { expires: 1 / 24 });
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
          { label: 'Upload Documents', path: `/dashboard/${user.role}/upload-documents`, icon: '📄' },
        ];
      case 'admin':
        return [
          { label: 'Dashboard', path: '/dashboard/admin', icon: '🏠' },
          { label: 'Users', path: '/dashboard/admin/users', icon: '👥' },
          { label: 'Bids', path: '/dashboard/admin/bids', icon: '📋' },
          { label: 'Winner Selection', path: '/dashboard/admin/winner-selection', icon: '🏆' },
          { label: 'Gate Passes', path: '/dashboard/admin/gate-passes', icon: '🎫' },
        ];
      default:
        return [];
    }
  };

  const sidebarItems = getSidebarItems();

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

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${location.pathname === item.path
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
                      <Badge variant="destructive" className="absolute top-1 right-1 h-5 w-5 flex items-center justify-center p-0">
                        {unreadCount}
                      </Badge>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <div className="p-1">
                    <div className="flex justify-between items-center mb-2 px-3 pt-2">
                      <h4 className="font-medium leading-none">Notifications</h4>
                      {unreadCount > 0 && (
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={markAllAsRead}>
                          Mark all as read
                        </Button>
                      )}
                    </div>
                    {notifications.length > 0 ? (
                      <div className="space-y-1 max-h-80 overflow-y-auto">
                        {notifications.slice(0, 5).map((notif) => (
                          <div key={notif.id} className="text-sm p-3 bg-gray-50 rounded-md">
                            <p className="font-medium">
                              {notif.type === 'BID_LIVE' ? '🟢 Auction Live' : '🔴 Auction Closed'}
                            </p>
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
