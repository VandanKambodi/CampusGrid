import { ArrowLeft, Ban, Flag, Send, Wifi, WifiOff } from 'lucide-react';
import MessageBubble from './MessageBubble';

function ChatWindow({ conversation, messages, currentUserId, draft, onDraft, onSend, onTyping, typingUser, online, connected, loading, hasMore, onLoadMore, onDelete, onBack, onBlock, onReport }) {
  if (!conversation) return <section className="hidden md:flex flex-1 items-center justify-center text-center p-8"><div><div className="text-5xl mb-4">💬</div><h2 className="font-black text-gray-900 dark:text-white">Choose a conversation</h2><p className="text-xs text-gray-500 mt-2">Start a private conversation with someone from their profile.</p></div></section>;
  const otherUser = conversation.otherUser;

  return (
    <section className={`flex-1 min-w-0 ${conversation ? 'flex' : 'hidden'} flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-10rem)]`}>
      <header className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-white/10">
        <button onClick={onBack} className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10" title="Back to chats"><ArrowLeft className="w-4 h-4" /></button>
        <img src={otherUser?.profilePicture} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-white/10" />
        <div className="min-w-0 flex-1"><h2 className="font-black truncate text-sm text-gray-900 dark:text-white">{otherUser?.name}</h2><p className="text-[11px] font-semibold flex items-center gap-1.5 text-gray-500">{online ? <><span className="w-2 h-2 rounded-full bg-emerald-500" /> Online</> : 'Offline'}</p></div>
        <span title={connected ? 'Connected' : 'Reconnecting'} className={connected ? 'text-emerald-500' : 'text-amber-500'}>{connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}</span>
        <button onClick={onBlock} title={conversation.blockedByMe ? 'Unblock user' : 'Block user'} className="flex items-center gap-1.5 p-2 text-xs font-bold text-gray-400 hover:text-red-500"><Ban className="w-4 h-4" /> <span className="hidden sm:inline">{conversation.blockedByMe ? 'Unblock' : 'Block'}</span></button>
        <button onClick={onReport} title="Report user" className="p-2 text-gray-400 hover:text-amber-500"><Flag className="w-4 h-4" /></button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/60 dark:bg-black/10">
        {hasMore && <button onClick={onLoadMore} disabled={loading} className="mx-auto block text-[11px] font-bold text-indigo-600 dark:text-indigo-400">{loading ? 'Loading...' : 'Load older messages'}</button>}
        {messages.length === 0 && !loading && <div className="h-full flex items-center justify-center text-center"><div><div className="text-4xl mb-3">👋</div><p className="text-sm font-black text-gray-800 dark:text-white">Start the conversation!</p><p className="text-xs text-gray-500 mt-1">Say hello to {otherUser?.name?.split(' ')[0]}.</p></div></div>}
        {messages.map(message => <MessageBubble key={message._id} message={message} isOwn={message.sender?._id === currentUserId || message.sender === currentUserId} onDelete={onDelete} />)}
        {typingUser && <p className="text-xs text-gray-500 italic">{typingUser} is typing...</p>}
      </div>

      <form onSubmit={onSend} className="p-3 border-t border-gray-200 dark:border-white/10 flex items-end gap-2">
        <textarea value={draft} onChange={e => { onDraft(e.target.value); onTyping(); }} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(e); } }} rows="1" maxLength="2000" placeholder="Type a message..." className="flex-1 resize-none bg-gray-100 dark:bg-white/5 border border-transparent dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 text-gray-900 dark:text-white" />
        <button type="submit" disabled={!draft.trim()} title="Send message" className="p-3 rounded-xl bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-700"><Send className="w-4 h-4" /></button>
      </form>
    </section>
  );
}

export default ChatWindow;