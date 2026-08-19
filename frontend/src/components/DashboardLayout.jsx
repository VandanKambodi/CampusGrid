import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  Briefcase, 
  User, 
  ShieldCheck, 
  LogOut, 
  Sun, 
  Moon, 
  Menu, 
  X,
  Search,
  GraduationCap
} from 'lucide-react';

function DashboardLayout({ toggleTheme, theme }) {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    window.dispatchEvent(new Event('auth-change'));
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/hub/network?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navItems = [
    { label: 'Campus Feed', path: '/hub/feed', icon: LayoutDashboard },
    { label: 'Resource Vault', path: '/hub/vault', icon: FolderKanban },
    { label: 'Campus Network', path: '/hub/network', icon: Users },
    { label: 'Placements Cell', path: '/hub/placements', icon: Briefcase },
    { label: 'My Profile', path: '/hub/profile', icon: User },
  ];

  if (user?.isAdmin || user?.role === 'admin') {
    navItems.push({ label: 'Admin Portal', path: '/hub/admin', icon: ShieldCheck });
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-[#070708] text-gray-900 dark:text-gray-100 font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-[#0d0d0e] border-r border-gray-200 dark:border-white/10 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Sidebar Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
            <Link to="/hub/feed" className="flex items-center gap-2 text-lg font-black tracking-tight bg-gradient-to-r from-indigo-600 to-cyan-400 bg-clip-text text-transparent">
              <GraduationCap className="w-6 h-6 text-indigo-500" />
              <span>CampusGrid</span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)} 
              className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/hub' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Info & Theme */}
        <div className="p-4 border-t border-gray-100 dark:border-white/5 space-y-3">
          <div className="flex items-center justify-between bg-gray-50 dark:bg-white/5 p-2.5 rounded-lg border border-gray-200/50 dark:border-white/5">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-indigo-500/30 bg-indigo-600 flex items-center justify-center">
                <img 
                  src={user?.profilePicture && user.profilePicture.trim() !== '' ? user.profilePicture : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.rollNo || 'User')}&background=6366f1&color=fff&bold=true`} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold truncate text-gray-900 dark:text-white">{user?.name || "Student"}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-mono">{user?.rollNo || user?.role || "Member"}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        
        {/* Top Navbar */}
        <header className="h-16 sticky top-0 z-30 bg-white/80 dark:bg-[#0d0d0e]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick Search */}
            <form onSubmit={handleSearchSubmit} className="relative hidden sm:block w-64 md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search students or peers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 dark:bg-white/5 border border-transparent focus:border-indigo-500 dark:focus:border-indigo-500 rounded-lg pl-9 pr-4 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none transition-all"
              />
            </form>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-all text-gray-700 dark:text-gray-300"
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-yellow-400" />}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

    </div>
  );
}

export default DashboardLayout;
