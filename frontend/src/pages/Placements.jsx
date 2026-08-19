import { useEffect, useState } from 'react';
import { Briefcase, Send, Loader2, ShieldAlert } from 'lucide-react';
import axios from 'axios';
import JobCard from '../components/JobCard';
import Loader from '../components/Loader';

function Placements() {
  const [jobs, setJobs] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [applyLink, setApplyLink] = useState('');
  const [roleType, setRoleType] = useState('Internship');

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) setUser(JSON.parse(userInfo));
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/hub/jobs`, { headers: { Authorization: `Bearer ${token}` } });
      setJobs(data);
    } catch (error) { console.error("Error fetching jobs:", error); } 
    finally { setIsLoading(false); }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    setIsPosting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/hub/jobs`, { title, company, description, applyLink, roleType }, { headers: { Authorization: `Bearer ${token}` } });
      setTitle(''); setCompany(''); setDescription(''); setApplyLink(''); fetchJobs();
    } catch (error) { 
      alert(error.response?.data?.message || "Error posting opportunity"); 
    } finally { 
      setIsPosting(false); 
    }
  };

  if (!user) return null;

  return (
    <div className="w-full space-y-6">
      
      <div className="border-b border-gray-200/60 dark:border-white/10 pb-5">
        <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2.5 mb-1">
          <Briefcase className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" /> 
          <span>Placements Cell</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium max-w-xl leading-relaxed">
          Discover verified internships, full-time engineering roles, and competitive hackathons curated by campus administration.
        </p>
      </div>

      {user.role === 'admin' ? (
        <form onSubmit={handlePostJob} className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-md p-4 md:p-5 shadow-sm space-y-3">
          <h3 className="font-extrabold text-sm flex items-center gap-2 text-gray-900 dark:text-gray-100 uppercase tracking-wider">
            <Send className="w-4 h-4 text-emerald-500" /> Share Career Opportunity (Admin Only)
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <select value={roleType} onChange={(e) => setRoleType(e.target.value)} className="w-full sm:w-1/3 bg-gray-50 dark:bg-white/5 rounded-sm px-4 py-2.5 text-xs outline-none font-bold dark:text-white border border-gray-200 dark:border-white/10">
              <option className="bg-white dark:bg-[#111] text-gray-900 dark:text-white" value="Internship">Internship</option>
              <option className="bg-white dark:bg-[#111] text-gray-900 dark:text-white" value="Full-Time">Full-Time</option>
              <option className="bg-white dark:bg-[#111] text-gray-900 dark:text-white" value="Hackathon">Hackathon</option>
            </select>
            <input type="text" placeholder="Role Title (e.g. SDE Intern)" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full sm:w-2/3 bg-gray-50 dark:bg-white/5 rounded-sm px-4 py-2.5 text-xs outline-none font-bold dark:text-white border border-gray-200 dark:border-white/10" required />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="text" placeholder="Company Name" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full sm:w-1/2 bg-gray-50 dark:bg-white/5 rounded-sm px-4 py-2.5 text-xs outline-none font-bold dark:text-white border border-gray-200 dark:border-white/10" required />
            <input type="url" placeholder="Application URL (https://...)" value={applyLink} onChange={(e) => setApplyLink(e.target.value)} className="w-full sm:w-1/2 bg-gray-50 dark:bg-white/5 rounded-sm px-4 py-2.5 text-xs outline-none font-bold text-indigo-600 dark:text-indigo-400 border border-gray-200 dark:border-white/10" required />
          </div>
          <textarea placeholder="Brief specifications regarding eligibility, stipend, or referral instructions..." value={description} onChange={(e) => setDescription(e.target.value)} rows="2" className="w-full bg-gray-50 dark:bg-white/5 rounded-sm px-4 py-2.5 text-xs outline-none resize-none font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10" required />
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={isPosting} className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-extrabold text-xs rounded-sm cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm">
              {isPosting ? <><Loader2 className="w-4 h-4 animate-spin"/> Posting...</> : 'Publish Opportunity'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 p-4 rounded-md text-xs font-extrabold flex items-center gap-2.5 uppercase tracking-wider shadow-sm">
          <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Only Campus Administrators can publish job and internship opportunities. Students have read-only access to verified listings.</span>
        </div>
      )}

      {isLoading ? (
        <Loader text="Loading placement opportunities..." />
      ) : (
        <div className="space-y-4">
          {jobs.length > 0 ? (
            jobs.map(job => <JobCard key={job._id} job={job} />)
          ) : (
            <div className="text-center py-12 text-xs font-bold text-gray-400 uppercase tracking-wider bg-white dark:bg-[#111] rounded-md border border-gray-200 dark:border-white/10">
              No placement opportunities listed at this time.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Placements;
