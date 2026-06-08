# Installation & Setup Guide

## Quick Start (Frontend Only)

The form can work standalone without a backend. To use it immediately:

1. **Copy all files** to your web server
2. **Open `index.html`** in your browser
3. Form works! 🎉

Data is collected client-side and logged to the browser console. No backend needed for basic testing.

---

## Setup with Backend API

### Prerequisites
- Node.js 14+
- PostgreSQL 12+
- npm or yarn

### Installation Steps

#### 1. Backend Setup

```bash
cd sell-bike

# Install dependencies
npm install express cors multer dotenv nodemailer uuid pg

# Or use the provided package.json
npm install
```

#### 2. Database Setup

```bash
# Create PostgreSQL database
createdb anybike_db

# Run schema
psql -U postgres -d anybike_db -f database-schema.sql

# Verify tables created
psql -U postgres -d anybike_db -c "\dt"
```

#### 3. Environment Configuration

```bash
# Copy example file
cp .env.example .env

# Edit .env with your values
nano .env
```

**Required environment variables:**
```
DB_HOST=localhost
DB_NAME=anybike_db
DB_USER=postgres
DB_PASSWORD=your_password

EMAIL_FROM=noreply@anybike.co.uk
EMAIL_PASSWORD=your_password
ADMIN_EMAIL=admin@anybike.co.uk
```

#### 4. Start Backend Server

```bash
# Development
npm run dev

# Production
npm start
```

Server runs on `http://localhost:3000`

#### 5. Update Frontend API Endpoint

Edit `script.js` line 15:

```javascript
const CONFIG = {
    API_ENDPOINT: 'https://your-api.com/api/valuations/submit',
    // ...
};
```

#### 6. Deploy

```bash
# Build/prepare for production
npm run build

# Or use PM2 for background process
npm install -g pm2
pm2 start api-backend.js --name "anybike-api"
pm2 save
```

---

## Integration with Main Website

### Option 1: Iframe Embed
```html
<iframe 
    src="https://your-domain.com/sell-bike/index.html"
    width="100%" 
    height="1200" 
    frameborder="0">
</iframe>
```

### Option 2: Link to Standalone Page
```html
<a href="/sell-bike/index.html" class="btn btn-primary">
    Sell Your Motorcycle
</a>
```

### Option 3: React/Vue Component Integration
Import `script.js` and styles into your component, then reference `index.html` for structure.

---

## File Structure

```
sell-bike/
├── index.html              # Main form page
├── styles.css              # Form styling
├── script.js               # Form logic & image upload
├── api-backend.js          # Optional Node.js backend
├── database-schema.sql     # PostgreSQL database
├── .env.example            # Environment variables template
├── README.md               # Module documentation
├── INSTALLATION.md         # This file
└── uploads/                # Photo upload directory (backend only)
```

---

## Testing

### Test Frontend Form

```bash
# Option 1: Direct browser
open index.html

# Option 2: Local server
python -m http.server 8000
# Visit http://localhost:8000/index.html
```

### Test Backend API

```bash
# Health check
curl http://localhost:3000/health

# Submit test valuation
curl -X POST http://localhost:3000/api/valuations/submit \
  -H "Content-Type: application/json" \
  -d '{
    "bikeDetails": {
      "registration": "AB21XYZ",
      "make": "Honda CB500F",
      "year": 2021,
      "mileage": 12500
    },
    "condition": {
      "overallCondition": "good",
      "serviceHistory": "full",
      "motStatus": "valid",
      "accidentHistory": "none"
    },
    "sellerInfo": {
      "fullName": "John Smith",
      "email": "john@example.com",
      "phone": "07700900000",
      "postcode": "SW1A1AA"
    }
  }'
```

---

## Troubleshooting

### Photos not uploading
- Check browser console for errors
- Verify file size < 5MB
- Check file format (JPEG, PNG, GIF)

### Form submission fails
- Check `CONFIG.API_ENDPOINT` in `script.js`
- Verify CORS settings in backend
- Check network tab in browser DevTools

### Email not sending
- Verify `EMAIL_FROM` and `EMAIL_PASSWORD` in `.env`
- Check email service credentials
- Enable "Less secure apps" if using Gmail

### Database connection error
- Verify PostgreSQL is running
- Check `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- Ensure database exists: `createdb anybike_db`

---

## Performance Tips

1. **Image Optimization**
   - Compress images on client-side before upload
   - Use WebP format for smaller files

2. **Database**
   - Add indexes (already included in schema)
   - Archive old listings monthly
   - Monitor query performance

3. **Frontend**
   - Minify CSS/JS in production
   - Enable gzip compression
   - Use CDN for static files

---

## Security Checklist

- [ ] Change default database passwords
- [ ] Set strong JWT_SECRET in .env
- [ ] Enable HTTPS in production
- [ ] Implement rate limiting on API
- [ ] Encrypt bank details (use PGP)
- [ ] Regular security audits
- [ ] Backup database regularly
- [ ] GDPR data retention policy

---

## Removal Instructions

If you don't want to use this feature:

```bash
# Delete the feature branch
git branch -D feature/bike-selling-form

# Or simply delete the sell-bike folder
rm -rf sell-bike/

# Or remove from main if merged
# Edit .gitignore to exclude sell-bike/
```

---

## Support & Updates

- Check `README.md` for feature documentation
- Review `database-schema.sql` for data structure
- Modify `script.js` for custom validation rules
- Update styling in `styles.css` to match your brand

---

## License

This module is part of AnyBike and follows the same license as the main project.
