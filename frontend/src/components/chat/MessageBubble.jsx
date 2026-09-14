import { CheckCheck, MoreVertical, Trash2 } from 'lucide-react';

function MessageBubble({ message, isOwn, onDelete }) {
  return (
    <div className={`group flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 ${isOwn ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-100 rounded-bl-sm'}`}>
        {message.deleted ? <p className="text-xs italic opacity-70">Message deleted</p> : <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>}
        <div className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] ${isOwn ? 'text-indigo-100' : 'text-gray-400'}`}>
          <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
          {isOwn && <CheckCheck className={`w-3.5 h-3.5 ${message.read ? 'text-cyan-200' : ''}`} />}
        </div>
        {isOwn && !message.deleted && <button onClick={() => onDelete(message._id)} title="Delete message" className="absolute -left-8 top-2 hidden group-hover:block text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>}
        <MoreVertical className="hidden" />
      </div>
    </div>
  );
}

export default MessageBubble;