import { useEffect, useState } from 'react';
import { Code, FolderGit2, X, Loader2, Plus, Sparkles, Briefcase, Globe, Users, UserMinus, UserPlus, ExternalLink } from 'lucide-react';
import axios from 'axios';
import Loader from '../components/Loader';
import AdminProfile from '../components/AdminProfile';

const safeExternalLink = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return trimmed;
  } catch {
    return null;
  }
};

function Profile() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [techStackInput, setTechStackInput] = useState('');
  const [projects, setProjects] = useState([]);
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [activeFollowList, setActiveFollowList] = useState(null);
  const [followEntries, setFollowEntries] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState('');

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
      setPortfolioUrl(data.portfolioUrl || '');
      setLinkedinUrl(data.linkedinUrl || '');
      setGithubUrl(data.githubUrl || '');
    } catch (error) { 
      console.error("Error fetching profile:", error); 
    }
  };

  const openFollowList = async (listType) => {
    if (!profile?._id) return;
    setActiveFollowList(listType);
    setListLoading(true);
    setListError('');
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/${profile._id}/${listType}`, { headers: { Authorization: `Bearer ${token}` } });
      const entries = listType === 'followers' ? data.followers || [] : data.following || [];
      setFollowEntries(entries);
    } catch (error) {
      console.error('Error fetching follow list', error);
      setListError('Unable to load this list right now.');
      setFollowEntries([]);
    } finally {
      setListLoading(false);
    }
  };

  const handleUnfollowFromList = async (userId) => {
    if (!profile?._id || !userId) return;

    const previousFollowing = [...(profile.following || [])];
    const previousList = [...followEntries];

    try {
      const token = localStorage.getItem('token');

      setProfile((prev) => ({
        ...prev,
        following: (prev?.following || []).filter((id) => id !== userId)
      }));
      setFollowEntries((prev) => prev.filter((user) => user._id !== userId));

      await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${userId}/follow`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (error) {
      console.error('Failed to unfollow user', error);
      setProfile((prev) => ({ ...prev, following: previousFollowing }));
      setFollowEntries(previousList);
      setListError('Could not unfollow this user. Please try again.');
    }
  };

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const techStackArray = techStackInput.split(',').map(item => item.trim()).filter(Boolean);
      const payload = { techStack: techStackArray, projects, portfolioUrl, linkedinUrl, githubUrl };
      const { data } = await axios.put(`${import.meta.env.VITE_API_URL}/api/users/profile`, payload, { headers: { Authorization: `Bearer ${token}` } });
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

  const linkedProfiles = [
    { key: 'portfolio', label: 'Portfolio', emoji: '🔗', url: safeExternalLink(profile?.portfolioUrl) },
    { key: 'linkedin', label: 'LinkedIn', emoji: '💼', url: safeExternalLink(profile?.linkedinUrl) },
    { key: 'github', label: 'GitHub', emoji: '🐙', url: safeExternalLink(profile?.githubUrl) }
  ].filter(item => item.url);

  if (!profile) return <Loader text="Loading personal profile..." />;
  if (profile.role === 'admin') {
    return <AdminProfile profile={profile} onProfileUpdated={(updatedProfile) => setProfile(prev => ({ ...prev, ...updatedProfile }))} />;
  }

  return (
    <div className="w-full space-y-6">
      <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-md p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <img 
            src={profile.profilePicture || "https://img.freepik.com/premium-vector/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-vector-illustration_561158-3485.jpg"} 
            alt="Profile" 
            className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-gray-200 dark:border-white/10 object-cover bg-gray-200 shadow-sm shrink-0" 
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white mb-1">{profile.name}</h1>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-bold flex flex-wrap items-center gap-2">
              <span>Roll No: {profile.rollNo}</span>
              <span>•</span>
              <span>{profile.course || "B.Tech"} {profile.branch || "CSE"}</span>
            </p>

            {linkedProfiles.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {linkedProfiles.map(({ key, label, emoji, url }) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
                  >
                    <span>{emoji}</span>
                    {label}
                  </a>
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
              <button type="button" onClick={() => openFollowList('followers')} className="inline-flex items-center gap-1.5 font-bold text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <Users className="w-3.5 h-3.5" />
                <span>{profile.followers?.length || 0} Followers</span>
              </button>
              <button type="button" onClick={() => openFollowList('following')} className="inline-flex items-center gap-1.5 font-bold text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <UserPlus className="w-3.5 h-3.5" />
                <span>{profile.following?.length || 0} Following</span>
              </button>
            </div>
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

      {activeFollowList && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-xl w-full max-w-xl max-h-[75vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10">
              <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-wider">
                {activeFollowList === 'followers' ? 'Followers' : 'Following'}
              </h3>
              <button onClick={() => setActiveFollowList(null)} className="text-gray-500 hover:text-gray-800 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(75vh-72px)]">
              {listLoading ? (
                <div className="py-10"><Loader text={activeFollowList === 'followers' ? 'Loading followers...' : 'Loading following...'} /></div>
              ) : listError ? (
                <div className="text-xs text-red-500 font-semibold py-6 text-center">{listError}</div>
              ) : followEntries.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400 font-semibold">
                  {activeFollowList === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {followEntries.map((user) => (
                    <div key={user._id} className="flex items-center justify-between gap-3 rounded-md border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={user.profilePicture || 'https://img.freepik.com/premium-vector/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-vector-illustration_561158-3485.jpg'} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-white/10" />
                        <div className="min-w-0">
                          <p className="text-sm font-black text-gray-900 dark:text-white truncate">{user.name}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate">{user.rollNo || 'N/A'} • {user.branch || user.course || 'Student'}</p>
                          <a href={`/hub/student/${user._id}`} className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mt-1">
                            View Profile <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      {activeFollowList === 'following' && (
                        <button
                          type="button"
                          onClick={() => handleUnfollowFromList(user._id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-wider transition-colors hover:bg-red-100 dark:hover:bg-red-500/20"
                        >
                          <UserMinus className="w-3.5 h-3.5" /> Unfollow
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-md p-6 shadow-sm">
            <h3 className="text-xs font-black mb-4 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              <Code className="w-4 h-4" /> Technical Stack
            </h3>
            {isEditing ? (
              <div className="space-y-4">
                <textarea 
                  value={techStackInput} 
                  onChange={(e) => setTechStackInput(e.target.value)} 
                  placeholder="React, Node.js, Express, MongoDB, Tailwind..." 
                  className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 dark:text-white rounded-sm p-3 text-xs font-semibold outline-none focus:border-indigo-500 transition-colors" 
                  rows="3" 
                />

                <div className="grid gap-3">
                  <label className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Portfolio URL</span>
                    <input value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} type="url" placeholder="https://yourportfolio.com" className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 dark:text-white rounded-sm px-3 py-2 text-xs outline-none focus:border-indigo-500" />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">LinkedIn URL</span>
                    <input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} type="url" placeholder="https://linkedin.com/in/yourname" className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 dark:text-white rounded-sm px-3 py-2 text-xs outline-none focus:border-indigo-500" />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">GitHub URL</span>
                    <input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} type="url" placeholder="https://github.com/yourname" className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 dark:text-white rounded-sm px-3 py-2 text-xs outline-none focus:border-indigo-500" />
                  </label>
                </div>
              </div>
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
