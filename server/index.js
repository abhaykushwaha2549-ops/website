require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const ADMIN_EMAIL     = process.env.ADMIN_EMAIL     || 'abhaykushwaha2549@gmail.com';
const ADMIN_PASSWORD  = process.env.ADMIN_PASSWORD  || 'Ab#ay2549';
const SUPABASE_URL    = process.env.SUPABASE_URL    || '';
const SUPABASE_KEY    = process.env.SUPABASE_SERVICE_KEY || '';
const FRONTEND_URL    = process.env.FRONTEND_URL    || 'http://localhost:3000';

// If both Supabase env vars are present → use cloud storage, otherwise local disk
const USE_SUPABASE = !!(SUPABASE_URL && SUPABASE_KEY);

let supabase = null;
if (USE_SUPABASE) {
  const { createClient } = require('@supabase/supabase-js');
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

const B2_KEY_ID = process.env.B2_KEY_ID || '';
const B2_APPLICATION_KEY = process.env.B2_APPLICATION_KEY || '';
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME || '';
const B2_ENDPOINT = process.env.B2_ENDPOINT || '';
const B2_REGION = process.env.B2_REGION || '';

const USE_B2 = !!(B2_KEY_ID && B2_APPLICATION_KEY && B2_BUCKET_NAME && B2_ENDPOINT && B2_REGION);

let s3Client = null;
if (USE_B2) {
  const { S3Client, PutBucketCorsCommand } = require('@aws-sdk/client-s3');
  
  let endpointUrl = B2_ENDPOINT;
  if (endpointUrl && !endpointUrl.startsWith('http://') && !endpointUrl.startsWith('https://')) {
    endpointUrl = `https://${endpointUrl}`;
  }
  
  s3Client = new S3Client({
    endpoint: endpointUrl,
    region: B2_REGION,
    credentials: {
      accessKeyId: B2_KEY_ID,
      secretAccessKey: B2_APPLICATION_KEY,
    },
  });
  console.log(`📦 Backblaze B2 storage client initialized on bucket: ${B2_BUCKET_NAME}`);

  const corsParams = {
    Bucket: B2_BUCKET_NAME,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
          AllowedOrigins: ['*'],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  };
  s3Client.send(new PutBucketCorsCommand(corsParams))
    .then(() => console.log('✅ Backblaze B2 CORS rules automatically set!'))
    .catch(err => console.error('⚠️  Failed to set Backblaze B2 CORS rules on startup:', err.message));
} else {
  console.log('⚠️  Backblaze B2 environment variables are not fully set. Cloud uploads will fail.');
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL DISK HELPERS  (only used in dev when Supabase env vars are not set)
// ─────────────────────────────────────────────────────────────────────────────
const DB_PATH    = path.join(__dirname, 'db.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const QRS_DIR = path.join(UPLOADS_DIR, 'qrs');
const SCREENSHOTS_DIR = path.join(UPLOADS_DIR, 'screenshots');
const REVIEWS_DIR = path.join(UPLOADS_DIR, 'reviews');

function readDB()       { return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')); }
function writeDB(data)  { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)); }

if (!USE_SUPABASE) {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  if (!fs.existsSync(QRS_DIR)) fs.mkdirSync(QRS_DIR, { recursive: true });
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  if (!fs.existsSync(REVIEWS_DIR)) fs.mkdirSync(REVIEWS_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ files: [], totalDownloads: 0, subscriptions: [], plans: { 49: null, 109: null, 149: null }, productCodes: [], reviews: [] }, null, 2));
  } else {
    const _db = readDB();
    if (typeof _db.totalDownloads !== 'number') { _db.totalDownloads = 0; }
    if (!_db.subscriptions) { _db.subscriptions = []; }
    if (!_db.plans) { _db.plans = { 49: null, 109: null, 149: null }; }
    if (!_db.productCodes) { _db.productCodes = []; }
    if (!_db.reviews) { _db.reviews = []; }
    writeDB(_db);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json());

// Only serve static uploads folder in local dev
if (!USE_SUPABASE) {
  app.use('/uploads', express.static(UPLOADS_DIR));
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────
const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.slice(7);
  
  try {
    const credentials = Buffer.from(token, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');
    if (email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
      return next();
    }
  } catch (err) {}

  if (token === ADMIN_PASSWORD) {
    return next();
  }

  return res.status(401).json({ error: 'Invalid credentials' });
};

// ─────────────────────────────────────────────────────────────────────────────
// MULTER  — diskStorage for local mode only (no memory storage used to avoid OOM)
// ─────────────────────────────────────────────────────────────────────────────
const ALLOWED_EXT = ['.apk', '.exe', '.dmg', '.zip', '.ipa'];

let upload = null;
let uploadScreenshot = null;
let uploadQr = null;
let uploadReviewImage = null;

if (!USE_SUPABASE) {
  upload = multer({
    storage: multer.diskStorage({
      destination: (_, __, cb) => cb(null, UPLOADS_DIR),
      filename:    (_, file, cb) => cb(null, uuidv4() + path.extname(file.originalname)),
    }),
    limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
    fileFilter: (_, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      ALLOWED_EXT.includes(ext)
        ? cb(null, true)
        : cb(new Error(`File type not allowed. Supported: ${ALLOWED_EXT.join(', ')}`));
    },
  });

  uploadScreenshot = multer({
    storage: multer.diskStorage({
      destination: (_, __, cb) => cb(null, SCREENSHOTS_DIR),
      filename:    (_, file, cb) => cb(null, uuidv4() + path.extname(file.originalname)),
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  });

  uploadQr = multer({
    storage: multer.diskStorage({
      destination: (_, __, cb) => cb(null, QRS_DIR),
      filename:    (_, file, cb) => cb(null, uuidv4() + path.extname(file.originalname)),
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  });

  uploadReviewImage = multer({
    storage: multer.diskStorage({
      destination: (_, __, cb) => cb(null, REVIEWS_DIR),
      filename:    (_, file, cb) => cb(null, uuidv4() + path.extname(file.originalname)),
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Normalise a Supabase DB row to the same shape the frontend expects
function normaliseFile(row) {
  return {
    id:           row.id,
    name:         row.name,
    originalName: row.original_name  ?? row.originalName,
    storagePath:  row.storage_path   ?? row.storagePath,
    filename:     row.filename,          // local mode only
    deviceType:   row.device_type    ?? row.deviceType,
    size:         row.size,
    sizeFormatted:row.size_formatted ?? row.sizeFormatted,
    uploadedAt:   row.uploaded_at    ?? row.uploadedAt,
    downloads:    row.downloads      ?? 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
    const token = Buffer.from(`${ADMIN_EMAIL}:${ADMIN_PASSWORD}`).toString('base64');
    return res.json({ token, success: true });
  }
  return res.status(401).json({ error: 'Incorrect email or password' });
});

// GET /api/auth/verify
app.get('/api/auth/verify', requireAuth, (_, res) => res.json({ valid: true }));

// ── GET /api/stats  (public) ─────────────────────────────────────────────────
app.get('/api/stats', async (_, res) => {
  try {
    if (USE_SUPABASE) {
      const { data } = await supabase
        .from('files')
        .select('downloads, device_type');
      const rows = data || [];
      return res.json({
        totalDownloads: rows.reduce((s, f) => s + (f.downloads || 0), 0),
        totalFiles:     rows.length,
        platforms:      new Set(rows.map(f => f.device_type)).size,
      });
    }
    const db = readDB();
    res.json({
      totalDownloads: db.totalDownloads || 0,
      totalFiles:     db.files.length,
      platforms:      new Set(db.files.map(f => f.deviceType)).size,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/files  (public) ─────────────────────────────────────────────────
app.get('/api/files', async (_, res) => {
  try {
    if (USE_SUPABASE) {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('uploaded_at', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      return res.json((data || []).map(normaliseFile));
    }
    res.json(readDB().files);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/upload/init  (protected) ───────────────────────────────────────
app.post('/api/upload/init', requireAuth, async (req, res) => {
  if (!USE_SUPABASE) {
    return res.json({ useSupabase: false });
  }

  const { fileName } = req.body;
  if (!fileName) {
    return res.status(400).json({ error: 'fileName is required' });
  }

  const ext = path.extname(fileName).toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) {
    return res.status(400).json({ error: `File type not allowed. Supported: ${ALLOWED_EXT.join(', ')}` });
  }

  try {
    const storagePath = uuidv4() + ext;

    if (!s3Client) {
      return res.status(500).json({ error: 'Backblaze B2 Client is not initialized on the server.' });
    }

    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

    const command = new PutObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: storagePath,
      ContentType: 'application/octet-stream',
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return res.json({
      useSupabase: true,
      signedUrl: signedUrl,
      storagePath: storagePath,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/upload/finalize  (protected) ───────────────────────────────────
app.post('/api/upload/finalize', requireAuth, async (req, res) => {
  if (!USE_SUPABASE) {
    return res.status(400).json({ error: 'Finalize endpoint is only for Supabase uploads' });
  }

  const { deviceType, displayName, storagePath, originalName, size } = req.body;

  const validTypes = ['android', 'iphone', 'tv', 'desktop', 'macbook'];
  if (!deviceType || !validTypes.includes(deviceType)) {
    return res.status(400).json({ error: 'Valid deviceType is required' });
  }
  if (!storagePath) {
    return res.status(400).json({ error: 'storagePath is required' });
  }
  if (!originalName) {
    return res.status(400).json({ error: 'originalName is required' });
  }
  if (typeof size !== 'number' || size <= 0) {
    return res.status(400).json({ error: 'Valid size is required' });
  }

  try {
    // Save metadata to Supabase DB
    const { data, error: dbErr } = await supabase
      .from('files')
      .insert({
        name:          displayName || originalName,
        original_name: originalName,
        storage_path:  storagePath,
        device_type:   deviceType,
        size:          size,
        size_formatted:formatFileSize(size),
        downloads:     0,
      })
      .select()
      .single();

    if (dbErr) {
      return res.status(500).json({ error: dbErr.message });
    }

    return res.json(normaliseFile(data));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/upload (protected, local fallback only) ──────────────────────
app.post('/api/upload', requireAuth, (req, res, next) => {
  if (USE_SUPABASE) {
    return res.status(400).json({ error: 'Direct upload is required when using Supabase.' });
  }
  upload.single('file')(req, res, next);
}, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });

  const { deviceType, displayName } = req.body;
  const validTypes = ['android', 'iphone', 'tv', 'desktop', 'macbook'];
  if (!deviceType || !validTypes.includes(deviceType)) {
    if (req.file.path) fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Valid deviceType is required' });
  }

  try {
    const newFile = {
      id:           uuidv4(),
      name:         displayName || req.file.originalname,
      filename:     req.file.filename,
      originalName: req.file.originalname,
      deviceType,
      size:         req.file.size,
      sizeFormatted:formatFileSize(req.file.size),
      uploadedAt:   new Date().toISOString(),
      downloads:    0,
    };
    const db = readDB();
    db.files.unshift(newFile);
    writeDB(db);
    return res.json(newFile);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/download/:id  (public) ──────────────────────────────────────────
app.get('/api/download/:id', async (req, res) => {
  try {
    if (USE_SUPABASE) {
      const { data: file, error } = await supabase
        .from('files')
        .select('*')
        .eq('id', req.params.id)
        .single();
      if (error || !file) return res.status(404).json({ error: 'File not found' });

      // Increment download counter (non-blocking)
      supabase.from('files')
        .update({ downloads: (file.downloads || 0) + 1 })
        .eq('id', req.params.id)
        .then(() => {});

      if (!s3Client) {
        return res.status(500).json({ error: 'Backblaze B2 Client is not initialized on the server.' });
      }

      const { GetObjectCommand } = require('@aws-sdk/client-s3');
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

      const command = new GetObjectCommand({
        Bucket: B2_BUCKET_NAME,
        Key: file.storage_path,
        ResponseContentDisposition: `attachment; filename="${encodeURIComponent(file.original_name)}"`,
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

      return res.redirect(signedUrl);
    }

    // ── Local disk ────────────────────────────────────────────────────────
    const db  = readDB();
    const idx = db.files.findIndex(f => f.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'File not found' });

    const file     = db.files[idx];
    const filePath = path.join(UPLOADS_DIR, file.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing from disk' });

    db.totalDownloads         = (db.totalDownloads || 0) + 1;
    db.files[idx].downloads   = (db.files[idx].downloads || 0) + 1;
    writeDB(db);

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.sendFile(filePath);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── DELETE /api/files/:id  (protected) ───────────────────────────────────────
app.delete('/api/files/:id', requireAuth, async (req, res) => {
  try {
    if (USE_SUPABASE) {
      const { data: file, error } = await supabase
        .from('files')
        .select('storage_path')
        .eq('id', req.params.id)
        .single();
      if (error || !file) return res.status(404).json({ error: 'File not found' });

      if (s3Client) {
        try {
          const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
          const command = new DeleteObjectCommand({
            Bucket: B2_BUCKET_NAME,
            Key: file.storage_path,
          });
          await s3Client.send(command);
        } catch (err) {
          console.warn(`File ${file.storage_path} not found in Backblaze B2 during deletion.`, err.message);
        }
      }
      await supabase.from('files').delete().eq('id', req.params.id);
      return res.json({ success: true, id: req.params.id });
    } else {
      const db  = readDB();
      const idx = db.files.findIndex(f => f.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'File not found' });

      const filePath = path.join(UPLOADS_DIR, db.files[idx].filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      db.files.splice(idx, 1);
      writeDB(db);
      return res.json({ success: true, id: req.params.id });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION & PLANS ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/status (public)
app.get('/api/status', (_, res) => {
  res.json({ useSupabase: USE_SUPABASE });
});

// GET /api/plans (public)
app.get('/api/plans', async (req, res) => {
  try {
    const plansData = { 49: null, 109: null, 149: null };
    
    if (USE_SUPABASE) {
      const { data, error } = await supabase
        .from('plans')
        .select('*');
      if (error) return res.status(500).json({ error: error.message });
      
      const { GetObjectCommand } = require('@aws-sdk/client-s3');
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      
      for (const row of (data || [])) {
        if (row.qr_path) {
          try {
            const command = new GetObjectCommand({
              Bucket: B2_BUCKET_NAME,
              Key: row.qr_path,
            });
            const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
            plansData[row.price] = url;
          } catch (err) {
            console.warn(`Failed to sign QR path: ${row.qr_path}`, err.message);
          }
        }
      }
    } else {
      const db = readDB();
      const plans = db.plans || { 49: null, 109: null, 149: null };
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      for (const price of [49, 109, 149]) {
        if (plans[price]) {
          plansData[price] = `${baseUrl}/uploads/qrs/${plans[price]}`;
        }
      }
    }
    return res.json(plansData);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/plans/qr/init (protected)
app.post('/api/admin/plans/qr/init', requireAuth, async (req, res) => {
  if (!USE_SUPABASE) {
    return res.json({ useSupabase: false });
  }
  const { fileName } = req.body;
  if (!fileName) return res.status(400).json({ error: 'fileName is required' });
  
  const ext = path.extname(fileName).toLowerCase();
  const allowed = ['.png', '.jpg', '.jpeg', '.webp'];
  if (!allowed.includes(ext)) {
    return res.status(400).json({ error: 'Only PNG, JPG, JPEG, WEBP allowed.' });
  }
  
  try {
    const storagePath = `qrs/${uuidv4()}${ext}`;
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    const command = new PutObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: storagePath,
      ContentType: 'image/jpeg',
    });
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return res.json({
      useSupabase: true,
      signedUrl,
      storagePath,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/plans/qr/finalize (protected)
app.post('/api/admin/plans/qr/finalize', requireAuth, async (req, res) => {
  const { price, storagePath } = req.body;
  if (!price || !storagePath) return res.status(400).json({ error: 'price and storagePath are required' });
  if (![49, 109, 149].includes(Number(price))) return res.status(400).json({ error: 'Invalid price' });
  
  try {
    const { data, error } = await supabase
      .from('plans')
      .upsert({
        price: Number(price),
        qr_path: storagePath,
      })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/plans/qr/local (protected, local fallback)
app.post('/api/admin/plans/qr/local', requireAuth, (req, res, next) => {
  if (USE_SUPABASE) return res.status(400).json({ error: 'Local upload not supported in Supabase mode' });
  uploadQr.single('file')(req, res, next);
}, (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });
  const { price } = req.body;
  if (!price || ![49, 109, 149].includes(Number(price))) {
    if (req.file.path) fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Valid price is required' });
  }
  
  const db = readDB();
  db.plans = db.plans || { 49: null, 109: null, 149: null };
  const oldFile = db.plans[price];
  if (oldFile) {
    const oldPath = path.join(QRS_DIR, oldFile);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }
  db.plans[price] = req.file.filename;
  writeDB(db);
  res.json({ success: true, qrFilename: req.file.filename });
});

// GET /api/subscription/check (public)
app.get('/api/subscription/check', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email query param is required' });
  
  try {
    if (USE_SUPABASE) {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('email', email.trim().toLowerCase());
      
      if (error) return res.status(500).json({ error: error.message });
      if (!data || data.length === 0) {
        return res.json({ status: 'none', plan: null });
      }
      
      const sorted = data.sort((a, b) => {
        if (a.status === 'approved' && b.status !== 'approved') return -1;
        if (b.status === 'approved' && a.status !== 'approved') return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      const sub = sorted[0];
      return res.json({ status: sub.status, plan: sub.plan_price });
    } else {
      const db = readDB();
      const subs = db.subscriptions || [];
      const matches = subs.filter(s => s.email.trim().toLowerCase() === email.trim().toLowerCase());
      if (matches.length === 0) {
        return res.json({ status: 'none', plan: null });
      }
      const sorted = matches.sort((a, b) => {
        if (a.status === 'approved' && b.status !== 'approved') return -1;
        if (b.status === 'approved' && a.status !== 'approved') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      const sub = sorted[0];
      return res.json({ status: sub.status, plan: sub.planPrice });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/subscription/init (public)
app.post('/api/subscription/init', async (req, res) => {
  if (!USE_SUPABASE) {
    return res.json({ useSupabase: false });
  }
  const { fileName } = req.body;
  if (!fileName) return res.status(400).json({ error: 'fileName is required' });
  
  const ext = path.extname(fileName).toLowerCase();
  const allowed = ['.png', '.jpg', '.jpeg', '.webp'];
  if (!allowed.includes(ext)) {
    return res.status(400).json({ error: 'Only PNG, JPG, JPEG, WEBP allowed.' });
  }
  
  try {
    const storagePath = `screenshots/${uuidv4()}${ext}`;
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    const command = new PutObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: storagePath,
      ContentType: 'image/jpeg',
    });
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return res.json({
      useSupabase: true,
      signedUrl,
      storagePath,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/subscription/finalize (public)
app.post('/api/subscription/finalize', async (req, res) => {
  const { name, email, planPrice, storagePath } = req.body;
  if (!name || !email || !planPrice || !storagePath) {
    return res.status(400).json({ error: 'name, email, planPrice, storagePath are required' });
  }
  if (![49, 109, 149].includes(Number(planPrice))) {
    return res.status(400).json({ error: 'Invalid plan price' });
  }
  
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert({
        id: uuidv4(),
        name,
        email: email.trim().toLowerCase(),
        plan_price: Number(planPrice),
        screenshot_path: storagePath,
        status: 'pending',
        created_at: new Date().toISOString(),
      }, { onConflict: 'email' })
      .select()
      .single();
      
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/subscription/upload-local (public, local fallback)
app.post('/api/subscription/upload-local', (req, res, next) => {
  if (USE_SUPABASE) return res.status(400).json({ error: 'Local upload not supported in Supabase mode' });
  uploadScreenshot.single('file')(req, res, next);
}, (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });
  const { name, email, planPrice } = req.body;
  if (!name || !email || !planPrice) {
    if (req.file.path) fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'name, email, planPrice are required' });
  }
  
  const db = readDB();
  const sub = {
    id: uuidv4(),
    name,
    email: email.trim().toLowerCase(),
    planPrice: Number(planPrice),
    filename: req.file.filename,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  
  db.subscriptions = (db.subscriptions || []).filter(s => s.email !== sub.email);
  db.subscriptions.push(sub);
  writeDB(db);
  res.json({ success: true, data: sub });
});

// GET /api/admin/subscriptions (protected)
app.get('/api/admin/subscriptions', requireAuth, async (req, res) => {
  try {
    if (USE_SUPABASE) {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      
      const subs = [];
      const { GetObjectCommand } = require('@aws-sdk/client-s3');
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      
      for (const row of (data || [])) {
        let screenshotUrl = '';
        if (row.screenshot_path) {
          try {
            const command = new GetObjectCommand({
              Bucket: B2_BUCKET_NAME,
              Key: row.screenshot_path,
            });
            screenshotUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
          } catch (err) {
            console.warn(`Failed to sign screenshot path: ${row.screenshot_path}`, err.message);
          }
        }
        subs.push({
          id: row.id,
          name: row.name,
          email: row.email,
          planPrice: row.plan_price,
          screenshotPath: row.screenshot_path,
          screenshotUrl: screenshotUrl,
          status: row.status,
          createdAt: row.created_at,
          approvedAt: row.approved_at,
        });
      }
      return res.json(subs);
    } else {
      const db = readDB();
      const subs = db.subscriptions || [];
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const result = subs.map(sub => ({
        ...sub,
        planPrice: sub.planPrice,
        createdAt: sub.createdAt,
        screenshotUrl: `${baseUrl}/uploads/screenshots/${sub.filename}`,
      }));
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return res.json(result);
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/subscriptions/approve/:id (protected)
app.post('/api/admin/subscriptions/approve/:id', requireAuth, async (req, res) => {
  try {
    if (USE_SUPABASE) {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true, data });
    } else {
      const db = readDB();
      const idx = db.subscriptions.findIndex(s => s.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Subscription not found' });
      db.subscriptions[idx].status = 'approved';
      db.subscriptions[idx].approvedAt = new Date().toISOString();
      writeDB(db);
      return res.json({ success: true, data: db.subscriptions[idx] });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/subscriptions/reject/:id (protected)
app.post('/api/admin/subscriptions/reject/:id', requireAuth, async (req, res) => {
  try {
    if (USE_SUPABASE) {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({ status: 'rejected' })
        .eq('id', req.params.id)
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true, data });
    } else {
      const db = readDB();
      const idx = db.subscriptions.findIndex(s => s.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Subscription not found' });
      db.subscriptions[idx].status = 'rejected';
      writeDB(db);
      return res.json({ success: true, data: db.subscriptions[idx] });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/admin/subscriptions/:id (protected)
app.delete('/api/admin/subscriptions/:id', requireAuth, async (req, res) => {
  try {
    if (USE_SUPABASE) {
      const { data: sub, error: fetchErr } = await supabase
        .from('subscriptions')
        .select('screenshot_path')
        .eq('id', req.params.id)
        .single();
      if (fetchErr || !sub) return res.status(404).json({ error: 'Subscription not found' });
      
      if (s3Client && sub.screenshot_path) {
        try {
          const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
          const command = new DeleteObjectCommand({
            Bucket: B2_BUCKET_NAME,
            Key: sub.screenshot_path,
          });
          await s3Client.send(command);
        } catch (err) {
          console.warn(`Screenshot file ${sub.screenshot_path} not found in B2 during deletion.`, err.message);
        }
      }
      await supabase.from('subscriptions').delete().eq('id', req.params.id);
      return res.json({ success: true, id: req.params.id });
    } else {
      const db = readDB();
      const idx = db.subscriptions.findIndex(s => s.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Subscription not found' });
      
      const filePath = path.join(SCREENSHOTS_DIR, db.subscriptions[idx].filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      
      db.subscriptions.splice(idx, 1);
      writeDB(db);
      return res.json({ success: true, id: req.params.id });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT AUTHORIZATION CODES
// ─────────────────────────────────────────────────────────────────────────────

function generateProductCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const genPart = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `LIM-${genPart()}-${genPart()}`;
}

// GET /api/admin/product-codes (protected)
app.get('/api/admin/product-codes', requireAuth, async (req, res) => {
  try {
    if (USE_SUPABASE) {
      const { data, error } = await supabase
        .from('product_codes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data || []);
    } else {
      const db = readDB();
      const codes = db.productCodes || [];
      codes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return res.json(codes);
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/product-codes/generate (protected)
app.post('/api/admin/product-codes/generate', requireAuth, async (req, res) => {
  const code = generateProductCode();
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  
  try {
    if (USE_SUPABASE) {
      const { data, error } = await supabase
        .from('product_codes')
        .insert({
          id,
          code,
          status: 'active',
          created_at: createdAt
        })
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true, data });
    } else {
      const db = readDB();
      db.productCodes = db.productCodes || [];
      const newCode = {
        id,
        code,
        status: 'active',
        createdAt
      };
      db.productCodes.push(newCode);
      writeDB(db);
      return res.json({ success: true, data: newCode });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/admin/product-codes/:id (protected)
app.delete('/api/admin/product-codes/:id', requireAuth, async (req, res) => {
  try {
    if (USE_SUPABASE) {
      const { error } = await supabase
        .from('product_codes')
        .delete()
        .eq('id', req.params.id);
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true, id: req.params.id });
    } else {
      const db = readDB();
      db.productCodes = db.productCodes || [];
      const idx = db.productCodes.findIndex(c => c.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Product code not found' });
      db.productCodes.splice(idx, 1);
      writeDB(db);
      return res.json({ success: true, id: req.params.id });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/subscription/verify-code (public)
app.post('/api/subscription/verify-code', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'email and code are required' });
  
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim().toUpperCase();
  
  try {
    if (USE_SUPABASE) {
      const { data: codeRow, error: codeErr } = await supabase
        .from('product_codes')
        .select('*')
        .eq('code', cleanCode)
        .eq('status', 'active')
        .maybeSingle();
        
      if (codeErr || !codeRow) {
        return res.status(400).json({ error: 'Invalid or already used product code' });
      }
      
      const now = new Date().toISOString();
      await supabase
        .from('product_codes')
        .update({
          status: 'used',
          used_by: cleanEmail,
          used_at: now
        })
        .eq('id', codeRow.id);
        
      const { data: subData, error: subErr } = await supabase
        .from('subscriptions')
        .upsert({
          id: uuidv4(),
          name: 'Product Owner',
          email: cleanEmail,
          plan_price: 149,
          screenshot_path: `product-code: ${cleanCode}`,
          status: 'approved',
          created_at: now,
          approved_at: now
        }, { onConflict: 'email' })
        .select()
        .single();
        
      if (subErr) return res.status(500).json({ error: subErr.message });
      return res.json({ success: true, data: subData });
    } else {
      const db = readDB();
      db.productCodes = db.productCodes || [];
      const idx = db.productCodes.findIndex(c => c.code === cleanCode && c.status === 'active');
      if (idx === -1) return res.status(400).json({ error: 'Invalid or already used product code' });
      
      const now = new Date().toISOString();
      db.productCodes[idx].status = 'used';
      db.productCodes[idx].usedBy = cleanEmail;
      db.productCodes[idx].usedAt = now;
      
      db.subscriptions = db.subscriptions || [];
      const subIdx = db.subscriptions.findIndex(s => s.email === cleanEmail);
      const newSub = {
        id: subIdx !== -1 ? db.subscriptions[subIdx].id : uuidv4(),
        name: 'Product Owner',
        email: cleanEmail,
        planPrice: 149,
        filename: 'product-code',
        screenshotUrl: 'product-code',
        status: 'approved',
        createdAt: subIdx !== -1 ? db.subscriptions[subIdx].createdAt : now,
        approvedAt: now
      };
      
      if (subIdx !== -1) {
        db.subscriptions[subIdx] = newSub;
      } else {
        db.subscriptions.push(newSub);
      }
      
      writeDB(db);
      return res.json({ success: true, data: newSub });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/reviews (public)
app.get('/api/reviews', async (req, res) => {
  try {
    if (USE_SUPABASE) {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) return res.status(500).json({ error: error.message });
      
      const { GetObjectCommand } = require('@aws-sdk/client-s3');
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      
      const results = [];
      for (const row of (data || [])) {
        let imageUrl = null;
        if (row.image_path) {
          try {
            const command = new GetObjectCommand({
              Bucket: B2_BUCKET_NAME,
              Key: row.image_path,
            });
            imageUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
          } catch (err) {
            console.warn(`Failed to sign review image path: ${row.image_path}`, err.message);
          }
        }
        results.push({
          id: row.id,
          name: row.name,
          email: row.email,
          rating: row.rating,
          content: row.content,
          imageUrl,
          createdAt: row.created_at
        });
      }
      return res.json(results);
    } else {
      const db = readDB();
      const reviews = db.reviews || [];
      const sorted = [...reviews].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      const results = sorted.map(r => ({
        id: r.id,
        name: r.name,
        email: r.email,
        rating: r.rating,
        content: r.content,
        imageUrl: r.filename ? `${baseUrl}/uploads/reviews/${r.filename}` : null,
        createdAt: r.createdAt
      }));
      return res.json(results);
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/reviews/init (public)
app.post('/api/reviews/init', async (req, res) => {
  if (!USE_SUPABASE) return res.status(400).json({ error: 'B2 uploads not supported in local mode' });
  const { filename, contentType } = req.body;
  if (!filename || !contentType) return res.status(400).json({ error: 'filename and contentType are required' });
  
  const ext = path.extname(filename).toLowerCase();
  const fileKey = `reviews/${uuidv4()}${ext}`;
  
  try {
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    
    const command = new PutObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
    });
    
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    return res.json({ uploadUrl, storagePath: fileKey });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/reviews/finalize (public)
app.post('/api/reviews/finalize', async (req, res) => {
  const { name, email, rating, content, storagePath } = req.body;
  if (!name || !email || !content) {
    return res.status(400).json({ error: 'name, email, and content are required' });
  }
  
  const cleanEmail = email.trim().toLowerCase();
  const numRating = rating ? Number(rating) : 5;
  const id = uuidv4();
  const now = new Date().toISOString();
  
  try {
    if (USE_SUPABASE) {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          id,
          name,
          email: cleanEmail,
          rating: numRating,
          content,
          image_path: storagePath || null,
          created_at: now
        })
        .select()
        .single();
        
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true, data });
    } else {
      const db = readDB();
      db.reviews = db.reviews || [];
      const newReview = {
        id,
        name,
        email: cleanEmail,
        rating: numRating,
        content,
        filename: storagePath || null,
        createdAt: now
      };
      db.reviews.push(newReview);
      writeDB(db);
      return res.json({ success: true, data: newReview });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/reviews/upload-local (public)
app.post('/api/reviews/upload-local', (req, res, next) => {
  if (USE_SUPABASE) return res.status(400).json({ error: 'Local upload not supported in Supabase mode' });
  uploadReviewImage.single('file')(req, res, next);
}, (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });
  return res.json({ storagePath: req.file.filename });
});

// DELETE /api/admin/reviews/:id (protected)
app.delete('/api/admin/reviews/:id', requireAuth, async (req, res) => {
  try {
    if (USE_SUPABASE) {
      const { data: rev, error: fetchErr } = await supabase
        .from('reviews')
        .select('image_path')
        .eq('id', req.params.id)
        .maybeSingle();
        
      if (fetchErr || !rev) {
        return res.status(404).json({ error: 'Review not found' });
      }
      
      if (rev.image_path) {
        try {
          const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
          const command = new DeleteObjectCommand({
            Bucket: B2_BUCKET_NAME,
            Key: rev.image_path,
          });
          await s3Client.send(command);
        } catch (err) {
          console.warn(`Review file ${rev.image_path} not found in B2 during deletion.`, err.message);
        }
      }
      
      const { error: delErr } = await supabase
        .from('reviews')
        .delete()
        .eq('id', req.params.id);
        
      if (delErr) return res.status(500).json({ error: delErr.message });
      return res.json({ success: true, id: req.params.id });
    } else {
      const db = readDB();
      db.reviews = db.reviews || [];
      const idx = db.reviews.findIndex(r => r.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Review not found' });
      
      if (db.reviews[idx].filename) {
        const filePath = path.join(REVIEWS_DIR, db.reviews[idx].filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      
      db.reviews.splice(idx, 1);
      writeDB(db);
      return res.json({ success: true, id: req.params.id });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// ERROR HANDLER
// ─────────────────────────────────────────────────────────────────────────────
app.use((err, _, res, __) => {
  if (err.code === 'LIMIT_FILE_SIZE')
    return res.status(400).json({ error: 'File too large. Maximum is 500 MB.' });
  res.status(400).json({ error: err.message || 'Something went wrong' });
});

// ─────────────────────────────────────────────────────────────────────────────
// START
// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  🚀  Lightinmotion Server');
  console.log(`  📡  http://localhost:${PORT}`);
  console.log(`  🔑  Password : ${ADMIN_PASSWORD}`);
  console.log(`  📦  Storage  : ${USE_SUPABASE ? '☁️  Supabase' : '💾  Local disk (dev mode)'}`);
  console.log('');
});
