const Resource = require('../models/Resource');
const Job = require('../models/Job');

const uploadResource = async (req, res) => {
    const { title, subject, semester, branch } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'Please attach a file (PDF/Image).' });
    }

    try {
        const resource = await Resource.create({
            title,
            subject,
            semester,
            branch,
            fileUrl: req.file.path,
            uploadedBy: req.user._id
        });

        const populatedResource = await Resource.findById(resource._id).populate('uploadedBy', 'name profilePicture');
        res.status(201).json(populatedResource);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getResources = async (req, res) => {
    const { semester, branch } = req.query;
    let query = {};
    if (semester) query.semester = semester;
    if (branch) query.branch = branch;

    try {
        const resources = await Resource.find(query)
            .populate('uploadedBy', 'name profilePicture')
            .sort({ createdAt: -1 });
        res.json(resources);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching resources' });
    }
};

const toggleResourceUpvote = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) return res.status(404).json({ message: 'Resource not found' });

        const alreadyUpvoted = resource.upvotes.includes(req.user._id);
        if (alreadyUpvoted) {
            resource.upvotes = resource.upvotes.filter(id => id.toString() !== req.user._id.toString());
        } else {
            resource.upvotes.push(req.user._id);
        }

        await resource.save();
        res.json({ message: 'Upvote toggled', upvotesCount: resource.upvotes.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createJob = async (req, res) => {
    const { title, company, description, applyLink, roleType } = req.body;

    try {
        const job = await Job.create({
            title,
            company,
            description,
            applyLink,
            roleType,
            postedBy: req.user._id,
            isVerified: true
        });

        const populatedJob = await Job.findById(job._id).populate('postedBy', 'name role profilePicture');
        res.status(201).json(populatedJob);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getJobs = async (req, res) => {
    try {
        const jobs = await Job.find()
            .populate('postedBy', 'name role profilePicture')
            .sort({ createdAt: -1 });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching jobs' });
    }
};

module.exports = { 
    uploadResource, getResources, toggleResourceUpvote, 
    createJob, getJobs 
};