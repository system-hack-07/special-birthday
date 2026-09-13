const express = require('express');
const path = require('path');
const db = require('./database');

const router = express.Router();

// GET /api/birthday/:id - Fetch birthday data
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!/^[A-Z0-9]{6}$/.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid birthday ID format' });
    }

    // Fetch birthday
    const birthday = await db.get(
      'SELECT * FROM birthdays WHERE id = ?',
      [id]
    );

    if (!birthday) {
      return res.status(404).json({ success: false, message: 'Birthday not found' });
    }

    // Fetch photos
    const photos = await db.all(
      'SELECT id, url, order_index FROM photos WHERE birthdayId = ? ORDER BY order_index ASC',
      [id]
    );

    // Convert boolean fields
    birthday.animationEnabled = birthday.animationEnabled === 1;
    birthday.musicAutoplay = birthday.musicAutoplay === 1;

    res.json({
      success: true,
      birthday: {
        ...birthday,
        photos: photos.map(p => ({
          id: p.id,
          url: p.url,
          order: p.order_index
        }))
      }
    });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'Failed to fetch birthday' : error.message
    });
  }
});

module.exports = router;
