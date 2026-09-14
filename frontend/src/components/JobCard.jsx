import { useState } from 'react';
import { Building, ExternalLink, Pencil, ShieldCheck, Trash2, X } from 'lucide-react';

function JobCard({ job, isAdmin, onEdit, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ title: job.title, company: job.company, description: job.description, applyLink: job.applyLink, roleType: job.roleType });
  const [isSaving, setIsSaving] = useState(false);
  const updateField = (field, value) => setForm(currentForm => ({ ...currentForm, [field]: value }));
  const saveChanges = async () => {
    setIsSaving(true);
    try { await onEdit(job._id, form); setIsEditing(false); } catch (error) { alert(error.response?.data?.message || 'Unable to edit this opportunity'); } finally { setIsSaving(false); }
  };
  const getBadgeStyle = (type) => {
    switch (type) {
      case 'Internship': return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
      case 'Hackathon': return 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20';
      default: return 'bg-green-50 text-green-600 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20';
    }
  };

  return (
    <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-md p-5 shadow-sm hover:border-gray-300 dark:hover:border-white/20 transition-all flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start gap-4 mb-2">
          <div>
            {isEditing ? <input value={form.title} onChange={event => updateField('title', event.target.value)} className="w-full border border-gray-200 dark:border-white/10 rounded-sm px-2 py-1 text-lg font-black bg-transparent text-gray-900 dark:text-white" /> : <h3 className="text-lg font-black text-gray-900 dark:text-white leading-snug">{job.title}</h3>}
            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 font-bold mt-1">
              <Building className="w-4 h-4 text-emerald-500 shrink-0" /> 
              {isEditing ? <input value={form.company} onChange={event => updateField('company', event.target.value)} className="border border-gray-200 dark:border-white/10 rounded-sm px-2 py-1 text-sm bg-transparent text-gray-700 dark:text-gray-300" /> : <span>{job.company}</span>}
            </div>
          </div>
          {isEditing ? <select value={form.roleType} onChange={event => updateField('roleType', event.target.value)} className="text-[10px] border rounded-sm bg-white dark:bg-[#111] dark:text-white"><option value="Internship">Internship</option><option value="Full-Time">Full-Time</option><option value="Hackathon">Hackathon</option></select> : <span className={`text-[10px] font-extrabold px-3 py-1 rounded-sm uppercase tracking-wider border shrink-0 ${getBadgeStyle(job.roleType)}`}>{job.roleType}</span>}
        </div>
        {isEditing ? <><textarea value={form.description} onChange={event => updateField('description', event.target.value)} rows="3" className="w-full mt-3.5 border border-gray-200 dark:border-white/10 rounded-sm px-2 py-1 text-sm bg-transparent text-gray-700 dark:text-gray-300" /><input value={form.applyLink} onChange={event => updateField('applyLink', event.target.value)} className="w-full mt-2 border border-gray-200 dark:border-white/10 rounded-sm px-2 py-1 text-xs bg-transparent text-gray-700 dark:text-gray-300" /></> : <p className="text-sm text-gray-700 dark:text-gray-300 mt-3.5 whitespace-pre-wrap leading-relaxed">{job.description}</p>}
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/5 pt-4 mt-5">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <img 
            src={job.postedBy?.profilePicture || "https://img.freepik.com/premium-vector/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-vector-illustration_561158-3485.jpg"} 
            alt="poster" 
            className="w-6 h-6 rounded-full object-cover shrink-0 border border-gray-200 dark:border-white/10" 
          />
          <span className="truncate max-w-[140px] sm:max-w-none">
            By <span className="font-bold text-gray-800 dark:text-gray-200">{job.postedBy?.name || "Admin"}</span>
          </span>
          {job.isVerified && <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" title="Verified Opportunity" />}
        </div>
        {isAdmin && isEditing && <div className="flex gap-1"><button onClick={() => setIsEditing(false)} title="Cancel" className="p-1.5 text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button><button onClick={saveChanges} disabled={isSaving} className="px-2 py-1 bg-indigo-600 text-white text-xs rounded-sm">{isSaving ? 'Saving' : 'Save'}</button></div>}
        {isAdmin && !isEditing && <div className="flex gap-1"><button onClick={() => setIsEditing(true)} title="Edit opportunity" className="p-1.5 text-gray-400 hover:text-indigo-500"><Pencil className="w-4 h-4" /></button><button onClick={() => onDelete(job._id)} title="Delete opportunity" className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></div>}
        <a 
          href={job.applyLink} 
          target="_blank" 
          rel="noreferrer" 
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black text-xs font-extrabold rounded-sm hover:bg-indigo-600 dark:hover:bg-indigo-400 dark:hover:text-white transition-all shadow-sm shrink-0"
        >
          <span>Apply Now</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

export default JobCard;