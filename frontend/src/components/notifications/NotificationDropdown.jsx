import { BellRing, CheckCheck, ExternalLink } from 'lucide-react';
import NotificationItem from './NotificationItem';

function NotificationDropdown({ notifications, loading, onClose, onMarkAllAsRead, onItemClick, onViewAll, unreadCount }) {
  return (
    <div className="absolute right-0 top-full mt-3 w-[min(92vw,370px)] rounded-xl border border-gray-200 bg-white/95 p-0 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#111]/95">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-white/10">
        <div className="flex items-center gap-2">
          <BellRing className="h-4 w-4 text-indigo-500" />
          <h3 className="text-sm font-black uppercase tracking-wide text-gray-900 dark:text-white">Notifications</h3>
        </div>
        {unreadCount > 0 && (
          <button type="button" onClick={onMarkAllAsRead} className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-indigo-600 hover:text-indigo-500 dark:text-indigo-300">
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all
          </button>
        )}
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {loading ? (
          <div className="p-5 text-sm text-gray-500 dark:text-gray-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
            <BellRing className="h-8 w-8 text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200">You’re all caught up.</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">No new notifications.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem key={notification._id} notification={notification} onClick={onItemClick} compact />
          ))
        )}
      </div>

      <button type="button" onClick={onViewAll} className="flex w-full items-center justify-center gap-2 border-t border-gray-200 px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-indigo-600 transition hover:bg-gray-50 dark:border-white/10 dark:text-indigo-300 dark:hover:bg-white/5">
        <ExternalLink className="h-3.5 w-3.5" />
        View all notifications
      </button>
    </div>
  );
}

export default NotificationDropdown;
