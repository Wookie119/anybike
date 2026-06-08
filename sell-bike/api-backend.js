// ========================================
// ANYBIKE - NODE.JS/EXPRESS BACKEND API
// Optional backend for form submissions
// ========================================

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
// const postgres = require('pg');

dotenv.config();

const app = express();

// ========== CONFIGURATION ==========
const PORT = process.env.PORT || 3000;
const DB_HOST = process.env.DB_HOST;
const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;

const UPLOAD_DIR = './uploads';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ========== MIDDLEWARE ==========
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
}));

// ========== MULTER CONFIGURATION ==========
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'bike-' + uniqueSuffix + '.jpg');
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// ========== DATABASE CONNECTION ==========
// Example using pg - uncomment to use
// const pool = new postgres.Pool({
//     host: DB_HOST,
//     database: DB_NAME,
//     user: DB_USER,
//     password: DB_PASSWORD,
// });

// ========== EMAIL CONFIGURATION ==========
const emailTransporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASSWORD
    }
});

// ========== HEALTH CHECK ==========
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ========== SUBMIT MOTORCYCLE VALUATION ==========
app.post('/api/valuations/submit', async (req, res) => {
    try {
        const {
            bikeDetails,
            condition,
            sellerInfo,
            bankDetails,
            photos
        } = req.body;

        // Validation
        if (!bikeDetails || !condition || !sellerInfo) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // Generate reference number
        const referenceNumber = generateReferenceNumber();

        // In production, save to database
        // const result = await saveToDatabaseExample(
        //     referenceNumber,
        //     bikeDetails,
        //     condition,
        //     sellerInfo,
        //     bankDetails,
        //     photos
        // );

        // Calculate estimated value
        const estimatedValue = calculateValuation(bikeDetails, condition);

        // Log the submission (in production, save to database)
        console.log('New valuation submission:', {
            referenceNumber,
            registration: bikeDetails.registration,
            email: sellerInfo.email,
            estimatedValue,
            timestamp: new Date().toISOString()
        });

        // Send confirmation email to customer
        await sendCustomerConfirmationEmail(sellerInfo.email, {
            referenceNumber,
            bikeDetails,
            estimatedValue
        });

        // Send notification email to admin
        await sendAdminNotificationEmail({
            referenceNumber,
            bikeDetails,
            sellerInfo,
            estimatedValue
        });

        // Response
        res.status(201).json({
            success: true,
            referenceNumber,
            estimatedValue,
            message: 'Valuation submitted successfully. We will contact you within 24 hours.'
        });

    } catch (error) {
        console.error('Error submitting valuation:', error);
        res.status(500).json({
            success: false,
            error: 'Error processing submission. Please try again.'
        });
    }
});

// ========== GET VALUATION ESTIMATE ==========
app.post('/api/valuations/estimate', (req, res) => {
    try {
        const { bikeDetails, condition } = req.body;

        if (!bikeDetails || !condition) {
            return res.status(400).json({
                success: false,
                error: 'Missing bike details or condition'
            });
        }

        const estimatedValue = calculateValuation(bikeDetails, condition);

        res.json({
            success: true,
            estimatedValue,
            currency: 'GBP',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error calculating estimate:', error);
        res.status(500).json({
            success: false,
            error: 'Error calculating estimate'
        });
    }
});

// ========== GET VALUATION STATUS ==========
app.get('/api/valuations/:referenceNumber', (req, res) => {
    try {
        const { referenceNumber } = req.params;

        // In production, query database
        // const valuation = await getValuationFromDatabase(referenceNumber);

        // Placeholder response
        res.json({
            success: true,
            referenceNumber,
            status: 'pending',
            createdAt: new Date().toISOString(),
            message: 'Your valuation is being reviewed. We will contact you soon.'
        });

    } catch (error) {
        console.error('Error fetching valuation:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching valuation'
        });
    }
});

// ========== UPLOAD PHOTOS ==========
app.post('/api/valuations/photos', upload.array('photos', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No files uploaded'
            });
        }

        const photoUrls = req.files.map(file => ({
            filename: file.filename,
            url: `/uploads/${file.filename}`,
            size: file.size,
            uploadedAt: new Date().toISOString()
        }));

        res.json({
            success: true,
            photos: photoUrls,
            totalUploaded: photoUrls.length
        });

    } catch (error) {
        console.error('Error uploading photos:', error);
        res.status(500).json({
            success: false,
            error: 'Error uploading photos'
        });
    }
});

// ========== SEND OFFER ==========
app.post('/api/offers/send', async (req, res) => {
    try {
        const { referenceNumber, amount, validUntil } = req.body;

        if (!referenceNumber || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Missing offer details'
            });
        }

        // In production: get customer email from database
        const customerEmail = 'customer@example.com';

        // Send offer email
        await emailTransporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: customerEmail,
            subject: `Offer for your motorcycle - Reference ${referenceNumber}`,
            html: generateOfferEmailHTML(referenceNumber, amount, validUntil)
        });

        res.json({
            success: true,
            message: 'Offer sent successfully'
        });

    } catch (error) {
        console.error('Error sending offer:', error);
        res.status(500).json({
            success: false,
            error: 'Error sending offer'
        });
    }
});

// ========== HELPER FUNCTIONS ==========

function generateReferenceNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `AB-${timestamp}-${random}`;
}

function calculateValuation(bikeDetails, condition) {
    let baseValue = 5000;

    // Age adjustment
    const ageYears = new Date().getFullYear() - parseInt(bikeDetails.year);
    baseValue -= (ageYears * 200);

    // Mileage adjustment
    const mileage = parseInt(bikeDetails.mileage);
    baseValue -= (mileage / 10);

    // Condition multiplier
    const conditionMultipliers = {
        'excellent': 1.2,
        'good': 1.0,
        'fair': 0.75,
        'poor': 0.5,
        'damaged': 0.25,
        'non-running': 0.1
    };

    const multiplier = conditionMultipliers[condition.overallCondition] || 1.0;
    baseValue *= multiplier;

    // Service history bonus
    if (condition.serviceHistory === 'full') {
        baseValue *= 1.1;
    }

    // Ensure minimum value
    baseValue = Math.max(baseValue, 500);

    return Math.round(baseValue);
}

async function sendCustomerConfirmationEmail(email, data) {
    const { referenceNumber, bikeDetails, estimatedValue } = data;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #0066cc 0%, #004499 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
                .reference { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #0066cc; }
                .details { margin: 20px 0; }
                .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; }
                .value { color: #0066cc; font-weight: bold; }
                .estimated-value { font-size: 24px; color: #0066cc; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>We Buy Any Bike</h1>
                    <p>Valuation Received</p>
                </div>
                <div class="content">
                    <p>Hello,</p>
                    <p>Thank you for submitting your motorcycle for valuation. We've received your details and will review them shortly.</p>
                    
                    <div class="reference">
                        <p><strong>Reference Number:</strong></p>
                        <p class="value">${referenceNumber}</p>
                        <p><small>Please keep this number for your records. We'll use it to track your valuation.</small></p>
                    </div>

                    <div class="details">
                        <h3>Bike Details Submitted:</h3>
                        <div class="detail-row">
                            <span>Make & Model:</span>
                            <span class="value">${bikeDetails.make}</span>
                        </div>
                        <div class="detail-row">
                            <span>Year:</span>
                            <span class="value">${bikeDetails.year}</span>
                        </div>
                        <div class="detail-row">
                            <span>Mileage:</span>
                            <span class="value">${parseInt(bikeDetails.mileage).toLocaleString()} miles</span>
                        </div>
                    </div>

                    <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                        <p style="color: #666; margin: 0 0 10px 0;">Estimated Value:</p>
                        <p class="estimated-value">£${estimatedValue.toLocaleString()}</p>
                        <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">This is an estimate. Final offer will be made after full inspection.</p>
                    </div>

                    <p>We'll contact you within 24 hours with a formal offer. Our team will arrange a convenient collection time at no cost to you.</p>
                    
                    <p>If you have any questions, please don't hesitate to get in touch.</p>
                    
                    <p>Best regards,<br>The AnyBike Team</p>
                </div>
            </div>
        </body>
        </html>
    `;

    await emailTransporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: `Valuation Received - Reference ${referenceNumber}`,
        html: html
    });
}

async function sendAdminNotificationEmail(data) {
    const { referenceNumber, bikeDetails, sellerInfo, estimatedValue } = data;

    const html = `
        <h2>New Valuation Submission</h2>
        <p><strong>Reference:</strong> ${referenceNumber}</p>
        <h3>Bike Details</h3>
        <ul>
            <li>Registration: ${bikeDetails.registration}</li>
            <li>Make & Model: ${bikeDetails.make}</li>
            <li>Year: ${bikeDetails.year}</li>
            <li>Mileage: ${bikeDetails.mileage} miles</li>
            <li>Estimated Value: £${estimatedValue}</li>
        </ul>
        <h3>Seller Information</h3>
        <ul>
            <li>Name: ${sellerInfo.fullName}</li>
            <li>Email: ${sellerInfo.email}</li>
            <li>Phone: ${sellerInfo.phone}</li>
        </ul>
    `;

    await emailTransporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: process.env.ADMIN_EMAIL,
        subject: `New Valuation - ${bikeDetails.registration} - £${estimatedValue}`,
        html: html
    });
}

function generateOfferEmailHTML(referenceNumber, amount, validUntil) {
    return `
        <h2>Formal Offer for Your Motorcycle</h2>
        <p>Reference: ${referenceNumber}</p>
        <p style="font-size: 24px; color: #0066cc;"><strong>£${amount.toLocaleString()}</strong></p>
        <p>Valid until: ${validUntil}</p>
    `;
}

// ========== ERROR HANDLING ==========
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
});

// ========== 404 HANDLER ==========
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
    console.log(`🚀 AnyBike API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
