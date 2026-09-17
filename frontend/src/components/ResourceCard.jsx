import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ThumbsUp, ExternalLink, Pencil, Trash2, X, Sparkles } from 'lucide-react';

function ResourceCard({ resource, currentUserId, onUpvote, isAdmin, onEdit, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ title: resource.title, subject: resource.subject, semester: resource.semester, branch: resource.branch });
  const [isSaving, setIsSaving] = useState(false);
  
  const uploadedById = typeof resource.uploadedBy === 'object' ? resource.uploadedBy?._id : resource.uploadedBy;
  const isOwner = uploadedById && String(uploadedById) === String(currentUserId);
  const canManage = isAdmin || isOwner;

  const hasUpvoted = resource.upvotes?.includes(currentUserId);
  const updateField = (field, value) => setForm(currentForm => ({ ...currentForm, [field]: value }));
  const saveChanges = async () => {
    setIsSaving(true);
    try { await onEdit(resource._id, form); setIsEditing(false); } catch (error) { alert(error.response?.data?.message || 'Unable to edit this resource'); } finally { setIsSaving(false); }
  };

  const downloadUrl = `${import.meta.env.VITE_API_URL}/api/hub/resources/download/${resource._id}`;

  return (
    <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-md p-5 shadow-sm hover:border-gray-300 dark:hover:border-white/20 transition-all flex flex-col justify-between h-full group">
      <div>
        <div className="flex justify-between items-start gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-md flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              {isEditing ? <div className="space-y-1"><input value={form.title} onChange={event => updateField('title', event.target.value)} className="w-full border border-gray-200 dark:border-white/10 rounded-sm px-2 py-1 text-sm font-bold bg-transparent text-gray-900 dark:text-white" /><input value={form.subject} onChange={event => updateField('subject', event.target.value)} className="w-full border border-gray-200 dark:border-white/10 rounded-sm px-2 py-1 text-xs bg-transparent text-gray-700 dark:text-gray-300" /></div> : <><h4 className="font-black text-sm md:text-base leading-tight text-gray-900 dark:text-white line-clamp-1 group-hover:text-indigo-500 transition-colors">{resource.title}</h4><p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mt-0.5">{resource.subject}</p></>}
            </div>
          </div>
          {isEditing ? <div className="flex gap-1"><select value={form.semester} onChange={event => updateField('semester', event.target.value)} className="text-[10px] border rounded-sm bg-white dark:bg-[#111] dark:text-white"><option value="1">Sem 1</option><option value="2">Sem 2</option><option value="3">Sem 3</option><option value="4">Sem 4</option><option value="5">Sem 5</option><option value="6">Sem 6</option><option value="7">Sem 7</option><option value="8">Sem 8</option></select><select value={form.branch} onChange={event => updateField('branch', event.target.value)} className="text-[10px] border rounded-sm bg-white dark:bg-[#111] dark:text-white"><option value="CSE">CSE</option><option value="ECE">ECE</option><option value="ME">ME</option><option value="CE">CE</option></select></div> : <span className="text-[10px] font-extrabold px-2.5 py-1 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-sm text-gray-700 dark:text-gray-300 whitespace-nowrap shrink-0 uppercase tracking-wider">Sem {resource.semester} • {resource.branch}</span>}
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-white/5 flex-wrap gap-2">
        {canManage && isEditing && <div className="flex gap-1"><button onClick={() => setIsEditing(false)} title="Cancel" className="p-1.5 text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button><button onClick={saveChanges} disabled={isSaving} className="px-2 py-1 bg-indigo-600 text-white text-xs rounded-sm">{isSaving ? 'Saving' : 'Save'}</button></div>}
        {canManage && !isEditing && <div className="flex gap-1"><button onClick={() => setIsEditing(true)} title="Edit resource" className="p-1.5 text-gray-400 hover:text-indigo-500"><Pencil className="w-4 h-4" /></button><button onClick={() => onDelete(resource._id)} title="Delete resource" className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></div>}
        
        <button 
          onClick={() => onUpvote(resource._id)} 
          className={`flex items-center gap-1.5 text-xs font-extrabold transition-colors px-3 py-1.5 rounded-sm border ${
            hasUpvoted 
              ? 'bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20' 
              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-white/5 dark:text-gray-400 dark:border-white/5 dark:hover:bg-white/10'
          }`}
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? 'fill-current' : ''}`} /> 
          <span>{resource.upvotes?.length || 0}</span>
        </button>

        <div className="flex items-center gap-2">
          <Link
            to={`/hub/vault/chat/${resource._id}`}
            className="flex items-center gap-1.5 text-xs font-black bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white px-3 py-1.5 rounded-sm transition-all shadow-sm hover:-translate-y-0.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask AI</span>
          </Link>

          <a 
            href={downloadUrl} 
            target="_blank" 
            rel="noreferrer" 
            className="flex items-center gap-1.5 text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-sm transition-all shadow-sm hover:-translate-y-0.5"
          >
            <span>Read</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default ResourceCard;