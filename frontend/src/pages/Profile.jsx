import { useEffect, useState } from 'react';
import { Code, FolderGit2, X, Loader2, Plus, Sparkles } from 'lucide-react';
import axios from 'axios';
import Loader from '../components/Loader';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [techStackInput, setTechStackInput] = useState('');
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/profile`, { headers: { Authorization: `Bearer ${token}` } });
      setProfile(data);
      setTechStackInput(data.techStack?.join(', ') || '');
      setProjects(data.projects || []);
    } catch (error) { 
      console.error("Error fetching profile:", error); 
    }
  };

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const techStackArray = techStackInput.split(',').map(item => item.trim()).filter(Boolean);
      const { data } = await axios.put(`${import.meta.env.VITE_API_URL}/api/users/profile`, { techStack: techStackArray, projects }, { headers: { Authorization: `Bearer ${token}` } });
      setProfile(prev => ({ ...prev, ...data }));
      setIsEditing(false);
    } catch { 
      alert("Error updating profile"); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const addProject = () => setProjects([...projects, { title: '', description: '', link: '' }]);
  const updateProject = (index, field, value) => { 
    const updated = [...projects]; 
    updated[index][field] = value; 
    setProjects(updated); 
  };

  if (!profile) return <Loader text="Loading personal profile..." />;

  return (
    <div className="w-full space-y-6">
      <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-md p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img 
            src={profile.profilePicture || "https://img.freepik.com/premium-vector/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-vector-illustration_561158-3485.jpg"} 
            alt="Profile" 
            className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-gray-200 dark:border-white/10 object-cover bg-gray-200 shadow-sm shrink-0" 
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
          onClick={() => isEditing ? handleUpdateProfile() : setIsEditing(true)} 
          disabled={isSaving} 
          className={`px-5 py-2.5 rounded-sm cursor-pointer text-xs font-black transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0 ${
            isEditing 
              ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
              : 'bg-gray-900 text-white hover:bg-indigo-600 dark:bg-white dark:text-black dark:hover:bg-indigo-400 dark:hover:text-white'
          }`}
        >
          {isSaving ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/> Saving Changes...</> : isEditing ? 'Save Profile' : 'Edit Profile'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Tech Stack */}
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-md p-6 shadow-sm">
            <h3 className="text-xs font-black mb-4 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              <Code className="w-4 h-4" /> Technical Stack
            </h3>
            {isEditing ? (
              <textarea 
                value={techStackInput} 
                onChange={(e) => setTechStackInput(e.target.value)} 
                placeholder="React, Node.js, Express, MongoDB, Tailwind..." 
                className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 dark:text-white rounded-sm p-3 text-xs font-semibold outline-none focus:border-indigo-500 transition-colors" 
                rows="3" 
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.techStack?.length > 0 ? (
                  profile.techStack.map((tech, i) => (
                    <span key={i} className="px-3 py-1.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-sm text-xs font-extrabold text-gray-800 dark:text-gray-200">
                      {tech}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 italic text-xs">No technical skills added yet. Click edit to customize.</span>
                )}
              </div>
            )}
          </div>

          {/* Projects */}
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-md p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black flex items-center gap-2 text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                <FolderGit2 className="w-4 h-4" /> Engineering Projects
              </h3>
              {isEditing && (
                <button 
                  onClick={addProject} 
                  type="button"
                  className="text-xs text-cyan-600 dark:text-cyan-400 font-black hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Project
                </button>
              )}
            </div>

            <div className="space-y-3">
              {isEditing ? (
                projects.map((proj, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 p-4 rounded-md space-y-2.5 relative">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Project #{i+1}</span>
                      <button onClick={() => setProjects(projects.filter((_, idx) => idx !== i))} type="button" className="text-red-500 hover:text-red-700">
                        <X className="w-4 h-4"/>
                      </button>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Project Title" 
                      value={proj.title} 
                      onChange={(e) => updateProject(i, 'title', e.target.value)} 
                      className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 dark:text-white rounded-sm px-3 py-2 text-xs font-bold outline-none focus:border-indigo-500" 
                    />
                    <input 
                      type="text" 
                      placeholder="Brief Description" 
                      value={proj.description} 
                      onChange={(e) => updateProject(i, 'description', e.target.value)} 
                      className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 dark:text-white rounded-sm px-3 py-2 text-xs font-medium outline-none focus:border-indigo-500" 
                    />
                    <input 
                      type="url" 
                      placeholder="GitHub or Live URL (https://...)" 
                      value={proj.link} 
                      onChange={(e) => updateProject(i, 'link', e.target.value)} 
                      className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-sm px-3 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 outline-none focus:border-indigo-500" 
                    />
                  </div>
                ))
              ) : (
                profile.projects?.length > 0 ? (
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
                )
              )}
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-md p-6 shadow-sm h-fit">
          <h3 className="text-xs font-black mb-5 flex items-center gap-2 uppercase tracking-wider text-gray-900 dark:text-gray-100">
            <Sparkles className="w-4 h-4 text-amber-500" /> Recent Campus Activity
          </h3>
          
          <div className="space-y-4">
            {profile.posts?.length > 0 ? (
              profile.posts.map(post => (
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
              <div className="text-center py-8 text-xs font-semibold text-gray-400 italic border border-dashed border-gray-200 dark:border-white/10 rounded-sm">
                No published posts recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;