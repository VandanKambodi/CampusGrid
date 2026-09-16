import { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart3, ClipboardList, MessageSquareText, Pencil, Trash2, Archive, Send, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const branches = ['all', 'CSE', 'ECE', 'Mechanical', 'Civil'];
const emptyForm = {
  title: '',
  description: '',
  targetBranch: 'all',
  status: 'Published',
  options: ['Option 1', 'Option 2'],
  feedbackUrl: '',
  questions: [{ question: '', type: 'singleChoice', options: ['Option 1', 'Option 2'] }]
};

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const endpointFor = (type) => `${API_URL}/api/admin/${type === 'poll' ? 'polls' : type === 'survey' ? 'surveys' : 'feedback'}`;

function AdminContent() {
  const [type, setType] = useState('poll');
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [content, setContent] = useState({ polls: [], surveys: [], feedback: [] });
  const [results, setResults] = useState({ polls: {}, surveys: {} });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [contentPage, setContentPage] = useState(1);

  const loadContent = async () => {
    const [polls, surveys, feedback] = await Promise.all([
      axios.get(`${API_URL}/api/admin/polls`, { headers: headers() }),
      axios.get(`${API_URL}/api/admin/surveys`, { headers: headers() }),
      axios.get(`${API_URL}/api/admin/feedback`, { headers: headers() })
    ]);
    const pollResults = await Promise.all((polls.data || []).map(async (item) => [item._id, (await axios.get(`${API_URL}/api/polls/${item._id}/results`, { headers: headers() })).data]));
    const surveyResults = await Promise.all((surveys.data || []).map(async (item) => [item._id, (await axios.get(`${API_URL}/api/surveys/${item._id}/results`, { headers: headers() })).data]));
    setContent({ polls: polls.data || [], surveys: surveys.data || [], feedback: feedback.data || [] });
    setResults({ polls: Object.fromEntries(pollResults), surveys: Object.fromEntries(surveyResults) });
  };

  useEffect(() => { loadContent().catch(() => setMessage('Unable to load admin content.')); }, []);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const reset = () => { setForm({ ...emptyForm, options: [...emptyForm.options], questions: [{ ...emptyForm.questions[0], options: [...emptyForm.questions[0].options] }] }); setEditing(null); };

  const chooseType = (nextType) => { setType(nextType); reset(); };

  const editItem = (itemType, item) => {
    setType(itemType);
    setEditing({ type: itemType, id: item._id });
    setForm({
      title: item.title || '', description: item.description || '', targetBranch: item.targetBranch || 'all', status: item.status || 'Published',
      options: itemType === 'poll' ? (item.options || []).map((option) => option.text || option) : ['Option 1', 'Option 2'],
      feedbackUrl: item.feedbackUrl || '',
      questions: itemType === 'survey' ? (item.questions || []).map((question) => ({ question: question.question || '', type: question.type || 'singleChoice', options: question.options || [] })) : [...emptyForm.questions]
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (type === 'poll') payload.options = form.options.filter(Boolean).map((text) => ({ text }));
      if (type === 'survey') payload.questions = form.questions.map((question) => ({ ...question, options: question.type === 'textAnswer' ? [] : question.options.filter(Boolean) }));
      if (editing) await axios.put(`${endpointFor(type)}/${editing.id}`, payload, { headers: headers() });
      else await axios.post(endpointFor(type), payload, { headers: headers() });
      setMessage(`${type[0].toUpperCase()}${type.slice(1)} ${editing ? 'updated' : 'created'} successfully.`);
      reset();
      await loadContent();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to save this item.');
    } finally { setSaving(false); }
  };

  const action = async (itemType, id, operation) => {
    try {
      const url = `${endpointFor(itemType)}/${id}`;
      if (operation === 'delete') await axios.delete(url, { headers: headers() });
      else await axios.patch(`${url}/${operation}`, {}, { headers: headers() });
      setMessage(`${itemType[0].toUpperCase()}${itemType.slice(1)} ${operation}d successfully.`);
      await loadContent();
    } catch (error) { setMessage(error.response?.data?.message || `Unable to ${operation} this item.`); }
  };

  const addOption = () => update('options', [...form.options, '']);
  const addQuestion = () => update('questions', [...form.questions, { question: '', type: 'singleChoice', options: ['Option 1', 'Option 2'] }]);

  const allContent = [
    ...content.polls.map((item) => ({ item, type: 'poll' })),
    ...content.surveys.map((item) => ({ item, type: 'survey' })),
    ...content.feedback.map((item) => ({ item, type: 'feedback' }))
  ];
  const itemsPerPage = 5;
  const totalContentPages = Math.max(1, Math.ceil(allContent.length / itemsPerPage));
  const visibleContent = allContent.slice((contentPage - 1) * itemsPerPage, contentPage * itemsPerPage);

  useEffect(() => {
    setContentPage((page) => Math.min(page, totalContentPages));
  }, [totalContentPages]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-700 to-slate-900 p-6 text-white shadow-lg">
        <div className="flex items-center gap-3"><BarChart3 className="h-8 w-8 text-purple-200" /><div><h1 className="text-2xl font-black">Polls, Surveys & Feedback</h1><p className="text-xs text-purple-100">Create branch-targeted content and review live results.</p></div></div>
      </div>
      {message && <div className="flex justify-between rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-xs font-bold text-green-300"><span>{message}</span><button onClick={() => setMessage('')}><X className="h-4 w-4" /></button></div>}

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#111112]">
        <div className="mb-5 flex flex-wrap gap-2">{['poll', 'survey', 'feedback'].map((itemType) => <button key={itemType} type="button" onClick={() => chooseType(itemType)} className={`rounded-xl px-3 py-2 text-xs font-black uppercase ${type === itemType ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300'}`}>{itemType === 'feedback' ? 'Add Feedback' : `Create ${itemType}`}</button>)}{editing && <button type="button" onClick={reset} className="rounded-xl bg-gray-200 px-3 py-2 text-xs font-black dark:bg-white/10 dark:text-white">Cancel Edit</button>}</div>
        <form onSubmit={submit} className="space-y-4">
          <input required value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Title" className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" />
          <textarea value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Description" rows="3" className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" />
          <div><label className="mb-1 block text-xs font-bold text-gray-500">Target Branch</label><select value={form.targetBranch} onChange={(event) => update('targetBranch', event.target.value)} className="content-select w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-[#1c1c1f] dark:text-white">{branches.map((branch) => <option className="bg-white text-gray-900 dark:bg-[#1c1c1f] dark:text-white" key={branch} value={branch}>{branch === 'all' ? 'All Branches' : branch}</option>)}</select></div>
          {type === 'feedback' && <input required value={form.feedbackUrl} onChange={(event) => update('feedbackUrl', event.target.value)} placeholder="https://forms.google.com/..." className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" />}
          {type === 'poll' && <div className="space-y-2">{form.options.map((option, index) => <input key={index} required value={option} onChange={(event) => update('options', form.options.map((entry, optionIndex) => optionIndex === index ? event.target.value : entry))} placeholder={`Option ${index + 1}`} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" />)}<button type="button" onClick={addOption} className="text-xs font-black text-indigo-500">+ Add Option</button></div>}
          {type === 'survey' && <div className="space-y-3">{form.questions.map((question, index) => <div key={index} className="rounded-xl border border-gray-200 p-3 dark:border-white/10"><input required value={question.question} onChange={(event) => update('questions', form.questions.map((entry, questionIndex) => questionIndex === index ? { ...entry, question: event.target.value } : entry))} placeholder={`Question ${index + 1}`} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" /><select value={question.type} onChange={(event) => update('questions', form.questions.map((entry, questionIndex) => questionIndex === index ? { ...entry, type: event.target.value } : entry))} className="content-select mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-[#1c1c1f] dark:text-white"><option className="bg-white text-gray-900 dark:bg-[#1c1c1f] dark:text-white" value="singleChoice">Single Choice</option><option className="bg-white text-gray-900 dark:bg-[#1c1c1f] dark:text-white" value="multipleChoice">Multiple Choice</option><option className="bg-white text-gray-900 dark:bg-[#1c1c1f] dark:text-white" value="textAnswer">Text Answer</option></select>{question.type !== 'textAnswer' && <input value={(question.options || []).join(', ')} onChange={(event) => update('questions', form.questions.map((entry, questionIndex) => questionIndex === index ? { ...entry, options: event.target.value.split(',').map((option) => option.trim()) } : entry))} placeholder="Options separated by commas" className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" />}</div>)}<button type="button" onClick={addQuestion} className="text-xs font-black text-indigo-500">+ Add Question</button></div>}
          <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-black text-white disabled:opacity-60"><Send className="h-3.5 w-3.5" />{saving ? 'Saving...' : editing ? 'Update' : 'Publish'}</button>
        </form>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#111112]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-gray-900 dark:text-white">Content & Results</h2>
            <p className="mt-1 text-xs text-gray-500">Showing up to five items per page.</p>
          </div>
          <span className="text-xs font-bold text-gray-500">Page {contentPage} of {totalContentPages}</span>
        </div>
        {visibleContent.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-5 text-xs text-gray-500 dark:border-white/10">No content created yet.</p>
        ) : (
          <div className="space-y-3">
            {visibleContent.map(({ item, type: itemType }) => (
              <ContentCard key={`${itemType}-${item._id}`} item={item} type={itemType} results={itemType === 'poll' ? results.polls : itemType === 'survey' ? results.surveys : {}} onEdit={editItem} onAction={action} />
            ))}
          </div>
        )}
        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-white/10">
          <button type="button" onClick={() => setContentPage((page) => Math.max(1, page - 1))} disabled={contentPage === 1} className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-black text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white/5 dark:text-gray-200">Previous</button>
          <span className="text-xs font-bold text-gray-500">{allContent.length} total items</span>
          <button type="button" onClick={() => setContentPage((page) => Math.min(totalContentPages, page + 1))} disabled={contentPage === totalContentPages} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40">Next</button>
        </div>
      </section>
    </div>
  );
}

function ContentCard({ item, type, results, onEdit, onAction }) {
  const icon = type === 'poll' ? <BarChart3 className="h-4 w-4" /> : type === 'survey' ? <ClipboardList className="h-4 w-4" /> : <MessageSquareText className="h-4 w-4" />;
  const label = type === 'feedback' ? 'Feedback' : type[0].toUpperCase() + type.slice(1);

  return (
    <article className="rounded-xl border border-gray-200 p-4 dark:border-white/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-indigo-500">{icon}{label}</div>
          <h3 className="mt-1 font-black text-gray-900 dark:text-white">{item.title}</h3>
          <div className="mt-1 text-[11px] text-gray-500">{item.targetBranch === 'all' ? 'All Branches' : item.targetBranch} · {item.status}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onEdit(type, item)} className="inline-flex items-center gap-1 text-xs font-bold text-indigo-500"><Pencil className="h-3.5 w-3.5" /> Edit</button>
          <button type="button" onClick={() => onAction(type, item._id, 'delete')} className="inline-flex items-center gap-1 text-xs font-bold text-red-500"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
          {item.status === 'Published' ? <button type="button" onClick={() => onAction(type, item._id, 'archive')} className="inline-flex items-center gap-1 text-xs font-bold text-amber-500"><Archive className="h-3.5 w-3.5" /> Archive</button> : <button type="button" onClick={() => onAction(type, item._id, 'publish')} className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500"><Send className="h-3.5 w-3.5" /> Publish</button>}
        </div>
      </div>
      {type === 'poll' && <div className="mt-3 rounded-lg bg-indigo-500/10 p-3 text-xs text-gray-600 dark:text-gray-300"><div className="font-bold">Total votes: {results[item._id]?.totalVotes || 0}</div>{(results[item._id]?.options || []).map((option) => <div key={option.text} className="mt-2"><div className="flex justify-between"><span>{option.text}</span><span>{option.percentage || 0}%</span></div><div className="mt-1 h-2 rounded-full bg-gray-200 dark:bg-white/10"><div className="h-2 rounded-full bg-indigo-500" style={{ width: `${option.percentage || 0}%` }} /></div></div>)}</div>}
      {type === 'survey' && <div className="mt-3 rounded-lg bg-violet-500/10 p-3 text-xs text-gray-600 dark:text-gray-300"><div className="font-bold">Submissions: {results[item._id]?.totalSubmissions || 0}</div>{(results[item._id]?.questions || []).map((question) => <div key={question.questionIndex} className="mt-3"><div className="font-bold">{question.question}</div>{question.type === 'textAnswer' ? <div className="mt-1">{(question.responses || []).slice(0, 3).join(' · ') || 'No text responses'}</div> : question.options?.map((option) => <div key={option.text} className="mt-2"><div className="flex justify-between"><span>{option.text}</span><span>{option.percentage || 0}%</span></div><div className="mt-1 h-2 rounded-full bg-gray-200 dark:bg-white/10"><div className="h-2 rounded-full bg-violet-500" style={{ width: `${option.percentage || 0}%` }} /></div></div>)}</div>)}</div>}
      {type === 'feedback' && <div className="mt-3 rounded-lg bg-emerald-500/10 p-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Targeted feedback form: {item.targetBranch === 'all' ? 'All Branches' : item.targetBranch}</div>}
    </article>
  );
}

export default AdminContent;
