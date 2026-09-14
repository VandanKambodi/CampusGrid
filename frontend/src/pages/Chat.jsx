import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const authConfig = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

function Chat() {
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [typingUser, setTypingUser] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const socketRef = useRef(null);
  const selectedRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');

  const selected = conversations.find(conversation => conversation._id === selectedId);
  selectedRef.current = selected;

  const loadConversations = async () => {
    try {
      const { data } = await axios.get(`${apiUrl}/api/chat/conversations`, authConfig());
      setConversations(data);
      setError('');
      const requestedUser = searchParams.get('userId');
      if (requestedUser) {
        const response = await axios.post(`${apiUrl}/api/chat/conversations`, { userId: requestedUser }, authConfig());
        setConversations(previous => previous.some(item => item._id === response.data._id) ? previous : [response.data, ...previous]);
        setSelectedId(response.data._id);
      } else if (data.length > 0) setSelectedId(previous => previous || data[0]._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load conversations.');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadConversations(); }, [searchParams]);

  useEffect(() => {
    const socket = io(apiUrl, { auth: { token: localStorage.getItem('token') }, reconnection: true });
    socketRef.current = socket;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => { setConnected(false); setTypingUser(''); });
    socket.on('user:online', ({ userId }) => setOnlineUsers(previous => new Set(previous).add(userId)));
    socket.on('user:offline', ({ userId }) => setOnlineUsers(previous => { const next = new Set(previous); next.delete(userId); return next; }));
    socket.on('typing:start', ({ conversationId, name }) => { if (conversationId === selectedRef.current?._id) setTypingUser(name); });
    socket.on('typing:stop', ({ conversationId }) => { if (conversationId === selectedRef.current?._id) setTypingUser(''); });
    socket.on('message:receive', message => {
      setConversations(previous => previous.map(conversation => conversation._id === message.conversation ? { ...conversation, lastMessage: message, lastMessageAt: message.createdAt, unreadCount: message.receiver?._id === currentUser._id ? conversation.unreadCount + 1 : conversation.unreadCount } : conversation));
      if (message.conversation === selectedRef.current?._id) setMessages(previous => previous.some(item => item._id === message._id) ? previous : [...previous, message]);
    });
    socket.on('message:deleted', ({ messageId }) => setMessages(previous => previous.map(message => message._id === messageId ? { ...message, deleted: true, content: '' } : message)));
    socket.on('message:updated', updatedMessage => setMessages(previous => previous.map(message => message._id === updatedMessage._id ? updatedMessage : message)));
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setPage(1);
    setMessagesLoading(true);
    setTypingUser('');
    socketRef.current?.emit('conversation:join', selectedId);
    axios.get(`${apiUrl}/api/chat/conversations/${selectedId}/messages?page=1&limit=30`, authConfig())
      .then(({ data }) => { setMessages(data.messages); setHasMore(data.hasMore); return axios.patch(`${apiUrl}/api/chat/conversations/${selectedId}/read`, {}, authConfig()); })
      .then(() => setConversations(previous => previous.map(conversation => conversation._id === selectedId ? { ...conversation, unreadCount: 0 } : conversation)))
      .catch(err => setError(err.response?.data?.message || 'Unable to load messages.'))
      .finally(() => setMessagesLoading(false));
    return () => socketRef.current?.emit('conversation:leave', selectedId);
  }, [selectedId]);

  const loadOlder = async () => {
    const nextPage = page + 1;
    setMessagesLoading(true);
    try {
      const { data } = await axios.get(`${apiUrl}/api/chat/conversations/${selectedId}/messages?page=${nextPage}&limit=30`, authConfig());
      setMessages(previous => [...data.messages, ...previous]); setPage(nextPage); setHasMore(data.hasMore);
    } catch { setError('Unable to load older messages.'); } finally { setMessagesLoading(false); }
  };

  const handleTyping = () => {
    if (!selectedId || !socketRef.current) return;
    socketRef.current.emit('typing:start', selectedId);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => socketRef.current?.emit('typing:stop', selectedId), 900);
  };

  const handleSend = async event => {
    event.preventDefault();
    if (!draft.trim() || !selectedId) return;
    const content = draft.trim(); setDraft(''); clearTimeout(typingTimeoutRef.current); socketRef.current?.emit('typing:stop', selectedId);
    try { await axios.post(`${apiUrl}/api/chat/conversations/${selectedId}/messages`, { content }, authConfig()); }
    catch (err) { setDraft(content); setError(err.response?.data?.message || 'Message failed to send.'); }
  };

  const deleteMessage = async messageId => { try { await axios.delete(`${apiUrl}/api/chat/messages/${messageId}`, authConfig()); setMessages(previous => previous.map(message => message._id === messageId ? { ...message, deleted: true, content: '' } : message)); } catch { setError('Unable to delete message.'); } };
  const editMessage = async (messageId, content) => {
    try {
      const { data } = await axios.put(`${apiUrl}/api/chat/messages/${messageId}`, { content }, authConfig());
      setMessages(previous => previous.map(message => message._id === messageId ? data : message));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to edit message.');
      throw err;
    }
  };
  const blockUser = async () => {
    if (!selected?.otherUser?._id) return;
    const isBlocked = selected.blockedByMe;
    if (!isBlocked && !window.confirm(`Block ${selected.otherUser.name}?`)) return;
    try {
      const method = isBlocked ? 'delete' : 'put';
      await axios({ method, url: `${apiUrl}/api/chat/users/${selected.otherUser._id}/block`, ...authConfig() });
      setConversations(previous => previous.map(conversation => conversation._id === selected._id ? { ...conversation, blockedByMe: !isBlocked } : conversation));
      setError(isBlocked ? 'Student unblocked. You can message them again.' : 'Student blocked. New messages are disabled.');
    } catch (err) {
      setError(err.response?.data?.message || `Unable to ${isBlocked ? 'unblock' : 'block'} student.`);
    }
  };
  const reportUser = async () => { if (!selected?.otherUser?._id) return; const reason = window.prompt('Reason: spam, harassment, inappropriate content, fake account, or other'); if (!reason) return; try { await axios.post(`${apiUrl}/api/chat/reports`, { reportedUser: selected.otherUser._id, conversation: selected._id, reason: reason.toLowerCase() }, authConfig()); setError('Report submitted for admin review.'); } catch (err) { setError(err.response?.data?.message || 'Unable to submit report.'); } };

  return <div className="w-full bg-white/80 dark:bg-[#111]/80 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden flex min-h-[calc(100vh-10rem)]">
    {error && <div className="absolute z-10 top-24 left-1/2 -translate-x-1/2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-300 text-xs font-bold px-4 py-2 rounded-lg">{error}</div>}
    {loading ? <div className="w-full flex items-center justify-center text-sm text-gray-500">Loading conversations...</div> : <><ChatSidebar conversations={conversations} selectedId={selectedId} search={search} onSearch={setSearch} onSelect={setSelectedId} /><ChatWindow conversation={selected} messages={messages} currentUserId={currentUser._id} draft={draft} onDraft={setDraft} onSend={handleSend} onTyping={handleTyping} typingUser={typingUser} online={onlineUsers.has(selected?.otherUser?._id)} connected={connected} loading={messagesLoading} hasMore={hasMore} onLoadMore={loadOlder} onEdit={editMessage} onDelete={deleteMessage} onBack={() => setSelectedId(null)} onBlock={blockUser} onReport={reportUser} /></>}
  </div>;
}

export default Chat;