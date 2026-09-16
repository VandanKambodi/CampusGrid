const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const { setupSocket } = require('./socket');

dotenv.config();

// Connect to database
connectDB();

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: { origin: true, credentials: true }
});
app.set('io', io);
setupSocket(io);

// Middleware
app.use(cors());
app.use(express.json({ limit: '25kb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.get('/', (req, res) => {
    res.send('CampusGrid API is running...');
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/hub', require('./routes/hubRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api', require('./routes/contentRoutes'));

// Global error handler (handles Multer file limit errors)
app.use((err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size exceeds maximum limit of 10MB.' });
    }
    if (err) {
        return res.status(err.status || 500).json({ message: err.message || 'An unexpected error occurred' });
    }
    next();
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server running in development mode on port ${PORT}`);
});