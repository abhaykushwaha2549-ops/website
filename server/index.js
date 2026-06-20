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
const ADMIN_PASSWORD  = process.env.ADMIN_PASSWORD  || 'lightinmotion@admin';
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

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL DISK HELPERS  (only used in dev when Supabase env vars are not set)
// ─────────────────────────────────────────────────────────────────────────────
const DB_PATH    = path.join(__dirname, 'db.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

function readDB()       { return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')); }
function writeDB(data)  { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)); }

if (!USE_SUPABASE) {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ files: [], totalDownloads: 0 }, null, 2));
  } else {
    const _db = readDB();
    if (typeof _db.totalDownloads !== 'number') { _db.totalDownloads = 0; writeDB(_db); }
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
  if (auth.slice(7) !== ADMIN_PASSWORD)
    return res.status(401).json({ error: 'Invalid credentials' });
  next();
};

// ─────────────────────────────────────────────────────────────────────────────
// MULTER  — memoryStorage for Supabase, diskStorage for local
// ─────────────────────────────────────────────────────────────────────────────
const ALLOWED_EXT = ['.apk', '.exe', '.dmg', '.zip', '.ipa'];

const upload = multer({
  storage: USE_SUPABASE
    ? multer.memoryStorage()
    : multer.diskStorage({
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
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });
  if (password === ADMIN_PASSWORD)
    return res.json({ token: ADMIN_PASSWORD, success: true });
  return res.status(401).json({ error: 'Incorrect password' });
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

// ── POST /api/upload  (protected) ────────────────────────────────────────────
app.post('/api/upload', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });

  const { deviceType, displayName } = req.body;
  const validTypes = ['android', 'iphone', 'tv', 'desktop'];
  if (!deviceType || !validTypes.includes(deviceType)) {
    if (!USE_SUPABASE && req.file.path) fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Valid deviceType is required' });
  }

  try {
    if (USE_SUPABASE) {
      const ext         = path.extname(req.file.originalname);
      const storagePath = uuidv4() + ext;

      // 1. Upload binary to Supabase Storage
      const { error: storErr } = await supabase.storage
        .from('uploads')
        .upload(storagePath, req.file.buffer, { contentType: 'application/octet-stream' });
      if (storErr) return res.status(500).json({ error: storErr.message });

      // 2. Save metadata to Supabase DB
      const { data, error: dbErr } = await supabase
        .from('files')
        .insert({
          name:          displayName || req.file.originalname,
          original_name: req.file.originalname,
          storage_path:  storagePath,
          device_type:   deviceType,
          size:          req.file.size,
          size_formatted:formatFileSize(req.file.size),
          downloads:     0,
        })
        .select()
        .single();
      if (dbErr) return res.status(500).json({ error: dbErr.message });

      return res.json(normaliseFile(data));
    }

    // ── Local disk ────────────────────────────────────────────────────────
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

      // Create a signed URL that forces download with the original filename
      const { data: signed, error: signErr } = await supabase.storage
        .from('uploads')
        .createSignedUrl(file.storage_path, 3600, { download: file.original_name });
      if (signErr) return res.status(500).json({ error: signErr.message });

      return res.redirect(signed.signedUrl);
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

      await supabase.storage.from('uploads').remove([file.storage_path]);
      await supabase.from('files').delete().eq('id', req.params.id);
      return res.json({ success: true, id: req.params.id });
    }

    // ── Local disk ────────────────────────────────────────────────────────
    const db  = readDB();
    const idx = db.files.findIndex(f => f.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'File not found' });

    const filePath = path.join(UPLOADS_DIR, db.files[idx].filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    db.files.splice(idx, 1);
    writeDB(db);
    return res.json({ success: true, id: req.params.id });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

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
