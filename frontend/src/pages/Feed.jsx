import { useEffect, useState, useRef } from 'react';
import { Image as ImageIcon, Megaphone, Loader2 } from 'lucide-react';
import axios from 'axios';
import PostCard from '../components/PostCard';
import Loader from '../components/Loader';

function Feed() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true); 
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('blog');
  const [itemStatus, setItemStatus] = useState('lost');
  const [images, setImages] = useState([]);
  const [isPosting, setIsPosting] = useState(false); 
  const fileInputRef = useRef(null);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) setUser(JSON.parse(userInfo));
  }, []);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = activeTab === 'all' 
        ? `${import.meta.env.VITE_API_URL}/api/posts` 
        : `${import.meta.env.VITE_API_URL}/api/posts?type=${activeTab}`;
      const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    if (user) fetchPosts(); 
    if (activeTab !== 'all') setPostType(activeTab);
    else setPostType('blog');
  }, [activeTab, user]);

  const handleCreatePost = async () => {
    if (!title.trim() || !content.trim()) return alert("Title and Content required.");
    setIsPosting(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('type', postType);
      if (postType === 'lost-found') formData.append('itemStatus', itemStatus);
      Array.from(images).forEach(file => formData.append('images', file));

      await axios.post(`${import.meta.env.VITE_API_URL}/api/posts`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setTitle(''); setContent(''); setImages([]); fetchPosts();
    } catch (error) {
      alert(error.response?.data?.message || "Something went wrong");
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      setPosts(posts.map(post => {
        if (post._id === postId) {
          const hasLiked = post.likes.includes(user._id);
          const newLikes = hasLiked ? post.likes.filter(id => id !== user._id) : [...post.likes, user._id];
          return { ...post, likes: newLikes };
        }
        return post;
      }));
      await axios.put(`${import.meta.env.VITE_API_URL}/api/posts/${postId}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch { fetchPosts(); }
  };

  const handleComment = async (postId, text) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/posts/${postId}/comment`, { text }, { headers: { Authorization: `Bearer ${token}` } });
      fetchPosts(); 
    } catch (error) { console.error(error); }
  };

  if (!user) return null;

  return (
    <div className="w-full space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {['all', 'announcement', 'blog', 'lost-found'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)} 
            className={`px-4 py-2 rounded-sm text-xs font-extrabold whitespace-nowrap transition-all uppercase tracking-wider ${activeTab === tab ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}
          >
            {tab === 'all' ? 'All Activity' : tab === 'announcement' ? 'Announcements' : tab === 'blog' ? 'Student Blogs' : 'Lost & Found'}
          </button>
        ))}
      </div>

      {user.role === 'admin' || activeTab !== 'announcement' ? (
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-md p-4 shadow-sm">
          {(activeTab === 'all' || postType === 'lost-found') && (
            <div className="flex flex-wrap gap-3 items-center mb-3">
              {activeTab === 'all' && (
                <select value={postType} onChange={(e) => setPostType(e.target.value)} className="bg-gray-50 dark:bg-white/5 text-xs font-extrabold px-3 py-1.5 rounded-sm outline-none text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10">
                  <option className="bg-white dark:bg-[#111] text-gray-900 dark:text-white" value="blog">Student Blog</option>
                  <option className="bg-white dark:bg-[#111] text-gray-900 dark:text-white" value="lost-found">Lost & Found</option>
                  {user.role === 'admin' && <option className="bg-white dark:bg-[#111] text-gray-900 dark:text-white" value="announcement">Announcement</option>}
                </select>
              )}
              {postType === 'lost-found' && (
                <select value={itemStatus} onChange={(e) => setItemStatus(e.target.value)} className="bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 text-xs font-extrabold px-3 py-1.5 rounded-sm outline-none border border-pink-100 dark:border-pink-500/20">
                  <option className="bg-white dark:bg-[#111] text-gray-900 dark:text-white" value="lost">Lost Item</option>
                  <option className="bg-white dark:bg-[#111] text-gray-900 dark:text-white" value="found">Found Item</option>
                </select>
              )}
            </div>
          )}
          <input type="text" placeholder={postType === 'lost-found' ? "What did you lose or find?" : "Post Title..."} value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-transparent border-none text-base font-black mb-1 outline-none placeholder-gray-400 text-gray-900 dark:text-white" />
          <textarea placeholder={postType === 'lost-found' ? "Describe the item and where you last saw it..." : "Write something..."} value={content} onChange={(e) => setContent(e.target.value)} rows="7" className="w-full bg-transparent border-none text-sm outline-none placeholder-gray-500 resize-none text-gray-700 dark:text-gray-300" />
          
          {images.length > 0 && (
            <div className="flex gap-2 my-2 overflow-x-auto">
              {Array.from(images).map((file, i) => (
                <div key={i} className="relative w-16 h-16 shrink-0 rounded-sm overflow-hidden border border-gray-200 dark:border-white/10">
                  <img src={URL.createObjectURL(file)} alt="preview" className="object-cover w-full h-full" />
                </div>
              ))}
            </div>
          )}

          <div className="mt-2 pt-3 border-t border-gray-100 dark:border-white/5 flex flex-wrap justify-between items-center gap-2">
            <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={(e) => setImages(e.target.files)} className="hidden" />
            <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 cursor-pointer hover:text-indigo-500 transition-colors">
              <ImageIcon className="w-4 h-4" /> Attach Image
            </button>
            <button onClick={handleCreatePost} disabled={isPosting} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-sm cursor-pointer font-extrabold text-xs transition-all flex items-center gap-2 shadow-sm">
              {isPosting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Posting...</> : 'Publish Post'}
            </button>
          </div>
        </div>
      ) : (
         <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 text-purple-600 dark:text-purple-300 p-4 rounded-sm text-xs font-extrabold flex items-center gap-2 uppercase tracking-wider">
           <Megaphone className="w-4 h-4"/> Only Administrators can broadcast university announcements.
         </div>
      )}

      {isLoading ? (
        <Loader text="Fetching campus activity..." />
      ) : (
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12 text-xs font-bold text-gray-400 uppercase tracking-wider bg-white dark:bg-[#111] rounded-md border border-gray-200 dark:border-white/10">
              No activity recorded in this module yet.
            </div>
          ) : (
            posts.map((post) => (
              <PostCard 
                key={post._id} 
                post={post} 
                currentUserId={user._id} 
                onLike={handleLike} 
                onComment={handleComment} 
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Feed;