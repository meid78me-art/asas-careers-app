const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-before-deploying';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'HRAsas2026';
// Optional second password that can ONLY download the Excel export (used by
// the auto-export kit on colleagues' laptops). Not set = feature disabled.
const VIEWER_PASSWORD = process.env.VIEWER_PASSWORD || '';

// Returns 'hr', 'viewer', or null.
// The viewer password is only accepted when the caller asks for scope 'export',
// so it can never be used to sign in to the HR portal screen.
function checkPassword(password, scope) {
  if (typeof password !== 'string' || !password) return null;
  if (password === ADMIN_PASSWORD) return 'hr';
  if (VIEWER_PASSWORD && scope === 'export' && password === VIEWER_PASSWORD) return 'viewer';
  return null;
}

function issueToken(role) {
  return jwt.sign({ role: role === 'viewer' ? 'viewer' : 'hr' }, JWT_SECRET, { expiresIn: '12h' });
}

function readRole(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return { error: 'Missing token' };
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return { role: payload.role === 'viewer' ? 'viewer' : 'hr' };
  } catch (e) {
    return { error: 'Invalid or expired token' };
  }
}

// HR only: everything in the portal (view, edit, delete, files).
function requireAuth(req, res, next) {
  const r = readRole(req);
  if (r.error) return res.status(401).json({ error: r.error });
  if (r.role !== 'hr') return res.status(403).json({ error: 'Not allowed for this password' });
  next();
}

// HR or viewer: the Excel export only.
function requireExportAccess(req, res, next) {
  const r = readRole(req);
  if (r.error) return res.status(401).json({ error: r.error });
  next();
}

module.exports = { checkPassword, issueToken, requireAuth, requireExportAccess, JWT_SECRET, ADMIN_PASSWORD };
