import { useState, useEffect } from 'react';
import axios from 'axios';
import Loader from '../components/Loader';
import ConfirmModal from '../components/ConfirmModal';
import { 
  ShieldCheck, 
  UserPlus, 
  CheckCircle, 
  XCircle, 
  KeyRound, 
  Clock, 
  User, 
  Lock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Users,
  X
} from 'lucide-react';

function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [message, setMessage] = useState('');

  // Pagination for Students Table
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Change Password Modal State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newPasswordForUser, setNewPasswordForUser] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordModalError, setPasswordModalError] = useState('');

  // Direct Student Creation Form State
  const [newRollNo, setNewRollNo] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newCourse, setNewCourse] = useState('B.Tech');
  const [newBranch, setNewBranch] = useState('CSE');
  const [creatingUser, setCreatingUser] = useState(false);
  const [createSuccess, setCreateSuccess] = useState('');
  const [createError, setCreateError] = useState('');

  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/hub/admin/requests`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests(data);
    } catch (err) {
      console.error('Failed to fetch requests', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStudents(data);
    } catch (err) {
      console.error('Failed to fetch students', err);
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
    fetchStudents();
  }, []);

  const handleProcessRequest = async (requestId, status) => {
    setProcessingId(requestId);
    setMessage('');
    try {
      const { data } = await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/hub/admin/requests/${requestId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(data.message);
      fetchPendingRequests();
      fetchStudents();
    } catch (err) {
      console.error('Request action failed', err);
    } finally {
      setProcessingId(null);
    }
  };

  const [deleteStudentTarget, setDeleteStudentTarget] = useState(null);

  const executeRemoveStudent = async () => {
    if (!deleteStudentTarget) return;
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/hub/admin/users/${deleteStudentTarget.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`Student account "${deleteStudentTarget.name}" removed successfully.`);
      setDeleteStudentTarget(null);
      fetchStudents();
    } catch (err) {
      console.error('Delete student error', err);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPasswordForUser.trim()) {
      setPasswordModalError('Password cannot be empty.');
      return;
    }

    setChangingPassword(true);
    setPasswordModalError('');

    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/hub/admin/users/${selectedStudent._id}/password`,
        { newPassword: newPasswordForUser },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`Password for ${selectedStudent.name} updated successfully.`);
      setSelectedStudent(null);
      setNewPasswordForUser('');
    } catch (err) {
      setPasswordModalError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDirectCreateUser = async (e) => {
    e.preventDefault();
    if (!newRollNo.trim() || !newName.trim() || !newPassword.trim()) {
      setCreateError('Roll number, name, and password are required.');
      return;
    }

    setCreatingUser(true);
    setCreateError('');
    setCreateSuccess('');

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/hub/admin/users`,
        {
          rollNo: newRollNo,
          name: newName,
          password: newPassword,
          course: newCourse,
          branch: newBranch
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCreateSuccess(`Student ${data.name} (${data.rollNo}) created successfully!`);
      setNewRollNo('');
      setNewName('');
      setNewPassword('');
      fetchStudents();
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create student account');
    } finally {
      setCreatingUser(false);
    }
  };

  if (!currentUser.isAdmin && currentUser.role !== 'admin') {
    return (
      <div className="text-center py-16 max-w-md mx-auto space-y-4">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
        <p className="text-xs text-gray-500">You must be a system administrator to access this management dashboard.</p>
      </div>
    );
  }

  // Pagination calculation for Students Table
  const totalPages = Math.ceil(students.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = students.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-purple-400" /> Admin Command Center
        </h1>
        <p className="text-xs sm:text-sm text-purple-200">
          Manage registered students, approve account creation & password reset requests, or manually provision credentials.
        </p>
      </div>

      {message && (
        <div className="p-3.5 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300 text-xs font-semibold rounded-xl border border-green-200 dark:border-green-500/20 flex justify-between items-center">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Student Accounts Table with Pagination (Limit 5) */}
      <div className="bg-white dark:bg-[#111112] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" /> Registered Students Directory ({students.length})
          </h2>
          <span className="text-xs font-semibold text-gray-400">Showing {itemsPerPage} per page</span>
        </div>

        {studentsLoading ? (
          <Loader text="Loading Registered Students..." />
        ) : students.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-500 dark:text-gray-400">
            No student accounts registered yet.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/10 text-[11px] uppercase tracking-wider text-gray-400 font-bold">
                    <th className="py-3 px-3">Student</th>
                    <th className="py-3 px-3">Roll Number</th>
                    <th className="py-3 px-3">Course / Branch</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-xs text-gray-800 dark:text-gray-200">
                  {currentStudents.map(student => (
                    <tr key={student._id} className="hover:bg-gray-50/50 dark:hover:bg-white/5">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-gray-200 dark:border-white/10 bg-indigo-600 flex items-center justify-center">
                            <img 
                              src={student.profilePicture && student.profilePicture.trim() !== '' ? student.profilePicture : `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || student.rollNo || 'S')}&background=6366f1&color=fff&bold=true`}
                              alt={student.name || student.rollNo}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white">{student.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{student.rollNo}</td>
                      <td className="py-3.5 px-3">
                        <span className="font-semibold">{student.branch || 'CSE'}</span>
                        <span className="text-[10px] text-gray-400 block">{student.course || 'B.Tech'}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                          student.role === 'admin'
                            ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300'
                        }`}>
                          {student.role || 'student'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setSelectedStudent(student); setNewPasswordForUser(''); setPasswordModalError(''); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition-all"
                            title="Reset Student Password"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-500" /> Password
                          </button>
                          
                          {student.role !== 'admin' && (
                            <button
                              onClick={() => setDeleteStudentTarget({ id: student._id, name: student.name })}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                              title="Delete Student Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/10 text-xs">
              <span className="text-gray-500 dark:text-gray-400 font-medium">
                Page {currentPage} of {totalPages} ({students.length} Total Students)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-white/5 disabled:opacity-40 text-gray-700 dark:text-gray-300 rounded-lg font-bold text-xs cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        currentPage === page
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-white/5 disabled:opacity-40 text-gray-700 dark:text-gray-300 rounded-lg font-bold text-xs cursor-pointer"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Change Password Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#151516] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-white/10">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-500" /> Reset Password for {selectedStudent.name}
              </h3>
              <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordModalError && (
              <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs rounded-lg border border-red-200">
                {passwordModalError}
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  New Password for {selectedStudent.rollNo}
                </label>
                <input 
                  type="password"
                  placeholder="Enter new password"
                  value={newPasswordForUser}
                  onChange={(e) => setNewPasswordForUser(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-white/10">
                <button 
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="px-4 py-2 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={changingPassword}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm"
                >
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pending Requests Section */}
      <div className="bg-white dark:bg-[#111112] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" /> Pending Requests ({requests.length})
        </h2>

        {loading ? (
          <Loader text="Loading Pending Requests..." />
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-500 dark:text-gray-400">
            No pending student account or password reset requests at this time.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10 text-[11px] uppercase tracking-wider text-gray-400 font-bold">
                  <th className="py-3 px-3">Request Type</th>
                  <th className="py-3 px-3">Roll No</th>
                  <th className="py-3 px-3">Name / Branch</th>
                  <th className="py-3 px-3">Req. Password</th>
                  <th className="py-3 px-3">Reason</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-xs text-gray-800 dark:text-gray-200">
                {requests.map(req => (
                  <tr key={req._id} className="hover:bg-gray-50/50 dark:hover:bg-white/5">
                    <td className="py-3.5 px-3">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                        req.type === 'account_creation'
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                      }`}>
                        {req.type === 'account_creation' ? 'New Account' : 'Password Reset'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold">{req.rollNo}</td>
                    <td className="py-3.5 px-3">
                      <span className="font-bold block">{req.name || 'N/A'}</span>
                      <span className="text-[10px] text-gray-400">{req.branch || 'CSE'} ({req.course || 'B.Tech'})</span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{req.requestedPassword}</td>
                    <td className="py-3.5 px-3 text-gray-500 dark:text-gray-400 max-w-xs truncate">{req.reason || 'No reason specified'}</td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleProcessRequest(req._id, 'approved')}
                          disabled={processingId === req._id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleProcessRequest(req._id, 'rejected')}
                          disabled={processingId === req._id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Direct Student Provisioning Form */}
      <div className="bg-white dark:bg-[#111112] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
        <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-indigo-500" /> Direct Student Account Provisioning
        </h2>

        {createSuccess && (
          <div className="p-3 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300 text-xs rounded-lg border border-green-200">
            {createSuccess}
          </div>
        )}

        {createError && (
          <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs rounded-lg border border-red-200">
            {createError}
          </div>
        )}

        <form onSubmit={handleDirectCreateUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Roll Number</label>
              <input 
                type="text"
                placeholder="e.g. 23IT052"
                value={newRollNo}
                onChange={(e) => setNewRollNo(e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Student Full Name</label>
              <input 
                type="text"
                placeholder="e.g. Alex Mercer"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Initial Password</label>
              <input 
                type="password"
                placeholder="Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Course</label>
              <input 
                type="text"
                value={newCourse}
                onChange={(e) => setNewCourse(e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Branch</label>
              <input 
                type="text"
                value={newBranch}
                onChange={(e) => setNewBranch(e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={creatingUser}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            {creatingUser ? 'Provisioning Student...' : 'Create Student Account'}
          </button>
        </form>
      </div>

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

export default AdminDashboard;
