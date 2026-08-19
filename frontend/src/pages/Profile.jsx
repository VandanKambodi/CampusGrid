import { useState, useEffect } from 'react';
import axios from 'axios';
import Loader from '../components/Loader';
import PostCard from '../components/PostCard';
import ConfirmModal from '../components/ConfirmModal';
import { User, Edit3, BookOpen, Code, Sparkles, X } from 'lucide-react';

function Profile() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deletePostId, setDeletePostId] = useState(null);

  // Form fields
  const [name, setName] = useState('');
  const [course, setCourse] = useState('');
  const [branch, setBranch] = useState('');
  const [techStackInput, setTechStackInput] = useState('');
  const [profilePicture, setProfilePicture] = useState('');

  const token = localStorage.getItem('token');

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/profile`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfileData(data);
      setName(data.name || '');
      setCourse(data.course || '');
      setBranch(data.branch || '');
      setTechStackInput(Array.isArray(data.techStack) ? data.techStack.join(', ') : '');
      setProfilePicture(data.profilePicture || '');
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const techStackArray = techStackInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    try {
      const { data } = await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/profile`,
        {
          name,
          course,
          branch,
          techStack: techStackArray,
          profilePicture
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update localStorage userInfo name if needed
      const localUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      localStorage.setItem('userInfo', JSON.stringify({ ...localUserInfo, name: data.name, profilePicture: data.profilePicture }));
      window.dispatchEvent(new Event('auth-change'));

      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/posts/${postId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async (postId, text) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/posts/${postId}/comment`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <Loader text="Loading Profile..." />;
  if (!profileData) return <div className="text-center py-12 text-gray-500">Failed to load profile details.</div>;

  const executeDeletePost = async () => {
    if (!deletePostId) return;
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/posts/${deletePostId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDeletePostId(null);
      fetchProfile();
    } catch (err) {
      console.error('Delete post error', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-[#111112] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 -m-6 mb-6 opacity-90" />

        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            <div className="w-24 h-24 shrink-0 rounded-full border-4 border-white dark:border-[#111112] overflow-hidden shadow-lg bg-indigo-600 flex items-center justify-center -mt-16 sm:-mt-16 z-10">
              <img 
                src={profileData.profilePicture && profileData.profilePicture.trim() !== '' ? profileData.profilePicture : `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name || profileData.rollNo || 'Admin')}&background=6366f1&color=fff&bold=true`} 
                alt={profileData.name || profileData.rollNo} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="pt-2 sm:pt-0">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                {profileData.name || profileData.rollNo || 'Student'}
                {profileData.role === 'admin' && (
                  <span className="bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300 text-[10px] px-2 py-0.5 rounded font-extrabold uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </h1>
              <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-0.5">
                {profileData.rollNo} • {profileData.branch || 'CSE'} ({profileData.course || 'B.Tech'})
              </p>
            </div>
          </div>

          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Profile
          </button>
        </div>

        {/* Profile Stats Bar */}
        <div className="grid grid-cols-3 gap-3 bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-gray-100 dark:border-white/5 text-center">
          <div>
            <span className="block text-lg font-black text-gray-900 dark:text-white">{profileData.posts?.length || 0}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Posts</span>
          </div>
          <div className="border-x border-gray-200 dark:border-white/10">
            <span className="block text-lg font-black text-gray-900 dark:text-white">{profileData.followers?.length || 0}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Followers</span>
          </div>
          <div>
            <span className="block text-lg font-black text-gray-900 dark:text-white">{profileData.following?.length || 0}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Following</span>
          </div>
        </div>

        {/* Tech Stack & Bio */}
        {profileData.techStack?.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-indigo-500" /> Tech Stack & Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {profileData.techStack.map((tech, idx) => (
                <span 
                  key={idx}
                  className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-xs font-semibold rounded-md border border-indigo-100 dark:border-indigo-500/20"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#151516] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-white/10">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-500" /> Edit Profile Details
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Course</label>
                  <input 
                    type="text" 
                    value={course} 
                    onChange={(e) => setCourse(e.target.value)} 
                    placeholder="e.g. B.Tech"
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Branch</label>
                  <input 
                    type="text" 
                    value={branch} 
                    onChange={(e) => setBranch(e.target.value)} 
                    placeholder="e.g. CSE, ECE"
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Tech Stack (Comma-separated)
                </label>
                <input 
                  type="text" 
                  value={techStackInput} 
                  onChange={(e) => setTechStackInput(e.target.value)} 
                  placeholder="e.g. React, Node.js, Python, Tailwind"
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Profile Image URL</label>
                <input 
                  type="text" 
                  value={profilePicture} 
                  onChange={(e) => setProfilePicture(e.target.value)} 
                  placeholder="https://..."
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-white/10">
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User's Created Posts */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-500" /> My Campus Posts ({profileData.posts?.length || 0})
        </h2>

        {profileData.posts?.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-[#111112] border border-gray-200 dark:border-white/10 rounded-xl">
            <p className="text-xs text-gray-500 dark:text-gray-400">You haven't posted anything on CampusGrid yet.</p>
          </div>
        ) : (
          profileData.posts?.map(post => (
            <PostCard 
              key={post._id} 
              post={{ ...post, author: profileData }}
              currentUserId={profileData._id}
              currentUser={profileData}
              onLike={handleLike}
              onComment={handleComment}
              onDelete={(id) => setDeletePostId(id)}
            />
          ))
        )}
      </div>

      <ConfirmModal 
        isOpen={!!deletePostId}
        onClose={() => setDeletePostId(null)}
        onConfirm={executeDeletePost}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete Post"
      />

    </div>
  );
}

export default Profile;
