const User = require('../models/User');
const Post = require('../models/Post');
const Resource = require('../models/Resource');
const Job = require('../models/Job');
const Request = require('../models/Request');
const Event = require('../models/Event');
const PollVote = require('../models/PollVote');
const SurveySubmission = require('../models/SurveySubmission');

const BRANCHES = ['CSE', 'ECE', 'Mechanical', 'Civil'];

const getDateRange = (query) => {
    const now = new Date();
    let start;

    if (query.startDate || query.endDate) {
        start = query.startDate ? new Date(query.startDate) : new Date(0);
        const end = query.endDate ? new Date(query.endDate) : now;
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return null;
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }

    const days = { '7d': 7, '30d': 30, '3m': 90, '6m': 180, '12m': 365 }[query.period || '30d'];
    if (!days && query.period !== 'all') return null;
    if (!days) return { start: new Date(0), end: now };
    start = new Date(now);
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);
    return { start, end: now };
};

const dateMatch = (field, range) => ({ [field]: { $gte: range.start, $lte: range.end } });

const getStudentMatch = (branch) => ({ role: 'student', ...(branch ? { branch } : {}) });

const getStudentIds = async (branch) => User.find(getStudentMatch(branch)).distinct('_id');

const getSeries = async (model, match, field, range, unit) => {
    const format = unit === 'day' ? '%Y-%m-%d' : '%Y-%m';
    return model.aggregate([
        { $match: { ...match, ...dateMatch(field, range) } },
        { $group: { _id: { $dateToString: { format, date: `$${field}` } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: '$_id', count: 1 } }
    ]);
};

const getRecordedActivity = async (studentIds, range) => {
    const [posts, comments, resources, votes, submissions] = await Promise.all([
        Post.aggregate([{ $match: { author: { $in: studentIds }, ...dateMatch('createdAt', range) } }, { $group: { _id: '$author' } }]),
        Post.aggregate([{ $unwind: '$comments' }, { $match: { 'comments.user': { $in: studentIds }, 'comments.createdAt': { $gte: range.start, $lte: range.end } } }, { $group: { _id: '$comments.user' } }]),
        Resource.aggregate([{ $match: { uploadedBy: { $in: studentIds }, ...dateMatch('createdAt', range) } }, { $group: { _id: '$uploadedBy' } }]),
        PollVote.aggregate([{ $match: { user: { $in: studentIds }, ...dateMatch('createdAt', range) } }, { $group: { _id: '$user' } }]),
        SurveySubmission.aggregate([{ $match: { user: { $in: studentIds }, ...dateMatch('createdAt', range) } }, { $group: { _id: '$user' } }])
    ]);
    return new Set([...posts, ...comments, ...resources, ...votes, ...submissions].map(({ _id }) => _id.toString()));
};

const getMostActiveStudents = async (studentIds, range) => {
    const counts = new Map();
    const addCounts = (items) => items.forEach(({ _id, count }) => counts.set(_id.toString(), (counts.get(_id.toString()) || 0) + count));
    const [posts, comments, resources, votes, submissions] = await Promise.all([
        Post.aggregate([{ $match: { author: { $in: studentIds }, ...dateMatch('createdAt', range) } }, { $group: { _id: '$author', count: { $sum: 1 } } }]),
        Post.aggregate([{ $unwind: '$comments' }, { $match: { 'comments.user': { $in: studentIds }, 'comments.createdAt': { $gte: range.start, $lte: range.end } } }, { $group: { _id: '$comments.user', count: { $sum: 1 } } }]),
        Resource.aggregate([{ $match: { uploadedBy: { $in: studentIds }, ...dateMatch('createdAt', range) } }, { $group: { _id: '$uploadedBy', count: { $sum: 1 } } }]),
        PollVote.aggregate([{ $match: { user: { $in: studentIds }, ...dateMatch('createdAt', range) } }, { $group: { _id: '$user', count: { $sum: 1 } } }]),
        SurveySubmission.aggregate([{ $match: { user: { $in: studentIds }, ...dateMatch('createdAt', range) } }, { $group: { _id: '$user', count: { $sum: 1 } } }])
    ]);
    addCounts(posts); addCounts(comments); addCounts(resources); addCounts(votes); addCounts(submissions);
    const topIds = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const users = await User.find({ _id: { $in: topIds.map(([id]) => id) } }).select('name branch profilePicture').lean();
    const userMap = new Map(users.map(user => [user._id.toString(), user]));
    return topIds.map(([id, activityCount], index) => ({ rank: index + 1, ...userMap.get(id), activityCount }));
};

const getAdminAnalytics = async (req, res) => {
    const range = getDateRange(req.query);
    const branch = req.query.branch || '';
    if (!range || (branch && !BRANCHES.includes(branch))) return res.status(400).json({ message: 'Invalid analytics filters.' });

    try {
        const studentMatch = getStudentMatch(branch);
        const studentIds = await getStudentIds(branch);
        const postMatch = { author: { $in: studentIds } };
        const resourceMatch = branch ? { branch } : {};
        const trendUnit = (range.end - range.start) / 86400000 <= 60 ? 'day' : 'month';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayRange = { start: today, end: new Date() };

        const [totalStudents, totalPosts, totalResources, totalJobs, totalRequests, totalEvents, totalAnnouncements, activeToday, studentGrowth, resourceUploads, branchDistribution, mostActiveStudents, mostLikedPosts, mostUpvotedResources] = await Promise.all([
            User.countDocuments(studentMatch),
            Post.countDocuments(postMatch),
            Resource.countDocuments(resourceMatch),
            Job.countDocuments(),
            Request.countDocuments(),
            Event.countDocuments(),
            Post.countDocuments({ type: 'announcement' }),
            getRecordedActivity(studentIds, todayRange),
            getSeries(User, studentMatch, 'createdAt', range, trendUnit),
            getSeries(Resource, resourceMatch, 'createdAt', range, trendUnit),
            User.aggregate([{ $match: studentMatch }, { $group: { _id: { $cond: [{ $in: ['$branch', BRANCHES] }, '$branch', 'Other'] }, count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $project: { _id: 0, branch: '$_id', count: 1 } }]),
            getMostActiveStudents(studentIds, range),
            Post.aggregate([{ $match: postMatch }, { $addFields: { likeCount: { $size: { $ifNull: ['$likes', []] } } } }, { $sort: { likeCount: -1, createdAt: -1 } }, { $limit: 5 }, { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'author' } }, { $unwind: '$author' }, { $project: { _id: 1, title: 1, content: 1, type: 1, createdAt: 1, likeCount: 1, 'author.name': 1 } }]),
            Resource.aggregate([{ $match: resourceMatch }, { $addFields: { upvoteCount: { $size: { $ifNull: ['$upvotes', []] } } } }, { $sort: { upvoteCount: -1, createdAt: -1 } }, { $limit: 5 }, { $project: { _id: 1, title: 1, subject: 1, branch: 1, createdAt: 1, upvoteCount: 1 } }])
        ]);

        const dailyActiveUsers = { available: false, reason: 'Login or activity history is not stored yet.' };
        res.json({
            filters: { period: req.query.period || '30d', branch, startDate: range.start, endDate: range.end },
            overview: { totalStudents, activeToday: activeToday.size, totalPosts, totalResources, totalAnnouncements, totalJobs, totalRequests, totalEvents },
            studentGrowth,
            resourceUploads,
            branchDistribution,
            dailyActiveUsers,
            mostActiveStudents,
            mostLikedPosts,
            mostDownloadedResources: { available: false, reason: 'Resource downloads are served but not counted in the current schema.', items: [] },
            mostUpvotedResources,
            limitations: ['Active students reflect recorded posts, comments, uploads, poll votes, and survey submissions for today; login history is not stored.', 'Resource ranking uses upvotes because downloads are not tracked.']
        });
    } catch (error) {
        console.error('Admin analytics error:', error);
        res.status(500).json({ message: 'Error fetching admin analytics' });
    }
};

module.exports = { getAdminAnalytics };