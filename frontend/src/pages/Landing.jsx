import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Megaphone, Users, Briefcase, PenSquare, Zap, HelpCircle, ChevronDown } from 'lucide-react';

function Landing() {
  const [user, setUser] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

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

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    { q: "Who can register on the CampusGrid platform?", a: "CampusGrid is exclusively built for verified college students, faculty, and administrative heads. Registration requires a valid institutional Roll Number." },
    { q: "How does the Resource Vault ensure quality study materials?", a: "Every uploaded note, previous year question paper, or lab manual is subject to peer peer-review. Students can upvote high-utility materials, automatically elevating the best resources to the top of semester feeds." },
    { q: "Are placement opportunities and internships verified?", a: "Yes. All opportunities submitted by peers undergo administrative auditing. Verified postings receive an official green shield badge to protect students from unverified or expired listings." },
    { q: "What happens after I report a Lost & Found item?", a: "Once an item is reported with photographic evidence, it broadcasts immediately to the universal campus feed. Users can comment directly on the thread or message the poster to coordinate secure handovers." }
  ];

  return (
    <div className="relative overflow-hidden flex flex-col flex-1 w-full">
      
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0"></div>
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-indigo-500/15 to-cyan-400/15 dark:from-indigo-600/15 dark:to-purple-600/15 blur-[120px] rounded-md pointer-events-none z-0"></div>

      <main className="relative pt-36 pb-20 flex flex-col items-center text-center w-[90%] max-w-7xl mx-auto z-10">
        {user ? (
          <div className="w-full flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-xs font-extrabold mb-6 uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 fill-current" /> Active Session Access
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-4 leading-none">
              Welcome back, <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                {user.name ? user.name.split(' ')[0] : 'Student'}!
              </span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-12 font-medium max-w-xl">
              Your centralized campus feed is updated. Where would you like to navigate today?
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
              <Link to="/hub/feed" className="p-10 bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-md hover:border-indigo-500/50 hover:-translate-y-1 transition-all group flex flex-col items-center gap-3 shadow-sm">
                <Megaphone className="w-8 h-8 text-indigo-500 group-hover:scale-110 transition-transform" />
                <span className="font-extrabold text-sm">Announcements</span>
              </Link>
              <Link to="/hub/feed" className="p-10 bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-md hover:border-cyan-500/50 hover:-translate-y-1 transition-all group flex flex-col items-center gap-3 shadow-sm">
                <PenSquare className="w-8 h-8 text-cyan-500 group-hover:scale-110 transition-transform" />
                <span className="font-extrabold text-sm">Student Blogs</span>
              </Link>
              <Link to="/hub/feed" className="p-10 bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-md hover:border-pink-500/50 hover:-translate-y-1 transition-all group flex flex-col items-center gap-3 shadow-sm">
                <Search className="w-8 h-8 text-pink-500 group-hover:scale-110 transition-transform" />
                <span className="font-extrabold text-sm">Lost & Found</span>
              </Link>
              <Link to="/hub/network" className="p-10 bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-md hover:border-purple-500/50 hover:-translate-y-1 transition-all group flex flex-col items-center gap-3 shadow-sm">
                <Users className="w-8 h-8 text-purple-500 group-hover:scale-110 transition-transform" />
                <span className="font-extrabold text-sm">Campus Network</span>
              </Link>
              <Link to="/hub/vault" className="p-10 bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-md hover:border-blue-500/50 hover:-translate-y-1 transition-all group flex flex-col items-center gap-3 shadow-sm">
                <BookOpen className="w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform" />
                <span className="font-extrabold text-sm">Resource Vault</span>
              </Link>
              <Link to="/hub/placements" className="p-10 bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-md hover:border-green-500/50 hover:-translate-y-1 transition-all group flex flex-col items-center gap-3 shadow-sm">
                <Briefcase className="w-8 h-8 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span className="font-extrabold text-sm">Placements</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="inline-flex items-center gap-2 mb-6 px-3.5 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/80 dark:bg-indigo-500/10 text-xs font-extrabold text-indigo-600 dark:text-indigo-300 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
              </span>
              v1.0 Live in Campus
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.1]">
              The entire campus. <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                In your pocket.
              </span>
            </h1>
            
            <p className="font-medium sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mb-10">
              Eliminate chaotic messaging groups. Share verified academic notes, recover lost essentials, and build your digital engineering legacy on CampusGrid.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center">
              <Link to="/login" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-black text-sm transition-all shadow-md hover:shadow-indigo-500/25 hover:-translate-y-0.5 text-center">
                Access Student Portal
              </Link>
              <Link to="/login" className="px-8 py-4 bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 rounded-md font-black text-sm transition-all text-center">
                Admin Console
              </Link>
            </div>
          </>
        )}
      </main>

      {!user && (
        <>
          <section className="py-12 border-y border-gray-200/60 dark:border-white/5 bg-white/40 dark:bg-black/20 backdrop-blur-md relative z-10 w-full">
            <div className="w-[90%] max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl sm:text-4xl font-black text-indigo-600 dark:text-indigo-400">50+</div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Study Modules Shared</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-black text-purple-600 dark:text-purple-400">100%</div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Verified Placement Drives</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-black text-cyan-600 dark:text-cyan-400">24/7</div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Peer Network Access</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">8+</div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Academic Semesters</div>
              </div>
            </div>
          </section>

          <section className="py-20 relative z-10 w-[90%] max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">Engineered for academic survival.</h2>
              <p className="text-base text-gray-600 dark:text-gray-400 font-medium">Built by computer science students to solve real-world institutional communication bottlenecks.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-8 rounded-lg cursor-pointer bg-white dark:bg-[#111] border border-gray-200/80 dark:border-white/10 hover:border-indigo-500/50 transition-all duration-300 group shadow-sm">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center rounded-md mb-6 group-hover:-translate-y-1 transition-transform duration-300">
                  <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-extrabold mb-2.5">Resource Vault</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Access peer-reviewed notes, previous year question papers, and specialized engineering study materials organized by branch and semester.</p>
              </div>

              <div className="p-8 rounded-lg cursor-pointer bg-white dark:bg-[#111] border border-gray-200/80 dark:border-white/10 hover:border-cyan-500/50 transition-all duration-300 group shadow-sm">
                <div className="w-12 h-12 bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center rounded-md mb-6 group-hover:-translate-y-1 transition-transform duration-300">
                  <Search className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h3 className="text-xl font-extrabold mb-2.5">Lost & Found Hub</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Misplaced your ID card, laboratory manuals, or electronics? Broadcast photographic evidence to mobilize the campus network for rapid recovery.</p>
              </div>

              <div className="p-8 rounded-lg cursor-pointer bg-white dark:bg-[#111] border border-gray-200/80 dark:border-white/10 hover:border-purple-500/50 transition-all duration-300 group shadow-sm">
                <div className="w-12 h-12 bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center rounded-md mb-6 group-hover:-translate-y-1 transition-transform duration-300">
                  <Megaphone className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-extrabold mb-2.5">Verified Announcements</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Receive authenticated administrative alerts, examination schedules, and urgent academic directives directly from department heads.</p>
              </div>
            </div>
          </section>

          <section className="py-16 relative z-10 w-[90%] max-w-7xl mx-auto border-t border-gray-200/60 dark:border-white/5">
            <h2 className="text-2xl sm:text-3xl font-black text-center mb-12 uppercase tracking-wide">3-Step Onboarding Workflow</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-sm mb-4 shadow-md">1</div>
                <h4 className="font-extrabold text-base mb-1">Institutional Auth</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">Log in securely using your registered college Roll Number and authorized password.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-black flex items-center justify-center text-sm mb-4 shadow-md">2</div>
                <h4 className="font-extrabold text-base mb-1">Select Hub Module</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">Navigate between peer blogs, placement drives, study vaults, or senior directories.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-sm mb-4 shadow-md">3</div>
                <h4 className="font-extrabold text-base mb-1">Contribute & Elevate</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">Upload semester notes, apply for internships, or upvote critical campus alerts.</p>
              </div>
            </div>
          </section>

          <section className="py-16 relative z-10 w-[90%] max-w-7xl mx-auto mb-10">
            <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs uppercase tracking-wider mb-2">
              <HelpCircle className="w-4 h-4" /> System Knowledge Base
            </div>
            <h2 className="text-3xl font-black text-center mb-10">Frequently Asked Questions</h2>
            
            <div className="space-y-3 max-w-3xl mx-auto">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border border-gray-200 dark:border-white/10 rounded-md overflow-hidden bg-white dark:bg-[#111] transition-all">
                  <button 
                    onClick={() => toggleFaq(idx)} 
                    className="w-full p-5 text-left font-extrabold text-sm flex justify-between items-center gap-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${openFaq === idx ? 'rotate-180 text-indigo-500' : 'text-gray-400'}`} />
                  </button>
                  {openFaq === idx && (
                    <div className="px-5 pb-5 pt-1 text-xs text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-white/5">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <footer className="w-full border-t border-gray-200/60 dark:border-white/10 py-8 relative z-10 bg-white/40 dark:bg-black/40 backdrop-blur-md mt-auto">
        <div className="w-[90%] max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-gray-500 dark:text-gray-400 text-xs font-semibold">
          <div className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300">
            <img src="/CampusGrid.png" alt="CampusGrid" className="w-4 h-4 object-contain" />
            <span>© 2026 CampusGrid Smart Campus Operating System</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-indigo-500 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-500 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-indigo-500 transition-colors">System Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;