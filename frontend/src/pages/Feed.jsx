import { useState, useEffect } from 'react';
import axios from 'axios';
import PostCard from '../components/PostCard';
import Loader from '../components/Loader';
import ConfirmModal from '../components/ConfirmModal';
import { Send, Image as ImageIcon, Megaphone, HelpCircle, Sparkles, Filter } from 'lucide-react';

function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [deletePostId, setDeletePostId] = useState(null);

  // Create post state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('general');
  const [itemStatus, setItemStatus] = useState('lost');
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const token = localStorage.getItem('token');

  const fetchPosts = async (selectedType = filterType) => {
    setLoading(true);
    try {
      let url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/posts`;
      if (selectedType !== 'all') {
        url += `?type=${selectedType}`;
      }
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(data);
    } catch (err) {
      console.error('Failed to fetch posts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(filterType);
  }, [filterType]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }

    for (let i = 0; i < images.length; i++) {
      if (images[i].size > 10 * 1024 * 1024) {
        setError(`Image "${images[i].name}" exceeds maximum limit of 10MB.`);
        return;
      }
    }

    setError('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('type', type);
      if (type === 'lost-found') {
        formData.append('itemStatus', itemStatus);
      }
      for (let i = 0; i < images.length; i++) {
        formData.append('images', images[i]);
      }

      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/posts`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Reset form
      setTitle('');
      setContent('');
      setType('general');
      setItemStatus('lost');
      setImages([]);
      fetchPosts(filterType);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const { data } = await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/posts/${postId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPosts(prev => prev.map(p => {
        if (p._id === postId) {
          const alreadyLiked = p.likes.includes(currentUser._id);
          const updatedLikes = alreadyLiked 
            ? p.likes.filter(id => id !== currentUser._id)
            : [...p.likes, currentUser._id];
          return { ...p, likes: updatedLikes };
        }
        return p;
      }));
    } catch (err) {
      console.error('Like failed', err);
    }
  };

  const handleComment = async (postId, text) => {
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/posts/${postId}/comment`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPosts(prev => prev.map(p => {
        if (p._id === postId) {
          return { ...p, comments: data };
        }
        return p;
      }));
    } catch (err) {
      console.error('Comment failed', err);
    }
  };

  const executeDeletePost = async () => {
    if (!deletePostId) return;
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/posts/${deletePostId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDeletePostId(null);
      fetchPosts(filterType);
    } catch (err) {
      console.error('Delete post error', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Create Post Box */}
      <div className="bg-white dark:bg-[#111112] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Share with Campus
        </h2>

        {error && (
          <div className="mb-3 p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs rounded-lg border border-red-200 dark:border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleCreatePost} className="space-y-3">
          <input 
            type="text"
            placeholder="Post Title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-indigo-500 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none transition-all"
          />

          <textarea 
            placeholder="What's happening on campus?"
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-indigo-500 rounded-lg p-3.5 text-sm text-gray-900 dark:text-white outline-none transition-all resize-none"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-white/5">
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Type selector */}
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-700 dark:text-gray-300 font-medium rounded-lg px-3 py-1.5 outline-none cursor-pointer"
              >
                <option value="general" className="bg-white dark:bg-[#151516]">General Post</option>
                <option value="lost-found" className="bg-white dark:bg-[#151516]">Lost & Found</option>
                {(currentUser.isAdmin || currentUser.role === 'admin') && (
                  <option value="announcement" className="bg-white dark:bg-[#151516]">Announcement</option>
                )}
              </select>

              {/* Status for Lost & Found */}
              {type === 'lost-found' && (
                <select
                  value={itemStatus}
                  onChange={(e) => setItemStatus(e.target.value)}
                  className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-700 dark:text-gray-300 font-medium rounded-lg px-3 py-1.5 outline-none cursor-pointer"
                >
                  <option value="lost" className="bg-white dark:bg-[#151516]">Item Lost</option>
                  <option value="found" className="bg-white dark:bg-[#151516]">Item Found</option>
                </select>
              )}

              {/* Image Input */}
              <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5">
                <ImageIcon className="w-4 h-4 text-indigo-500" />
                <span>{images.length > 0 ? `${images.length} Image(s)` : 'Attach Image'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={(e) => setImages(Array.from(e.target.files))}
                  className="hidden" 
                />
              </label>
            </div>

            <button 
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Posting...' : 'Publish'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Feed Filters */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {[
            { id: 'all', label: 'All Posts' },
            { id: 'general', label: 'General' },
            { id: 'lost-found', label: 'Lost & Found' },
            { id: 'announcement', label: 'Announcements' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === f.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-[#111112] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Feed */}
      {loading ? (
        <Loader text="Loading Campus Feed..." />
      ) : posts.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[#111112] border border-gray-200 dark:border-white/10 rounded-xl p-8">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">No posts found in this section yet.</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Be the first to share an update!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard 
              key={post._id} 
              post={post} 
              currentUserId={currentUser._id}
              currentUser={currentUser}
              onLike={handleLike}
              onComment={handleComment}
              onDelete={(id) => setDeletePostId(id)}
            />
          ))}
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal 
        isOpen={!!deletePostId}
        onClose={() => setDeletePostId(null)}
        onConfirm={executeDeletePost}
        title="Delete Post"
        message="Are you sure you want to delete this campus post? It will be permanently removed."
        confirmText="Delete Post"
      />

    </div>
  );
}

export default Feed;
