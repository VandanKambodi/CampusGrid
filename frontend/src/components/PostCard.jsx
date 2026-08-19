import { useState } from 'react';
import { Heart, MessageCircle, Send, Trash2 } from 'lucide-react';

function PostCard({ post, currentUserId, onLike, onComment, onDelete, currentUser }) {
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const isLiked = post.likes.includes(currentUserId);
  
  const user = currentUser || JSON.parse(localStorage.getItem('userInfo') || '{}');
  const canDelete = onDelete && (user.isAdmin || user.role === 'admin' || post.author?._id === currentUserId);

  const handleCommentSubmit = () => {
    if (!replyText.trim()) return;
    onComment(post._id, replyText);
    setReplyText('');
  };

  const getBadgeStyles = () => {
    if (post.type === 'lost-found') {
      return post.itemStatus === 'lost' 
        ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:border-red-500/20' 
        : 'bg-green-50 text-green-600 border-green-100 dark:bg-green-500/10 dark:border-green-500/20';
    }
    if (post.type === 'announcement') {
      return 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:border-purple-500/20';
    }
    return 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20';
  };

  const isLostFoundWithImage = post.type === 'lost-found' && post.images?.length > 0;

  return (
    <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-md p-4 md:p-5 shadow-sm transition-all hover:border-gray-300 dark:hover:border-white/20">
      
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2.5 items-center">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-100 dark:border-white/10 bg-indigo-600 flex items-center justify-center">
            <img 
              src={post.author?.profilePicture && post.author.profilePicture.trim() !== '' ? post.author.profilePicture : `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || post.author?.rollNo || 'Student')}&background=6366f1&color=fff&bold=true`} 
              alt="avatar" 
              className="w-full h-full object-cover" 
            />
          </div>
          <div>
            <h4 className="font-bold text-sm leading-tight flex items-center gap-1.5 text-gray-900 dark:text-white">
              {post.author?.name || "Anonymous Student"}
              {post.type === 'announcement' && (
                <span className="bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300 text-[10px] px-1.5 py-0.5 rounded-sm font-extrabold uppercase tracking-wider">
                  Admin
                </span>
              )}
            </h4>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-sm uppercase tracking-wider border shrink-0 ${getBadgeStyles()}`}>
            {post.type === 'lost-found' ? post.itemStatus : post.type}
          </span>
          {canDelete && (
            <button
              onClick={() => onDelete(post._id)}
              title="Delete Post"
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {isLostFoundWithImage ? (
        <div className="flex flex-col sm:flex-row gap-5 items-start mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-black mb-1.5 text-gray-900 dark:text-white leading-snug">{post.title}</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{post.content}</p>
          </div>

          <div>
            {post.images.map((imgUrl, i) => (
              <img 
                key={i} 
                src={imgUrl.startsWith('http') ? imgUrl : `${import.meta.env.VITE_API_URL}${imgUrl}`} 
                alt="lost item full view" 
                className="w-full h-auto max-h-60 object-contain rounded-sm mx-auto" 
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          <h3 className="text-base font-black mb-1.5 text-gray-900 dark:text-white">{post.title}</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap leading-relaxed">{post.content}</p>

          {post.images?.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {post.images.map((imgUrl, i) => (
                <img 
                  key={i} 
                  src={imgUrl.startsWith('http') ? imgUrl : `${import.meta.env.VITE_API_URL}${imgUrl}`} 
                  alt="attachment preview" 
                  className="rounded-sm object-contain bg-gray-50 dark:bg-white/5 w-full max-h-72 border border-gray-100 dark:border-white/5 mx-auto" 
                />
              ))}
            </div>
          )}
        </>
      )}

      <div className="flex items-center gap-6 border-t border-gray-100 dark:border-white/5 pt-3 mt-2">
        <button 
          onClick={() => onLike(post._id)} 
          className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} /> {post.likes.length}
        </button>
        <button 
          onClick={() => setIsCommentsOpen(!isCommentsOpen)} 
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-indigo-500 transition-colors"
        >
          <MessageCircle className="w-4 h-4" /> {post.comments.length}
        </button>
      </div>

      {isCommentsOpen && (
        <div className="mt-3 pt-3 border-t border-gray-50 dark:border-white/5 space-y-3">
          {post.comments.map(comment => (
            <div key={comment._id} className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-gray-200 dark:border-white/10 bg-indigo-600 flex items-center justify-center">
                <img 
                  src={comment.user?.profilePicture && comment.user.profilePicture.trim() !== '' ? comment.user.profilePicture : `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user?.name || 'Student')}&background=6366f1&color=fff&bold=true`} 
                  alt="avatar" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="bg-gray-50 dark:bg-white/5 px-3.5 py-2 rounded-sm flex-1">
                <span className="font-bold text-xs block mb-0.5 text-gray-900 dark:text-gray-200">{comment.user?.name || "Student"}</span>
                <span className="text-xs text-gray-700 dark:text-gray-300 leading-normal">{comment.text}</span>
              </div>
            </div>
          ))}
          <div className="flex gap-2 items-center pt-1">
            <input 
              type="text" 
              placeholder="Write a reply..." 
              value={replyText} 
              onChange={(e) => setReplyText(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()} 
              className="flex-grow bg-gray-100 dark:bg-white/5 border border-transparent focus:border-indigo-500 dark:focus:border-indigo-500 px-3.5 py-2 rounded-sm text-xs outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400" 
            />
            <button 
              onClick={handleCommentSubmit} 
              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm cursor-pointer transition-all shrink-0 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostCard;