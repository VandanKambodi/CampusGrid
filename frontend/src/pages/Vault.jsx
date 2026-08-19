import { useState, useEffect } from 'react';
import axios from 'axios';
import Loader from '../components/Loader';
import ConfirmModal from '../components/ConfirmModal';
import { 
  FolderKanban, 
  UploadCloud, 
  ThumbsUp, 
  FileText, 
  Download, 
  Filter, 
  X, 
  BookOpen,
  Plus,
  Trash2,
  Eye
} from 'lucide-react';

function Vault() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branchFilter, setBranchFilter] = useState('');
  const [semFilter, setSemFilter] = useState('');
  const [deleteResourceId, setDeleteResourceId] = useState(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [semester, setSemester] = useState('1');
  const [branch, setBranch] = useState('CSE');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const token = localStorage.getItem('token');

  const fetchResources = async () => {
    setLoading(true);
    try {
      let params = [];
      if (branchFilter) params.push(`branch=${branchFilter}`);
      if (semFilter) params.push(`semester=${semFilter}`);
      const queryStr = params.length > 0 ? `?${params.join('&')}` : '';

      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/hub/resources${queryStr}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResources(data);
    } catch (err) {
      console.error('Failed to fetch resources', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [branchFilter, semFilter]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title.trim() || !subject.trim()) {
      setError('Title, subject, and file are required.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds maximum limit of 10MB. Please choose a smaller file.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('subject', subject);
      formData.append('semester', semester);
      formData.append('branch', branch);
      formData.append('file', file);

      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/hub/resources`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setIsModalOpen(false);
      setTitle('');
      setSubject('');
      setFile(null);
      fetchResources();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload resource');
    } finally {
      setUploading(false);
    }
  };

  const handleUpvote = async (resourceId) => {
    try {
      const { data } = await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/hub/resources/${resourceId}/upvote`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResources(prev => prev.map(r => {
        if (r._id === resourceId) {
          const alreadyUpvoted = r.upvotes?.includes(currentUser._id);
          const updatedUpvotes = alreadyUpvoted 
            ? r.upvotes.filter(id => id !== currentUser._id)
            : [...(r.upvotes || []), currentUser._id];
          return { ...r, upvotes: updatedUpvotes };
        }
        return r;
      }));
    } catch (err) {
      console.error('Upvote failed', err);
    }
  };

  const executeDeleteResource = async () => {
    if (!deleteResourceId) return;
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/hub/resources/${deleteResourceId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDeleteResourceId(null);
      fetchResources();
    } catch (err) {
      console.error('Delete resource error', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2 max-w-xl">
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
            <FolderKanban className="w-8 h-8" /> Resource Vault
          </h1>
          <p className="text-xs sm:text-sm text-purple-100 leading-relaxed">
            Access previous year question papers (PYQs), lecture notes, lab manuals, and syllabus resources uploaded by peers and faculty.
          </p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-white text-purple-700 hover:bg-purple-50 font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Share Resource
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-white dark:bg-[#111112] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </span>

          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 rounded-lg px-3 py-1.5 outline-none cursor-pointer"
          >
            <option value="" className="bg-white dark:bg-[#151516]">All Branches</option>
            <option value="CSE" className="bg-white dark:bg-[#151516]">Computer Science (CSE)</option>
            <option value="IT" className="bg-white dark:bg-[#151516]">Information Technology (IT)</option>
            <option value="ECE" className="bg-white dark:bg-[#151516]">Electronics (ECE)</option>
            <option value="ME" className="bg-white dark:bg-[#151516]">Mechanical (ME)</option>
            <option value="CE" className="bg-white dark:bg-[#151516]">Civil (CE)</option>
          </select>

          <select
            value={semFilter}
            onChange={(e) => setSemFilter(e.target.value)}
            className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 rounded-lg px-3 py-1.5 outline-none cursor-pointer"
          >
            <option value="" className="bg-white dark:bg-[#151516]">All Semesters</option>
            {[1,2,3,4,5,6,7,8].map(s => (
              <option key={s} value={s} className="bg-white dark:bg-[#151516]">Semester {s}</option>
            ))}
          </select>

          {(branchFilter || semFilter) && (
            <button 
              onClick={() => { setBranchFilter(''); setSemFilter(''); }}
              className="text-xs text-indigo-500 hover:underline font-semibold"
            >
              Clear Filters
            </button>
          )}
        </div>

        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
          Showing {resources.length} resource(s)
        </span>
      </div>

      {/* Resource Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#151516] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-white/10">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-indigo-500" /> Share Study Material
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

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Title</label>
                <input 
                  type="text"
                  placeholder="e.g. Data Structures End-Sem PYQ Solutions"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Subject Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Data Structures & Algorithms"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Branch</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                  >
                    <option value="CSE" className="bg-white dark:bg-[#151516]">CSE</option>
                    <option value="IT" className="bg-white dark:bg-[#151516]">IT</option>
                    <option value="ECE" className="bg-white dark:bg-[#151516]">ECE</option>
                    <option value="ME" className="bg-white dark:bg-[#151516]">ME</option>
                    <option value="CE" className="bg-white dark:bg-[#151516]">CE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                  >
                    {[1,2,3,4,5,6,7,8].map(s => (
                      <option key={s} value={s} className="bg-white dark:bg-[#151516]">Sem {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">File Attachment (PDF/Doc/Image)</label>
                <input 
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
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
                  disabled={uploading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm"
                >
                  {uploading ? 'Uploading...' : 'Upload Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resource Cards */}
      {loading ? (
        <Loader text="Loading Resource Vault..." />
      ) : resources.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[#111112] border border-gray-200 dark:border-white/10 rounded-xl p-8">
          <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">No resources available for this filter.</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Be the first to share notes or question papers!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map(res => {
            const isUpvoted = res.upvotes?.includes(currentUser._id);
            const isUploader = res.uploadedBy?._id === currentUser._id || res.uploadedBy === currentUser._id;
            const isAdmin = currentUser.isAdmin || currentUser.role === 'admin';
            const canDelete = isUploader || isAdmin;

            const fileUrl = res.fileUrl?.startsWith('http') 
              ? res.fileUrl 
              : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${res.fileUrl?.startsWith('/') ? '' : '/'}${res.fileUrl}`;

            return (
              <div 
                key={res._id}
                className="bg-white dark:bg-[#111112] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm hover:border-gray-300 dark:hover:border-white/20 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-snug">{res.title}</h3>
                        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{res.subject}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded border border-gray-200 dark:border-white/10">
                        {res.branch} • Sem {res.semester}
                      </span>
                      {canDelete && (
                        <button
                          onClick={() => setDeleteResourceId(res._id)}
                          title="Delete Resource"
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5 mt-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-gray-200 dark:border-white/10 bg-indigo-600 flex items-center justify-center">
                      <img 
                        src={res.uploadedBy?.profilePicture && res.uploadedBy.profilePicture.trim() !== '' ? res.uploadedBy.profilePicture : `https://ui-avatars.com/api/?name=${encodeURIComponent(res.uploadedBy?.name || 'Student')}&background=6366f1&color=fff&bold=true`}
                        alt="uploader"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="truncate max-w-[120px]">{res.uploadedBy?.name || 'Student'}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleUpvote(res._id)}
                      className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        isUpvoted 
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-300' 
                          : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-white/5 dark:border-white/10 dark:text-gray-400'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${isUpvoted ? 'fill-current' : ''}`} />
                      <span>{res.upvotes?.length || 0}</span>
                    </button>

                    <a 
                      href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/hub/resources/download/${res._id}`} 
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                      title="Download Resource File"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modern Custom React Confirm Modal */}
      <ConfirmModal 
        isOpen={!!deleteResourceId}
        onClose={() => setDeleteResourceId(null)}
        onConfirm={executeDeleteResource}
        title="Remove Resource"
        message="Are you sure you want to delete this study resource from the vault? This cannot be undone."
        confirmText="Remove Resource"
      />

    </div>
  );
}

export default Vault;
