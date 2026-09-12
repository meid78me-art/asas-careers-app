// Minimal JSON-file database. No native dependencies, so it installs and
// deploys cleanly anywhere Node runs. Fine for job-application volumes
// (hundreds to low thousands of records). Writes are atomic (write to a
// temp file, then rename) so a crash mid-write can't corrupt the file.
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    write({ applications: [], counters: {} });
  }
}

function read() {
  ensureDb();
  const raw = fs.readFileSync(DB_FILE, 'utf8');
  try { return JSON.parse(raw); }
  catch (e) { return { applications: [], counters: {} }; }
}

function write(data) {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

// A simple in-process write queue so concurrent requests never interleave
// their read-modify-write cycles.
let queue = Promise.resolve();
function transact(mutator) {
  queue = queue.then(async () => {
    const data = read();
    const result = await mutator(data);
    write(data);
    return result;
  });
  return queue;
}

function nextRef() {
  const data = read();
  const year = new Date().getFullYear();
  const key = String(year);
  const n = (data.counters[key] || 0) + 1;
  return { year, n, preview: `ASAS-${year}-${String(n).padStart(4, '0')}` };
}

module.exports = { read, write, transact, nextRef, DATA_DIR };
