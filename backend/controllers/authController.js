const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const setupInitialAdmin = async (req, res) => {
    const adminExists = await User.findOne({ role: 'admin' });

    if (adminExists) {
        return res.status(400).json({ message: 'Admin already exists. Setup closed.' });
    }

    const { rollNo, name, password } = req.body;

    const admin = await User.create({
        role: 'admin',
        rollNo,
        name,
        password
    });

    if (admin) {
        res.status(201).json({
            _id: admin._id,
            rollNo: admin.rollNo,
            name: admin.name,
            role: admin.role,
            token: generateToken(admin._id)
        });
    } else {
        res.status(400).json({ message: 'Invalid admin data' });
    }
};

const loginUser = async (req, res) => {
    const { rollNo, password } = req.body;

    const user = await User.findOne({ rollNo });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            rollNo: user.rollNo,
            name: user.name,
            role: user.role,
            token: generateToken(user._id)
        });
    } else {
        res.status(401).json({ message: 'Invalid Roll Number or Password' });
    }
};

const registerStudent = async (req, res) => {
    const { rollNo, name, password, course, branch } = req.body;

    const userExists = await User.findOne({ rollNo });

    if (userExists) {
        return res.status(400).json({ message: 'Student already exists' });
    }

    const user = await User.create({
        role: 'student',
        rollNo,
        name,
        password,
        course,
        branch
    });

    if (user) {
        res.status(201).json({
            message: 'Student created successfully',
            student: {
                _id: user._id,
                rollNo: user.rollNo,
                name: user.name,
                course: user.course,
                branch: user.branch
            }
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

module.exports = { setupInitialAdmin, loginUser, registerStudent };