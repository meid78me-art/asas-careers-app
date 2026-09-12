// Automated Excel snapshot. Run this on a schedule (e.g. Windows Task
// Scheduler every 15 minutes) and it will overwrite ONE fixed Excel file
// with whatever is currently in the database — no clicking required.
//
// Where the file is saved is controlled by EXPORT_PATH in your .env file.
// If you don't set one, it defaults to your Desktop.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const os = require('os');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'HRAsas2026';
const EXPORT_PATH = process.env.EXPORT_PATH || path.join(os.homedir(), 'Desktop', 'ASAS-Applications-Latest.xlsx');
const LOG_FILE = path.join(__dirname, 'auto-export.log');

function log(line) {
  const stamped = `[${new Date().toISOString()}] ${line}`;
  console.log(stamped);
  try { fs.appendFileSync(LOG_FILE, stamped + '\n'); } catch (e) { /* ignore logging failures */ }
}

(async () => {
  try {
    const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: ADMIN_PASSWORD })
    });
    if (!loginRes.ok) throw new Error(`Login failed (${loginRes.status}) — is the server running, and is ADMIN_PASSWORD correct in .env?`);
    const { token } = await loginRes.json();

    const exportRes = await fetch(`${BASE_URL}/api/admin/export`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!exportRes.ok) throw new Error(`Export failed (${exportRes.status})`);

    const buffer = Buffer.from(await exportRes.arrayBuffer());
    fs.mkdirSync(path.dirname(EXPORT_PATH), { recursive: true });
    fs.writeFileSync(EXPORT_PATH, buffer);
    log(`OK — saved ${buffer.length} bytes to ${EXPORT_PATH}`);
  } catch (err) {
    log(`FAILED — ${err.message}`);
    process.exitCode = 1;
  }
})();
