import { Bell, Heart, MessageCircle, UserPlus, Briefcase, BookOpen, CalendarDays, Megaphone, ShieldAlert, CheckCircle, Users } from 'lucide-react';

const typeIconMap = {
  POST_LIKE: Heart,
  POST_COMMENT: MessageCircle,
  COMMENT_REPLY: MessageCircle,
  FOLLOW: UserPlus,
  NEW_MESSAGE: MessageCircle,
  PLACEMENT_DRIVE: Briefcase,
  ACCOUNT_APPROVED: CheckCircle,
  RESOURCE_UPVOTE: BookOpen,
  EVENT_PUBLISHED: CalendarDays,
  EVENT_REMINDER: CalendarDays,
  ANNOUNCEMENT: Megaphone,
  COMMUNITY_UPDATE: Users,
  POLL_PUBLISHED: Bell,
  SURVEY_PUBLISHED: Bell,
  MENTION: MessageCircle,
  NEW_ACCOUNT_REQUEST: ShieldAlert,
  NEW_PLACEMENT_APPLICATION: Briefcase,
  RESOURCE_REPORT: ShieldAlert,
  POST_REPORT: ShieldAlert,
  COMMUNITY_REQUEST: Users,
  EVENT_REGISTRATION: CalendarDays,
  SURVEY_PARTICIPATION_UPDATE: Bell,
  SYSTEM_ALERT: ShieldAlert
};

const formatRelativeTime = (dateString) => {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const seconds = Math.max(1, Math.floor(diffMs / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
};

function NotificationItem({ notification, onClick, compact = false }) {
  const Icon = typeIconMap[notification.type] || Bell;
  const actorName = notification.actor?.name || 'CampusGrid';

  return (
    <button
      type="button"
      onClick={() => onClick?.(notification)}
      className={`w-full text-left p-3 transition-colors ${notification.isRead ? 'bg-transparent' : 'bg-indigo-50/70 dark:bg-indigo-500/5'} ${compact ? 'rounded-sm' : 'rounded-md'} border-b border-gray-200 dark:border-white/10 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${notification.isRead ? 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300'}`}>
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className={`text-sm font-bold truncate ${notification.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
              {notification.title}
            </p>
            {!notification.isRead && (
              <span className="h-2 w-2 rounded-full bg-indigo-500 flex-shrink-0" />
            )}
          </div>

          <p className={`mt-1 text-xs ${notification.isRead ? 'text-gray-500 dark:text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
            {notification.message}
          </p>

          {notification.metadata?.subtext && (
            <p className="mt-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400 truncate">
              {notification.metadata.subtext}
            </p>
          )}

          <div className="mt-2 flex items-center gap-2 text-[11px] font-medium text-gray-500 dark:text-gray-400">
            <span>{actorName}</span>
            <span>•</span>
            <span>{formatRelativeTime(notification.createdAt)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default NotificationItem;
