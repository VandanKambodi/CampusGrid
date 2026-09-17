const Resource = require('../models/Resource');
const Job = require('../models/Job');
const { processPdfFile, scoreChunkRelevance } = require('../utils/pdfProcessor');

const processAndStoreResourceChunks = async (resourceId, fileSource) => {
    try {
        const result = await processPdfFile(fileSource);
        if (result && result.chunks && result.chunks.length > 0) {
            await Resource.findByIdAndUpdate(resourceId, {
                chunks: result.chunks,
                totalPages: result.numPages || 1,
                totalChunks: result.totalChunks || result.chunks.length,
                isIndexed: true
            });
            console.log(`Resource ${resourceId} indexed successfully with ${result.chunks.length} chunks.`);
        }
    } catch (err) {
        console.error(`Failed to process PDF chunks for ${resourceId}:`, err.message);
    }
};

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

        // Trigger background PDF chunk extraction
        const fileSource = req.file.buffer || req.file.path;
        processAndStoreResourceChunks(resource._id, fileSource);

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

        const uploadedById = resource.uploadedBy._id ? resource.uploadedBy._id.toString() : resource.uploadedBy.toString();
        const isOwner = uploadedById === req.user._id.toString();
        const isAdmin = req.user.role === 'admin' || req.user.isAdmin;

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Only the resource uploader or an admin can delete this resource' });
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

const updateResource = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) return res.status(404).json({ message: 'Resource not found' });

        const uploadedById = resource.uploadedBy._id ? resource.uploadedBy._id.toString() : resource.uploadedBy.toString();
        const isOwner = uploadedById === req.user._id.toString();
        const isAdmin = req.user.role === 'admin' || req.user.isAdmin;

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Only the resource uploader or an admin can edit this resource' });
        }

        const { title, subject, semester, branch } = req.body;
        if (!title?.trim() || !subject?.trim() || !semester || !branch) {
            return res.status(400).json({ message: 'Title, subject, semester, and branch are required' });
        }
        resource.title = title.trim();
        resource.subject = subject.trim();
        resource.semester = semester;
        resource.branch = branch;
        if (req.file) {
            await deleteCloudinaryFile(resource.fileUrl);
            resource.fileUrl = req.file.path;
        }

        await resource.save();
        await resource.populate('uploadedBy', 'name profilePicture');
        res.json(resource);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        if (req.user.role !== 'admin' && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Only admins can edit placement drives' });
        }

        const { title, company, description, applyLink, roleType } = req.body;
        if (!title?.trim() || !company?.trim() || !description?.trim() || !applyLink?.trim() || !roleType) {
            return res.status(400).json({ message: 'All placement fields are required' });
        }
        job.title = title.trim();
        job.company = company.trim();
        job.description = description.trim();
        job.applyLink = applyLink.trim();
        job.roleType = roleType;
        await job.save();
        await job.populate('postedBy', 'name role profilePicture');
        res.json(job);
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

/**
 * AI Semantic Search & Passage Retrieval for Resources
 */
const searchAIResources = async (req, res) => {
    const { query, semester, branch } = req.body;

    if (!query || !query.trim()) {
        return res.status(400).json({ message: 'Please provide a search query or question.' });
    }

    try {
        let dbQuery = {};
        if (semester) dbQuery.semester = semester;
        if (branch) dbQuery.branch = branch;

        let resources = await Resource.find(dbQuery).populate('uploadedBy', 'name profilePicture');

        // Check if any resources need indexing
        const unindexed = resources.filter(r => !r.isIndexed && r.fileUrl);
        if (unindexed.length > 0) {
            await Promise.all(unindexed.slice(0, 3).map(r => processAndStoreResourceChunks(r._id, r.fileUrl)));
            resources = await Resource.find(dbQuery).populate('uploadedBy', 'name profilePicture');
        }

        const matches = [];

        resources.forEach(resource => {
            const titleScore = scoreChunkRelevance(query, resource.title) * 2.5;
            const subjectScore = scoreChunkRelevance(query, resource.subject) * 2.0;

            if (resource.chunks && resource.chunks.length > 0) {
                resource.chunks.forEach(chunk => {
                    const chunkScore = scoreChunkRelevance(query, chunk.text);
                    const totalScore = Math.round((chunkScore + titleScore + subjectScore) * 100) / 100;

                    if (totalScore > 0.15) {
                        matches.push({
                            score: totalScore,
                            resourceId: resource._id,
                            title: resource.title,
                            subject: resource.subject,
                            semester: resource.semester,
                            branch: resource.branch,
                            fileUrl: resource.fileUrl,
                            uploadedBy: resource.uploadedBy,
                            upvotesCount: resource.upvotes ? resource.upvotes.length : 0,
                            chunkIndex: chunk.chunkIndex,
                            pageNumber: chunk.pageNumber || 1,
                            totalPages: resource.totalPages || 1,
                            textSnippet: chunk.text
                        });
                    }
                });
            } else if (titleScore + subjectScore > 0.3) {
                matches.push({
                    score: titleScore + subjectScore,
                    resourceId: resource._id,
                    title: resource.title,
                    subject: resource.subject,
                    semester: resource.semester,
                    branch: resource.branch,
                    fileUrl: resource.fileUrl,
                    uploadedBy: resource.uploadedBy,
                    upvotesCount: resource.upvotes ? resource.upvotes.length : 0,
                    chunkIndex: 0,
                    pageNumber: 1,
                    totalPages: resource.totalPages || 1,
                    textSnippet: `Reference Document: ${resource.title} (${resource.subject})`
                });
            }
        });

        // Sort by highest relevance score
        matches.sort((a, b) => b.score - a.score);
        const topReferences = matches.slice(0, 20);

        let aiAnswer = null;

        // Optional Gemini API synthesis if GEMINI_API_KEY is configured
        if (process.env.GEMINI_API_KEY && topReferences.length > 0) {
            try {
                const contextPassages = topReferences
                    .map((r, i) => `[Doc ${i + 1}: "${r.title}" (${r.subject})]\n${r.textSnippet}`)
                    .join('\n\n');

                const promptText = `You are CampusGrid Academic AI Assistant. Answer the student's question concisely using only the reference study material chunks below. 
Highlight exact key concepts and mention which document standard notes to refer to. Keep response helpful, structured, and within 3 short bullet points.

Question: ${query}

Reference Material:
${contextPassages}`;

                const geminiRes = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: promptText }] }]
                        })
                    }
                );

                if (geminiRes.ok) {
                    const data = await geminiRes.json();
                    aiAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text || null;
                }
            } catch (aiErr) {
                console.warn('Gemini API call skipped/failed:', aiErr.message);
            }
        }

        // Default synthesized response if no Gemini key or fallback
        if (!aiAnswer && topReferences.length > 0) {
            const topDoc = topReferences[0];
            aiAnswer = `Found ${topReferences.length} matching passage(s) across academic notes. Best reference match: **${topDoc.title}** (${topDoc.subject}, Semester ${topDoc.semester}). Review the reference snippets below or download the complete PDF documents directly.`;
        } else if (topReferences.length === 0) {
            aiAnswer = `No specific text matches found for "${query}" in the uploaded PDFs. Try broadening your query terms or upload relevant study notes for this subject.`;
        }

        res.json({
            query,
            aiAnswer,
            references: topReferences,
            totalIndexedResources: resources.filter(r => r.isIndexed).length
        });
    } catch (error) {
        console.error('AI Resource Search Error:', error);
        res.status(500).json({ message: 'Error performing semantic search across resources.' });
    }
};

/**
 * Reindex all unindexed PDF resources (Admin Utility)
 */
const reindexResources = async (req, res) => {
    try {
        const unindexed = await Resource.find({ fileUrl: { $exists: true } });
        let processedCount = 0;

        for (const resource of unindexed) {
            if (resource.fileUrl) {
                await processAndStoreResourceChunks(resource._id, resource.fileUrl);
                processedCount++;
            }
        }

        res.json({ message: `Successfully reindexed ${processedCount} resources for AI search.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Structured Answer Synthesizer for Local Fallback Mode
 */
function synthesizeStructuredAnswer(question, topPassages, resourceTitle, resourceSubject) {
    if (!topPassages || topPassages.length === 0) return null;

    const pages = Array.from(new Set(topPassages.map(p => p.pageNumber))).sort((a, b) => a - b);
    const pageStr = pages.join(', ');

    const fullText = topPassages.map(p => p.text).join('\n');
    const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);

    const workItems = [];
    const planItems = [];
    const refItems = [];
    let currentSection = 'work';

    lines.forEach(line => {
        const lower = line.toLowerCase();
        if (lower.includes('work done') || lower.includes('key topics') || lower.includes('concepts')) {
            currentSection = 'work';
            return;
        } else if (lower.includes('plans for next week') || lower.includes('future work') || lower.includes('next steps')) {
            currentSection = 'plans';
            return;
        } else if (lower.includes('references:') || lower.includes('bibliography')) {
            currentSection = 'references';
            return;
        }

        const isBulletOrNum = /^(\d+[\.\)]|[\-•\*])\s+/.test(line);
        if (isBulletOrNum) {
            const cleanText = line.replace(/^(\d+[\.\)]|[\-•\*])\s+/, '').trim();
            if (currentSection === 'work') workItems.push(cleanText);
            else if (currentSection === 'plans') planItems.push(cleanText);
            else if (currentSection === 'references') refItems.push(cleanText);
            else workItems.push(cleanText);
        }
    });

    let output = `### 📋 Summary & Analysis: "${resourceTitle}" (${resourceSubject})\n`;
    output += `**Source Pages:** Page ${pageStr}\n\n`;

    if (workItems.length > 0) {
        output += `#### 📝 Key Work Completed / Points:\n`;
        workItems.slice(0, 10).forEach(item => {
            output += `• ${item}\n`;
        });
        output += `\n`;
    }

    if (planItems.length > 0) {
        output += `#### 🎯 Upcoming Tasks / Plans:\n`;
        planItems.slice(0, 6).forEach(item => {
            output += `• ${item}\n`;
        });
        output += `\n`;
    }

    if (refItems.length > 0) {
        output += `#### 📚 References & Links:\n`;
        refItems.slice(0, 4).forEach(item => {
            output += `• ${item}\n`;
        });
        output += `\n`;
    }

    if (workItems.length === 0 && planItems.length === 0) {
        const sentences = fullText.split(/(?<=[.!?])\s+/).filter(s => s.length > 25);
        output += `#### 💡 Key Passage Details:\n`;
        sentences.slice(0, 5).forEach(s => {
            output += `• ${s.replace(/\s+/g, ' ').trim()}\n`;
        });
    }

    return output;
}

/**
 * Chat Specifically with an Individual PDF Resource
 */
const chatWithDocument = async (req, res) => {
    const { id } = req.params;
    const { question } = req.body;

    if (!question || !question.trim()) {
        return res.status(400).json({ message: 'Please enter a question about this document.' });
    }

    try {
        let resource = await Resource.findById(id).populate('uploadedBy', 'name profilePicture');
        if (!resource) {
            return res.status(404).json({ message: 'Resource document not found.' });
        }

        // On-the-fly chunk indexing if not already processed
        if ((!resource.chunks || resource.chunks.length === 0) && resource.fileUrl) {
            await processAndStoreResourceChunks(resource._id, resource.fileUrl);
            resource = await Resource.findById(id).populate('uploadedBy', 'name profilePicture');
        }

        const chunks = resource.chunks || [];
        const matches = [];

        chunks.forEach(chunk => {
            const score = scoreChunkRelevance(question, chunk.text);
            if (score > 0.05) {
                matches.push({
                    score,
                    chunkIndex: chunk.chunkIndex,
                    pageNumber: chunk.pageNumber || 1,
                    text: chunk.text
                });
            }
        });

        matches.sort((a, b) => b.score - a.score);
        
        // If no specific match (or general question like "overview"), select initial document chunks
        let topPassages = matches.slice(0, 5);
        if (topPassages.length === 0 && chunks.length > 0) {
            topPassages = chunks.slice(0, 3).map(c => ({
                score: 1.0,
                chunkIndex: c.chunkIndex,
                pageNumber: c.pageNumber || 1,
                text: c.text
            }));
        }

        let answer = null;
        const pageSet = new Set(topPassages.map(p => p.pageNumber));
        const referencedPages = Array.from(pageSet).sort((a, b) => a - b);

        if (process.env.GEMINI_API_KEY && topPassages.length > 0) {
            try {
                const passageContext = topPassages
                    .map(p => `[Page ${p.pageNumber}]\n${p.text}`)
                    .join('\n\n');

                const promptText = `You are CampusGrid AI Document Assistant. The student is asking a question about the document "${resource.title}" (${resource.subject}).
Answer the question accurately based ONLY on the document passages provided below. 
Format your answer in clear, bulleted points and explicitly state page numbers (e.g., "On Page X...").

Question: ${question}

Document Passages:
${passageContext}`;

                const geminiRes = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
                    }
                );

                if (geminiRes.ok) {
                    const data = await geminiRes.json();
                    answer = data.candidates?.[0]?.content?.parts?.[0]?.text || null;
                }
            } catch (err) {
                console.warn('Gemini chat error:', err.message);
            }
        }

        if (!answer && topPassages.length > 0) {
            answer = synthesizeStructuredAnswer(question, topPassages, resource.title, resource.subject);
        } else if (topPassages.length === 0) {
            answer = `I couldn't find specific passages in "${resource.title}" answering "${question}". Try rephrasing your question or asking about a specific concept in this note.`;
        }

        res.json({
            question,
            answer,
            referencedPages,
            topPassages,
            resource: {
                _id: resource._id,
                title: resource.title,
                subject: resource.subject,
                semester: resource.semester,
                branch: resource.branch,
                totalPages: resource.totalPages || 1,
                totalChunks: resource.totalChunks || chunks.length,
                fileUrl: resource.fileUrl
            }
        });
    } catch (error) {
        console.error('Document Chat Error:', error);
        res.status(500).json({ message: 'Error processing question for this document.' });
    }
};

module.exports = { 
    uploadResource, getResources, toggleResourceUpvote, deleteResource, downloadResource,
    createJob, getJobs, deleteJob, updateJob, updateResource, deleteCloudinaryFile,
    searchAIResources, reindexResources, chatWithDocument
};