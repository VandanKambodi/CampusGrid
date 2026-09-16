const Poll = require('../models/Poll');
const PollVote = require('../models/PollVote');
const Survey = require('../models/Survey');
const SurveySubmission = require('../models/SurveySubmission');
const Feedback = require('../models/Feedback');

const VALID_BRANCHES = ['all', 'CSE', 'ECE', 'Mechanical', 'Civil'];

const sanitizeText = (value) => {
    if (typeof value !== 'string') return '';
    return value.trim();
};

const isAdminUser = (user) => user && (user.role === 'admin' || user.isAdmin);

const isAllowedForBranch = (targetBranch, userBranch, user) => {
    if (isAdminUser(user)) return true;
    if (!targetBranch || targetBranch === 'all') return true;
    return targetBranch === userBranch;
};

const normalizeBranch = (value) => {
    const cleaned = sanitizeText(value);
    if (!cleaned) return 'all';
    const match = VALID_BRANCHES.find((branch) => branch.toLowerCase() === cleaned.toLowerCase());
    return match || 'all';
};

const normalizeStatus = (value, type) => {
    const cleaned = sanitizeText(value);
    const statuses = {
        poll: ['Draft', 'Published', 'Closed', 'Archived'],
        survey: ['Draft', 'Published', 'Closed', 'Archived'],
        feedback: ['Draft', 'Published', 'Expired', 'Archived']
    };

    if (!cleaned) return statuses[type][0];
    return statuses[type].includes(cleaned) ? cleaned : statuses[type][0];
};

const getPollResultSummary = async (pollId) => {
    const poll = await Poll.findById(pollId);
    if (!poll) return { totalVotes: 0, options: [], votedUsers: 0 };

    const votes = await PollVote.find({ poll: pollId }).lean();
    const totals = poll.options.map((option) => ({
        text: option.text,
        voteCount: 0
    }));

    votes.forEach((vote) => {
        const match = totals.find((option) => option.text === vote.option);
        if (match) match.voteCount += 1;
    });

    const totalVotes = totals.reduce((sum, option) => sum + option.voteCount, 0);

    return {
        totalVotes,
        options: totals.map((option) => ({
            ...option,
            percentage: totalVotes > 0 ? Number(((option.voteCount / totalVotes) * 100).toFixed(1)) : 0
        }))
    };
};

const getSurveyResultSummary = async (surveyId) => {
    const survey = await Survey.findById(surveyId);
    if (!survey) return { totalSubmissions: 0, questions: [] };

    const submissions = await SurveySubmission.find({ survey: surveyId }).lean();
    const questionSummary = survey.questions.map((question, index) => {
        const answers = submissions
            .map((sub) => sub.answers.find((ans) => ans.questionIndex === index))
            .filter(Boolean)
            .map((entry) => entry.answer)
            .flatMap((answer) => Array.isArray(answer) ? answer : [answer]);

        if (question.type === 'textAnswer') {
            return {
                questionIndex: index,
                question: question.question,
                type: question.type,
                responses: answers.filter((answer) => answer && String(answer).trim() !== '')
            };
        }

        const counts = {};
        for (const option of question.options || []) {
            counts[option] = 0;
        }

        answers.forEach((answer) => {
            const label = String(answer);
            if (counts[label] !== undefined) counts[label] += 1;
        });

        const total = answers.length || 0;
        return {
            questionIndex: index,
            question: question.question,
            type: question.type,
            options: question.options.map((option) => ({
                text: option,
                count: counts[option] || 0,
                percentage: total > 0 ? Number((((counts[option] || 0) / total) * 100).toFixed(1)) : 0
            }))
        };
    });

    return {
        totalSubmissions: submissions.length,
        questions: questionSummary
    };
};

const validateFeedbackUrl = (value) => {
    if (!value) return false;
    try {
        const url = new URL(value);
        const protocol = url.protocol.toLowerCase();
        if (!['http:', 'https:'].includes(protocol)) return false;
        const lowerValue = value.toLowerCase();
        if (lowerValue.startsWith('javascript:') || lowerValue.startsWith('data:') || lowerValue.startsWith('file:')) return false;
        return true;
    } catch (error) {
        return false;
    }
};

const pollListQuery = (user, includeArchived = false) => {
    const base = {};
    if (!includeArchived) base.status = { $ne: 'Archived' };
    if (!isAdminUser(user)) {
        base.targetBranch = { $in: ['all', user.branch] };
    }
    return base;
};

const surveyListQuery = (user, includeArchived = false) => {
    const base = {};
    if (!includeArchived) base.status = { $ne: 'Archived' };
    if (!isAdminUser(user)) {
        base.targetBranch = { $in: ['all', user.branch] };
    }
    return base;
};

const feedbackListQuery = (user, includeArchived = false) => {
    const base = {};
    if (!includeArchived) base.status = { $ne: 'Archived' };
    if (!isAdminUser(user)) {
        base.targetBranch = { $in: ['all', user.branch] };
    }
    return base;
};

const getPollProjection = async (poll, user) => {
    const resultSummary = await getPollResultSummary(poll._id);
    const vote = await PollVote.findOne({ poll: poll._id, user: user._id }).lean();
    const userOption = vote ? vote.option : null;
    const hasVoted = Boolean(vote);

    if (isAdminUser(user)) {
        return {
            ...poll.toObject(),
            totalVotes: resultSummary.totalVotes,
            results: resultSummary.options,
            hasVoted: false,
            selectedOption: null,
            canVote: false,
            isAdminView: true
        };
    }

    return {
        ...poll.toObject(),
        totalVotes: resultSummary.totalVotes,
        results: resultSummary.options,
        hasVoted,
        selectedOption: userOption,
        canVote: poll.status === 'Published' && (!poll.endAt || new Date(poll.endAt) >= new Date())
    };
};

const getSurveyProjection = async (survey, user) => {
    const submission = await SurveySubmission.findOne({ survey: survey._id, user: user._id }).lean();
    const results = await getSurveyResultSummary(survey._id);

    if (isAdminUser(user)) {
        return {
            ...survey.toObject(),
            hasSubmitted: false,
            canSubmit: false,
            submittedAnswers: [],
            results
        };
    }

    return {
        ...survey.toObject(),
        hasSubmitted: Boolean(submission),
        canSubmit: Boolean(survey.status === 'Published' || survey.status === 'Draft'),
        submittedAnswers: submission ? submission.answers : [],
        results
    };
};

const getFeedbackProjection = (feedback) => ({
    ...feedback.toObject(),
    isActive: feedback.status === 'Published' && (!feedback.endAt || new Date(feedback.endAt) >= new Date())
});

exports.getPolls = async (req, res) => {
    try {
        const polls = await Poll.find(pollListQuery(req.user, false)).sort({ createdAt: -1 });
        const visiblePolls = [];

        for (const poll of polls) {
            if (!isAllowedForBranch(poll.targetBranch, req.user.branch, req.user)) continue;
            if (poll.status === 'Published' && poll.endAt && new Date(poll.endAt) < new Date()) {
                poll.status = 'Closed';
                await poll.save();
            }
            visiblePolls.push(await getPollProjection(poll, req.user));
        }

        res.json(visiblePolls);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Unable to fetch polls.' });
    }
};

exports.getPollById = async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json({ message: 'Poll not found.' });

        if (!isAllowedForBranch(poll.targetBranch, req.user.branch, req.user)) {
            return res.status(403).json({ message: 'You do not have access to this poll.' });
        }

        if (poll.status === 'Published' && poll.endAt && new Date(poll.endAt) < new Date()) {
            poll.status = 'Closed';
            await poll.save();
        }

        const response = await getPollProjection(poll, req.user);
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Unable to fetch poll.' });
    }
};

exports.createPoll = async (req, res) => {
    try {
        if (!isAdminUser(req.user)) return res.status(403).json({ message: 'Only admins can create polls.' });

        const title = sanitizeText(req.body.title);
        const description = sanitizeText(req.body.description);
        const rawOptions = Array.isArray(req.body.options) ? req.body.options : [];
        const targetBranch = normalizeBranch(req.body.targetBranch);
        const status = normalizeStatus(req.body.status, 'poll');

        if (!title) return res.status(400).json({ message: 'Poll title is required.' });
        if (rawOptions.length < 2) return res.status(400).json({ message: 'A poll requires at least two options.' });

        const options = rawOptions
            .map((option) => sanitizeText(option?.text || option))
            .filter(Boolean)
            .map((text) => ({ text, voteCount: 0 }));

        if (options.length < 2) return res.status(400).json({ message: 'At least two valid options are required.' });

        const poll = await Poll.create({
            title,
            description,
            options,
            targetBranch,
            createdBy: req.user._id,
            status,
            startAt: req.body.startAt || Date.now(),
            endAt: req.body.endAt || null
        });

        res.status(201).json(poll);
    } catch (error) {
        res.status(400).json({ message: error.message || 'Unable to create poll.' });
    }
};

exports.updatePoll = async (req, res) => {
    try {
        if (!isAdminUser(req.user)) return res.status(403).json({ message: 'Only admins can edit polls.' });

        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json({ message: 'Poll not found.' });

        const title = sanitizeText(req.body.title);
        const description = sanitizeText(req.body.description);
        const rawOptions = Array.isArray(req.body.options) ? req.body.options : poll.options;
        const targetBranch = normalizeBranch(req.body.targetBranch || poll.targetBranch);
        const status = normalizeStatus(req.body.status || poll.status, 'poll');

        if (!title) return res.status(400).json({ message: 'Poll title is required.' });

        const options = rawOptions
            .map((option) => sanitizeText(option?.text || option))
            .filter(Boolean)
            .map((text) => ({ text, voteCount: poll.options.find((entry) => entry.text === text)?.voteCount || 0 }));

        if (options.length < 2) return res.status(400).json({ message: 'A poll must include at least two options.' });

        poll.title = title;
        poll.description = description;
        poll.options = options;
        poll.targetBranch = targetBranch;
        poll.status = status;
        poll.startAt = req.body.startAt || poll.startAt;
        poll.endAt = req.body.endAt || poll.endAt;

        await poll.save();
        res.json(poll);
    } catch (error) {
        res.status(400).json({ message: error.message || 'Unable to update poll.' });
    }
};

exports.deletePoll = async (req, res) => {
    try {
        if (!isAdminUser(req.user)) return res.status(403).json({ message: 'Only admins can delete polls.' });

        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json({ message: 'Poll not found.' });

        await PollVote.deleteMany({ poll: poll._id });
        await poll.deleteOne();
        res.json({ message: 'Poll deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Unable to delete poll.' });
    }
};

exports.publishPoll = async (req, res) => {
    try {
        if (!isAdminUser(req.user)) return res.status(403).json({ message: 'Only admins can publish polls.' });
        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json({ message: 'Poll not found.' });
        poll.status = 'Published';
        if (!poll.startAt) poll.startAt = Date.now();
        await poll.save();
        res.json({ message: 'Poll published successfully.', poll });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Unable to publish poll.' });
    }
};

exports.archivePoll = async (req, res) => {
    try {
        if (!isAdminUser(req.user)) return res.status(403).json({ message: 'Only admins can archive polls.' });
        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json({ message: 'Poll not found.' });
        poll.status = 'Archived';
        await poll.save();
        res.json({ message: 'Poll archived successfully.', poll });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Unable to archive poll.' });
    }
};

exports.getAdminPolls = async (req, res) => {
    if (!isAdminUser(req.user)) return res.status(403).json({ message: 'Only admins can manage polls.' });
    const polls = await Poll.find().sort({ createdAt: -1 });
    res.json(polls);
};

exports.voteOnPoll = async (req, res) => {
    try {
        if (isAdminUser(req.user)) {
            return res.status(403).json({ message: 'Admins cannot vote in student polls.' });
        }

        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json({ message: 'Poll not found.' });
        if (!isAllowedForBranch(poll.targetBranch, req.user.branch, req.user)) {
            return res.status(403).json({ message: 'You do not have access to this poll.' });
        }

        if (poll.status !== 'Published') {
            return res.status(400).json({ message: 'This poll is not accepting votes right now.' });
        }

        if (poll.endAt && new Date(poll.endAt) < new Date()) {
            poll.status = 'Closed';
            await poll.save();
            return res.status(400).json({ message: 'This poll is closed.' });
        }

        const optionText = sanitizeText(req.body.option);
        if (!optionText || !poll.options.some((option) => option.text === optionText)) {
            return res.status(400).json({ message: 'Please select a valid poll option.' });
        }

        const existingVote = await PollVote.findOne({ poll: poll._id, user: req.user._id });

        if (existingVote) {
            const oldOption = existingVote.option;
            if (oldOption !== optionText) {
                existingVote.option = optionText;
                await existingVote.save();
                await Poll.updateOne({ _id: poll._id, 'options.text': oldOption }, { $inc: { 'options.$.voteCount': -1 } });
                await Poll.updateOne({ _id: poll._id, 'options.text': optionText }, { $inc: { 'options.$.voteCount': 1 } });
            }

            const summary = await getPollResultSummary(poll._id);
            return res.status(200).json({
                message: 'Vote updated successfully.',
                vote: existingVote,
                totalVotes: summary.totalVotes,
                selectedOption: optionText,
                results: summary.options
            });
        }

        const vote = await PollVote.create({ poll: poll._id, user: req.user._id, option: optionText });
        await Poll.updateOne({ _id: poll._id, 'options.text': optionText }, { $inc: { 'options.$.voteCount': 1 } });

        const summary = await getPollResultSummary(poll._id);
        res.status(201).json({
            message: 'Vote recorded successfully.',
            vote,
            totalVotes: summary.totalVotes,
            selectedOption: optionText,
            results: summary.options
        });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Unable to submit vote.' });
    }
};

exports.getSurveys = async (req, res) => {
    try {
        const surveys = await Survey.find(surveyListQuery(req.user, false)).sort({ createdAt: -1 });
        const visibleSurveys = [];

        for (const survey of surveys) {
            if (!isAllowedForBranch(survey.targetBranch, req.user.branch, req.user)) continue;
            if (survey.status === 'Published' && survey.endAt && new Date(survey.endAt) < new Date()) {
                survey.status = 'Closed';
                await survey.save();
            }
            visibleSurveys.push(await getSurveyProjection(survey, req.user));
        }

        res.json(visibleSurveys);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Unable to fetch surveys.' });
    }
};

exports.getSurveyById = async (req, res) => {
    try {
        const survey = await Survey.findById(req.params.id);
        if (!survey) return res.status(404).json({ message: 'Survey not found.' });

        if (!isAllowedForBranch(survey.targetBranch, req.user.branch, req.user)) {
            return res.status(403).json({ message: 'You do not have access to this survey.' });
        }

        if (survey.status === 'Published' && survey.endAt && new Date(survey.endAt) < new Date()) {
            survey.status = 'Closed';
            await survey.save();
        }

        const response = await getSurveyProjection(survey, req.user);
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Unable to fetch survey.' });
    }
};

exports.createSurvey = async (req, res) => {
    try {
        if (!isAdminUser(req.user)) return res.status(403).json({ message: 'Only admins can create surveys.' });

        const title = sanitizeText(req.body.title);
        const description = sanitizeText(req.body.description);
        const targetBranch = normalizeBranch(req.body.targetBranch);
        const status = normalizeStatus(req.body.status, 'survey');
        const questions = Array.isArray(req.body.questions) ? req.body.questions : [];

        if (!title) return res.status(400).json({ message: 'Survey title is required.' });
        if (!questions.length) return res.status(400).json({ message: 'At least one question is required.' });

        const normalizedQuestions = questions.map((question) => {
            const q = {
                question: sanitizeText(question.question),
                type: question.type,
                required: Boolean(question.required !== false),
                options: Array.isArray(question.options) ? question.options.map((option) => sanitizeText(option)).filter(Boolean) : []
            };

            if (!q.question) throw new Error('Each question must have text.');
            if (!['singleChoice', 'multipleChoice', 'textAnswer'].includes(q.type)) {
                throw new Error('Unsupported question type.');
            }
            if ((q.type === 'singleChoice' || q.type === 'multipleChoice') && q.options.length < 2) {
                throw new Error('Choice questions need at least two options.');
            }
            return q;
        });

        const survey = await Survey.create({
            title,
            description,
            targetBranch,
            questions: normalizedQuestions,
            createdBy: req.user._id,
            status,
            startAt: req.body.startAt || Date.now(),
            endAt: req.body.endAt || null
        });

        res.status(201).json(survey);
    } catch (error) {
        res.status(400).json({ message: error.message || 'Unable to create survey.' });
    }
};

exports.updateSurvey = async (req, res) => {
    try {
        if (!isAdminUser(req.user)) return res.status(403).json({ message: 'Only admins can edit surveys.' });

        const survey = await Survey.findById(req.params.id);
        if (!survey) return res.status(404).json({ message: 'Survey not found.' });

        const questions = Array.isArray(req.body.questions) ? req.body.questions : survey.questions;
        const title = sanitizeText(req.body.title || survey.title);
        const description = sanitizeText(req.body.description || survey.description);
        const targetBranch = normalizeBranch(req.body.targetBranch || survey.targetBranch);
        const status = normalizeStatus(req.body.status || survey.status, 'survey');

        if (!title) return res.status(400).json({ message: 'Survey title is required.' });
        if (!questions.length) return res.status(400).json({ message: 'At least one question is required.' });

        survey.title = title;
        survey.description = description;
        survey.targetBranch = targetBranch;
        survey.status = status;
        survey.questions = questions.map((question) => {
            const cleanedQuestion = {
                question: sanitizeText(question.question),
                type: question.type,
                required: Boolean(question.required !== false),
                options: Array.isArray(question.options) ? question.options.map((option) => sanitizeText(option)).filter(Boolean) : []
            };

            if (!cleanedQuestion.question) throw new Error('Each question must have text.');
            if (!['singleChoice', 'multipleChoice', 'textAnswer'].includes(cleanedQuestion.type)) {
                throw new Error('Unsupported question type.');
            }
            if ((cleanedQuestion.type === 'singleChoice' || cleanedQuestion.type === 'multipleChoice') && cleanedQuestion.options.length < 2) {
                throw new Error('Choice questions need at least two options.');
            }
            return cleanedQuestion;
        });
        survey.startAt = req.body.startAt || survey.startAt;
        survey.endAt = req.body.endAt || survey.endAt;

        await survey.save();
        res.json(survey);
    } catch (error) {
        res.status(400).json({ message: error.message || 'Unable to update survey.' });
    }
};

exports.deleteSurvey = async (req, res) => {
    try {
        if (!isAdminUser(req.user)) return res.status(403).json({ message: 'Only admins can delete surveys.' });

        const survey = await Survey.findById(req.params.id);
        if (!survey) return res.status(404).json({ message: 'Survey not found.' });

        await SurveySubmission.deleteMany({ survey: survey._id });
        await survey.deleteOne();
        res.json({ message: 'Survey deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Unable to delete survey.' });
    }
};

exports.publishSurvey = async (req, res) => {
    try {
        if (!isAdminUser(req.user)) return res.status(403).json({ message: 'Only admins can publish surveys.' });
        const survey = await Survey.findById(req.params.id);
        if (!survey) return res.status(404).json({ message: 'Survey not found.' });
        survey.status = 'Published';
        if (!survey.startAt) survey.startAt = Date.now();
        await survey.save();
        res.json({ message: 'Survey published successfully.', survey });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Unable to publish survey.' });
    }
};

exports.archiveSurvey = async (req, res) => {
    try {
        if (!isAdminUser(req.user)) return res.status(403).json({ message: 'Only admins can archive surveys.' });
        const survey = await Survey.findById(req.params.id);
        if (!survey) return res.status(404).json({ message: 'Survey not found.' });
        survey.status = 'Archived';
        await survey.save();
        res.json({ message: 'Survey archived successfully.', survey });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Unable to archive survey.' });
    }
};

exports.getAdminSurveys = async (req, res) => {
    if (!isAdminUser(req.user)) return res.status(403).json({ message: 'Only admins can manage surveys.' });
    const surveys = await Survey.find().sort({ createdAt: -1 });
    res.json(surveys);
};

exports.submitSurvey = async (req, res) => {
    try {
        if (isAdminUser(req.user)) {
            return res.status(403).json({ message: 'Admins cannot submit student surveys.' });
        }

        const survey = await Survey.findById(req.params.id);
        if (!survey) return res.status(404).json({ message: 'Survey not found.' });
        if (!isAllowedForBranch(survey.targetBranch, req.user.branch, req.user)) {
            return res.status(403).json({ message: 'You do not have access to this survey.' });
        }
        if (survey.status !== 'Published') {
            return res.status(400).json({ message: 'This survey is not active.' });
        }
        if (survey.endAt && new Date(survey.endAt) < new Date()) {
            survey.status = 'Closed';
            await survey.save();
            return res.status(400).json({ message: 'This survey is closed.' });
        }

        const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
        const normalizedAnswers = [];

        survey.questions.forEach((question, index) => {
            const entry = answers.find((item) => Number(item.questionIndex) === index);
            if (!entry && question.required) {
                throw new Error(`Question "${question.question}" is required.`);
            }
            if (!entry) return;
            const answer = entry.answer;
            if (question.type === 'textAnswer') {
                if (typeof answer !== 'string' || !answer.trim()) {
                    throw new Error(`Please provide an answer for "${question.question}".`);
                }
            }
            if (question.type === 'singleChoice' && typeof answer !== 'string') {
                throw new Error(`Please choose one option for "${question.question}".`);
            }
            if (question.type === 'multipleChoice') {
                if (!Array.isArray(answer) || answer.length === 0) {
                    throw new Error(`Please choose at least one option for "${question.question}".`);
                }
            }
            normalizedAnswers.push({
                questionIndex: index,
                question: question.question,
                type: question.type,
                answer
            });
        });

        const existingSubmission = await SurveySubmission.findOne({ survey: survey._id, user: req.user._id });

        let submission;
        if (existingSubmission) {
            existingSubmission.answers = normalizedAnswers;
            submission = await existingSubmission.save();
        } else {
            submission = await SurveySubmission.create({
                survey: survey._id,
                user: req.user._id,
                answers: normalizedAnswers
            });
        }

        const summary = await getSurveyResultSummary(survey._id);
        const message = existingSubmission ? 'Survey response updated successfully.' : 'Survey submitted successfully.';
        res.status(existingSubmission ? 200 : 201).json({ message, submission, results: summary });
    } catch (error) {
        res.status(400).json({ message: error.message || 'Unable to submit survey.' });
    }
};

exports.getSurveyResults = async (req, res) => {
    try {
        if (!isAdminUser(req.user)) return res.status(403).json({ message: 'Only admins can view survey results.' });
        const survey = await Survey.findById(req.params.id);
        if (!survey) return res.status(404).json({ message: 'Survey not found.' });
        const result = await getSurveyResultSummary(survey._id);
        res.json({ survey, ...result });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Unable to fetch survey results.' });
    }
};

exports.getFeedbacks = async (req, res) => {
    try {
        const feedbackEntries = await Feedback.find(feedbackListQuery(req.user, false)).sort({ createdAt: -1 });
        const visibleEntries = [];
        for (const item of feedbackEntries) {
            if (!isAllowedForBranch(item.targetBranch, req.user.branch, req.user)) continue;
            if (item.status === 'Published' && item.endAt && new Date(item.endAt) < new Date()) {
                item.status = 'Expired';
                await item.save();
            }
            visibleEntries.push(getFeedbackProjection(item));
        }
        res.json(visibleEntries);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Unable to fetch feedback forms.' });
    }
};

exports.getFeedbackById = async (req, res) => {
    try {
        const item = await Feedback.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Feedback form not found.' });
        if (!isAllowedForBranch(item.targetBranch, req.user.branch, req.user)) {
            return res.status(403).json({ message: 'You do not have access to this feedback form.' });
        }
        if (item.status === 'Published' && item.endAt && new Date(item.endAt) < new Date()) {
            item.status = 'Expired';
            await item.save();
        }
        res.json(getFeedbackProjection(item));
    } catch (error) {
        res.status(500).json({ message: error.message || 'Unable to fetch feedback form.' });
    }
};

exports.createFeedback = async (req, res) => {
    try {
        if (!isAdminUser(req.user)) return res.status(403).json({ message: 'Only admins can create feedback forms.' });

        const title = sanitizeText(req.body.title);
        const description = sanitizeText(req.body.description);
        const targetBranch = normalizeBranch(req.body.targetBranch);
        const feedbackUrl = sanitizeText(req.body.feedbackUrl);
        const status = normalizeStatus(req.body.status, 'feedback');

        if (!title) return res.status(400).json({ message: 'Feedback title is required.' });
        if (!validateFeedbackUrl(feedbackUrl)) return res.status(400).json({ message: 'Please provide a valid http/https feedback URL.' });

        const item = await Feedback.create({
            title,
            description,
            targetBranch,
            feedbackUrl,
            createdBy: req.user._id,
            status,
            startAt: req.body.startAt || Date.now(),
            endAt: req.body.endAt || null
        });

        res.status(201).json(item);
    } catch (error) {
        res.status(400).json({ message: error.message || 'Unable to create feedback form.' });
    }
};

exports.updateFeedback = async (req, res) => {
    try {
        if (!isAdminUser(req.user)) return res.status(403).json({ message: 'Only admins can edit feedback forms.' });

        const item = await Feedback.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Feedback form not found.' });

        const title = sanitizeText(req.body.title || item.title);
        const description = sanitizeText(req.body.description || item.description);
        const targetBranch = normalizeBranch(req.body.targetBranch || item.targetBranch);
        const feedbackUrl = sanitizeText(req.body.feedbackUrl || item.feedbackUrl);
        const status = normalizeStatus(req.body.status || item.status, 'feedback');

        if (!title) return res.status(400).json({ message: 'Feedback title is required.' });
        if (!validateFeedbackUrl(feedbackUrl)) return res.status(400).json({ message: 'Please provide a valid http/https feedback URL.' });

        item.title = title;
        item.description = description;
        item.targetBranch = targetBranch;
        item.feedbackUrl = feedbackUrl;
        item.status = status;
        item.startAt = req.body.startAt || item.startAt;
        item.endAt = req.body.endAt || item.endAt;

        await item.save();
        res.json(item);
    } catch (error) {
        res.status(400).json({ message: error.message || 'Unable to update feedback form.' });
    }
};

exports.deleteFeedback = async (req, res) => {
    try {
        if (!isAdminUser(req.user)) return res.status(403).json({ message: 'Only admins can delete feedback forms.' });

        const item = await Feedback.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Feedback form not found.' });

        await item.deleteOne();
        res.json({ message: 'Feedback form deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Unable to delete feedback form.' });
    }
};

exports.publishFeedback = async (req, res) => {
    try {
        if (!isAdminUser(req.user)) return res.status(403).json({ message: 'Only admins can publish feedback forms.' });
        const item = await Feedback.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Feedback form not found.' });
        item.status = 'Published';
        if (!item.startAt) item.startAt = Date.now();
        await item.save();
        res.json({ message: 'Feedback form published successfully.', item });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Unable to publish feedback form.' });
    }
};

exports.archiveFeedback = async (req, res) => {
    try {
        if (!isAdminUser(req.user)) return res.status(403).json({ message: 'Only admins can archive feedback forms.' });
        const item = await Feedback.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Feedback form not found.' });
        item.status = 'Archived';
        await item.save();
        res.json({ message: 'Feedback form archived successfully.', item });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Unable to archive feedback form.' });
    }
};

exports.getAdminFeedback = async (req, res) => {
    if (!isAdminUser(req.user)) return res.status(403).json({ message: 'Only admins can manage feedback forms.' });
    const items = await Feedback.find().sort({ createdAt: -1 });
    res.json(items);
};

exports.getPollResults = async (req, res) => {
    try {
        if (!isAdminUser(req.user)) return res.status(403).json({ message: 'Only admins can view poll results.' });
        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json({ message: 'Poll not found.' });
        const summary = await getPollResultSummary(poll._id);
        res.json({ poll, ...summary });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Unable to fetch poll results.' });
    }
};
