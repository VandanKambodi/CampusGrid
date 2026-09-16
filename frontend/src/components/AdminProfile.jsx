import { createElement, useCallback, useEffect, useState } from 'react';
import { Activity, BarChart3, BookOpen, Edit3, FileText, Loader2, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import axios from 'axios';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const branchOptions = ['', 'CSE', 'ECE', 'Mechanical', 'Civil'];
const periodOptions = [['7d', 'Last 7 days'], ['30d', 'Last 30 days'], ['3m', 'Last 3 months'], ['6m', 'Last 6 months'], ['12m', 'Last 12 months'], ['all', 'All time']];
const chartColors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

const formatNumber = (value) => value === null || value === undefined ? 'N/A' : new Intl.NumberFormat().format(value);

function ChartEmpty({ children = 'No data available for the selected period.' }) {
  return <div className="h-48 flex items-center justify-center text-xs font-semibold text-gray-400 border border-dashed border-gray-200 dark:border-white/10 rounded-sm">{children}</div>;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-sm border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-white/10 dark:bg-[#161616]"><p className="font-bold text-gray-500">{label}</p><p className="font-black text-indigo-500">{formatNumber(payload[0].value)}</p></div>;
}

function AdminProfile({ profile, onProfileUpdated }) {
  const [analytics, setAnalytics] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile.name || '');
  const [profilePicture, setProfilePicture] = useState(profile.profilePicture || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('30d');
  const [branch, setBranch] = useState('');
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activityPage, setActivityPage] = useState(1);
  const activityPerPage = 3;
  const activityPosts = profile.posts || [];
  const activityPageCount = Math.max(1, Math.ceil(activityPosts.length / activityPerPage));
  const visibleActivityPosts = activityPosts.slice((activityPage - 1) * activityPerPage, activityPage * activityPerPage);

  const fetchAnalytics = useCallback(async () => {
    setIsLoadingAnalytics(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/api/admin/analytics`, { params: { period, branch }, headers: { Authorization: `Bearer ${token}` } });
      setAnalytics(data);
      setLastUpdated(new Date());
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load admin analytics.');
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [period, branch]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

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

      <section className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-md p-4 md:p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div><h2 className="text-xs font-black flex items-center gap-2 uppercase tracking-wider text-gray-900 dark:text-gray-100"><BarChart3 className="w-4 h-4 text-indigo-500" /> CampusGrid Analytics</h2><p className="text-xs text-gray-500 mt-1">Platform activity and student engagement from recorded data.</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={period} onChange={(event) => setPeriod(event.target.value)} className="bg-gray-50 dark:bg-[#1b1b1b] border border-gray-200 dark:border-white/10 rounded-sm px-2.5 py-2 text-xs font-bold text-gray-900 dark:text-white outline-none [color-scheme:light] dark:[color-scheme:dark]"><option value="" className="bg-white text-gray-900 dark:bg-[#1b1b1b] dark:text-white">Date range</option>{periodOptions.map(([value, label]) => <option key={value} value={value} className="bg-white text-gray-900 dark:bg-[#1b1b1b] dark:text-white">{label}</option>)}</select>
            <select value={branch} onChange={(event) => setBranch(event.target.value)} className="bg-gray-50 dark:bg-[#1b1b1b] border border-gray-200 dark:border-white/10 rounded-sm px-2.5 py-2 text-xs font-bold text-gray-900 dark:text-white outline-none [color-scheme:light] dark:[color-scheme:dark]"><option value="" className="bg-white text-gray-900 dark:bg-[#1b1b1b] dark:text-white">All branches</option>{branchOptions.slice(1).map(option => <option key={option} value={option} className="bg-white text-gray-900 dark:bg-[#1b1b1b] dark:text-white">{option}</option>)}</select>
            <button onClick={fetchAnalytics} disabled={isLoadingAnalytics} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm bg-indigo-600 text-white text-xs font-black hover:bg-indigo-500 disabled:opacity-60"><RefreshCw className={`w-3.5 h-3.5 ${isLoadingAnalytics ? 'animate-spin' : ''}`} /> Refresh</button>
          </div>
        </div>
        {lastUpdated && <p className="text-[10px] font-semibold text-gray-400">Last updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
        {isLoadingAnalytics && !analytics ? <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-24 rounded-sm bg-gray-100 dark:bg-white/5 animate-pulse" />)}</div> : analytics && <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {[
              ['totalStudents', 'Total Students', Users], ['activeToday', 'Active Today', Activity], ['totalPosts', 'Total Posts', FileText], ['totalResources', 'Total Resources', BookOpen], ['totalAnnouncements', 'Announcements', BarChart3]
            ].map(([key, label, Icon]) => <div key={key} className="border border-gray-200 dark:border-white/10 rounded-sm p-3 bg-gray-50 dark:bg-white/5">{createElement(Icon, { className: 'w-4 h-4 text-indigo-500 mb-3' })}<p className="text-xl font-black text-gray-900 dark:text-white">{formatNumber(analytics.overview[key])}</p><p className="text-[9px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-1">{label}</p></div>)}
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="border border-gray-200 dark:border-white/10 rounded-sm p-4"><h3 className="text-xs font-black uppercase tracking-wider mb-4">Student growth</h3>{analytics.studentGrowth.length ? <ResponsiveContainer width="100%" height={220}><AreaChart data={analytics.studentGrowth}><CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} /><Tooltip content={<ChartTooltip />} /><Area type="monotone" dataKey="count" stroke="#6366f1" fill="#6366f133" strokeWidth={2} /></AreaChart></ResponsiveContainer> : <ChartEmpty />}</div>
            <div className="border border-gray-200 dark:border-white/10 rounded-sm p-4"><h3 className="text-xs font-black uppercase tracking-wider mb-4">Resource uploads</h3>{analytics.resourceUploads.length ? <ResponsiveContainer width="100%" height={220}><BarChart data={analytics.resourceUploads}><CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} /><Tooltip content={<ChartTooltip />} /><Bar dataKey="count" fill="#06b6d4" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer> : <ChartEmpty />}</div>
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="border border-gray-200 dark:border-white/10 rounded-sm p-4"><h3 className="text-xs font-black uppercase tracking-wider mb-3">Branch distribution</h3>{analytics.branchDistribution.length ? <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={analytics.branchDistribution} dataKey="count" nameKey="branch" innerRadius={55} outerRadius={82} paddingAngle={3}>{analytics.branchDistribution.map((entry, index) => <Cell key={entry.branch} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <ChartEmpty />}</div>
            <div className="border border-gray-200 dark:border-white/10 rounded-sm p-4"><h3 className="text-xs font-black uppercase tracking-wider mb-3">Most active students</h3>{analytics.mostActiveStudents.length ? <div className="space-y-2">{analytics.mostActiveStudents.map(student => <div key={student._id} className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-white/5 pb-2"><div className="min-w-0"><p className="text-xs font-black truncate">{student.rank}. {student.name}</p><p className="text-[10px] text-gray-500">{student.branch || 'Branch not set'}</p></div><span className="text-xs font-black text-indigo-500">{student.activityCount}</span></div>)}</div> : <ChartEmpty>No recorded activity for the selected period.</ChartEmpty>}</div>
          </div>
          <div className="grid lg:grid-cols-2 gap-4"><div className="border border-gray-200 dark:border-white/10 rounded-sm p-4"><h3 className="text-xs font-black uppercase tracking-wider mb-3">Most liked posts</h3>{analytics.mostLikedPosts.length ? analytics.mostLikedPosts.map(post => <div key={post._id} className="py-2 border-b border-gray-100 dark:border-white/5"><div className="flex justify-between gap-3"><p className="text-xs font-black truncate">{post.title}</p><span className="text-xs font-black text-pink-500">{post.likeCount} likes</span></div><p className="text-[10px] text-gray-500">{post.author?.name || 'Unknown author'} · {new Date(post.createdAt).toLocaleDateString()}</p></div>) : <ChartEmpty />}</div><div className="border border-gray-200 dark:border-white/10 rounded-sm p-4"><h3 className="text-xs font-black uppercase tracking-wider mb-3">Top resources by upvotes</h3>{analytics.mostUpvotedResources.length ? analytics.mostUpvotedResources.map(resource => <div key={resource._id} className="py-2 border-b border-gray-100 dark:border-white/5"><div className="flex justify-between gap-3"><p className="text-xs font-black truncate">{resource.title}</p><span className="text-xs font-black text-cyan-500">{resource.upvoteCount} upvotes</span></div><p className="text-[10px] text-gray-500">{resource.subject} · {resource.branch}</p></div>) : <ChartEmpty />}</div></div>
          <div className="text-[10px] leading-relaxed text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-white/10 pt-3">{analytics.limitations?.join(' ')}</div>
        </>}
      </section>

      <section className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-md p-6 shadow-sm">
        <h2 className="text-xs font-black mb-5 flex items-center gap-2 uppercase tracking-wider text-gray-900 dark:text-gray-100">
          <Activity className="w-4 h-4 text-amber-500" /> Campus Activity
        </h2>
        <div className="space-y-4">
          {activityPosts.length > 0 ? visibleActivityPosts.map(post => (
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
        {activityPosts.length > activityPerPage && (
          <div className="flex items-center justify-between gap-3 mt-4">
            <button
              type="button"
              onClick={() => setActivityPage(page => Math.max(1, page - 1))}
              disabled={activityPage === 1}
              className="px-3 py-2 rounded-sm border border-gray-200 dark:border-white/10 text-xs font-black text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Page {activityPage} of {activityPageCount}</span>
            <button
              type="button"
              onClick={() => setActivityPage(page => Math.min(activityPageCount, page + 1))}
              disabled={activityPage === activityPageCount}
              className="px-3 py-2 rounded-sm border border-gray-200 dark:border-white/10 text-xs font-black text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminProfile;
