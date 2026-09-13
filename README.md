# Special Birthday - Instagram-Style Birthday Link Generator

## Production-Ready Features

✨ **Creator Experience**
- Multi-step wizard UI (mobile-first)
- Person details, messages, up to 10 photos
- 8 premium themes (Luxury, Dreamy, Party, Cute, Minimal, Neon, Royal, Dark)
- Live preview with customization options
- Photo reordering, compression, and validation
- Automatic image optimization

🎉 **Birthday Page Experience**
- Cinematic intro animation
- Photo slideshow with Ken Burns effects
- Confetti, particles, hearts, balloons, sparkles
- Swipe gestures and fullscreen gallery
- Optional music with controls
- Reduced-motion support
- Works on all devices

🔧 **Backend & Infrastructure**
- Express.js REST API
- SQLite persistent database
- Image storage with compression
- Server-side validation
- Rate limiting
- Error handling
- Unique shareable URLs

## Project Structure

```
special-birthday/
├── server.js
├── package.json
├── .env.example
├── index.html                 # Frontend (all-in-one)
├── public/
│   ├── favicon.ico
│   └── manifest.json
├── api/
│   ├── birthday.js           # Birthday routes
│   ├── create.js             # Create/upload routes
│   ├── database.js           # SQLite setup
│   └── middleware.js         # Auth, validation, rate limit
├── uploads/                  # Photo storage (not in git)
├── data/                     # Database file (not in git)
└── README.md
```

## Quick Start

### Installation

```bash
npm install
cp .env.example .env
```

### Development

```bash
npm run dev
```

Open http://localhost:3000

### Production

```bash
NODE_ENV=production npm start
```

## Environment Variables

See `.env.example` for all options:

- `PORT` - Server port (default: 3000)
- `BASE_URL` - Public URL for sharing
- `DB_PATH` - SQLite database location
- `UPLOAD_DIR` - Photo storage directory
- `MAX_FILE_SIZE` - Max upload size (default: 5MB)
- `MAX_PHOTOS` - Max photos per birthday (default: 10)
- `IMAGE_QUALITY` - JPEG quality 1-100 (default: 80)

## API Endpoints

### Create Birthday

```bash
POST /api/create
Content-Type: multipart/form-data

Payload:
- personName (string, required)
- personAge (number, required)
- birthday (date, required)
- nickname (string, optional)
- relationship (string, required)
- mainMessage (string, required)
- shortMessage (string, optional)
- longMessage (string, optional)
- signature (string, optional)
- senderName (string, required)
- theme (string, required)
- backgroundImage (file, optional)
- photos (files[], max 10)

Response:
{
  "success": true,
  "birthdayId": "X7K92P",
  "url": "http://localhost:3000/birthday/X7K92P",
  "message": "Birthday page created successfully!"
}
```

### Get Birthday

```bash
GET /api/birthday/:id

Response:
{
  "success": true,
  "birthday": {
    "id": "X7K92P",
    "personName": "Sarah",
    "personAge": 25,
    "birthday": "1999-09-13",
    "nickname": "Sara",
    "relationship": "Friend",
    "mainMessage": "Happy 25th Birthday!",
    "shortMessage": "You're awesome!",
    "longMessage": "...",
    "signature": "With love",
    "senderName": "Alex",
    "theme": "Luxury",
    "photos": [
      {
        "id": 1,
        "url": "/uploads/X7K92P/photo-1.jpg",
        "order": 1
      }
    ],
    "createdAt": "2024-09-13T10:30:00Z"
  }
}
```

## Testing

### Complete Flow Test

1. **Create Birthday**
   - Fill all person details
   - Add main & short message
   - Upload 10 photos
   - Select theme
   - Generate link

2. **Share & Open**
   - Copy link
   - Open in new browser/device
   - Verify fresh load

3. **Mobile Responsiveness**
   - Test on iPhone (iOS Safari)
   - Test on Android (Chrome)
   - Test on tablet
   - Test desktop

4. **Photo Gallery**
   - Swipe through photos
   - Fullscreen mode
   - Landscape orientation

5. **Invalid IDs**
   - Visit `/birthday/INVALID123`
   - Should show 404 page

## Deployment

### Heroku

```bash
heroku create your-app-name
heroku config:set BASE_URL=https://your-app-name.herokuapp.com
heroku config:set NODE_ENV=production
git push heroku main
```

### Docker

```bash
docker build -t special-birthday .
docker run -p 3000:3000 -v /data:/app/data special-birthday
```

### Vercel/Netlify

Not recommended for this project (requires persistent storage and file uploads). Use Node.js hosting like Heroku, Railway, Render, or DigitalOcean instead.

## Performance

- Images auto-compressed to max 1200x1200px
- JPEG quality optimized at 80% (configurable)
- Lazy loading for photo gallery
- Minimal dependencies
- Efficient particle animations (limited count)
- Reduced-motion CSS media query support
- Mobile-optimized (no horizontal scroll)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Security

- Rate limiting (30 requests per 15 min)
- File type validation (images only)
- File size limits (5MB per file)
- SQL injection prevention (parameterized queries)
- XSS protection (HTML escaping)
- CORS enabled for sharing
- No secrets in frontend

## License

ISC
