import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import CampusNetwork from './pages/CampusNetwork';
import Vault from './pages/Vault';
import Placements from './pages/Placements';
import AdminDashboard from './pages/AdminDashboard';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [pathname]);

  return null;
}

const ProtectedRoute = ({ children }) => {
  const userInfo = localStorage.getItem('userInfo');
  return userInfo ? children : <Navigate to="/login" />;
};

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#050505] text-gray-900 dark:text-gray-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col">
      <div className="flex flex-col flex-1 relative w-full">
        <Router>
          <ScrollToTop />
          <Navbar toggleTheme={toggleTheme} theme={theme} />
          
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />

            <Route path="/feed" element={<Navigate to="/hub/feed" replace />} />
            <Route path="/profile" element={<Navigate to="/hub/profile" replace />} />

            <Route path="/hub" element={
              <ProtectedRoute>
                <DashboardLayout toggleTheme={toggleTheme} theme={theme} />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/hub/feed" />} />
              <Route path="feed" element={<Feed />} />
              <Route path="profile" element={<Profile />} />
              <Route path="student/:id" element={<PublicProfile />} />
              
              <Route path="vault" element={<Vault />} />
              <Route path="network" element={<CampusNetwork />} />
              <Route path="placements" element={<Placements />} />

              <Route path="admin" element={<AdminDashboard />} />
            </Route>
          </Routes>
        </Router>
      </div>
    </div>
  );
}

export default App;