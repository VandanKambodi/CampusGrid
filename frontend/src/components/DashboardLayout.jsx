import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Home, Search as SearchIcon, BookOpen, Users, Briefcase, Bell, User as UserIcon, Sun, Moon, Menu, X, ShieldAlert } from 'lucide-react';
import axios from 'axios';

function DashboardLayout({ toggleTheme, theme }) {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = () => {
      const userInfo = localStorage.getItem('userInfo');
      setUser(userInfo ? JSON.parse(userInfo) : null);
    };
    checkUser();
    window.addEventListener('auth-change', checkUser);
    window.addEventListener('storage', checkUser);
    return () => {
      window.removeEventListener('auth-change', checkUser);
      window.removeEventListener('storage', checkUser);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    window.dispatchEvent(new Event('auth-change'));
    navigate('/login');
  };

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const delayDebounceFn = setTimeout(async () => {
        try {
          const token = localStorage.getItem('token');
          const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/search?keyword=${searchQuery}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setSearchResults(data);
          setIsSearching(true);
        } catch (error) {
          console.error("Search error", error);
        }
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleResultClick = (id) => {
    setSearchQuery('');
    setIsSearching(false);
    navigate(`/hub/student/${id}`);
  };

  const isActive = (path) => location.pathname.includes(path);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#050505] text-gray-900 dark:text-gray-100 font-sans selection:bg-indigo-500 selection:text-white relative w-full">
      
      <nav className="fixed top-0 w-full backdrop-blur-md bg-white/80 dark:bg-black/80 border-b border-gray-200/80 dark:border-white/10 z-50 h-16 flex items-center transition-all">
        <div className="w-[90%] max-w-7xl mx-auto px-4 md:px-6 flex justify-between items-center gap-4">
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="md:hidden p-2 -ml-2 rounded-sm hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/hub/feed" className="flex items-center gap-2 text-xl font-black tracking-tight text-indigo-600 dark:text-indigo-400 shrink-0">
              <img src="/CampusGrid.png" alt="CampusGrid Logo" className="w-6 h-6 object-contain" /> 
              <span className="hidden sm:block">CampusGrid</span>
            </Link>
          </div>
          
          <div className="flex-1 max-w-md relative hidden sm:block">
            <div className="relative">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search students, roll numbers..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 dark:bg-white/5 border border-transparent dark:border-white/10 text-xs font-bold rounded-md pl-10 pr-4 py-2 outline-none focus:bg-white dark:focus:bg-black focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all dark:text-white placeholder-gray-400"
              />
            </div>
            
            {isSearching && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-md shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map(result => (
                    <button 
                      key={result._id} 
                      onClick={() => handleResultClick(result._id)} 
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/5 last:border-0 text-left"
                    >
                      <img src={result.profilePicture} alt="avatar" className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200 dark:border-white/10" />
                      <div>
                        <div className="font-extrabold text-xs text-gray-900 dark:text-white">{result.name}</div>
                        <div className="text-[11px] font-semibold text-gray-500">{result.rollNo} • {result.branch || "CSE"}</div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs font-bold text-gray-500">No student records found.</div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <button className="p-2 rounded-sm hover:bg-gray-100 dark:hover:bg-white/10 transition-colors relative text-gray-600 dark:text-gray-300">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-black"></span>
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-full cursor-pointer border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-all duration-300">
              {theme === 'light' ? <Moon className="w-4 h-4 text-gray-800" /> : <Sun className="w-4 h-4 text-yellow-400" />}
            </button>
            <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1 hidden md:block"></div>
            <Link to="/hub/profile" className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-white/5 px-2.5 py-1.5 rounded-sm transition-colors">
              <img src={user.profilePicture || "https://img.freepik.com/premium-vector/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-vector-illustration_561158-3485.jpg"} alt="avatar" className="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-white/10" />
              <span className="text-xs font-extrabold hidden sm:block text-gray-800 dark:text-gray-200">{user.name.split(' ')[0]}</span>
            </Link>
            <button onClick={handleLogout} className="p-2 rounded-sm hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-colors" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <div className="w-[90%] max-w-7xl mx-auto pt-20 md:pt-24 pb-12 flex flex-col md:flex-row gap-8 items-start relative">
        
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden animate-in fade-in" onClick={() => setIsMobileMenuOpen(false)} />
        )}

        <aside className={`fixed md:sticky top-0 md:top-24 left-0 h-screen md:h-auto w-64 bg-white dark:bg-[#080808] md:bg-transparent md:dark:bg-transparent z-40 border-r border-gray-200 dark:border-white/10 md:border-none transform transition-transform duration-300 ease-in-out p-6 md:p-0 pt-20 md:pt-0 overflow-y-auto ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}`}>
          <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-3">
            Campus Hub
          </div>
          <div className="space-y-1">
            <Link onClick={() => setIsMobileMenuOpen(false)} to="/hub/feed" className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-xs font-extrabold transition-all ${isActive('/feed') ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400'}`}>
              <Home className="w-4 h-4" /> The Feed
            </Link>
            <Link onClick={() => setIsMobileMenuOpen(false)} to="/hub/vault" className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-xs font-extrabold transition-all ${isActive('/vault') ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400'}`}>
              <BookOpen className="w-4 h-4" /> Resource Vault
            </Link>
            {user.role === 'admin' && (
              <Link onClick={() => setIsMobileMenuOpen(false)} to="/hub/admin" className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-xs font-extrabold transition-all ${isActive('/admin') ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' : 'hover:bg-purple-50 dark:hover:bg-purple-500/10 text-purple-600 dark:text-purple-400'}`}>
                <ShieldAlert className="w-4 h-4" /> Admin Console
              </Link>
            )}
          </div>
          
          <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 mt-8 px-3">
            Network & Career
          </div>
          <div className="space-y-1">
            <Link onClick={() => setIsMobileMenuOpen(false)} to="/hub/network" className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-xs font-extrabold transition-all ${isActive('/network') ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400'}`}>
              <Users className="w-4 h-4" /> Campus Network
            </Link>
            <Link onClick={() => setIsMobileMenuOpen(false)} to="/hub/placements" className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-xs font-extrabold transition-all ${isActive('/placements') ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400'}`}>
              <Briefcase className="w-4 h-4" /> Placements Cell
            </Link>
          </div>

          <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 mt-8 px-3">
            User Settings
          </div>
          <div className="space-y-1">
            <Link onClick={() => setIsMobileMenuOpen(false)} to="/hub/profile" className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-xs font-extrabold transition-all ${isActive('/profile') ? 'bg-pink-600 text-white shadow-md shadow-pink-500/20' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400'}`}>
              <UserIcon className="w-4 h-4" /> My Profile
            </Link>
          </div>
        </aside>

        <main className="flex-1 w-full min-h-[500px]">
          <div onClick={() => setIsSearching(false)}> 
            <Outlet /> 
          </div>
        </main>

      </div>
    </div>
  );
}

export default DashboardLayout;
