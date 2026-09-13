require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

const db = require('./lib/db');
const { checkPassword, issueToken, requireAuth } = require('./lib/auth');

const app = express();
const PORT = process.env.PORT || 3000;
// Uploaded files live INSIDE the data folder (not a separate top-level
// folder). This matters for deployment: hosts that only give you one
// persistent volume (e.g. Railway's free/trial tier) can mount it at
// /app/data and this one mount covers both the database AND every
// candidate's files — no second volume needed.
const UPLOAD_ROOT = path.join(__dirname, 'data', 'uploads');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ------------------------------------------------------------------ */
/* File uploads                                                        */
/* ------------------------------------------------------------------ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // req.applicationRef is set just before multer runs, see below
    const dir = path.join(UPLOAD_ROOT, req.applicationRef);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${file.fieldname}__${safeName}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: (req, file, cb) => {
    const allowed = {
      cv: ['.pdf', '.doc', '.docx'],
      idDoc: ['.pdf', '.jpg', '.jpeg', '.png'],
      photo: ['.jpg', '.jpeg', '.png', '.webp']
    };
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed[file.fieldname] && allowed[file.fieldname].includes(ext)) cb(null, true);
    else cb(new Error(`Unsupported file type for ${file.fieldname}: ${ext}`));
  }
});
// Assign the application's ref BEFORE multer's disk storage needs it.
function assignRef(req, res, next) {
  const { preview } = db.nextRef();
  req.applicationRef = preview; // reserved, not yet committed to the counter
  next();
}

/* ------------------------------------------------------------------ */
/* Public: submit an application                                       */
/* ------------------------------------------------------------------ */
app.post(
  '/api/applications',
  assignRef,
  upload.fields([{ name: 'cv', maxCount: 1 }, { name: 'idDoc', maxCount: 1 }, { name: 'photo', maxCount: 1 }]),
  async (req, res) => {
    try {
      const b = req.body;
      const parseJSON = (s, fallback) => { try { return JSON.parse(s || ''); } catch (e) { return fallback; } };

      const files = req.files || {};
      const attachments = {};
      for (const kind of ['cv', 'idDoc', 'photo']) {
        if (files[kind] && files[kind][0]) {
          const f = files[kind][0];
          attachments[kind] = { name: f.originalname, size: f.size, storedAs: f.filename };
        } else {
          attachments[kind] = null;
        }
      }

      const record = {
        ref: req.applicationRef,
        submittedAt: new Date().toISOString(),
        candidateType: b.candidateType || 'local',
        position: b.position || '', jobCode: b.jobCode || '', department: b.department || '',
        location: b.location || '', startDate: b.startDate || '',
        expectedSalary: b.expectedSalary || '', expectedCurrency: b.expectedCurrency || '',
        employmentType: b.employmentType || '', sourceOfVacancy: b.sourceOfVacancy || '',
        fullName: b.fullName || '', nationality: b.nationality || '', dob: b.dob || '', placeOfBirth: b.placeOfBirth || '',
        gender: b.gender || '', religion: b.religion || '', maritalStatus: b.maritalStatus || '',
        dependents: b.dependents || '', dependentsDetail: b.dependentsDetail || '',
        idType: b.idType || '', idNumber: b.idNumber || '', idIssueDate: b.idIssueDate || '',
        idExpiryDate: b.idExpiryDate || '', idPlaceOfIssue: b.idPlaceOfIssue || '', militaryStatus: b.militaryStatus || '',
        mobile: b.mobile || '', altPhone: b.altPhone || '', email: b.email || '', city: b.city || '',
        country: b.country || '', address: b.address || '', governorate: b.governorate || '',
        emergName: b.emergName || '', emergRelation: b.emergRelation || '', emergCountry: b.emergCountry || '',
        emergCity: b.emergCity || '', emergPhone: b.emergPhone || '',
        langArabic: b.langArabic || '', langKurdish: b.langKurdish || '', langEnglish: b.langEnglish || '',
        otherLanguage: b.otherLanguage || '', otherLanguageLevel: b.otherLanguageLevel || '',
        technicalSkills: b.technicalSkills || '', computerSkills: b.computerSkills || '', computerOther: b.computerOther || '',
        education: parseJSON(b.educationJSON, []),
        jobs: parseJSON(b.jobsJSON, []),
        courses: parseJSON(b.coursesJSON, []),
        relatives: parseJSON(b.relativesJSON, []),
        careerExperienceYears: b.careerExperienceYears || '',
        q_healthHistory: b.q_healthHistory || '', healthHistoryDetail: b.healthHistoryDetail || '',
        medicallyFit: b.medicallyFit === 'true',
        q_iraqIssue: b.q_iraqIssue || '', iraqIssueDetail: b.iraqIssueDetail || '',
        q_shifts: b.q_shifts || '', q_car: b.q_car || '', q_license: b.q_license || '', q_relocate: b.q_relocate || '',
        q_prevAsas: b.q_prevAsas || '', prevAsasPosition: b.prevAsasPosition || '', prevAsasPeriod: b.prevAsasPeriod || '',
        prevAsasLocation: b.prevAsasLocation || '', q_govt: b.q_govt || '', govtPlace: b.govtPlace || '',
        attachments,
        signature: b.signature || '', signDate: b.signDate || '',
        status: 'New', jobAssignedCode: '', interviewDate: '', interviewResult: '',
        assessmentResult: '', reviewer: '', notes: '',
        cvReceived: 'Yes', applicationAccepted: '', candidateStatus: '',
        offerDate: '', offerStatus: '',
        workPermitStatus: '', visaTravelStatus: '',
        expectedJoinDate: '', joinDate: '', offeredSalary: '', offeredCurrency: '',
        accommodation: '', meals: '', jobTitleFinal: ''
      };

      await db.transact((data) => {
        const year = new Date().getFullYear();
        const key = String(year);
        data.counters[key] = (data.counters[key] || 0) + 1;
        data.applications.push(record);
      });

      res.json({ ok: true, ref: record.ref });
      refreshExportSnapshot();
    } catch (err) {
      console.error(err);
      // best-effort cleanup of any partially-uploaded files
      try { fs.rmSync(path.join(UPLOAD_ROOT, req.applicationRef), { recursive: true, force: true }); } catch (e) {}
      res.status(400).json({ ok: false, error: err.message || 'Could not save application' });
    }
  }
);

/* ------------------------------------------------------------------ */
/* Admin: auth                                                          */
/* ------------------------------------------------------------------ */
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body || {};
  if (!checkPassword(password)) return res.status(401).json({ error: 'Incorrect password' });
  res.json({ token: issueToken() });
});

/* ------------------------------------------------------------------ */
/* Admin: applications CRUD                                            */
/* ------------------------------------------------------------------ */
app.get('/api/admin/applications', requireAuth, (req, res) => {
  const data = db.read();
  res.json(data.applications.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
});

app.get('/api/admin/applications/:ref', requireAuth, (req, res) => {
  const data = db.read();
  const app_ = data.applications.find(a => a.ref === req.params.ref);
  if (!app_) return res.status(404).json({ error: 'Not found' });
  res.json(app_);
});

app.patch('/api/admin/applications/:ref', requireAuth, async (req, res) => {
  const allowed = [
    'status', 'jobAssignedCode', 'interviewDate', 'interviewResult', 'assessmentResult', 'reviewer', 'notes',
    'cvReceived', 'applicationAccepted', 'candidateStatus',
    'offerDate', 'offerStatus',
    'workPermitStatus', 'visaTravelStatus',
    'expectedJoinDate', 'joinDate', 'offeredSalary', 'offeredCurrency', 'accommodation', 'meals', 'jobTitleFinal'
  ];
  const updates = {};
  for (const k of allowed) if (k in req.body) updates[k] = req.body[k];

  const result = await db.transact((data) => {
    const app_ = data.applications.find(a => a.ref === req.params.ref);
    if (!app_) return { error: 'Not found' };
    Object.assign(app_, updates);
    return { ok: true, app: app_ };
  });
  if (result.error) return res.status(404).json(result);
  res.json(result.app);
  refreshExportSnapshot();
});

app.delete('/api/admin/applications/:ref', requireAuth, async (req, res) => {
  await db.transact((data) => {
    data.applications = data.applications.filter(a => a.ref !== req.params.ref);
  });
  try { fs.rmSync(path.join(UPLOAD_ROOT, req.params.ref), { recursive: true, force: true }); } catch (e) {}
  res.json({ ok: true });
  refreshExportSnapshot();
});

/* ------------------------------------------------------------------ */
/* Admin: file download                                                 */
/* ------------------------------------------------------------------ */
app.get('/api/admin/applications/:ref/file/:kind', requireAuth, (req, res) => {
  const data = db.read();
  const app_ = data.applications.find(a => a.ref === req.params.ref);
  if (!app_ || !app_.attachments || !app_.attachments[req.params.kind]) {
    return res.status(404).json({ error: 'File not found' });
  }
  const meta = app_.attachments[req.params.kind];
  const filePath = path.join(UPLOAD_ROOT, req.params.ref, meta.storedAs);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing on disk' });
  res.download(filePath, meta.name);
});

/* ------------------------------------------------------------------ */
/* Excel workbook builder — shared by the on-demand download AND the    */
/* automatic snapshot-to-disk that fires on every change.               */
/* ------------------------------------------------------------------ */
const LABEL_OVERRIDES = {
  dob: 'Date of Birth', idType: 'ID Type', idNumber: 'ID/Passport No.',
  idIssueDate: 'ID Issue Date', idExpiryDate: 'ID Expiry Date', idPlaceOfIssue: 'ID Place of Issue',
  q_shifts: 'Willing to Work Shifts', q_car: 'Owns Car', q_license: 'Driving License',
  q_relocate: 'Willing to Relocate', q_prevAsas: 'Previously Employed by ASAS',
  q_govt: 'Employed by Iraqi Govt.', q_healthHistory: 'History of Illness/Surgery',
  q_iraqIssue: 'Issue Working in Iraq', ref: 'Reference', cvReceived: 'CV Received',
  emergName: 'Emergency Contact Name', emergRelation: 'Emergency Contact Relationship', emergPhone: 'Emergency Contact Phone'
};
function toLabel(key) {
  if (LABEL_OVERRIDES[key]) return LABEL_OVERRIDES[key];
  return key
    .replace(/^q_/, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function buildWorkbook(list) {
  const wb = new ExcelJS.Workbook();

  const appSheet = wb.addWorksheet('Applications');
  const appCols = [
    'ref', 'submittedAt', 'status', 'candidateType', 'position', 'jobCode', 'department', 'location',
    'expectedSalary', 'expectedCurrency', 'employmentType', 'sourceOfVacancy', 'fullName', 'nationality',
    'dob', 'placeOfBirth', 'gender', 'religion', 'maritalStatus', 'dependents', 'dependentsDetail',
    'idType', 'idNumber', 'idIssueDate', 'idExpiryDate', 'idPlaceOfIssue', 'militaryStatus',
    'mobile', 'altPhone', 'email', 'city', 'country', 'address', 'governorate',
    'emergName', 'emergRelation', 'emergPhone', 'langArabic', 'langKurdish', 'langEnglish',
    'otherLanguage', 'otherLanguageLevel', 'technicalSkills', 'computerSkills', 'computerOther',
    'careerExperienceYears', 'q_healthHistory', 'healthHistoryDetail', 'q_iraqIssue', 'iraqIssueDetail',
    'q_shifts', 'q_car', 'q_license', 'q_relocate', 'q_prevAsas', 'q_govt',
    'jobAssignedCode', 'interviewDate', 'interviewResult', 'assessmentResult', 'reviewer', 'notes',
    'cvReceived', 'applicationAccepted', 'candidateStatus', 'offerDate', 'offerStatus',
    'workPermitStatus', 'visaTravelStatus', 'expectedJoinDate', 'joinDate',
    'offeredSalary', 'offeredCurrency', 'accommodation', 'meals', 'jobTitleFinal'
  ];
  appSheet.addRow(appCols.map(toLabel));
  appSheet.getRow(1).font = { bold: true };
  list.forEach(a => appSheet.addRow(appCols.map(c => a[c] ?? '')));

  const eduSheet = wb.addWorksheet('Education');
  eduSheet.addRow(['Reference', 'Name', 'Institution', 'Degree', 'Field', 'Country', 'Year', 'Grade']).font = { bold: true };
  list.forEach(a => (a.education || []).forEach(e => {
    if (e.institution || e.degree) eduSheet.addRow([a.ref, a.fullName, e.institution, e.degree, e.field, e.country, e.year, e.grade]);
  }));

  const jobSheet = wb.addWorksheet('Employment History');
  jobSheet.addRow(['Reference', 'Name', 'From', 'To', 'Employer', 'Position', 'Country', 'Reason', 'Summary', 'Net Salary', 'Currency', 'Ref Name', 'Ref Position/Phone', 'Ref Email']).font = { bold: true };
  list.forEach(a => (a.jobs || []).forEach(j => {
    if (j.employer || j.position) jobSheet.addRow([a.ref, a.fullName, j.start, j.end, j.employer, j.position, j.country, j.reason, j.summary, j.salary, j.currency, j.refName, j.refPositionPhone, j.refEmail]);
  }));

  const courseSheet = wb.addWorksheet('Courses & Certificates');
  courseSheet.addRow(['Reference', 'Name', 'Course', 'Provider', 'Date', 'Duration', 'Location']).font = { bold: true };
  list.forEach(a => (a.courses || []).forEach(c => {
    if (c.name) courseSheet.addRow([a.ref, a.fullName, c.name, c.provider, c.date, c.duration, c.location]);
  }));

  const relSheet = wb.addWorksheet('Relatives at ASAS');
  relSheet.addRow(['Reference', 'Name', 'Relative Name', 'Relationship', 'Employment City']).font = { bold: true };
  list.forEach(a => (a.relatives || []).forEach(r => {
    if (r.name) relSheet.addRow([a.ref, a.fullName, r.name, r.relation, r.city]);
  }));

  return wb;
}

// If EXPORT_PATH is set in .env, this rewrites that ONE file on disk every
// time it's called — used right after every create/update/delete so the
// file is always current with zero manual steps. Failures are logged but
// never break the API response (a report-writing hiccup shouldn't fail
// someone's application submission).
const EXPORT_PATH = process.env.EXPORT_PATH || '';
async function refreshExportSnapshot() {
  if (!EXPORT_PATH) return;
  try {
    const data = db.read();
    const list = data.applications.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    const wb = buildWorkbook(list);
    fs.mkdirSync(path.dirname(EXPORT_PATH), { recursive: true });
    await wb.xlsx.writeFile(EXPORT_PATH);
    console.log(`[auto-export] snapshot refreshed → ${EXPORT_PATH}`);
  } catch (err) {
    console.error('[auto-export] failed to refresh snapshot:', err.message);
  }
}

/* ------------------------------------------------------------------ */
/* Admin: Excel export (multi-sheet, mirrors the applications' shape)   */
/* ------------------------------------------------------------------ */
app.get('/api/admin/export', requireAuth, async (req, res) => {
  const data = db.read();
  const list = data.applications.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  const wb = buildWorkbook(list);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="ASAS-Applications-${new Date().toISOString().slice(0,10)}.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
});

app.listen(PORT, () => console.log(`ASAS Careers server running on port ${PORT}`));

