import { useEffect, useState } from 'react';
import { Activity, BarChart3, Edit3, Loader2, ShieldCheck, Users } from 'lucide-react';
import axios from 'axios';
import Loader from './Loader';

const metricLabels = [
  ['totalStudents', 'Total Students'],
  ['totalPosts', 'Total Posts'],
  ['totalResources', 'Total Resources'],
  ['totalJobs', 'Jobs / Drives'],
  ['totalRequests', 'Account Requests'],
  ['totalCampusActivity', 'Campus Activity']
];

function AdminProfile({ profile, onProfileUpdated }) {
  const [analytics, setAnalytics] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile.name || '');
  const [profilePicture, setProfilePicture] = useState(profile.profilePicture || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/admin/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAnalytics(data);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load admin analytics.');
      }
    };

    fetchAnalytics();
  }, []);

  const saveProfile = async () => {
    setIsSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/profile`,
        { name, profilePicture },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onProfileUpdated(data);
      setIsEditing(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update admin profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="bg-white dark:bg-[#111] border border-indigo-200 dark:border-indigo-500/30 rounded-md p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <img
            src={profile.profilePicture || 'https://ui-avatars.com/api/?name=CampusGrid+Admin&background=4f46e5&color=fff&bold=true'}
            alt="CampusGrid Admin"
            className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-indigo-200 dark:border-indigo-500/30 object-cover bg-gray-200 shadow-sm shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider mb-1">
              <ShieldCheck className="w-3.5 h-3.5" /> System Account
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <input value={name} onChange={(event) => setName(event.target.value)} className="bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 dark:text-white rounded-sm px-3 py-2 text-sm font-bold outline-none focus:border-indigo-500" />
                <input value={profilePicture} onChange={(event) => setProfilePicture(event.target.value)} placeholder="Profile image URL" className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 dark:text-white rounded-sm px-3 py-2 text-xs outline-none focus:border-indigo-500" />
              </div>
            ) : (
              <>
                <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">{profile.name}</h1>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-bold">System Roll No: {profile.rollNo}</p>
              </>
            )}
          </div>
        </div>
        <button onClick={() => (isEditing ? saveProfile() : setIsEditing(true))} disabled={isSaving} className="px-5 py-2.5 rounded-sm text-xs font-black bg-gray-900 text-white hover:bg-indigo-600 dark:bg-white dark:text-black dark:hover:bg-indigo-400 dark:hover:text-white transition-all flex items-center justify-center gap-1.5 shrink-0">
          {isSaving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : <><Edit3 className="w-3.5 h-3.5" /> {isEditing ? 'Save Profile' : 'Edit Profile'}</>}
        </button>
      </div>

      {error && <div className="p-3 rounded-sm border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 text-xs font-semibold text-red-600 dark:text-red-400">{error}</div>}

      <section className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-md p-6 shadow-sm">
        <h2 className="text-xs font-black mb-5 flex items-center gap-2 uppercase tracking-wider text-gray-900 dark:text-gray-100">
          <BarChart3 className="w-4 h-4 text-indigo-500" /> Admin Analytics
        </h2>
        {analytics ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {metricLabels.map(([key, label]) => (
              <div key={key} className="border border-gray-200 dark:border-white/10 rounded-sm p-4 bg-gray-50 dark:bg-white/5">
                <p className="text-2xl font-black text-gray-900 dark:text-white">{analytics[key]}</p>
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
        ) : (
          <Loader text="Loading admin analytics..." />
        )}
      </section>

      <section className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-md p-6 shadow-sm">
        <h2 className="text-xs font-black mb-5 flex items-center gap-2 uppercase tracking-wider text-gray-900 dark:text-gray-100">
          <Activity className="w-4 h-4 text-amber-500" /> Campus Activity
        </h2>
        <div className="space-y-4">
          {profile.posts?.length > 0 ? profile.posts.map(post => (
            <div key={post._id} className="p-4 rounded-sm bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase">{post.type}</span>
                <span className="text-[11px] font-semibold text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">{post.title}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{post.content}</p>
            </div>
          )) : (
            <div className="text-center py-8 text-xs font-semibold text-gray-400 italic border border-dashed border-gray-200 dark:border-white/10 rounded-sm">No admin activity recorded yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}

export default AdminProfile;
