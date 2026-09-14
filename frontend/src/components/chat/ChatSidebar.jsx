import { Search, MessageCircle } from 'lucide-react';

function ChatSidebar({ conversations, selectedId, search, onSearch, onSelect }) {
  const filtered = conversations.filter(({ otherUser }) => otherUser?.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <aside className={`w-full md:w-80 shrink-0 md:border-r border-gray-200 dark:border-white/10 ${selectedId ? 'hidden md:block' : 'block'}`}>
      <div className="p-5 border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-indigo-500" />
          <h1 className="text-lg font-black text-gray-900 dark:text-white">Chats</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => onSearch(e.target.value)} placeholder="Search chats..." className="w-full bg-gray-100 dark:bg-white/5 border border-transparent dark:border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-xs font-semibold outline-none focus:border-indigo-500 text-gray-900 dark:text-white" />
        </div>
      </div>
      <div className="max-h-[calc(100vh-14rem)] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500 dark:text-gray-400">No conversations yet.<br />Connect with a student to start chatting.</div>
        ) : filtered.map(conversation => (
          <button key={conversation._id} onClick={() => onSelect(conversation._id)} className={`w-full flex items-center gap-3 p-4 text-left border-b border-gray-100 dark:border-white/5 transition-colors ${selectedId === conversation._id ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}>
            <img src={conversation.otherUser?.profilePicture} alt="" className="w-11 h-11 rounded-full object-cover border border-gray-200 dark:border-white/10" />
            <span className="min-w-0 flex-1">
              <span className="flex justify-between gap-2">
                <strong className="truncate text-sm text-gray-900 dark:text-white">{conversation.otherUser?.name}</strong>
                {conversation.unreadCount > 0 && <em className="not-italic min-w-5 h-5 px-1 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">{conversation.unreadCount}</em>}
              </span>
              <span className="block truncate text-xs text-gray-500 dark:text-gray-400 mt-1">{conversation.lastMessage?.deleted ? 'Message deleted' : conversation.lastMessage?.content || 'Start the conversation'}</span>
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}

export default ChatSidebar;