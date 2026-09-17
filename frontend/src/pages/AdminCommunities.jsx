import { useEffect, useState } from 'react';
import { Archive, Search, ShieldCheck, UserMinus, UserRound, UsersRound, Plus } from 'lucide-react';
import axios from 'axios';
import Loader from '../components/Loader';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const categories = ['Technology', 'Design', 'Robotics', 'Photography', 'Sports', 'Music', 'Entrepreneurship', 'Cultural', 'Academic', 'Other'];

function AdminCommunities() {
  const [communities, setCommunities] = useState([]);
  const [selected, setSelected] = useState(null);
  const [members, setMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ name: '', description: '', category: 'Technology', icon: '🏫' });

  const load = async () => {
    try { const { data } = await axios.get(`${API_URL}/api/communities?limit=50`, auth()); setCommunities(data.communities || []); }
    catch { setMessage('Unable to load communities.'); }
    finally { setLoading(false); }
  };

  const loadMembers = async (communityId, search = '') => {
    setMembersLoading(true);
    try { const { data } = await axios.get(`${API_URL}/api/communities/${communityId}/members`, { ...auth(), params: { search } }); setMembers(data.members || []); }
    catch (error) { setMessage(error.response?.data?.message || 'Unable to load members.'); }
    finally { setMembersLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (!selected) return; const timer = setTimeout(() => loadMembers(selected._id, memberSearch), 250); return () => clearTimeout(timer); }, [selected, memberSearch]);

  const submit = async event => {
    event.preventDefault(); setSaving(true); setMessage('');
    try { await axios.post(`${API_URL}/api/communities/admin`, form, auth()); setForm({ name: '', description: '', category: 'Technology', icon: '🏫' }); setMessage('Community created successfully.'); await load(); }
    catch (error) { setMessage(error.response?.data?.message || 'Unable to create community.'); }
    finally { setSaving(false); }
  };

  const archive = async id => {
    if (!window.confirm('Archive this community?')) return;
    try { await axios.put(`${API_URL}/api/communities/admin/${id}`, { status: 'archived' }, auth()); setMessage('Community archived.'); await load(); }
    catch (error) { setMessage(error.response?.data?.message || 'Unable to archive community.'); }
  };

  const updateMember = async (userId, role) => {
    try { await axios.patch(`${API_URL}/api/communities/${selected._id}/members/${userId}`, { role }, auth()); setMessage(role === 'admin' ? 'Community admin assigned.' : 'Community admin removed.'); await loadMembers(selected._id, memberSearch); }
    catch (error) { setMessage(error.response?.data?.message || 'Unable to update member role.'); }
  };

  const removeMember = async userId => {
    if (!window.confirm('Remove this member from the community?')) return;
    try { await axios.delete(`${API_URL}/api/communities/${selected._id}/members/${userId}`, auth()); setMessage('Member removed.'); await loadMembers(selected._id, memberSearch); }
    catch (error) { setMessage(error.response?.data?.message || 'Unable to remove member.'); }
  };

  const communityAdmins = members.filter(member => ['owner', 'admin'].includes(member.role));
  const regularMembers = members.filter(member => !['owner', 'admin'].includes(member.role));

  return <div className="mx-auto max-w-6xl space-y-6">
    <div className="rounded-2xl bg-linear-to-r from-purple-700 via-indigo-700 to-slate-900 p-6 text-white shadow-lg"><h1 className="flex items-center gap-3 text-2xl font-black"><UsersRound className="h-7 w-7 text-purple-200" /> Community Management</h1><p className="mt-1 text-xs text-purple-100">Create communities and assign community-scoped administrators.</p></div>
    {message && <div className="rounded-md border border-indigo-200 bg-indigo-50 p-3 text-xs font-bold text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-200">{message}</div>}
    <form onSubmit={submit} className="space-y-4 rounded-md border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#111]"><h2 className="flex items-center gap-2 text-sm font-black dark:text-white"><Plus className="h-4 w-4 text-indigo-500" /> Create community</h2><div className="grid gap-3 md:grid-cols-2"><input required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Community name" className="field" /><select value={form.category} onChange={event => setForm({ ...form, category: event.target.value })} className="field dark:bg-[#1c1c1f] dark:text-white">{categories.map(category => <option key={category} className="bg-white text-gray-900 dark:bg-[#1c1c1f] dark:text-white">{category}</option>)}</select></div><div className="flex gap-3"><input value={form.icon} onChange={event => setForm({ ...form, icon: event.target.value })} aria-label="Community icon" className="w-20 field text-center text-xl" /><textarea required value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="What is this community about?" rows="3" className="field flex-1" /></div><button disabled={saving} className="rounded-sm bg-indigo-600 px-4 py-2 text-xs font-black text-white disabled:opacity-60">{saving ? 'Creating...' : 'Create Community'}</button></form>
    <section className="rounded-md border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#111]"><div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-black dark:text-white">Active communities</h2><span className="text-xs font-bold text-gray-500">{communities.length} total</span></div>{loading ? <Loader text="Loading communities..." /> : <div className="space-y-3">{communities.map(community => <div key={community._id} className={`flex flex-wrap items-center gap-3 rounded-sm border p-3 ${selected?._id === community._id ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10' : 'border-gray-100 dark:border-white/5'}`}><span className="text-2xl">{community.icon}</span><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-black dark:text-white">{community.name}</h3><p className="text-xs text-gray-500">{community.category} · {community.memberCount} members</p></div><button onClick={() => { setSelected(community); setMemberSearch(''); }} className="rounded-sm bg-indigo-600 px-3 py-2 text-xs font-black text-white">Manage members</button><button onClick={() => archive(community._id)} className="flex items-center gap-1.5 text-xs font-black text-red-500"><Archive className="h-4 w-4" /> Archive</button></div>)}</div>}</section>
    {selected && <section className="rounded-md border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#111]"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black dark:text-white">{selected.name} members</h2><p className="text-xs text-gray-500">Community roles apply only inside this community.</p></div><button onClick={() => setSelected(null)} className="text-xs font-bold text-gray-500">Close</button></div><label className="relative mt-4 block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={memberSearch} onChange={event => setMemberSearch(event.target.value)} placeholder="Search members by name or roll number" className="field w-full pl-10" /></label>{membersLoading ? <Loader text="Loading members..." /> : <div className="mt-5 space-y-5"><MemberGroup title="Community admins" icon={<ShieldCheck className="h-4 w-4" />} members={communityAdmins} onRole={updateMember} onRemove={removeMember} /><MemberGroup title="Members" icon={<UserRound className="h-4 w-4" />} members={regularMembers} onRole={updateMember} onRemove={removeMember} /></div>}</section>}
  </div>;
}

function MemberGroup({ title, icon, members, onRole, onRemove }) {
  return <div><h3 className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-500">{icon}{title} <span className="text-gray-400">({members.length})</span></h3>{members.length ? <div className="space-y-2">{members.map(member => <div key={member._id} className="flex flex-wrap items-center gap-3 rounded-sm border border-gray-100 p-3 dark:border-white/5"><img src={member.user?.profilePicture} alt="" className="h-9 w-9 rounded-full object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-black dark:text-white">{member.user?.name}</p><p className="text-xs text-gray-500">{member.user?.rollNo} · {member.role}</p></div>{member.role !== 'owner' && <>{member.role === 'admin' ? <button onClick={() => onRole(member.user._id, 'member')} className="text-xs font-black text-amber-500">Remove admin</button> : <button onClick={() => onRole(member.user._id, 'admin')} className="text-xs font-black text-indigo-500">Make admin</button>}<button onClick={() => onRemove(member.user._id)} title="Remove member" className="p-1 text-red-500"><UserMinus className="h-4 w-4" /></button></>}</div>)}</div> : <p className="rounded-sm border border-dashed border-gray-200 p-4 text-xs text-gray-500 dark:border-white/10">No members found.</p>}</div>;
}

export default AdminCommunities;
