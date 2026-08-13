import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut, UserCircle } from 'lucide-react';

function Navbar({ toggleTheme, theme }) {
  const [user, setUser] = useState(null);
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
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    setUser(null);
    window.dispatchEvent(new Event('auth-change'));
    navigate('/');
  };

  if (location.pathname.startsWith('/hub')) return null;

  return (
    <nav className="fixed top-0 w-full backdrop-blur-md bg-white/70 dark:bg-black/60 border-b border-gray-200/60 dark:border-white/10 z-50 transition-all">
      <div className="w-[90%] max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 text-xl font-black tracking-tighter bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-400 bg-clip-text text-transparent">
          <img src="/CampusGrid.png" alt="CampusGrid Logo" className="w-6 h-6 object-contain" />
          <span>CampusGrid</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} aria-label="Toggle Theme" className="p-2 rounded-full cursor-pointer border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-all duration-300">
            {theme === 'light' ? <Moon className="w-4 h-4 text-gray-800" /> : <Sun className="w-4 h-4 text-yellow-400" />}
          </button>
          
          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-gray-200 dark:border-white/10">
              <Link to="/hub/profile" className="flex items-center gap-2 text-xs font-extrabold text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <UserCircle className="w-5 h-5 text-indigo-500" />
                <span className="hidden sm:inline">{user.name?.split(' ')[0]}</span>
              </Link>
              <button onClick={handleLogout} aria-label="Logout" className="p-1.5 text-gray-400 rounded-sm hover:text-red-500 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-sm transition-all shadow-sm hover:shadow-indigo-500/25 hover:-translate-y-0.5">
              Portal Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;