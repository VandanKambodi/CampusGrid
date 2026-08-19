import { useEffect, useState, useRef } from 'react';
import { BookOpen, Upload, CheckCircle2, Loader2 } from 'lucide-react';
import axios from 'axios';
import ResourceCard from '../components/ResourceCard';
import Loader from '../components/Loader';

function Vault() {
  const [resources, setResources] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [semester, setSemester] = useState('1');
  const [branch, setBranch] = useState('CSE');
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) setUser(JSON.parse(userInfo));
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/hub/resources`, { headers: { Authorization: `Bearer ${token}` } });
      setResources(data);
    } catch (error) { 
      console.error("Error fetching resources:", error); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title || !subject || !file) return alert("Title, Subject, and File are required!");
    setIsUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', title); 
      formData.append('subject', subject);
      formData.append('semester', semester); 
      formData.append('branch', branch);
      formData.append('file', file);

      await axios.post(`${import.meta.env.VITE_API_URL}/api/hub/resources`, formData, { 
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } 
      });
      setTitle(''); setSubject(''); setFile(null); fetchResources(); 
    } catch { 
      alert("Error uploading file."); 
    } finally { 
      setIsUploading(false); 
    }
  };

  const handleUpvote = async (id) => {
    try {
      const token = localStorage.getItem('token');
      setResources(resources.map(res => {
        if (res._id === id) {
          const hasUpvoted = res.upvotes.includes(user._id);
          const newUpvotes = hasUpvoted ? res.upvotes.filter(uId => uId !== user._id) : [...res.upvotes, user._id];
          return { ...res, upvotes: newUpvotes };
        }
        return res;
      }));
      await axios.put(`${import.meta.env.VITE_API_URL}/api/hub/resources/${id}/upvote`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch { 
      fetchResources(); 
    }
  };

  if (!user) return null;

  return (
    <div className="w-full space-y-6">
      <div className="border-b border-gray-200/60 dark:border-white/10 pb-5">
        <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2.5 mb-1">
          <BookOpen className="w-6 h-6 text-cyan-600 dark:text-cyan-400 shrink-0" /> 
          <span>Resource Vault</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium max-w-xl leading-relaxed">
          Access, upload, and upvote peer-reviewed study notes, previous year examination papers, and lab manuals.
        </p>
      </div>

      <form onSubmit={handleUpload} className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-md p-4 md:p-5 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm flex items-center gap-2 text-gray-900 dark:text-gray-100 uppercase tracking-wider">
          <Upload className="w-4 h-4 text-cyan-500" /> Contribute Academic Material
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <input 
            type="text" 
            placeholder="Title (e.g. OOPS Unit 1 Notes)" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-sm px-4 py-2.5 text-xs font-bold outline-none focus:border-cyan-500 dark:text-white" 
            required 
          />
          <input 
            type="text" 
            placeholder="Subject Name" 
            value={subject} 
            onChange={(e) => setSubject(e.target.value)} 
            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-sm px-4 py-2.5 text-xs font-bold outline-none focus:border-cyan-500 dark:text-white" 
            required 
          />
          <select 
            value={semester} 
            onChange={(e) => setSemester(e.target.value)} 
            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-sm px-4 py-2.5 text-xs outline-none font-bold dark:text-white"
          >
            {[1,2,3,4,5,6,7,8].map(sem => <option className="bg-white dark:bg-[#111] text-gray-900 dark:text-white" key={sem} value={sem}>Semester {sem}</option>)}
          </select>
          <select 
            value={branch} 
            onChange={(e) => setBranch(e.target.value)} 
            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-sm px-4 py-2.5 text-xs outline-none font-bold dark:text-white"
          >
            <option className="bg-white dark:bg-[#111] text-gray-900 dark:text-white" value="CSE">CSE</option> 
            <option className="bg-white dark:bg-[#111] text-gray-900 dark:text-white" value="ECE">ECE</option> 
            <option className="bg-white dark:bg-[#111] text-gray-900 dark:text-white" value="ME">Mechanical</option> 
            <option className="bg-white dark:bg-[#111] text-gray-900 dark:text-white" value="CE">Civil</option>
          </select>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between border-t border-gray-100 dark:border-white/5 pt-4 mt-2 gap-3">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <input type="file" ref={fileInputRef} onChange={(e) => setFile(e.target.files[0])} accept=".pdf,.doc,.docx,.jpg,.png" className="hidden" />
            <button 
              type="button" 
              onClick={() => fileInputRef.current.click()} 
              className="whitespace-nowrap px-4 py-2 bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-extrabold text-xs rounded-sm cursor-pointer hover:bg-cyan-100 transition-colors"
            >
              Choose Document
            </button>
            {file && (
              <span className="text-xs text-gray-600 dark:text-gray-300 font-semibold flex items-center gap-1.5 overflow-hidden text-ellipsis">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0"/> {file.name}
              </span>
            )}
          </div>
          <button 
            type="submit" 
            disabled={isUploading} 
            className="w-full md:w-auto px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 text-white font-black text-xs rounded-sm cursor-pointer transition-all shadow-sm hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            {isUploading ? <><Loader2 className="w-4 h-4 animate-spin"/> Uploading...</> : 'Publish Resource'}
          </button>
        </div>
      </form>

      {isLoading ? (
        <Loader text="Loading academic vault..." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {resources.length > 0 ? (
            resources.map(res => (
              <ResourceCard 
                key={res._id} 
                resource={res} 
                currentUserId={user._id} 
                onUpvote={handleUpvote} 
              />
            ))
          ) : (
            <div className="col-span-1 sm:col-span-2 text-center py-12 text-xs font-bold text-gray-400 uppercase tracking-wider bg-white dark:bg-[#111] rounded-md border border-gray-200 dark:border-white/10">
              No study materials have been uploaded for this filter yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Vault;
