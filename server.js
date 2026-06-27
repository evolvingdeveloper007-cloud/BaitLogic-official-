require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ADMIN_KEY = process.env.ADMIN_KEY || 'change-this-admin-key';
const SITE_TITLE = process.env.SITE_TITLE || 'BaitLogic';
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

const seedStore = {
  signups: [],
  reports: [
    {
      id: 'seed-waterwatch',
      name: 'BaitLogic Water Watch',
      water: 'Carlyle Lake',
      category: 'Water Quality',
      report: 'Reminder: report pollution, fish kills, invasive species, and habitat damage so issues can be routed quickly.',
      latitude: '',
      longitude: '',
      agencyStatus: 'Use the agency links below for urgent official reports.',
      photoNote: '',
      createdAt: '2026-06-22T15:00:00.000Z'
    },
    {
      id: 'seed-mike-r',
      name: 'Mike R.',
      water: 'Horseshoe Lake',
      category: 'Fishing Report',
      report: '5lb largemouth on a jig at Horseshoe Lake',
      createdAt: '2026-06-21T15:00:00.000Z'
    },
    {
      id: 'seed-sarah-t',
      name: 'Sarah T.',
      water: 'Carlyle Lake',
      category: 'Fishing Report',
      report: 'Crappie stacked at 12ft, Carlyle Lake brush piles',
      createdAt: '2026-06-21T13:00:00.000Z'
    },
    {
      id: 'seed-dan-w',
      name: 'Dan W.',
      water: 'Mel Price',
      category: 'Fishing Report',
      report: 'Channel cats hitting cut shad below Mel Price',
      createdAt: '2026-06-21T11:00:00.000Z'
    }
  ],
  catches: []
};

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeStore(store) {
  return {
    signups: safeArray(store?.signups),
    reports: safeArray(store?.reports),
    catches: safeArray(store?.catches)
  };
}

async function ensureDataFile() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    await fsp.writeFile(DATA_FILE, JSON.stringify(seedStore, null, 2));
  }
}

async function readStore() {
  await ensureDataFile();
  const raw = await fsp.readFile(DATA_FILE, 'utf8');
  try {
    return normalizeStore(JSON.parse(raw));
  } catch {
    return normalizeStore(seedStore);
  }
}

let writeQueue = Promise.resolve();
function writeStore(nextStore) {
  writeQueue = writeQueue.then(() => fsp.writeFile(DATA_FILE, JSON.stringify(normalizeStore(nextStore), null, 2)));
  return writeQueue;
}

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toText(value, max = 300) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

const rateMap = new Map();
function rateLimit(req, res, next) {
  const key = `${req.ip}:${req.path}`;
  const current = rateMap.get(key) || { count: 0, start: Date.now() };
  const age = Date.now() - current.start;
  const windowMs = 60_000;
  if (age > windowMs) {
    rateMap.set(key, { count: 1, start: Date.now() });
    return next();
  }
  if (current.count >= 30) {
    return res.status(429).json({ error: 'Too many requests. Please slow down.' });
  }
  current.count += 1;
  rateMap.set(key, current);
  next();
}

function adminAuth(req, res, next) {
  const supplied = req.headers['x-admin-key'] || req.query.key;
  if (!supplied || supplied !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json({ limit: '250kb' }));
app.use(express.urlencoded({ extended: false }));
app.use('/api', rateLimit);
app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, siteTitle: SITE_TITLE, timestamp: nowIso() });
});

app.get('/api/reports', async (req, res) => {
  const store = await readStore();
  const limit = Math.max(1, Math.min(Number(req.query.limit || 20), 100));
  const reports = [...store.reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
  res.json({ reports });
});

app.post('/api/reports', async (req, res) => {
  const name = toText(req.body.name, 60);
  const water = toText(req.body.water, 80);
  const category = toText(req.body.category || 'Fishing Report', 60);
  const report = toText(req.body.report, 600);
  const latitude = toText(req.body.latitude, 40);
  const longitude = toText(req.body.longitude, 40);
  const agencyStatus = toText(req.body.agencyStatus, 160);
  const photoNote = toText(req.body.photoNote, 160);
  if (!name || !water || !report) {
    return res.status(400).json({ error: 'Name, water, and report are required.' });
  }
  const store = await readStore();
  const entry = { id: makeId('report'), name, water, category, report, latitude, longitude, agencyStatus, photoNote, createdAt: nowIso() };
  store.reports.push(entry);
  await writeStore(store);
  res.status(201).json({ message: category === 'Fishing Report' ? 'Report published.' : 'Conservation report published.', report: entry });
});

app.get('/api/catches', async (req, res) => {
  const store = await readStore();
  const catches = [...store.catches].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ catches });
});

app.post('/api/catches', async (req, res) => {
  const species = toText(req.body.species, 80);
  const weight = toText(req.body.weight, 30);
  const location = toText(req.body.location, 120);
  const notes = toText(req.body.notes, 400);
  if (!species || !location) {
    return res.status(400).json({ error: 'Species and location are required.' });
  }
  const store = await readStore();
  const entry = { id: makeId('catch'), species, weight, location, notes, createdAt: nowIso() };
  store.catches.push(entry);
  await writeStore(store);
  res.status(201).json({ message: 'Catch saved.', catch: entry });
});

app.post('/api/signups', async (req, res) => {
  const name = toText(req.body.name, 80);
  const email = toText(req.body.email, 120).toLowerCase();
  const water = toText(req.body.water, 120);
  const interest = toText(req.body.interest, 60);
  if (!name || !validEmail(email)) {
    return res.status(400).json({ error: 'Valid name and email are required.' });
  }
  const store = await readStore();
  const duplicate = store.signups.find(item => item.email === email);
  if (duplicate) {
    return res.status(200).json({ message: 'You are already on the early-access list.' });
  }
  const entry = { id: makeId('signup'), name, email, water, interest, createdAt: nowIso() };
  store.signups.push(entry);
  await writeStore(store);
  res.status(201).json({ message: 'You are on the early-access list.', signup: entry });
});

app.get('/api/admin/summary', adminAuth, async (req, res) => {
  const store = await readStore();
  res.json({
    signups: store.signups.length,
    reports: store.reports.length,
    catches: store.catches.length,
    latestSignup: store.signups.at(-1) || null,
    latestReport: store.reports.at(-1) || null,
    latestCatch: store.catches.at(-1) || null
  });
});

app.get('/api/admin/signups', adminAuth, async (req, res) => {
  const store = await readStore();
  res.json({ signups: [...store.signups].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

app.get('/api/admin/reports', adminAuth, async (req, res) => {
  const store = await readStore();
  res.json({ reports: [...store.reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

app.get('/api/admin/catches', adminAuth, async (req, res) => {
  const store = await readStore();
  res.json({ catches: [...store.catches].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'admin.html'));
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

ensureDataFile().then(() => {
  app.listen(PORT, () => {
    console.log(`${SITE_TITLE} listening on http://localhost:${PORT}`);
  });
});

