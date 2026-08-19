import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Loader from '../components/Loader';
import ConfirmModal from '../components/ConfirmModal';
import { Search, UserPlus, UserCheck, Users, ExternalLink, Code, Filter, Trash2 } from 'lucide-react';

function CampusNetwork() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [followingMap, setFollowingMap] = useState({});

  const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const token = localStorage.getItem('token');

  const fetchStudents = async (query = searchTerm) => {
    setLoading(true);
    try {
      let url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users`;
      if (query.trim()) {
        url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/search?keyword=${encodeURIComponent(query.trim())}`;
      }
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Exclude current user from network grid if present
      const list = data.filter(s => s._id !== currentUser._id);
      setStudents(list);

      // Build initial map of who current user is following
      const map = {};
      list.forEach(s => {
        if (s.followers?.includes(currentUser._id)) {
          map[s._id] = true;
        }
      });
      setFollowingMap(map);
    } catch (err) {
      console.error('Failed to fetch students', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(searchTerm);
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (val.trim()) {
      setSearchParams({ search: val });
    } else {
      setSearchParams({});
    }
    fetchStudents(val);
  };

  const handleFollowToggle = async (studentId) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/${studentId}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFollowingMap(prev => ({
        ...prev,
        [studentId]: !prev[studentId]
      }));
    } catch (err) {
      console.error('Follow toggle error', err);
    }
  };

  const branches = ['ALL', 'CSE', 'IT', 'ECE', 'ME', 'CE', 'AI/DS'];

  const filteredStudents = students.filter(student => {
    if (selectedBranch === 'ALL') return true;
    return student.branch?.toUpperCase() === selectedBranch;
  });

  const [deleteStudentTarget, setDeleteStudentTarget] = useState(null);

  const executeRemoveStudent = async () => {
    if (!deleteStudentTarget) return;
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/hub/admin/users/${deleteStudentTarget.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDeleteStudentTarget(null);
      fetchStudents(searchTerm);
    } catch (err) {
      console.error('Remove student error', err);
    }
  };

  const isAdmin = currentUser.isAdmin || currentUser.role === 'admin';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
            <Users className="w-8 h-8" /> Campus Network
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
            Connect with peers, find project collaborators, and explore profiles across departments on CampusGrid.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-white dark:bg-[#111112] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name or roll number..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-indigo-500 rounded-lg pl-9 pr-4 py-2 text-xs text-gray-900 dark:text-white outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
            <Filter className="w-3.5 h-3.5" /> Branch:
          </span>
          {branches.map(b => (
            <button
              key={b}
              onClick={() => setSelectedBranch(b)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                selectedBranch === b
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-transparent hover:border-gray-200 dark:hover:border-white/10'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Student Cards Grid */}
      {loading ? (
        <Loader text="Searching Campus Network..." />
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[#111112] border border-gray-200 dark:border-white/10 rounded-xl p-8">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">No students found matching your criteria.</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try clearing the search or branch filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map(student => {
            const isFollowing = followingMap[student._id];
            return (
              <div 
                key={student._id}
                className="bg-white dark:bg-[#111112] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm hover:border-indigo-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-gray-200 dark:border-white/10 bg-indigo-600 flex items-center justify-center">
                        <img 
                          src={student.profilePicture && student.profilePicture.trim() !== '' ? student.profilePicture : `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || student.rollNo || 'Student')}&background=6366f1&color=fff&bold=true`} 
                          alt={student.name || student.rollNo} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <Link 
                          to={`/hub/student/${student._id}`}
                          className="font-bold text-sm text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
                        >
                          {student.name}
                        </Link>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                          {student.rollNo} • {student.branch || 'CSE'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {student.techStack?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 my-3">
                      {student.techStack.slice(0, 4).map((tech, idx) => (
                        <span key={idx} className="text-[10px] bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-medium px-2 py-0.5 rounded">
                          {tech}
                        </span>
                      ))}
                      {student.techStack.length > 4 && (
                        <span className="text-[10px] text-gray-400 font-semibold px-1">+ {student.techStack.length - 4} more</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-white/5 mt-2">
                  <button
                    onClick={() => handleFollowToggle(student._id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isFollowing 
                        ? 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5 text-green-500" /> Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" /> Follow
                      </>
                    )}
                  </button>

                  <Link 
                    to={`/hub/student/${student._id}`}
                    className="p-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 rounded-lg text-xs transition-all"
                    title="View Full Profile"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  {isAdmin && (
                    <button
                      onClick={() => setDeleteStudentTarget({ id: student._id, name: student.name })}
                      title="Remove Student Account"
                      className="p-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Remove Student Modal */}
      <ConfirmModal 
        isOpen={!!deleteStudentTarget}
        onClose={() => setDeleteStudentTarget(null)}
        onConfirm={executeRemoveStudent}
        title="Remove Student Account"
        message={deleteStudentTarget ? `Are you sure you want to remove student account "${deleteStudentTarget.name}"?` : "Are you sure you want to remove this student account?"}
        confirmText="Remove Account"
      />

    </div>
  );
}

export default CampusNetwork;
