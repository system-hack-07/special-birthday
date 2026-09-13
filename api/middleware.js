const rateLimit = require('express-rate-limit');

const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 30),
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const validateBirthdayData = (req, res, next) => {
  const { personName, personAge, birthday, relationship, mainMessage, senderName, theme } = req.body;

  const errors = [];

  if (!personName || typeof personName !== 'string' || personName.trim().length === 0) {
    errors.push('Person name is required');
  }
  if (!personName || personName.length > 100) {
    errors.push('Person name must be less than 100 characters');
  }

  if (!personAge || typeof personAge !== 'number' || personAge < 1 || personAge > 150) {
    errors.push('Person age must be between 1 and 150');
  }

  if (!birthday || !/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
    errors.push('Birthday must be in YYYY-MM-DD format');
  }

  if (!relationship || typeof relationship !== 'string' || relationship.trim().length === 0) {
    errors.push('Relationship is required');
  }

  if (!mainMessage || typeof mainMessage !== 'string' || mainMessage.trim().length === 0) {
    errors.push('Main message is required');
  }
  if (mainMessage && mainMessage.length > 500) {
    errors.push('Main message must be less than 500 characters');
  }

  if (!senderName || typeof senderName !== 'string' || senderName.trim().length === 0) {
    errors.push('Sender name is required');
  }
  if (senderName && senderName.length > 100) {
    errors.push('Sender name must be less than 100 characters');
  }

  if (!theme || !['Luxury', 'Dreamy', 'Party', 'Cute', 'Minimal', 'Neon', 'Royal', 'Dark'].includes(theme)) {
    errors.push('Invalid theme selected');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
};

const sanitizeHtml = (html) => {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

module.exports = {
  rateLimiter,
  validateBirthdayData,
  sanitizeHtml
};
