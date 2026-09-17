import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, Users, UsersRound } from 'lucide-react';
import axios from 'axios';
import Loader from '../components/Loader';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const categories = ['All Categories', 'Technology', 'Design', 'Robotics', 'Photography', 'Sports', 'Music', 'Entrepreneurship', 'Cultural', 'Academic', 'Other'];

function Communities() {
  const [communities, setCommunities] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const loadCommunities = async () => {
    setLoading(true);
    try {
      const params = { search };
      if (category !== 'All Categories') params.category = category;
      const { data } = await axios.get(`${API_URL}/api/communities`, { params, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setCommunities(data.communities || []); setError('');
    } catch { setError('Unable to load communities.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { const timer = setTimeout(loadCommunities, 250); return () => clearTimeout(timer); }, [search, category]);

  const toggleMembership = async (community) => {
    setBusyId(community._id);
    try {
      const url = `${API_URL}/api/communities/${community._id}`;
      const { data } = community.membership ? await axios.delete(`${url}/leave`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }) : await axios.post(`${url}/join`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setCommunities(current => current.map(item => item._id === community._id ? { ...item, memberCount: data.memberCount, membership: community.membership ? null : data.membership } : item));
    } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to update membership.'); }
    finally { setBusyId(null); }
  };

  return <div className="mx-auto max-w-6xl space-y-6">
    <header className="rounded-2xl bg-gradient-to-r from-indigo-700 via-violet-700 to-slate-900 p-6 text-white shadow-lg sm:p-8">
      <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">CampusGrid / Student Life</p><h1 className="mt-2 text-3xl font-black">Campus Communities</h1><p className="mt-2 max-w-xl text-sm text-indigo-100">Find your people, build something together, and stay close to the clubs shaping campus.</p></div><UsersRound className="hidden h-12 w-12 text-cyan-200 sm:block" /></div>
    </header>
    <div className="flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search communities..." className="w-full rounded-md border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-[#111] dark:text-white" /></label><select value={category} onChange={event => setCategory(event.target.value)} className="rounded-md border border-gray-200 bg-white px-4 py-3 text-sm font-bold outline-none dark:border-white/10 dark:bg-[#111] dark:text-white">{categories.map(item => <option key={item}>{item}</option>)}</select></div>
    {error && <div className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"><span>{error}</span><button onClick={loadCommunities} className="underline">Retry</button></div>}
    {loading ? <Loader text="Discovering campus communities..." /> : communities.length === 0 ? <div className="rounded-md border border-dashed border-gray-300 py-16 text-center text-sm font-bold text-gray-500 dark:border-white/10">No communities found.</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{communities.map(community => <article key={community._id} className="flex flex-col rounded-md border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 dark:border-white/10 dark:bg-[#111]"><div className="flex items-start justify-between gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-md bg-indigo-50 text-2xl dark:bg-indigo-500/10">{community.icon}</div><span className="rounded-sm bg-gray-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-gray-500 dark:bg-white/5">{community.category}</span></div><h2 className="mt-5 text-lg font-black text-gray-900 dark:text-white">{community.name}</h2><p className="mt-2 line-clamp-3 min-h-[60px] text-sm leading-relaxed text-gray-500 dark:text-gray-400">{community.description}</p><div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-gray-500"><Users className="h-4 w-4" /> {community.memberCount} members</div><div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-4 dark:border-white/5"><button disabled={busyId === community._id} onClick={() => toggleMembership(community)} className={`flex-1 rounded-sm px-3 py-2.5 text-xs font-black transition ${community.membership ? 'border border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300' : 'bg-indigo-600 text-white hover:bg-indigo-700'} disabled:opacity-60`}>{busyId === community._id ? 'Updating...' : community.membership ? 'Joined' : 'Join Club'}</button><Link to={`/hub/communities/${community._id}`} className="rounded-sm border border-gray-200 p-2.5 text-gray-500 hover:border-indigo-400 hover:text-indigo-500 dark:border-white/10" title="Open community"><ArrowRight className="h-4 w-4" /></Link></div></article>)}</div>}
  </div>;
}

export default Communities;