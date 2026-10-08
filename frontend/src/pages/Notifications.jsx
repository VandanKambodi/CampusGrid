import { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCheck, Loader2 } from 'lucide-react';
import NotificationItem from '../components/notifications/NotificationItem';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchNotifications = async (nextPage = 1, nextFilter = filter) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/api/notifications?page=${nextPage}&limit=${limit}${nextFilter === 'unread' ? '&unread=true' : ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const items = data.notifications || [];
      setNotifications(nextPage === 1 ? items : [...notifications, ...items]);
      setHasMore(Boolean(data.hasMore));
    } catch (error) {
      console.error('Failed to fetch notifications', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1, filter);
  }, [filter]);

  const handleMarkRead = async (notification) => {
    if (notification.isRead) return;
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/api/notifications/${notification._id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications((prev) => prev.map((item) => item._id === notification._id ? { ...item, isRead: true } : item));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/api/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    await handleMarkRead(notification);
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#111]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">CampusGrid</p>
            <h1 className="mt-1 text-2xl font-black text-gray-900 dark:text-white">Notifications</h1>
          </div>
          <button type="button" onClick={markAllRead} className="inline-flex items-center gap-2 rounded-sm bg-indigo-600 px-3 py-2 text-xs font-black text-white hover:bg-indigo-500">
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all as read
          </button>
        </div>

        <div className="flex gap-2">
          {['all', 'unread'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`rounded-sm border px-3 py-1.5 text-xs font-black uppercase tracking-wide transition ${filter === tab ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300'}`}
            >
              {tab === 'all' ? 'All' : 'Unread'}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#111]">
        {loading && notifications.length === 0 ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-500 dark:text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-600 dark:text-gray-300">No notifications here yet.</div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <NotificationItem key={notification._id} notification={notification} onClick={handleNotificationClick} />
            ))}
            {hasMore && (
              <div className="border-t border-gray-200 p-4 text-center dark:border-white/10">
                <button
                  type="button"
                  className="text-xs font-black uppercase tracking-wide text-indigo-600 dark:text-indigo-300"
                  onClick={() => {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    fetchNotifications(nextPage, filter);
                  }}
                >
                  Load more
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;
