const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isCloudinaryConfigured = 
    cloudName && cloudName !== 'your_cloud_name' &&
    apiKey && apiKey !== 'your_api_key' &&
    apiSecret && apiSecret !== 'your_api_secret';

let storage;

if (isCloudinaryConfigured) {
    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret
    });

    storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: async (req, file) => {
            const ext = path.extname(file.originalname).toLowerCase();
            const isDoc = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt'].includes(ext) || (file.mimetype && file.mimetype.includes('pdf'));
            return {
                folder: 'campusgrid',
                resource_type: isDoc ? 'raw' : 'auto'
            };
        }
    });
} else {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            cb(null, `${Date.now()}-${file.originalname}`);
        }
    });
}

const upload = multer({ 
    storage,
    limits: { 
        fileSize: 10 * 1024 * 1024 // 10MB Universal File Size Limit
    }
});

module.exports = upload;
