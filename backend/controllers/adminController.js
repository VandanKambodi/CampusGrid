const Request = require('../models/Request');
const User = require('../models/User');

// @desc    Request new student account creation
// @route   POST /api/hub/requests/account
// @access  Public
const requestAccountCreation = async (req, res) => {
    const { rollNo, name, course, branch, requestedPassword, reason } = req.body;

    if (!rollNo || !requestedPassword) {
        return res.status(400).json({ message: 'Roll number and requested password are required.' });
    }

    try {
        const existingUser = await User.findOne({ rollNo });
        if (existingUser) {
            return res.status(400).json({ message: 'An account with this roll number already exists.' });
        }

        const request = await Request.create({
            type: 'account_creation',
            rollNo,
            name: name || '',
            course: course || 'B.Tech',
            branch: branch || 'CSE',
            requestedPassword,
            reason: reason || ''
        });

        res.status(201).json({ message: 'Account creation request submitted successfully', request });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Request password reset
// @route   POST /api/hub/requests/reset-password
// @access  Public
const requestPasswordReset = async (req, res) => {
    const { rollNo, name, requestedPassword, reason } = req.body;

    if (!rollNo || !requestedPassword) {
        return res.status(400).json({ message: 'Roll number and new requested password are required.' });
    }

    try {
        const request = await Request.create({
            type: 'password_reset',
            rollNo,
            name: name || '',
            requestedPassword,
            reason: reason || ''
        });

        res.status(201).json({ message: 'Password reset request submitted successfully', request });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all pending requests
// @route   GET /api/hub/admin/requests
// @access  Private/Admin
const getPendingRequests = async (req, res) => {
    try {
        const requests = await Request.find({ status: 'pending' }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve or reject a request
// @route   PUT /api/hub/admin/requests/:id
// @access  Private/Admin
const processRequest = async (req, res) => {
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be approved or rejected.' });
    }

    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (status === 'approved') {
            if (request.type === 'account_creation') {
                const userExists = await User.findOne({ rollNo: request.rollNo });
                if (!userExists) {
                    await User.create({
                        role: 'student',
                        rollNo: request.rollNo,
                        name: request.name,
                        course: request.course,
                        branch: request.branch,
                        password: request.requestedPassword
                    });
                }
            } else if (request.type === 'password_reset') {
                const user = await User.findOne({ rollNo: request.rollNo });
                if (user) {
                    user.password = request.requestedPassword;
                    await user.save();
                }
            }
        }

        request.status = status;
        await request.save();

        res.json({ message: `Request ${status} successfully`, request });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Directly create a student account
// @route   POST /api/hub/admin/users
// @access  Private/Admin
const directCreateStudent = async (req, res) => {
    const { rollNo, name, password, course, branch } = req.body;

    if (!rollNo || !name || !password) {
        return res.status(400).json({ message: 'Roll number, name, and password are required.' });
    }

    try {
        const userExists = await User.findOne({ rollNo });
        if (userExists) {
            return res.status(400).json({ message: 'User with this roll number already exists.' });
        }

        const user = await User.create({
            role: 'student',
            rollNo,
            name,
            password,
            course: course || '',
            branch: branch || ''
        });

        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Directly change student password
// @route   PUT /api/hub/admin/users/:id/password
// @access  Private/Admin
const directChangePassword = async (req, res) => {
    const { newPassword } = req.body;

    if (!newPassword) {
        return res.status(400).json({ message: 'New password is required.' });
    }

    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    requestAccountCreation,
    requestPasswordReset,
    getPendingRequests,
    processRequest,
    directCreateStudent,
    directChangePassword
};
