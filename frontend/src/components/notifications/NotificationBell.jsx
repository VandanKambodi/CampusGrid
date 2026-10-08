import { useEffect, useRef, useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function NotificationBell({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error('Failed to fetch unread count', error);
    }
  };

  const loadLatestNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/api/notifications?page=1&limit=8`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
  }, [user, location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) loadLatestNotifications();
  }, [open, user]);

  const refreshAll = async () => {
    await fetchUnreadCount();
    if (open) await loadLatestNotifications();
  };

  const handleNotificationClick = async (notification) => {
    try {
      const token = localStorage.getItem('token');
      if (!notification.isRead) {
        await axios.patch(`${API_URL}/api/notifications/${notification._id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setNotifications((prev) => prev.map((item) => item._id === notification._id ? { ...item, isRead: true } : item));
      setUnreadCount((prev) => Math.max(0, prev - (notification.isRead ? 0 : 1)));
    } catch (error) {
      console.error('Failed to mark notification read', error);
    } finally {
      setOpen(false);
      if (notification.link) navigate(notification.link);
      else navigate('/hub/notifications');
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/api/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  };

  const badgeLabel = unreadCount > 99 ? '99+' : unreadCount;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
            {badgeLabel}
          </span>
        )}
      </button>

      {open && (
        <NotificationDropdown
          notifications={notifications}
          loading={loading}
          unreadCount={unreadCount}
          onClose={() => setOpen(false)}
          onMarkAllAsRead={markAllAsRead}
          onItemClick={handleNotificationClick}
          onViewAll={() => {
            setOpen(false);
            navigate('/hub/notifications');
          }}
        />
      )}

      {loading && open && (
        <div className="absolute right-0 top-full mt-3 flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 shadow-lg dark:border-white/10 dark:bg-[#111] dark:text-gray-300">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading notifications...
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
