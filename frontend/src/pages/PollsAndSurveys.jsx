import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { BarChart3, ClipboardList, MessageSquareText, Vote, ExternalLink, CheckCircle2, AlertCircle, LoaderCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const branchOptions = ['all', 'CSE', 'ECE', 'Mechanical', 'Civil'];
const tabs = ['all', 'polls', 'surveys', 'feedback'];

const getUser = () => JSON.parse(localStorage.getItem('userInfo') || '{}');

function PollsAndSurveys() {
  const [tab, setTab] = useState('all');
  const [polls, setPolls] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [surveyAnswers, setSurveyAnswers] = useState({});
  const [isSubmittingSurvey, setIsSubmittingSurvey] = useState({});
  const [isVoting, setIsVoting] = useState({});

  const token = localStorage.getItem('token');
  const user = useMemo(() => getUser(), []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError('');
      const [pollRes, surveyRes, feedbackRes] = await Promise.all([
        axios.get(`${API_URL}/api/polls`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/surveys`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/feedback`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setPolls(pollRes.data || []);
      setSurveys(surveyRes.data || []);
      setFeedback(feedbackRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load polls and surveys right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSurveyAnswer = (surveyId, questionIndex, value) => {
    setSurveyAnswers((prev) => ({
      ...prev,
      [surveyId]: {
        ...(prev[surveyId] || {}),
        [questionIndex]: value
      }
    }));
  };

  const handleVote = async (pollId, optionText) => {
    if (isVoting[pollId]) return;
    setIsVoting((prev) => ({ ...prev, [pollId]: true }));

    try {
      await axios.post(
        `${API_URL}/api/polls/${pollId}/vote`,
        { option: optionText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchContent();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to submit your vote right now.');
    } finally {
      setIsVoting((prev) => ({ ...prev, [pollId]: false }));
    }
  };

  const handleSurveySubmit = async (surveyId, survey) => {
    const questions = survey.questions || [];
    const answers = questions.map((question, index) => ({
      questionIndex: index,
      answer: surveyAnswers[surveyId]?.[index] ?? ''
    }));

    if (answers.some((item) => item.answer === '' || item.answer === null || item.answer === undefined)) {
      setError('Please answer all required survey questions before submitting.');
      return;
    }

    setIsSubmittingSurvey((prev) => ({ ...prev, [surveyId]: true }));
    try {
      await axios.post(
        `${API_URL}/api/surveys/${surveyId}/submit`,
        { answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchContent();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to submit the survey.');
    } finally {
      setIsSubmittingSurvey((prev) => ({ ...prev, [surveyId]: false }));
    }
  };

  const filteredPolls = polls.filter((poll) => tab === 'all' || tab === 'polls');
  const filteredSurveys = surveys.filter((survey) => tab === 'all' || tab === 'surveys');
  const filteredFeedback = feedback.filter((item) => tab === 'all' || tab === 'feedback');

  const renderPollCard = (poll) => (
    <div key={poll._id} className="rounded-2xl border border-indigo-200/60 dark:border-indigo-500/20 bg-white/80 dark:bg-[#121212] p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
          <Vote className="w-3.5 h-3.5" /> Poll
        </span>
        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">Target: {poll.targetBranch || 'all'}</span>
      </div>

      <h3 className="text-xl font-black text-gray-900 dark:text-white">{poll.title}</h3>
      {poll.description && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{poll.description}</p>}

      <div className="mt-4 space-y-2">
        {poll.options?.map((option) => {
          const selected = poll.selectedOption === option.text;
          const isDisabled = !poll.canVote || isVoting[poll._id];
          const showResults = poll.hasVoted || poll.status === 'Closed';

          return (
            <div key={`${poll._id}-${option.text}`} className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-2.5">
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                  <input
                    type="radio"
                    name={`poll-${poll._id}`}
                    checked={selected}
                    onChange={() => handleVote(poll._id, option.text)}
                    disabled={isDisabled}
                    className="h-4 w-4 accent-indigo-600"
                  />
                  <span>{option.text}</span>
                </label>
                {showResults && (
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-300">{option.percentage || 0}%</span>
                )}
              </div>

              {showResults && (
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                    style={{ width: `${option.percentage || 0}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => handleVote(poll._id, poll.selectedOption || poll.options?.[0]?.text)}
          disabled={!poll.canVote || isVoting[poll._id] || !poll.selectedOption}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isVoting[poll._id] ? 'Submitting...' : poll.hasVoted ? 'Update Vote' : 'Vote'}
        </button>

        <div className="text-xs text-gray-600 dark:text-gray-300">
          {poll.hasVoted ? (
            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-300"><CheckCircle2 className="w-4 h-4" /> You voted for {poll.selectedOption}</span>
          ) : (
            <span className="font-semibold">Total votes: {poll.totalVotes || 0}</span>
          )}
        </div>
      </div>

      {poll.hasVoted && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          <div className="font-bold">Results</div>
          {poll.results?.map((option) => (
            <div key={option.text} className="mt-2 flex items-center justify-between gap-3">
              <span className="w-24 truncate font-semibold">{option.text}</span>
              <div className="flex-1 h-2.5 rounded-full bg-gray-200 dark:bg-white/10">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${option.percentage}%` }} />
              </div>
              <span className="w-12 text-right font-bold">{option.percentage}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSurveyCard = (survey) => {
    const answers = surveyAnswers[survey._id] || {};
    const existingAnswers = survey.submittedAnswers || [];
    const answersByIndex = {};
    existingAnswers.forEach((entry) => {
      answersByIndex[entry.questionIndex] = entry.answer;
    });
    const canSubmit = survey.status === 'Published';

    return (
      <div key={survey._id} className="rounded-2xl border border-violet-200/60 dark:border-violet-500/20 bg-white/80 dark:bg-[#121212] p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
            <ClipboardList className="w-3.5 h-3.5" /> Survey
          </span>
          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">Target: {survey.targetBranch || 'all'}</span>
        </div>

        <h3 className="text-xl font-black text-gray-900 dark:text-white">{survey.title}</h3>
        {survey.description && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{survey.description}</p>}
        <p className="mt-3 text-xs font-bold text-gray-500 dark:text-gray-400">{survey.questions?.length || 0} questions</p>

        {canSubmit ? (
          <div className="mt-4 space-y-4">
            {survey.questions?.map((question, index) => (
              <div key={`${survey._id}-${index}`} className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3">
                <div className="mb-2 text-sm font-bold text-gray-800 dark:text-gray-100">{index + 1}. {question.question}</div>

                {question.type === 'textAnswer' ? (
                  <textarea
                    rows="3"
                    value={answers[index] ?? answersByIndex[index] ?? ''}
                    onChange={(e) => updateSurveyAnswer(survey._id, index, e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-white/10 dark:bg-[#0c0c0c] dark:text-gray-100"
                    placeholder="Write your answer here..."
                  />
                ) : question.type === 'multipleChoice' ? (
                  <div className="space-y-2">
                    {question.options?.map((option) => {
                      const currentValue = Array.isArray(answers[index]) ? answers[index] : Array.isArray(answersByIndex[index]) ? answersByIndex[index] : [];
                      const selected = currentValue.includes(option);
                      return (
                        <label key={option} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(e) => {
                              const existing = Array.isArray(answers[index]) ? answers[index] : Array.isArray(answersByIndex[index]) ? answersByIndex[index] : [];
                              const next = e.target.checked ? [...existing, option] : existing.filter((item) => item !== option);
                              updateSurveyAnswer(survey._id, index, next);
                            }}
                            className="h-4 w-4 accent-violet-600"
                          />
                          <span>{option}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {question.options?.map((option) => (
                      <label key={option} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                        <input
                          type="radio"
                          name={`survey-${survey._id}-${index}`}
                          checked={(answers[index] ?? answersByIndex[index]) === option}
                          onChange={() => updateSurveyAnswer(survey._id, index, option)}
                          className="h-4 w-4 accent-violet-600"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={() => handleSurveySubmit(survey._id, survey)}
              disabled={isSubmittingSurvey[survey._id]}
              className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-black text-white shadow-sm disabled:opacity-60"
            >
              {isSubmittingSurvey[survey._id] ? 'Submitting...' : survey.hasSubmitted ? 'Update Response' : 'Submit Survey'}
            </button>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-xs text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
            {survey.status === 'Closed' ? 'Survey closed.' : 'Survey is not currently available.'}
          </div>
        )}
      </div>
    );
  };

  const renderFeedbackCard = (item) => (
    <div key={item._id} className="rounded-2xl border border-emerald-200/60 dark:border-emerald-500/20 bg-white/80 dark:bg-[#121212] p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">
          <MessageSquareText className="w-3.5 h-3.5" /> Feedback
        </span>
        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">Target: {item.targetBranch || 'all'}</span>
      </div>

      <h3 className="text-xl font-black text-gray-900 dark:text-white">{item.title}</h3>
      {item.description && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{item.description}</p>}

      {item.isActive ? (
        <button
          type="button"
          onClick={() => window.open(item.feedbackUrl, '_blank', 'noopener,noreferrer')}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-sm"
        >
          Give Feedback <ExternalLink className="w-3.5 h-3.5" />
        </button>
      ) : (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-xs text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
          Feedback form is not active.
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300">
        <LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> Loading polls and surveys...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-violet-700 via-indigo-700 to-slate-900 p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-violet-200" />
          <div>
            <h1 className="text-2xl font-black">Polls, Surveys & Feedback</h1>
            <p className="text-xs text-violet-100">Branch-aware campus feedback and engagement.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4" /> <span>{error}</span>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white/80 p-3 dark:border-white/10 dark:bg-[#111112]">
        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wide transition ${
                tab === item
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10'
              }`}
            >
              {item === 'all' ? 'All' : item}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {tab === 'all' || tab === 'polls' ? (
          <div className="space-y-4">
            <h2 className="text-base font-black text-gray-900 dark:text-white">Polls</h2>
            {filteredPolls.length === 0 ? <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">No polls available for your branch right now.</div> : filteredPolls.map(renderPollCard)}
          </div>
        ) : null}

        {tab === 'all' || tab === 'surveys' ? (
          <div className="space-y-4">
            <h2 className="text-base font-black text-gray-900 dark:text-white">Surveys</h2>
            {filteredSurveys.length === 0 ? <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">No surveys available for your branch right now.</div> : filteredSurveys.map(renderSurveyCard)}
          </div>
        ) : null}

        {tab === 'all' || tab === 'feedback' ? (
          <div className="space-y-4">
            <h2 className="text-base font-black text-gray-900 dark:text-white">Feedback</h2>
            {filteredFeedback.length === 0 ? <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">No feedback forms available for your branch right now.</div> : filteredFeedback.map(renderFeedbackCard)}
          </div>
        ) : null}
      </div>

      {user.branch && !branchOptions.includes(user.branch) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
          Your recorded branch is {user.branch}; branch-based visibility is enforced by the backend.
        </div>
      )}
    </div>
  );
}

export default PollsAndSurveys;
