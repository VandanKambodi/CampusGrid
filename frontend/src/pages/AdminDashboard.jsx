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
  const [reports, setReports] = useState([]);
  const [reportsPage, setReportsPage] = useState(1);
  const [adminContent, setAdminContent] = useState({ polls: [], surveys: [], feedback: [] });
  const [contentResults, setContentResults] = useState({ polls: {}, surveys: {} });
  const [contentType, setContentType] = useState('poll');
  const [contentForm, setContentForm] = useState({
    title: '',
    description: '',
    targetBranch: 'all',
    status: 'Published',
    options: ['Option 1', 'Option 2'],
    feedbackUrl: '',
    questions: [{ question: '', type: 'singleChoice', options: ['Option 1', 'Option 2'] }],
  });
  const [creatingContent, setCreatingContent] = useState(false);

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

  const fetchReports = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/chat/reports`, { headers: { Authorization: `Bearer ${token}` } });
      setReports(data);
    } catch (err) {
      console.error('Failed to fetch chat reports', err);
    }
  };

  const fetchAdminContent = async () => {
    try {
      const [pollsRes, surveysRes, feedbackRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/polls`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/surveys`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/feedback`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const polls = pollsRes.data || [];
      const surveys = surveysRes.data || [];

      const pollResults = await Promise.all(
        polls.map(async (poll) => {
          try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/polls/${poll._id}/results`, { headers: { Authorization: `Bearer ${token}` } });
            return [poll._id, data];
          } catch (err) {
            return [poll._id, { totalVotes: 0, options: [] }];
          }
        })
      );

      const surveyResults = await Promise.all(
        surveys.map(async (survey) => {
          try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/surveys/${survey._id}/results`, { headers: { Authorization: `Bearer ${token}` } });
            return [survey._id, data];
          } catch (err) {
            return [survey._id, { totalSubmissions: 0, questions: [] }];
          }
        })
      );

      setAdminContent({
        polls: pollsRes.data || [],
        surveys: surveysRes.data || [],
        feedback: feedbackRes.data || []
      });

      setContentResults({
        polls: Object.fromEntries(pollResults),
        surveys: Object.fromEntries(surveyResults)
      });
    } catch (err) {
      console.error('Failed to fetch admin content', err);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
    fetchStudents();
    fetchReports();
    fetchAdminContent();
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

  const updateReportStatus = async (reportId, status) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/chat/reports/${reportId}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      fetchReports();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to update report.');
    }
  };

  const updateContentField = (field, value) => {
    setContentForm((prev) => ({ ...prev, [field]: value }));
  };

  const addPollOption = () => {
    setContentForm((prev) => ({ ...prev, options: [...prev.options, ''] }));
  };

  const updatePollOption = (index, value) => {
    setContentForm((prev) => ({
      ...prev,
      options: prev.options.map((option, optionIndex) => optionIndex === index ? value : option)
    }));
  };

  const addSurveyQuestion = () => {
    setContentForm((prev) => ({
      ...prev,
      questions: [...prev.questions, { question: '', type: 'singleChoice', options: ['Option 1', 'Option 2'] }]
    }));
  };

  const updateSurveyQuestion = (questionIndex, field, value) => {
    setContentForm((prev) => ({
      ...prev,
      questions: prev.questions.map((question, index) => index === questionIndex ? { ...question, [field]: value } : question)
    }));
  };

  const addSurveyChoice = (questionIndex) => {
    setContentForm((prev) => ({
      ...prev,
      questions: prev.questions.map((question, index) => index === questionIndex
        ? { ...question, options: [...(question.options || []), `Option ${((question.options || []).length + 1)}`] }
        : question)
    }));
  };

  const updateSurveyChoice = (questionIndex, optionIndex, value) => {
    setContentForm((prev) => ({
      ...prev,
      questions: prev.questions.map((question, index) => index === questionIndex
        ? { ...question, options: (question.options || []).map((option, optionKey) => optionKey === optionIndex ? value : option) }
        : question)
    }));
  };

  const handleCreateContent = async (e) => {
    e.preventDefault();
    setCreatingContent(true);
    setMessage('');

    try {
      const payload = { ...contentForm };
      if (contentType === 'poll') {
        payload.options = contentForm.options.filter(Boolean).map((value) => ({ text: value }));
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/polls`, payload, { headers: { Authorization: `Bearer ${token}` } });
        setMessage('Poll created successfully.');
      }

      if (contentType === 'survey') {
        const cleanedQuestions = contentForm.questions.map((question) => ({
          ...question,
          options: question.type === 'textAnswer' ? [] : (question.options || []).filter(Boolean)
        }));
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/surveys`, { ...payload, questions: cleanedQuestions }, { headers: { Authorization: `Bearer ${token}` } });
        setMessage('Survey created successfully.');
      }

      if (contentType === 'feedback') {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/feedback`, payload, { headers: { Authorization: `Bearer ${token}` } });
        setMessage('Feedback form created successfully.');
      }

      setContentForm({
        title: '',
        description: '',
        targetBranch: 'all',
        status: 'Published',
        options: ['Option 1', 'Option 2'],
        feedbackUrl: '',
        questions: [{ question: '', type: 'singleChoice', options: ['Option 1', 'Option 2'] }],
      });
      fetchAdminContent();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to create the content item.');
    } finally {
      setCreatingContent(false);
    }
  };

  const renderPollSummary = (item) => {
    const result = contentResults.polls[item._id] || { totalVotes: 0, options: [] };
    return (
      <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 dark:border-indigo-500/20 dark:bg-indigo-500/10">
        <div className="mb-2 text-[10px] font-black uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Poll Results</div>
        <div className="text-[11px] font-bold text-gray-600 dark:text-gray-300">Total votes: {result.totalVotes || 0}</div>
        <div className="mt-2 space-y-2">
          {(result.options || []).map((option) => (
            <div key={`${item._id}-${option.text}`}>
              <div className="flex items-center justify-between text-[10px] text-gray-600 dark:text-gray-300">
                <span>{option.text}</span>
                <span>{option.percentage || 0}%</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-white/80 dark:bg-white/10">
                <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${option.percentage || 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSurveySummary = (item) => {
    const result = contentResults.surveys[item._id] || { totalSubmissions: 0, questions: [] };
    return (
      <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50/70 p-3 dark:border-violet-500/20 dark:bg-violet-500/10">
        <div className="mb-2 text-[10px] font-black uppercase tracking-wide text-violet-700 dark:text-violet-300">Survey Results</div>
        <div className="text-[11px] font-bold text-gray-600 dark:text-gray-300">Submissions: {result.totalSubmissions || 0}</div>
        <div className="mt-2 space-y-2">
          {(result.questions || []).map((question) => (
            <div key={`${item._id}-${question.questionIndex}`} className="rounded-lg border border-violet-100 bg-white/60 p-2 dark:border-violet-500/20 dark:bg-[#141414]">
              <div className="text-[10px] font-bold text-gray-700 dark:text-gray-200">{question.question}</div>
              {question.type === 'textAnswer' ? (
                <div className="mt-1 text-[10px] text-gray-600 dark:text-gray-300">{(question.responses || []).slice(0, 3).map((response, index) => <div key={`${question.questionIndex}-${index}`}>{response}</div>)}</div>
              ) : (
                <div className="mt-2 space-y-1">
                  {(question.options || []).map((option) => (
                    <div key={`${item._id}-${question.questionIndex}-${option.text}`}>
                      <div className="flex items-center justify-between text-[10px] text-gray-600 dark:text-gray-300">
                        <span>{option.text}</span>
                        <span>{option.percentage || 0}%</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-white/80 dark:bg-white/10">
                        <div className="h-2 rounded-full bg-violet-500" style={{ width: `${option.percentage || 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const deleteReportedAccount = async (report) => {
    const reportedUser = report.reportedUser;
    if (!reportedUser?._id || !window.confirm(`Delete ${reportedUser.name}'s account? This cannot be undone.`)) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/hub/admin/users/${reportedUser._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await updateReportStatus(report._id, 'resolved');
      setMessage(`${reportedUser.name}'s account was deleted and the report was resolved.`);
      fetchStudents();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to delete the reported account.');
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
  const reportPages = Math.ceil(reports.length / itemsPerPage) || 1;
  const currentReports = reports.slice((reportsPage - 1) * itemsPerPage, reportsPage * itemsPerPage);

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

      {/* <div className="bg-white dark:bg-[#111112] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap gap-2">
          {['poll', 'survey', 'feedback'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setContentType(type)}
              className={`rounded-xl px-3 py-2 text-xs font-extrabold uppercase tracking-wide ${contentType === type ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300'}`}
            >
              {type === 'poll' ? 'Create Poll' : type === 'survey' ? 'Create Survey' : 'Add Feedback'}
            </button>
          ))}
        </div>

        <form onSubmit={handleCreateContent} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Title</label>
              <input value={contentForm.title} onChange={(e) => updateContentField('title', e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" required />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Description</label>
              <textarea value={contentForm.description} onChange={(e) => updateContentField('description', e.target.value)} rows="3" className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" />
            </div>

            {contentType !== 'feedback' && (
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Target Branch</label>
                <select value={contentForm.targetBranch} onChange={(e) => updateContentField('targetBranch', e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white">
                  <option value="all">All Branches</option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Civil">Civil</option>
                </select>
              </div>
            )}

            {contentType === 'feedback' && (
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Feedback URL</label>
                <input value={contentForm.feedbackUrl} onChange={(e) => updateContentField('feedbackUrl', e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" placeholder="https://forms.google.com/..." required />
              </div>
            )}

            {contentType === 'poll' && (
              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Poll Options</label>
                {contentForm.options.map((option, index) => (
                  <div key={`poll-option-${index}`} className="flex gap-2">
                    <input value={option} onChange={(e) => updatePollOption(index, e.target.value)} className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" placeholder={`Option ${index + 1}`} />
                  </div>
                ))}
                <button type="button" onClick={addPollOption} className="text-xs font-bold text-indigo-600 dark:text-indigo-300">+ Add Option</button>
              </div>
            )}

            {contentType === 'survey' && (
              <div className="md:col-span-2 space-y-3">
                {contentForm.questions.map((question, questionIndex) => (
                  <div key={`survey-question-${questionIndex}`} className="rounded-xl border border-gray-200 p-3 dark:border-white/10">
                    <div className="flex items-center justify-between gap-3">
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Question {questionIndex + 1}</label>
                      {(questionIndex > 0) && <button type="button" onClick={() => setContentForm((prev) => ({ ...prev, questions: prev.questions.filter((_, index) => index !== questionIndex) }))} className="text-[10px] font-bold text-red-500">Remove</button>}
                    </div>
                    <input value={question.question} onChange={(e) => updateSurveyQuestion(questionIndex, 'question', e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" placeholder="How useful was the workshop?" />
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <select value={question.type} onChange={(e) => updateSurveyQuestion(questionIndex, 'type', e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white">
                        <option value="singleChoice">Single Choice</option>
                        <option value="multipleChoice">Multiple Choice</option>
                        <option value="textAnswer">Text Answer</option>
                      </select>
                      <select value={contentForm.targetBranch} onChange={(e) => updateContentField('targetBranch', e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white">
                        <option value="all">All Branches</option>
                        <option value="CSE">CSE</option>
                        <option value="ECE">ECE</option>
                        <option value="Mechanical">Mechanical</option>
                        <option value="Civil">Civil</option>
                      </select>
                    </div>
                    {question.type !== 'textAnswer' && (
                      <div className="mt-3 space-y-2">
                        {(question.options || []).map((option, optionIndex) => (
                          <input key={`${questionIndex}-option-${optionIndex}`} value={option} onChange={(e) => updateSurveyChoice(questionIndex, optionIndex, e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#0d0d0d] dark:text-white" />
                        ))}
                        <button type="button" onClick={() => addSurveyChoice(questionIndex)} className="text-xs font-bold text-indigo-600 dark:text-indigo-300">+ Add Choice</button>
                      </div>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addSurveyQuestion} className="text-xs font-bold text-indigo-600 dark:text-indigo-300">+ Add Question</button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-white/10">
            <button type="submit" disabled={creatingContent} className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-black text-white disabled:opacity-60">
              {creatingContent ? 'Saving...' : contentType === 'poll' ? 'Publish Poll' : contentType === 'survey' ? 'Publish Survey' : 'Publish Feedback'}
            </button>
          </div>
        </form>
      </div>

      </div> */}

      {/* <div className="bg-white dark:bg-[#111112] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">Published Content</h2>
        <div className="space-y-4">
          {adminContent.polls.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead><tr className="border-b border-gray-100 dark:border-white/10 text-[10px] uppercase text-gray-400"><th className="py-2">Title</th><th>Type</th><th>Branch</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>{adminContent.polls.slice(0, 5).map((item) => <tr key={item._id}><td className="py-2 font-bold align-top">{item.title}{renderPollSummary(item)}</td><td className="align-top">Poll</td><td className="align-top">{item.targetBranch}</td><td className="align-top">{item.status}</td><td className="align-top"><div className="flex gap-2"><button type="button" onClick={() => { setContentType('poll'); setContentForm({ title: item.title || '', description: item.description || '', targetBranch: item.targetBranch || 'all', status: item.status || 'Published', options: (item.options || []).map((option) => option.text || option), feedbackUrl: '', questions: [{ question: '', type: 'singleChoice', options: ['Option 1', 'Option 2'] }]}); }} className="text-indigo-600 dark:text-indigo-300 font-bold">Edit</button><button type="button" onClick={() => axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/polls/${item._id}`, { headers: { Authorization: `Bearer ${token}` } }).then(() => { setMessage('Poll deleted successfully.'); fetchAdminContent(); }).catch(() => setMessage('Unable to delete the poll.'))} className="text-red-500 font-bold">Delete</button>{item.status !== 'Published' ? <button type="button" onClick={() => axios.patch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/polls/${item._id}/publish`, {}, { headers: { Authorization: `Bearer ${token}` } }).then(() => { setMessage('Poll published successfully.'); fetchAdminContent(); }).catch(() => setMessage('Unable to publish the poll.'))} className="text-emerald-600 font-bold">Publish</button> : <button type="button" onClick={() => axios.patch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/polls/${item._id}/archive`, {}, { headers: { Authorization: `Bearer ${token}` } }).then(() => { setMessage('Poll archived successfully.'); fetchAdminContent(); }).catch(() => setMessage('Unable to archive the poll.'))} className="text-amber-600 font-bold">Archive</button>}</div></td></tr>)}</tbody>
              </table>
            </div>
          )}
          {adminContent.surveys.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead><tr className="border-b border-gray-100 dark:border-white/10 text-[10px] uppercase text-gray-400"><th className="py-2">Title</th><th>Type</th><th>Branch</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>{adminContent.surveys.slice(0, 5).map((item) => <tr key={item._id}><td className="py-2 font-bold align-top">{item.title}{renderSurveySummary(item)}</td><td className="align-top">Survey</td><td className="align-top">{item.targetBranch}</td><td className="align-top">{item.status}</td><td className="align-top"><div className="flex gap-2"><button type="button" onClick={() => { setContentType('survey'); setContentForm({ title: item.title || '', description: item.description || '', targetBranch: item.targetBranch || 'all', status: item.status || 'Published', options: ['Option 1', 'Option 2'], feedbackUrl: '', questions: (item.questions || []).map((question) => ({ question: question.question || '', type: question.type || 'singleChoice', options: question.options || ['Option 1', 'Option 2'] })) }); }} className="text-indigo-600 dark:text-indigo-300 font-bold">Edit</button><button type="button" onClick={() => axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/surveys/${item._id}`, { headers: { Authorization: `Bearer ${token}` } }).then(() => { setMessage('Survey deleted successfully.'); fetchAdminContent(); }).catch(() => setMessage('Unable to delete the survey.'))} className="text-red-500 font-bold">Delete</button>{item.status !== 'Published' ? <button type="button" onClick={() => axios.patch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/surveys/${item._id}/publish`, {}, { headers: { Authorization: `Bearer ${token}` } }).then(() => { setMessage('Survey published successfully.'); fetchAdminContent(); }).catch(() => setMessage('Unable to publish the survey.'))} className="text-emerald-600 font-bold">Publish</button> : <button type="button" onClick={() => axios.patch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/surveys/${item._id}/archive`, {}, { headers: { Authorization: `Bearer ${token}` } }).then(() => { setMessage('Survey archived successfully.'); fetchAdminContent(); }).catch(() => setMessage('Unable to archive the survey.'))} className="text-amber-600 font-bold">Archive</button>}</div></td></tr>)}</tbody>
              </table>
            </div>
          )}
          {adminContent.feedback.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead><tr className="border-b border-gray-100 dark:border-white/10 text-[10px] uppercase text-gray-400"><th className="py-2">Title</th><th>Type</th><th>Branch</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>{adminContent.feedback.slice(0, 5).map((item) => <tr key={item._id}><td className="py-2 font-bold align-top">{item.title}</td><td className="align-top">Feedback</td><td className="align-top">{item.targetBranch}</td><td className="align-top">{item.status}</td><td className="align-top"><div className="flex gap-2"><button type="button" onClick={() => { setContentType('feedback'); setContentForm({ title: item.title || '', description: item.description || '', targetBranch: item.targetBranch || 'all', status: item.status || 'Published', options: ['Option 1', 'Option 2'], feedbackUrl: item.feedbackUrl || '', questions: [{ question: '', type: 'singleChoice', options: ['Option 1', 'Option 2'] }] }); }} className="text-indigo-600 dark:text-indigo-300 font-bold">Edit</button><button type="button" onClick={() => axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/feedback/${item._id}`, { headers: { Authorization: `Bearer ${token}` } }).then(() => { setMessage('Feedback deleted successfully.'); fetchAdminContent(); }).catch(() => setMessage('Unable to delete the feedback form.'))} className="text-red-500 font-bold">Delete</button>{item.status !== 'Published' ? <button type="button" onClick={() => axios.patch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/feedback/${item._id}/publish`, {}, { headers: { Authorization: `Bearer ${token}` } }).then(() => { setMessage('Feedback published successfully.'); fetchAdminContent(); }).catch(() => setMessage('Unable to publish the feedback form.'))} className="text-emerald-600 font-bold">Publish</button> : <button type="button" onClick={() => axios.patch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/feedback/${item._id}/archive`, {}, { headers: { Authorization: `Bearer ${token}` } }).then(() => { setMessage('Feedback archived successfully.'); fetchAdminContent(); }).catch(() => setMessage('Unable to archive the feedback form.'))} className="text-amber-600 font-bold">Archive</button>}</div></td></tr>)}</tbody>
              </table>
            </div>
          )}
          {adminContent.polls.length === 0 && adminContent.surveys.length === 0 && adminContent.feedback.length === 0 && <p className="text-xs text-gray-500">No content created yet.</p>}
        </div>
      </div> */}

      <div className="bg-white dark:bg-[#111112] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /> Chat Reports ({reports.length})</h2>
        {reports.length === 0 ? <p className="text-xs text-gray-500">No chat reports have been submitted.</p> : <><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-gray-100 dark:border-white/10 text-[10px] uppercase text-gray-400"><th className="py-2">Reported user</th><th>Reason</th><th>Status</th><th className="text-right">Admin decision</th></tr></thead><tbody className="divide-y divide-gray-100 dark:divide-white/5">{currentReports.map(report => <tr key={report._id}><td className="py-3 font-bold text-gray-900 dark:text-white">{report.reportedUser?.name || 'Unknown'}</td><td className="capitalize text-gray-500">{report.reason}</td><td className="capitalize text-gray-500">{report.status}</td><td className="text-right"><div className="flex justify-end gap-2">{report.status !== 'resolved' && <button onClick={() => updateReportStatus(report._id, report.status === 'pending' ? 'reviewed' : 'resolved')} className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white font-bold">{report.status === 'pending' ? 'Mark reviewed' : 'Resolve'}</button>}{report.reportedUser?._id && report.status !== 'resolved' && <button onClick={() => deleteReportedAccount(report)} className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white font-bold">Delete account</button>}</div></td></tr>)}</tbody></table></div><div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs dark:border-white/10"><button onClick={() => setReportsPage((page) => Math.max(1, page - 1))} disabled={reportsPage === 1} className="rounded-lg bg-gray-100 px-3 py-1.5 font-bold text-gray-700 disabled:opacity-40 dark:bg-white/5 dark:text-gray-300">Previous</button><span className="font-semibold text-gray-500">Page {reportsPage} of {reportPages}</span><button onClick={() => setReportsPage((page) => Math.min(reportPages, page + 1))} disabled={reportsPage === reportPages} className="rounded-lg bg-indigo-600 px-3 py-1.5 font-bold text-white disabled:opacity-40">Next</button></div></>}
      </div>

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
