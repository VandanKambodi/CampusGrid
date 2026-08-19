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

const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

const deleteCloudinaryFile = async (fileUrl) => {
    if (!fileUrl) return;
    try {
        if (fileUrl.includes('cloudinary.com')) {
            const parts = fileUrl.split('/');
            const uploadIndex = parts.indexOf('upload');
            if (uploadIndex !== -1) {
                let publicIdParts = parts.slice(uploadIndex + 1);
                if (publicIdParts[0]?.startsWith('v')) {
                    publicIdParts = publicIdParts.slice(1);
                }
                const publicIdWithExt = publicIdParts.join('/');
                const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.')) || publicIdWithExt;

                await cloudinary.uploader.destroy(publicId).catch(() => {});
                await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }).catch(() => {});
            }
        } else {
            const localPath = path.join(__dirname, '..', fileUrl);
            if (fs.existsSync(localPath)) {
                fs.unlinkSync(localPath);
            }
        }
    } catch (e) {
        console.error('File cleanup warning:', e.message);
    }
};

const deleteResource = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) return res.status(404).json({ message: 'Resource not found' });

        const isUploader = resource.uploadedBy.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin' || req.user.isAdmin;

        if (!isUploader && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to delete this resource' });
        }

        if (resource.fileUrl) {
            await deleteCloudinaryFile(resource.fileUrl);
        }

        await resource.deleteOne();
        res.json({ message: 'Resource deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });

        const isAdmin = req.user.role === 'admin' || req.user.isAdmin;
        if (!isAdmin) {
            return res.status(403).json({ message: 'Only admins can delete placement drives' });
        }

        await job.deleteOne();
        res.json({ message: 'Placement drive deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const downloadResource = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource || !resource.fileUrl) {
            return res.status(404).json({ message: 'Resource file not found' });
        }

        const fileUrl = resource.fileUrl;
        const sanitizedTitle = (resource.title || 'document').replace(/[^a-zA-Z0-9_-]/g, '_');
        let ext = path.extname(fileUrl.split('?')[0]).toLowerCase();
        if (!ext || ext.length > 5) ext = '.pdf';

        if (fileUrl.includes('cloudinary.com')) {
            try {
                // If it's a Cloudinary URL uploaded under /image/upload/, swap to /raw/upload/ to fetch the complete raw document
                let targetUrl = fileUrl;
                if (fileUrl.includes('/image/upload/') && ext === '.pdf') {
                    targetUrl = fileUrl.replace('/image/upload/', '/raw/upload/');
                }

                let response = await fetch(targetUrl);
                if (!response.ok && targetUrl !== fileUrl) {
                    response = await fetch(fileUrl);
                }

                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    res.setHeader('Content-Type', ext === '.pdf' ? 'application/pdf' : (response.headers.get('content-type') || 'application/octet-stream'));
                    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}${ext}"`);
                    return res.send(buffer);
                }

                // 3. If direct fetch returns 401 (Cloudinary restricted PDF), fetch rendered .jpg document image
                if (ext === '.pdf') {
                    const jpgUrl = fileUrl.substring(0, fileUrl.lastIndexOf('.')) + '.jpg';
                    const jpgResponse = await fetch(jpgUrl);
                    if (jpgResponse.ok) {
                        const arrayBuffer = await jpgResponse.arrayBuffer();
                        const buffer = Buffer.from(arrayBuffer);
                        res.setHeader('Content-Type', 'image/jpeg');
                        res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}.jpg"`);
                        return res.send(buffer);
                    }
                }
            } catch (fetchErr) {
                console.error('Download fetch error:', fetchErr.message);
            }

            return res.redirect(fileUrl);
        } else {
            const localPath = path.join(__dirname, '..', fileUrl);
            if (fs.existsSync(localPath)) {
                return res.download(localPath, `${sanitizedTitle}${ext}`);
            }
            return res.status(404).json({ message: 'Local file missing' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { 
    uploadResource, getResources, toggleResourceUpvote, deleteResource, downloadResource,
    createJob, getJobs, deleteJob 
};