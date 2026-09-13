const express = require('express');
const mongoose = require('mongoose');
const shortid = require('shortid');
const cors = require('cors');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname)));

// MongoDB Connection Connection String
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/birthdayDB';
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret'
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'birthday-app-photos',
    allowed_formats: ['jpg', 'png', 'jpeg']
  }
});
const upload = multer({ storage: storage });

// Database Schema
const BirthdaySchema = new mongoose.Schema({
    uniqueId: { type: String, unique: true, default: shortid.generate },
    recipientName: String,
    message: String,
    photos: [String],
    theme: String,
    passcode: String,
    createdAt: { type: Date, default: Date.now }
});

const BirthdayPage = mongoose.model('BirthdayPage', BirthdaySchema);

// API Endpoint to Create Birthday Page with Image Uploads
app.post('/api/create', upload.array('photos', 5), async (req, res) => {
    try {
        const photoUrls = req.files ? req.files.map(file => file.path) : [];
        const newPage = new BirthdayPage({
            recipientName: req.body.recipientName,
            message: req.body.message,
            photos: photoUrls,
            theme: req.body.theme || 'bollywood',
            passcode: req.body.passcode || '2026'
        });
        
        const savedPage = await newPage.save();
        res.status(201).json({ 
            success: true, 
            shareableLink: `/view/${savedPage.uniqueId}` 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// API Endpoint to Fetch Birthday Data by Unique ID
app.get('/api/birthday/:id', async (req, res) => {
    try {
        const pageData = await BirthdayPage.findOne({ uniqueId: req.params.id });
        if (!pageData) return res.status(404).json({ error: "Page not found" });
        res.json(pageData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Catch-all route to serve index.html for custom links
app.get('/view/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
