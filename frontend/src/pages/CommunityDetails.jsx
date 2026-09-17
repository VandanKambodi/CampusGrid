import { createElement, useEffect, useRef, useState } from 'react';
import { ArrowLeft, CalendarDays, FileText, Megaphone, MessageSquare, Upload, Users, UserRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import Loader from '../components/Loader';
import PostCard from '../components/PostCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const tabs = [['discussions', MessageSquare], ['announcements', Megaphone], ['members', Users], ['events', CalendarDays], ['resources', FileText]];

function CommunityDetails() {
  const { communityId } = useParams();
  const [community, setCommunity] = useState(null);
  const [tab, setTab] = useState('discussions');
  const [memberSearch, setMemberSearch] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', eventType: 'Club Event', date: '', startTime: '10:00', endTime: '11:00', location: '', description: '' });
  const [resourceForm, setResourceForm] = useState({ title: '', subject: '' });
  const [resourceFile, setResourceFile] = useState(null);
  const resourceInput = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const isManager = ['owner', 'admin'].includes(community?.membership?.role);

  const loadTab = async (nextTab, search = '') => {
    setLoading(true);
    try {
      const path = nextTab === 'discussions' ? 'posts' : nextTab;
      const { data: result } = await axios.get(`${API_URL}/api/communities/${communityId}/${path}`, { ...auth(), params: nextTab === 'members' && search ? { search } : {} });
      setData(result.members || result);
      setError('');
    } catch { setError(`Unable to load ${nextTab}.`); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    axios.get(`${API_URL}/api/communities/${communityId}`, auth()).then(({ data: result }) => setCommunity(result)).catch(() => setError('Community not found.'));
  }, [communityId]);

  useEffect(() => { if (community && (community.membership || currentUser.role === 'admin' || currentUser.isAdmin)) { const timer = setTimeout(() => loadTab(tab, memberSearch), 250); return () => clearTimeout(timer); } }, [community, tab, memberSearch]);

  const postDiscussion = async event => {
    event.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setPosting(true);
    try {
      const type = tab === 'announcements' ? 'announcement' : 'blog';
      await axios.post(`${API_URL}/api/communities/${communityId}/${type === 'announcement' ? 'announcements' : 'posts'}`, { title, content, type }, auth());
      setTitle(''); setContent(''); await loadTab(tab);
    } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to publish community content.'); }
    finally { setPosting(false); }
  };

  const createEvent = async event => {
    event.preventDefault(); setSavingItem(true);
    try { await axios.post(`${API_URL}/api/communities/${communityId}/events`, eventForm, auth()); setEventForm({ title: '', eventType: 'Club Event', date: '', startTime: '10:00', endTime: '11:00', location: '', description: '' }); await loadTab('events'); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Unable to create event.'); }
    finally { setSavingItem(false); }
  };

  const createResource = async event => {
    event.preventDefault();
    if (!resourceFile) { setError('Choose a file before uploading.'); return; }
    setSavingItem(true);
    try {
      const formData = new FormData();
      Object.entries(resourceForm).forEach(([key, value]) => formData.append(key, value));
      formData.append('file', resourceFile);
      await axios.post(`${API_URL}/api/communities/${communityId}/resources`, formData, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'multipart/form-data' } });
      setResourceForm({ title: '', subject: '' }); setResourceFile(null); if (resourceInput.current) resourceInput.current.value = ''; await loadTab('resources');
    } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to upload resource.'); }
    finally { setSavingItem(false); }
  };

  const likePost = async id => { await axios.put(`${API_URL}/api/posts/${id}/like`, {}, auth()); loadTab(tab); };
  const commentPost = async (id, text) => { await axios.post(`${API_URL}/api/posts/${id}/comment`, { text }, auth()); loadTab(tab); };
  const deleteEvent = async id => { if (!window.confirm('Delete this community event?')) return; try { await axios.delete(`${API_URL}/api/communities/${communityId}/events/${id}`, auth()); await loadTab('events'); } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to delete event.'); } };
  const deleteResource = async id => { if (!window.confirm('Delete this community resource?')) return; try { await axios.delete(`${API_URL}/api/communities/${communityId}/resources/${id}`, auth()); await loadTab('resources'); } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to delete resource.'); } };
  const editPost = async (id, postData) => { await axios.put(`${API_URL}/api/posts/${id}`, postData, auth()); await loadTab(tab); };
  const deletePost = async id => { if (!window.confirm('Delete this discussion?')) return; await axios.delete(`${API_URL}/api/posts/${id}`, auth()); await loadTab(tab); };

  if (error && !community) return <div className="rounded-md border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-600">{error}</div>;
  if (!community) return <Loader text="Loading community..." />;
  if (!community.membership && currentUser.role !== 'admin' && !currentUser.isAdmin) return <div className="mx-auto max-w-3xl space-y-5"><Link to="/hub/communities" className="inline-flex items-center gap-2 text-xs font-black text-indigo-500"><ArrowLeft className="h-4 w-4" /> All communities</Link><section className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#111]"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-md bg-indigo-50 text-4xl dark:bg-indigo-500/10">{community.icon}</div><h1 className="mt-5 text-2xl font-black text-gray-900 dark:text-white">{community.name}</h1><p className="mx-auto mt-2 max-w-lg text-sm text-gray-500 dark:text-gray-400">Join this community to view discussions, announcements, members, events, and resources.</p><Link to="/hub/communities" className="mt-6 inline-flex rounded-sm bg-indigo-600 px-5 py-2.5 text-xs font-black text-white">Join from Communities</Link></section></div>;

  return <div className="mx-auto max-w-6xl space-y-5">
    <Link to="/hub/communities" className="inline-flex items-center gap-2 text-xs font-black text-indigo-500"><ArrowLeft className="h-4 w-4" /> All communities</Link>
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#111]"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="flex h-16 w-16 items-center justify-center rounded-md bg-indigo-50 text-4xl dark:bg-indigo-500/10">{community.icon}</div><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-black text-gray-900 dark:text-white">{community.name}</h1><span className="rounded-sm bg-indigo-50 px-2 py-1 text-[10px] font-black uppercase text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">{community.category}</span></div><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{community.description}</p><div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-gray-500"><Users className="h-4 w-4" /> {community.memberCount} members</div></div></div></section>
    <nav className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-white/10">{tabs.map(([name, TabIcon]) => <button key={name} onClick={() => setTab(name)} className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-xs font-black capitalize ${tab === name ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-gray-500'}`}>{createElement(TabIcon, { className: 'h-4 w-4' })} {name}</button>)}</nav>
    {error && community && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-600">{error}</div>}
    {tab === 'events' && isManager && <EventForm form={eventForm} setForm={setEventForm} onSubmit={createEvent} saving={savingItem} />}
    {tab === 'resources' && isManager && <ResourceForm form={resourceForm} setForm={setResourceForm} setFile={setResourceFile} inputRef={resourceInput} onSubmit={createResource} saving={savingItem} />}
    {(tab === 'discussions' || (tab === 'announcements' && isManager)) && <form onSubmit={postDiscussion} className="rounded-md border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-[#111]"><input value={title} onChange={event => setTitle(event.target.value)} placeholder={tab === 'announcements' ? 'Announcement title' : 'Discussion title'} className="w-full bg-transparent text-sm font-black outline-none dark:text-white" /><textarea value={content} onChange={event => setContent(event.target.value)} placeholder="Share something with the community..." rows="3" className="mt-3 w-full resize-none bg-transparent text-sm outline-none dark:text-gray-300" /><button disabled={posting} className="mt-3 rounded-sm bg-indigo-600 px-4 py-2 text-xs font-black text-white disabled:opacity-60">{posting ? 'Publishing...' : tab === 'announcements' ? 'Publish announcement' : 'Start discussion'}</button></form>}
    {tab === 'members' && <input value={memberSearch} onChange={event => setMemberSearch(event.target.value)} placeholder="Search members by name or roll number" className="field w-full" />}
    {loading ? <Loader text={`Loading ${tab}...`} /> : <TabContent tab={tab} data={data} currentUser={currentUser} isSystemAdmin={currentUser.role === 'admin' || currentUser.isAdmin} onLike={likePost} onComment={commentPost} onEdit={editPost} onDelete={deletePost} onDeleteEvent={deleteEvent} onDeleteResource={deleteResource} />}
  </div>;
}

function EventForm({ form, setForm, onSubmit, saving }) {
  const update = (field, value) => setForm(current => ({ ...current, [field]: value }));
  return <form onSubmit={onSubmit} className="grid gap-3 rounded-md border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-[#111]"><h2 className="text-sm font-black dark:text-white">Create community event</h2><input required value={form.title} onChange={event => update('title', event.target.value)} placeholder="Event title" className="field" /><div className="grid gap-3 sm:grid-cols-2"><select value={form.eventType} onChange={event => update('eventType', event.target.value)} className="field"><option>Club Event</option><option>Workshop</option><option>Hackathon</option><option>Seminar</option><option>Other</option></select><input required type="date" value={form.date} onChange={event => update('date', event.target.value)} className="field" /></div><div className="grid gap-3 sm:grid-cols-3"><input required type="time" value={form.startTime} onChange={event => update('startTime', event.target.value)} className="field" /><input required type="time" value={form.endTime} onChange={event => update('endTime', event.target.value)} className="field" /><input value={form.location} onChange={event => update('location', event.target.value)} placeholder="Location" className="field" /></div><textarea value={form.description} onChange={event => update('description', event.target.value)} placeholder="Description" rows="2" className="field" /><button disabled={saving} className="w-fit rounded-sm bg-indigo-600 px-4 py-2 text-xs font-black text-white disabled:opacity-60">{saving ? 'Creating...' : 'Create event'}</button></form>;
}

function ResourceForm({ form, setForm, setFile, inputRef, onSubmit, saving }) {
  const update = (field, value) => setForm(current => ({ ...current, [field]: value }));
  return <form onSubmit={onSubmit} className="grid gap-3 rounded-md border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-[#111]"><h2 className="text-sm font-black dark:text-white">Share community resource</h2><div className="grid gap-3 sm:grid-cols-2"><input required value={form.title} onChange={event => update('title', event.target.value)} placeholder="Resource title" className="field" /><input required value={form.subject} onChange={event => update('subject', event.target.value)} placeholder="Subject" className="field" /></div><input required ref={inputRef} type="file" onChange={event => setFile(event.target.files?.[0] || null)} className="field px-2 py-1.5 text-xs" /><button disabled={saving} className="flex w-fit items-center gap-2 rounded-sm bg-indigo-600 px-4 py-2 text-xs font-black text-white disabled:opacity-60"><Upload className="h-4 w-4" />{saving ? 'Uploading...' : 'Upload resource'}</button></form>;
}

function TabContent({ tab, data, currentUser, isSystemAdmin, onLike, onComment, onEdit, onDelete, onDeleteEvent, onDeleteResource }) {
  if (tab === 'discussions' || tab === 'announcements') return <div className="space-y-4">{data.length ? data.map(post => <PostCard key={post._id} post={post} currentUserId={currentUser._id} currentUser={currentUser} onLike={onLike} onComment={onComment} onEdit={onEdit} onDelete={onDelete} />) : <Empty text={tab === 'announcements' ? 'No announcements yet.' : 'No discussions yet.'} />}</div>;
  if (tab === 'members') return <div className="grid gap-3 sm:grid-cols-2">{data.length ? data.map(member => <div key={member._id} className="flex items-center gap-3 rounded-md border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-[#111]"><img src={member.user?.profilePicture} alt="" className="h-10 w-10 rounded-full object-cover" /><div><p className="text-sm font-black dark:text-white">{member.user?.name}</p><p className="text-xs text-gray-500">{member.user?.branch || 'Student'} · {member.role}</p></div><UserRound className="ml-auto h-4 w-4 text-gray-400" /></div>) : <Empty text="No members found." />}</div>;
  return <div className="grid gap-3 sm:grid-cols-2">{data.length ? data.map(item => <article key={item._id} className="rounded-md border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-[#111]"><div className="flex items-start justify-between gap-3"><h3 className="font-black dark:text-white">{item.title}</h3><div className="flex items-center gap-2">{tab === 'events' ? <CalendarDays className="h-4 w-4 text-indigo-500" /> : <FileText className="h-4 w-4 text-cyan-500" />}{isSystemAdmin && <button type="button" onClick={() => tab === 'events' ? onDeleteEvent(item._id) : onDeleteResource(item._id)} className="text-xs font-black text-red-500">Delete</button>}</div></div>{tab === 'events' ? <><p className="mt-2 text-xs font-bold text-indigo-500">{item.eventType}</p><p className="mt-1 text-xs text-gray-500">{item.date} · {item.startTime} - {item.endTime}</p><p className="mt-1 text-xs text-gray-500">{item.location || 'Campus'}</p></> : <><p className="mt-2 text-xs text-gray-500">{item.subject}</p><a href={item.fileUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-black text-indigo-500">Open resource</a></>}</article>) : <Empty text={tab === 'events' ? 'No upcoming events.' : 'No resources shared yet.'} />}</div>;
}

const Empty = ({ text }) => <div className="col-span-full rounded-md border border-dashed border-gray-300 py-12 text-center text-sm font-bold text-gray-500 dark:border-white/10">{text}</div>;
export default CommunityDetails;
