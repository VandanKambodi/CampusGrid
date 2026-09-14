import { useState } from 'react';
import { CheckCheck, Pencil, Trash2, X } from 'lucide-react';

function MessageBubble({ message, isOwn, onEdit, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(message.content);
  const [isSaving, setIsSaving] = useState(false);

  const saveEdit = async () => {
    if (!content.trim() || !onEdit) return;
    setIsSaving(true);
    try {
      await onEdit(message._id, content.trim());
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setContent(message.content);
    setIsEditing(false);
  };

  return (
    <div className={`group flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 ${isOwn ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-100 rounded-bl-sm'}`}>
        {message.deleted ? <p className="text-xs italic opacity-70">Message deleted</p> : isEditing ? <div className="space-y-2 min-w-52"><textarea value={content} onChange={event => setContent(event.target.value)} autoFocus rows="3" className="w-full bg-white/15 rounded-md px-2 py-1.5 text-sm outline-none resize-none" /><div className="flex justify-end gap-2"><button onClick={cancelEdit} title="Cancel edit" className="p-1 text-indigo-100 hover:text-white"><X className="w-3.5 h-3.5" /></button><button onClick={saveEdit} disabled={isSaving} className="px-2 py-1 bg-white text-indigo-700 rounded text-[10px] font-bold">{isSaving ? 'Saving...' : 'Save'}</button></div></div> : <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>}
        <div className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] ${isOwn ? 'text-indigo-100' : 'text-gray-400'}`}>
          <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
          {message.edited && !message.deleted && <span>edited</span>}
          {isOwn && <CheckCheck className={`w-3.5 h-3.5 ${message.read ? 'text-cyan-200' : ''}`} />}
        </div>
        {isOwn && !message.deleted && !isEditing && <div className="absolute -left-14 top-2 hidden group-hover:flex items-center gap-1"><button onClick={() => setIsEditing(true)} title="Edit message" className="text-gray-400 hover:text-indigo-500"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => onDelete(message._id)} title="Delete message" className="text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></div>}
      </div>
    </div>
  );
}

export default MessageBubble;