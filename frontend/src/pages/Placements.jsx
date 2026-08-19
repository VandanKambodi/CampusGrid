import { useState, useEffect } from 'react';
import axios from 'axios';
import Loader from '../components/Loader';
import ConfirmModal from '../components/ConfirmModal';
import { Briefcase, ExternalLink, Plus, Building2, MapPin, DollarSign, Calendar, X, Trash2 } from 'lucide-react';

function Placements() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  // Admin Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [roleType, setRoleType] = useState('full-time');
  const [description, setDescription] = useState('');
  const [applyLink, setApplyLink] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const token = localStorage.getItem('token');
  const isAdmin = currentUser.isAdmin || currentUser.role === 'admin';

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/hub/jobs`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJobs(data);
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!title.trim() || !company.trim() || !applyLink.trim()) {
      setError('Title, company, and apply link are required.');
      return;
    }

    setPosting(true);
    setError('');

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/hub/jobs`,
        { title, company, roleType, description, applyLink },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIsModalOpen(false);
      setTitle('');
      setCompany('');
      setDescription('');
      setApplyLink('');
      fetchJobs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post job drive');
    } finally {
      setPosting(false);
    }
  };

  const [deleteJobId, setDeleteJobId] = useState(null);

  const executeDeleteJob = async () => {
    if (!deleteJobId) return;
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/hub/jobs/${deleteJobId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDeleteJobId(null);
      fetchJobs();
    } catch (err) {
      console.error('Delete job error', err);
    }
  };

  const filteredJobs = jobs.filter(j => {
    if (filterType === 'all') return true;
    return j.roleType === filterType;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2 max-w-xl">
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
            <Briefcase className="w-8 h-8" /> Training & Placement Cell
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
            Discover verified campus placement drives, off-campus hiring alerts, and summer internships curated for students.
          </p>
        </div>

        {isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Post Placement Drive
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between bg-white dark:bg-[#111112] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Category:</span>
          {[
            { id: 'all', label: 'All Openings' },
            { id: 'full-time', label: 'Full-Time Roles' },
            { id: 'internship', label: 'Internships' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === f.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Admin Post Job Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#151516] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-white/10">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-500" /> Post Placement / Internship Drive
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Company Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Google, Microsoft, TCS"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Job / Role Title</label>
                <input 
                  type="text"
                  placeholder="e.g. Graduate Software Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Opportunity Type</label>
                <select
                  value={roleType}
                  onChange={(e) => setRoleType(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                >
                  <option value="full-time" className="bg-white dark:bg-[#151516]">Full-Time</option>
                  <option value="internship" className="bg-white dark:bg-[#151516]">Internship</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Application URL</label>
                <input 
                  type="url"
                  placeholder="https://company.com/careers/apply..."
                  value={applyLink}
                  onChange={(e) => setApplyLink(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Description / Eligibility Details</label>
                <textarea 
                  rows={3}
                  placeholder="Mention eligibility criteria, CTC, tech stack requirements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-3 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-white/10">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={posting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm"
                >
                  {posting ? 'Posting...' : 'Post Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Jobs Grid */}
      {loading ? (
        <Loader text="Loading Placement Opportunities..." />
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[#111112] border border-gray-200 dark:border-white/10 rounded-xl p-8">
          <Building2 className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">No active placement opportunities found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map(job => (
            <div 
              key={job._id}
              className="bg-white dark:bg-[#111112] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm hover:border-gray-300 dark:hover:border-white/20 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded border border-blue-100 dark:border-blue-500/20 inline-block mb-1.5">
                      {job.company}
                    </span>
                    <h3 className="font-extrabold text-base text-gray-900 dark:text-white leading-snug">{job.title}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-sm border shrink-0 ${
                      job.roleType === 'internship'
                        ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:border-purple-500/20'
                        : 'bg-green-50 text-green-600 border-green-100 dark:bg-green-500/10 dark:border-green-500/20'
                    }`}>
                      {job.roleType}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => setDeleteJobId(job._id)}
                        title="Delete Placement Drive"
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {job.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4 whitespace-pre-wrap line-clamp-3">
                    {job.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5 mt-3">
                <span className="text-[10px] font-mono text-gray-400">
                  Posted {new Date(job.createdAt).toLocaleDateString()}
                </span>

                <a 
                  href={job.applyLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  <span>Apply Now</span> <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Delete Placement Modal */}
      <ConfirmModal 
        isOpen={!!deleteJobId}
        onClose={() => setDeleteJobId(null)}
        onConfirm={executeDeleteJob}
        title="Delete Placement Drive"
        message="Are you sure you want to delete this placement drive? It will be removed for all students."
        confirmText="Delete Drive"
      />

    </div>
  );
}

export default Placements;
