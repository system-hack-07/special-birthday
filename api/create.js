const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');
const { validateBirthdayData, sanitizeHtml } = require('./middleware');

const router = express.Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || 5242880);
const MAX_PHOTOS = parseInt(process.env.MAX_PHOTOS || 10);
const IMAGE_QUALITY = parseInt(process.env.IMAGE_QUALITY || 80);
const IMAGE_MAX_WIDTH = parseInt(process.env.IMAGE_MAX_WIDTH || 1200);
const IMAGE_MAX_HEIGHT = parseInt(process.env.IMAGE_MAX_HEIGHT || 1200);

// Configure multer for file uploads
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Helper: Generate unique 6-char ID
const generateId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

// Helper: Process and save image
const processImage = async (file, filename) => {
  try {
    await sharp(file.buffer)
      .resize(IMAGE_MAX_WIDTH, IMAGE_MAX_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: IMAGE_QUALITY, progressive: true })
      .toFile(filename);
    return true;
  } catch (error) {
    console.error('Image processing error:', error);
    return false;
  }
};

// POST /api/create - Create a new birthday
router.post('/', validateBirthdayData, upload.array('photos', MAX_PHOTOS), async (req, res) => {
  try {
    const {
      personName,
      personAge,
      birthday,
      nickname,
      relationship,
      mainMessage,
      shortMessage,
      longMessage,
      signature,
      senderName,
      theme,
      backgroundColor,
      fontFamily,
      accentColor,
      animationEnabled,
      photoLayout,
      musicUrl
    } = req.body;

    // Validate files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one photo is required' });
    }

    if (req.files.length > MAX_PHOTOS) {
      return res.status(400).json({ success: false, message: `Maximum ${MAX_PHOTOS} photos allowed` });
    }

    // Generate unique ID
    let birthdayId = generateId();
    let exists = await db.get('SELECT id FROM birthdays WHERE id = ?', [birthdayId]);
    while (exists) {
      birthdayId = generateId();
      exists = await db.get('SELECT id FROM birthdays WHERE id = ?', [birthdayId]);
    }

    // Create birthday directory
    const birthdayDir = path.join(UPLOAD_DIR, birthdayId);
    if (!fs.existsSync(birthdayDir)) {
      fs.mkdirSync(birthdayDir, { recursive: true });
    }

    // Process and save photos
    const photos = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const filename = `photo-${i + 1}.jpg`;
      const filepath = path.join(birthdayDir, filename);

      const success = await processImage(file, filepath);
      if (success) {
        photos.push({
          order: i + 1,
          url: `/uploads/${birthdayId}/${filename}`,
          filename
        });
      }
    }

    if (photos.length === 0) {
      // Clean up directory if no photos processed
      fs.rmSync(birthdayDir, { recursive: true });
      return res.status(400).json({ success: false, message: 'Failed to process photos' });
    }

    // Insert birthday into database
    await db.run(
      `INSERT INTO birthdays (
        id, personName, personAge, birthday, nickname, relationship,
        mainMessage, shortMessage, longMessage, signature, senderName,
        theme, backgroundColor, fontFamily, accentColor, animationEnabled,
        photoLayout, musicUrl
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        birthdayId,
        sanitizeHtml(personName),
        parseInt(personAge),
        birthday,
        sanitizeHtml(nickname || ''),
        sanitizeHtml(relationship),
        sanitizeHtml(mainMessage),
        sanitizeHtml(shortMessage || ''),
        sanitizeHtml(longMessage || ''),
        sanitizeHtml(signature || ''),
        sanitizeHtml(senderName),
        theme,
        backgroundColor || '#ffffff',
        fontFamily || 'Inter',
        accentColor || '#ff006e',
        animationEnabled !== 'false' ? 1 : 0,
        photoLayout || 'grid',
        musicUrl || null
      ]
    );

    // Insert photos into database
    for (const photo of photos) {
      await db.run(
        'INSERT INTO photos (birthdayId, filename, url, order_index) VALUES (?, ?, ?, ?)',
        [birthdayId, photo.filename, photo.url, photo.order]
      );
    }

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const shareUrl = `${baseUrl}/birthday/${birthdayId}`;

    res.status(201).json({
      success: true,
      birthdayId,
      url: shareUrl,
      message: 'Birthday page created successfully!'
    });
  } catch (error) {
    console.error('Create error:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'Failed to create birthday' : error.message
    });
  }
});

module.exports = router;
