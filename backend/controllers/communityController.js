const mongoose = require('mongoose');
const Community = require('../models/Community');
const CommunityMembership = require('../models/CommunityMembership');
const Post = require('../models/Post');
const Event = require('../models/Event');
const Resource = require('../models/Resource');
const User = require('../models/User');
const { deleteCloudinaryFile } = require('./hubController');

const validId = id => mongoose.Types.ObjectId.isValid(id);
const memberQuery = (community, user) => ({ community, user });
const manageRoles = ['owner', 'admin'];

const getMembership = (community, user) => CommunityMembership.findOne(memberQuery(community, user));
const requireManager = async (communityId, userId, res) => {
    const actor = await User.findById(userId).select('role isAdmin');
    if (actor?.role === 'admin' || actor?.isAdmin) return { role: 'system-admin' };
    const membership = await getMembership(communityId, userId);
    if (!membership || !manageRoles.includes(membership.role)) {
        res.status(403).json({ message: 'You do not have permission to manage this community.' });
        return null;
    }
    return membership;
};

const requireCommunityMember = async (communityId, user, res) => {
    if (user.role === 'admin' || user.isAdmin) return true;
    const membership = await getMembership(communityId, user._id);
    if (!membership) {
        res.status(403).json({ message: 'Join this community to view its content.' });
        return false;
    }
    return true;
};

const serializeCommunity = async (community, userId) => {
    const [memberCount, membership] = await Promise.all([
        CommunityMembership.countDocuments({ community: community._id }),
        userId ? getMembership(community._id, userId) : null
    ]);
    return { ...community.toObject(), memberCount, membership: membership ? { role: membership.role, joinedAt: membership.joinedAt } : null };
};

const listCommunities = async (req, res) => {
    try {
        const { search = '', category } = req.query;
        const query = { status: 'active' };
        if (category && Community.categories.includes(category)) query.category = category;
        if (search.trim()) query.$or = [
            { name: { $regex: search.trim(), $options: 'i' } },
            { description: { $regex: search.trim(), $options: 'i' } },
            { category: { $regex: search.trim(), $options: 'i' } }
        ];
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(30, Math.max(1, Number(req.query.limit) || 12));
        const [communities, total] = await Promise.all([
            Community.find(query).sort({ name: 1 }).skip((page - 1) * limit).limit(limit),
            Community.countDocuments(query)
        ]);
        res.json({ communities: await Promise.all(communities.map(item => serializeCommunity(item, req.user._id))), page, pages: Math.ceil(total / limit), total });
    } catch (error) { res.status(500).json({ message: 'Unable to load communities.' }); }
};

const getCommunity = async (req, res) => {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid community id.' });
    try {
        const community = await Community.findOne({ _id: req.params.id, status: 'active' }).populate('createdBy', 'name profilePicture');
        if (!community) return res.status(404).json({ message: 'Community not found.' });
        res.json(await serializeCommunity(community, req.user._id));
    } catch (error) { res.status(500).json({ message: 'Unable to load community.' }); }
};

const joinCommunity = async (req, res) => {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid community id.' });
    try {
        const community = await Community.findOne({ _id: req.params.id, status: 'active' });
        if (!community) return res.status(404).json({ message: 'Community not found.' });
        const membership = await CommunityMembership.findOneAndUpdate(memberQuery(community._id, req.user._id), { $setOnInsert: { role: 'member', joinedAt: new Date() } }, { new: true, upsert: true, setDefaultsOnInsert: true });
        res.status(200).json({ message: 'Joined community.', membership, memberCount: await CommunityMembership.countDocuments({ community: community._id }) });
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ message: 'You are already a member of this community.' });
        res.status(500).json({ message: 'Unable to join community.' });
    }
};

const leaveCommunity = async (req, res) => {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid community id.' });
    try {
        const membership = await getMembership(req.params.id, req.user._id);
        if (!membership) return res.status(404).json({ message: 'You are not a member of this community.' });
        if (membership.role === 'owner') return res.status(400).json({ message: 'The owner cannot leave without transferring ownership.' });
        await membership.deleteOne();
        res.json({ message: 'Left community.', memberCount: await CommunityMembership.countDocuments({ community: req.params.id }) });
    } catch (error) { res.status(500).json({ message: 'Unable to leave community.' }); }
};

const getMembers = async (req, res) => {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid community id.' });
    if (!await requireCommunityMember(req.params.id, req.user, res)) return;
    try {
        const page = Math.max(1, Number(req.query.page) || 1); const limit = 50;
        const query = { community: req.params.id };
        if (req.query.search?.trim()) {
            const matchingUsers = await User.find({ role: 'student', $or: [
                { name: { $regex: req.query.search.trim(), $options: 'i' } },
                { rollNo: { $regex: req.query.search.trim(), $options: 'i' } }
            ] }).distinct('_id');
            query.user = { $in: matchingUsers };
        }
        const [members, total] = await Promise.all([
            CommunityMembership.find(query).populate('user', 'name rollNo course branch profilePicture').sort({ joinedAt: 1 }).skip((page - 1) * limit).limit(limit),
            CommunityMembership.countDocuments(query)
        ]);
        res.json({ members, page, pages: Math.ceil(total / limit), total });
    } catch (error) { res.status(500).json({ message: 'Unable to load community members.' }); }
};

const getCommunityPosts = async (req, res) => {
    if (!await requireCommunityMember(req.params.id, req.user, res)) return;
    try {
        const posts = await Post.find({ community: req.params.id }).populate('author', 'name rollNo profilePicture branch').populate('comments.user', 'name profilePicture').sort({ createdAt: -1 }).limit(50);
        res.json(posts);
    } catch (error) { res.status(500).json({ message: 'Unable to load discussions.' }); }
};

const createCommunityPost = async (req, res) => {
    const membership = await getMembership(req.params.id, req.user._id);
    const type = req.body.type === 'announcement' ? 'announcement' : 'blog';
    if (!membership || (type === 'announcement' && !manageRoles.includes(membership.role))) return res.status(403).json({ message: type === 'announcement' ? 'Only community managers can publish announcements.' : 'Join the community before starting a discussion.' });
    const { title, content } = req.body;
    if (!title?.trim() || !content?.trim()) return res.status(400).json({ message: 'Title and content are required.' });
    try {
        const post = await Post.create({ author: req.user._id, community: req.params.id, type, title: title.trim(), content: content.trim(), images: [] });
        res.status(201).json(await post.populate('author', 'name rollNo profilePicture branch'));
    } catch (error) { res.status(400).json({ message: error.message }); }
};

const getCommunityAnnouncements = async (req, res) => {
    if (!await requireCommunityMember(req.params.id, req.user, res)) return;
    try { res.json(await Post.find({ community: req.params.id, type: 'announcement' }).populate('author', 'name rollNo profilePicture branch').sort({ createdAt: -1 }).limit(30)); }
    catch (error) { res.status(500).json({ message: 'Unable to load community announcements.' }); }
};

const getCommunityEvents = async (req, res) => {
    if (!await requireCommunityMember(req.params.id, req.user, res)) return;
    try { res.json(await Event.find({ community: req.params.id, status: { $ne: 'Draft' } }).populate('createdBy', 'name role').sort({ date: 1, startTime: 1 })); }
    catch (error) { res.status(500).json({ message: 'Unable to load community events.' }); }
};

const getCommunityResources = async (req, res) => {
    if (!await requireCommunityMember(req.params.id, req.user, res)) return;
    try { res.json(await Resource.find({ community: req.params.id }).populate('uploadedBy', 'name profilePicture').sort({ createdAt: -1 }).limit(50)); }
    catch (error) { res.status(500).json({ message: 'Unable to load community resources.' }); }
};

const createCommunityEvent = async (req, res) => {
    if (!await requireManager(req.params.id, req.user._id, res)) return;
    const { title, description, eventType, date, startTime, endTime, location, organizer, registrationUrl, status } = req.body;
    if (!title?.trim() || !eventType || !date || !startTime || !endTime) return res.status(400).json({ message: 'Title, type, date, and times are required.' });
    try {
        const event = await Event.create({ title: title.trim(), description: description?.trim() || '', eventType, date, startTime, endTime, location: location?.trim() || '', organizer: organizer?.trim() || '', registrationUrl: registrationUrl?.trim() || '', status: status || 'Published', createdBy: req.user._id, community: req.params.id });
        res.status(201).json(await event.populate('createdBy', 'name role'));
    } catch (error) { res.status(400).json({ message: error.message }); }
};

const createCommunityResource = async (req, res) => {
    if (!await requireManager(req.params.id, req.user._id, res)) return;
    const { title, subject } = req.body;
    if (!req.file || !title?.trim() || !subject?.trim()) return res.status(400).json({ message: 'Title, subject, and a file are required.' });
    try {
        const resource = await Resource.create({ title: title.trim(), subject: subject.trim(), fileUrl: req.file.path, uploadedBy: req.user._id, community: req.params.id });
        res.status(201).json(await resource.populate('uploadedBy', 'name profilePicture'));
    } catch (error) { res.status(400).json({ message: error.message }); }
};

const deleteCommunityEvent = async (req, res) => {
    if (req.user.role !== 'admin' && !req.user.isAdmin) return res.status(403).json({ message: 'Only system administrators can delete community events.' });
    try {
        const event = await Event.findOne({ _id: req.params.eventId, community: req.params.id });
        if (!event) return res.status(404).json({ message: 'Community event not found.' });
        await event.deleteOne();
        res.json({ message: 'Community event deleted successfully.' });
    } catch (error) { res.status(500).json({ message: 'Unable to delete community event.' }); }
};

const deleteCommunityResource = async (req, res) => {
    if (req.user.role !== 'admin' && !req.user.isAdmin) return res.status(403).json({ message: 'Only system administrators can delete community resources.' });
    try {
        const resource = await Resource.findOne({ _id: req.params.resourceId, community: req.params.id });
        if (!resource) return res.status(404).json({ message: 'Community resource not found.' });
        await deleteCloudinaryFile(resource.fileUrl);
        await resource.deleteOne();
        res.json({ message: 'Community resource deleted successfully.' });
    } catch (error) { res.status(500).json({ message: 'Unable to delete community resource.' }); }
};

const createCommunity = async (req, res) => {
    const { name, description, category, icon, coverImage } = req.body;
    if (!name?.trim() || !description?.trim() || !Community.categories.includes(category)) return res.status(400).json({ message: 'Name, description, and a valid category are required.' });
    try {
        const community = await Community.create({ name: name.trim(), description: description.trim(), category, icon: icon?.trim() || '🏫', coverImage: coverImage || '', createdBy: req.user._id });
        await CommunityMembership.create({ community: community._id, user: req.user._id, role: 'owner' });
        res.status(201).json(await serializeCommunity(community, req.user._id));
    } catch (error) { res.status(400).json({ message: error.message }); }
};

const updateCommunity = async (req, res) => {
    if (!await requireManager(req.params.id, req.user._id, res)) return;
    const allowed = ['name', 'description', 'category', 'icon', 'coverImage', 'status'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    if (updates.category && !Community.categories.includes(updates.category)) return res.status(400).json({ message: 'Invalid category.' });
    try { const community = await Community.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }); if (!community) return res.status(404).json({ message: 'Community not found.' }); res.json(await serializeCommunity(community, req.user._id)); }
    catch (error) { res.status(400).json({ message: error.message }); }
};

const manageMember = async (req, res) => {
    const manager = await requireManager(req.params.id, req.user._id, res); if (!manager) return;
    if (!validId(req.params.userId)) return res.status(400).json({ message: 'Invalid user id.' });
    if (req.params.userId === req.user._id.toString()) return res.status(400).json({ message: 'You cannot change your own role.' });
    if (!await User.exists({ _id: req.params.userId, role: 'student' })) return res.status(404).json({ message: 'Student not found.' });
    let membership = await getMembership(req.params.id, req.params.userId);
    if (!membership && manager.role === 'system-admin' && req.body.role === 'admin') {
        membership = await CommunityMembership.create({ community: req.params.id, user: req.params.userId, role: 'admin' });
    }
    if (!membership) return res.status(404).json({ message: 'Member not found.' });
    if (membership.role === 'owner') return res.status(400).json({ message: 'The owner cannot be modified.' });
    if (!['admin', 'moderator', 'member'].includes(req.body.role)) return res.status(400).json({ message: 'Invalid community role.' });
    if (manager.role !== 'owner' && manager.role !== 'system-admin' && req.body.role === 'admin') return res.status(403).json({ message: 'Only the owner or system administrator can assign admins.' });
    membership.role = req.body.role; await membership.save(); res.json(membership);
};

const removeMember = async (req, res) => {
    const manager = await requireManager(req.params.id, req.user._id, res); if (!manager) return;
    const membership = await getMembership(req.params.id, req.params.userId);
    if (!membership) return res.status(404).json({ message: 'Member not found.' });
    if (membership.role === 'owner') return res.status(400).json({ message: 'The owner cannot be removed.' });
    await membership.deleteOne(); res.json({ message: 'Member removed.' });
};

module.exports = { listCommunities, getCommunity, joinCommunity, leaveCommunity, getMembers, getCommunityPosts, getCommunityAnnouncements, createCommunityPost, getCommunityEvents, getCommunityResources, createCommunityEvent, createCommunityResource, deleteCommunityEvent, deleteCommunityResource, createCommunity, updateCommunity, manageMember, removeMember };