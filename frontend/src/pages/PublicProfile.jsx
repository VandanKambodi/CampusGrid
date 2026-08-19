import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Loader from '../components/Loader';
import PostCard from '../components/PostCard';
import { UserPlus, UserCheck, Code, BookOpen, ArrowLeft } from 'lucide-react';

function PublicProfile() {
  const { id } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const token = localStorage.getItem('token');

  const fetchStudentProfile = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfileData(data.profile);
      setPosts(data.posts || []);

      const isUserFollowing = data.profile.followers?.includes(currentUser._id);
      setFollowing(!!isUserFollowing);
    } catch (err) {
      console.error('Failed to fetch student profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchStudentProfile();
  }, [id]);

  const handleFollowToggle = async () => {
    setActionLoading(true);
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/${id}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFollowing(!following);
      setProfileData(prev => ({
        ...prev,
        followers: following 
          ? prev.followers.filter(fId => fId !== currentUser._id)
          : [...(prev.followers || []), currentUser._id]
      }));
    } catch (err) {
      console.error('Follow error', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/posts/${postId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchStudentProfile();
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
      fetchStudentProfile();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <Loader text="Fetching Student Profile..." />;
  if (!profileData) return (
    <div className="text-center py-12 text-gray-500">
      Student profile not found.
      <div className="mt-4">
        <Link to="/hub/network" className="text-xs text-indigo-500 hover:underline">Return to Campus Network</Link>
      </div>
    </div>
  );

  const isSelf = currentUser._id === profileData._id;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/hub/network" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Campus Network
      </Link>

      {/* Header Card */}
      <div className="bg-white dark:bg-[#111112] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 -m-6 mb-6 opacity-90" />

        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            <div className="w-24 h-24 shrink-0 rounded-full border-4 border-white dark:border-[#111112] overflow-hidden shadow-lg bg-indigo-600 flex items-center justify-center -mt-16 sm:-mt-16 z-10">
              <img 
                src={profileData.profilePicture && profileData.profilePicture.trim() !== '' ? profileData.profilePicture : `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name || profileData.rollNo || 'Student')}&background=6366f1&color=fff&bold=true`} 
                alt={profileData.name || profileData.rollNo} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="pt-2 sm:pt-0">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                {profileData.name || profileData.rollNo || 'Student'}
              </h1>
              <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-0.5">
                {profileData.rollNo} • {profileData.branch || 'CSE'} ({profileData.course || 'B.Tech'})
              </p>
            </div>
          </div>

          {!isSelf && (
            <button 
              onClick={handleFollowToggle}
              disabled={actionLoading}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer ${
                following 
                  ? 'bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/20' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {following ? (
                <>
                  <UserCheck className="w-4 h-4 text-green-500" /> Following
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Follow Student
                </>
              )}
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-gray-100 dark:border-white/5 text-center">
          <div>
            <span className="block text-lg font-black text-gray-900 dark:text-white">{posts.length}</span>
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

        {/* Tech Stack */}
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

      {/* Student Posts */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-500" /> Recent Posts ({posts.length})
        </h2>

        {posts.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-[#111112] border border-gray-200 dark:border-white/10 rounded-xl">
            <p className="text-xs text-gray-500 dark:text-gray-400">No posts by this student yet.</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard 
              key={post._id} 
              post={{ ...post, author: profileData }}
              currentUserId={currentUser._id}
              onLike={handleLike}
              onComment={handleComment}
            />
          ))
        )}
      </div>

    </div>
  );
}

export default PublicProfile;
