import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Code, FolderGit2, ArrowLeft, UserPlus, UserCheck, Sparkles } from 'lucide-react';
import axios from 'axios';
import Loader from '../components/Loader';

function PublicProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => { 
    fetchProfile(); 
  }, [id]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setProfile(data.profile);
      setPosts(data.posts);
      
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (data.profile.followers?.includes(userInfo._id)) setIsFollowing(true);
    } catch (error) { 
      console.error("Error fetching peer profile:", error); 
    }
  };

  const handleFollow = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${id}/follow`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setIsFollowing(!isFollowing);
      fetchProfile();
    } catch (error) { 
      console.error("Error updating follow status", error); 
    }
  };

  if (!profile) return <Loader text="Loading peer profile..." />;

  return (
    <div className="space-y-6 w-full">
      <Link 
        to="/hub/feed" 
        className="inline-flex items-center gap-2 text-xs font-black text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase tracking-wider"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Feed
      </Link>

      <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-md p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img 
              src={profile.profilePicture || "https://img.freepik.com/premium-vector/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-vector-illustration_561158-3485.jpg"} 
              alt="Profile" 
              className="w-15 h-15 md:w-18 md:h-18 rounded-full border border-gray-200 dark:border-white/10 object-cover bg-gray-200 shadow-sm shrink-0" 
            />
            <div>
              <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white mb-1">{profile.name}</h1>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-bold flex items-center gap-2">
                <span>Roll No: {profile.rollNo}</span>
                <span>•</span>
                <span>{profile.course || "B.Tech"} {profile.branch || "CSE"}</span>
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleFollow} 
            className={`px-6 py-2.5 rounded-sm cursor-pointer text-xs font-black flex items-center justify-center gap-2 transition-all shadow-sm shrink-0 ${
              isFollowing 
                ? 'bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-white hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 border border-gray-200 dark:border-white/10' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/25 hover:-translate-y-0.5'
            }`}
          >
            {isFollowing ? <><UserCheck className="w-4 h-4" /> Following</> : <><UserPlus className="w-4 h-4" /> Connect</>}
          </button>
        </div>
        
        {/* Followers & Following Counters */}
        <div className="flex gap-4 text-xs border-t border-gray-100 dark:border-white/5 pt-4">
          <div className="p-2">
            <span className="font-black text-sm text-gray-900 dark:text-white mr-1.5">{profile.followers?.length || 0}</span> 
            <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Followers</span>
          </div>
          <div className="p-2">
            <span className="font-black text-sm text-gray-900 dark:text-white mr-1.5">{profile.following?.length || 0}</span> 
            <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Following</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Tech Stack */}
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-md p-6 shadow-sm">
            <h3 className="text-xs font-black mb-4 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              <Code className="w-4 h-4" /> Technical Stack
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.techStack?.length > 0 ? (
                profile.techStack.map((tech, i) => (
                  <span key={i} className="px-3 py-1.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-sm text-xs font-extrabold text-gray-800 dark:text-gray-200">
                    {tech}
                  </span>
                ))
              ) : (
                <span className="text-gray-400 italic text-xs">No technical stack listed by user.</span>
              )}
            </div>
          </div>

          {/* Projects */}
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-md p-6 shadow-sm">
            <h3 className="text-xs font-black mb-4 flex items-center gap-2 text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
              <FolderGit2 className="w-4 h-4" /> Project Portfolio
            </h3>
            <div className="space-y-3">
              {profile.projects?.length > 0 ? (
                profile.projects.map((proj, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 p-4 rounded-sm">
                    <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">{proj.title}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 my-1.5 leading-relaxed">{proj.description}</p>
                    {proj.link && (
                      <a 
                        href={proj.link} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[11px] uppercase font-black text-indigo-600 dark:text-indigo-400 hover:underline break-all inline-block mt-1"
                      >
                        View Repository →
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <span className="text-gray-400 italic text-xs">No project showcases listed.</span>
              )}
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-md p-6 shadow-sm h-fit">
          <h3 className="text-xs font-black mb-5 flex items-center gap-2 uppercase tracking-wider text-gray-900 dark:text-gray-100">
            <Sparkles className="w-4 h-4 text-amber-500" /> Published Activity
          </h3>
          
          <div className="space-y-4">
            {posts?.length > 0 ? (
              posts.map(post => (
                <div key={post._id} className="p-4 rounded-sm bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-2 py-0.5 mb-1 rounded-sm">
                      {post.type}
                    </span>
                    <span className="text-[11px] font-semibold text-gray-400">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm leading-tight mb-1 text-gray-900 dark:text-white">{post.title}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">{post.content}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs font-semibold text-gray-400 italic border border-dashed border-gray-200 dark:border-white/10 rounded-md">
                No recent activity recorded for this student.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicProfile;
