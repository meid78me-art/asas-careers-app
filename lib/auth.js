const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-before-deploying';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'HRAsas2026';

function checkPassword(password) {
  return password === ADMIN_PASSWORD;
}

function issueToken() {
  return jwt.sign({ role: 'hr' }, JWT_SECRET, { expiresIn: '12h' });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { checkPassword, issueToken, requireAuth, JWT_SECRET, ADMIN_PASSWORD };
