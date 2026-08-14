import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, UserPlus, KeyRound, X, CheckCircle2, AlertCircle } from "lucide-react";
import axios from "axios";

function Login() {
  const [rollNo, setRollNo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const [activeModal, setActiveModal] = useState("none");
  const [reqRollNo, setReqRollNo] = useState("");
  const [reqName, setReqName] = useState("");
  const [reqCourse, setReqCourse] = useState("B.Tech");
  const [reqBranch, setReqBranch] = useState("CSE");
  const [reqPassword, setReqPassword] = useState("");
  const [reqReason, setReqReason] = useState("");
  
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        { rollNo, password }
      );
      localStorage.setItem("token", data.token);
      localStorage.setItem("userInfo", JSON.stringify(data));
      window.dispatchEvent(new Event('auth-change'));
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Authentication failed. Verify server connection and credentials.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (type) => {
    setActiveModal(type);
    setModalError("");
    setModalSuccess("");
    setReqRollNo("");
    setReqName("");
    setReqPassword("");
    setReqReason("");
  };

  const closeModal = () => {
    setActiveModal("none");
  };

  const handleAccountRequest = async (e) => {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");
    setIsSubmitting(true);

    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/hub/requests/account`, {
        rollNo: reqReqRollNo(reqRollNo),
        name: reqName,
        course: reqCourse,
        branch: reqBranch,
        requestedPassword: reqPassword
      });
      setModalSuccess(data.message || "Account creation request submitted successfully!");
      setReqRollNo("");
      setReqName("");
      setReqPassword("");
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to submit account request. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");
    setIsSubmitting(true);

    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/hub/requests/reset-password`, {
        rollNo: reqRollNo,
        reason: reqReason || "Forgotten password",
        requestedPassword: reqPassword
      });
      setModalSuccess(data.message || "Password reset request submitted successfully!");
      setReqRollNo("");
      setReqPassword("");
      setReqReason("");
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to submit password reset request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const reqReqRollNo = (val) => val.trim();

  return (
    <div className="relative flex flex-col flex-1 w-full overflow-hidden">
      
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-500/15 to-purple-600/15 blur-[120px] rounded-full pointer-events-none z-0"></div>

      <main className="flex-1 flex items-center justify-center py-20 relative z-10 w-[90%] max-w-7xl mx-auto">
        <div className="w-full max-w-md bg-white/80 dark:bg-[#111]/80 border border-gray-200 dark:border-white/10 rounded-md p-8 sm:p-10 shadow-md relative backdrop-blur-md">
          <h2 className="text-3xl font-black mb-2 text-gray-900 dark:text-white tracking-tight">Institutional Login</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-8 font-medium">
            Enter your college Roll Number and password to access the authenticated campus network.
          </p>

          {error && (
            <div className="mb-6 p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-sm text-red-600 dark:text-red-400 text-xs font-extrabold text-center leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-black mb-1.5 text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Authorized Roll Number
              </label>
              <input
                type="text"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                placeholder="e.g. 2305581"
                className="w-full px-4 py-3.5 rounded-sm bg-gray-100 dark:bg-white/5 border border-transparent dark:border-white/5 focus:bg-white dark:focus:bg-black focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all placeholder-gray-400 text-xs font-bold text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[11px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => openModal("reset")}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3.5 rounded-sm bg-gray-100 dark:bg-white/5 border border-transparent dark:border-white/5 focus:bg-white dark:focus:bg-black focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all placeholder-gray-400 text-xs font-bold text-gray-900 dark:text-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-sm font-black text-sm shadow-md hover:shadow-indigo-500/25 transition-all hover:-translate-y-0.5 mt-2 flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Enter Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-gray-500 font-semibold border-t border-gray-100 dark:border-white/5 pt-6 flex flex-col gap-2">
            <span>Don&apos;t have an institutional profile yet?</span>
            <button
              type="button"
              onClick={() => openModal("account")}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <UserPlus className="w-4 h-4" />
              <span>Request Account Creation</span>
            </button>
          </div>
        </div>
      </main>

      {activeModal !== "none" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-md p-6 sm:p-8 w-full max-w-lg shadow-md relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-2.5 font-black text-lg text-gray-900 dark:text-white">
                {activeModal === "account" ? (
                  <>
                    <UserPlus className="w-5 h-5 text-indigo-500" />
                    <span>Request Institutional Account</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-5 h-5 text-purple-500" />
                    <span>Request Password Reset</span>
                  </>
                )}
              </div>
              <button onClick={closeModal} className="p-2 rounded-sm hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalSuccess && (
              <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-sm text-emerald-700 dark:text-emerald-300 text-xs font-extrabold flex items-center gap-2.5 leading-relaxed">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>{modalSuccess}</span>
              </div>
            )}

            {modalError && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-sm text-red-600 dark:text-red-400 text-xs font-extrabold flex items-center gap-2.5 leading-relaxed">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {activeModal === "account" && (
              <form onSubmit={handleAccountRequest} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black mb-1 text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    College Roll Number
                  </label>
                  <input type="text" placeholder="e.g. 2305581" value={reqRollNo} onChange={(e) => setReqRollNo(e.target.value)} className="w-full px-4 py-3 rounded-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500" required />
                </div>

                <div>
                  <label className="block text-[11px] font-black mb-1 text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input type="text" placeholder="e.g. Ramandeep Bhatia" value={reqName} onChange={(e) => setReqName(e.target.value)} className="w-full px-4 py-3 rounded-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500" required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black mb-1 text-gray-700 dark:text-gray-300 uppercase tracking-wider">Course</label>
                    <select value={reqCourse} onChange={(e) => setReqCourse(e.target.value)} className="w-full px-4 py-3 rounded-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500">
                      <option className="bg-white dark:bg-[#111] text-gray-900 dark:text-white" value="B.Tech">B.Tech</option>
                      <option className="bg-white dark:bg-[#111] text-gray-900 dark:text-white" value="M.Tech">M.Tech</option>
                      <option className="bg-white dark:bg-[#111] text-gray-900 dark:text-white" value="BCA">BCA</option>
                      <option className="bg-white dark:bg-[#111] text-gray-900 dark:text-white" value="MCA">MCA</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black mb-1 text-gray-700 dark:text-gray-300 uppercase tracking-wider">Branch</label>
                    <select value={reqBranch} onChange={(e) => setReqBranch(e.target.value)} className="w-full px-4 py-3 rounded-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500">
                      <option className="bg-white dark:bg-[#111] text-gray-900 dark:text-white" value="CSE">CSE</option>
                      <option className="bg-white dark:bg-[#111] text-gray-900 dark:text-white" value="ECE">ECE</option>
                      <option className="bg-white dark:bg-[#111] text-gray-900 dark:text-white" value="ME">Mechanical</option>
                      <option className="bg-white dark:bg-[#111] text-gray-900 dark:text-white" value="CE">Civil</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black mb-1 text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Initial Requested Password
                  </label>
                  <input type="password" placeholder="Create a strong password" value={reqPassword} onChange={(e) => setReqPassword(e.target.value)} className="w-full px-4 py-3 rounded-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500" required />
                  <p className="text-[10px] text-gray-500 mt-1">You will use this password once an Administrator approves your account.</p>
                </div>

                <div className="pt-2">
                  <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-sm cursor-pointer font-black text-xs transition-all flex justify-center items-center gap-2 shadow-md">
                    {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting Request...</> : "Submit Creation Request"}
                  </button>
                </div>
              </form>
            )}

            {activeModal === "reset" && (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black mb-1 text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Registered Roll Number
                  </label>
                  <input type="text" placeholder="e.g. 2305581" value={reqRollNo} onChange={(e) => setReqRollNo(e.target.value)} className="w-full px-4 py-3 rounded-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-purple-500" required />
                </div>

                <div>
                  <label className="block text-[11px] font-black mb-1 text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    New Requested Password
                  </label>
                  <input type="password" placeholder="Enter your new desired password" value={reqPassword} onChange={(e) => setReqPassword(e.target.value)} className="w-full px-4 py-3 rounded-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-purple-500" required />
                </div>

                <div>
                  <label className="block text-[11px] font-black mb-1 text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Reason for Reset (Optional)
                  </label>
                  <textarea placeholder="e.g. Forgot password / Account locked" value={reqReason} onChange={(e) => setReqReason(e.target.value)} rows="2" className="w-full px-4 py-2.5 rounded-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-purple-500 resize-none" />
                </div>

                <div className="pt-2">
                  <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-sm font-black text-xs transition-all flex justify-center items-center gap-2 shadow-md">
                    {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending to Admin...</> : "Submit Reset Request"}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      <footer className="w-full border-t border-gray-200/60 dark:border-white/10 py-6 relative z-10 bg-white/40 dark:bg-black/40 backdrop-blur-md mt-auto">
        <div className="w-[90%] max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-gray-500 dark:text-gray-400 text-xs font-semibold">
          <div>© 2026 CampusGrid Smart Campus Operating System. All rights reserved.</div>
          <div className="flex gap-6">
            <Link to="/" className="hover:text-indigo-500 transition-colors">Home Portal</Link>
            <a href="#" className="hover:text-indigo-500 transition-colors">Admin Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Login;