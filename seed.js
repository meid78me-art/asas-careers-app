// Seeds two sample applications into your running ASAS Careers app so you
// can see real records (including a real attachment) in the HR portal.
//
// Usage (from inside the asas-careers-app folder, while `npm start` is
// running in another window):
//
//   node seed.js "C:\path\to\some-file.pdf"
//
// The file path is optional — if you skip it, both samples submit without
// an attachment. If you give a path, it's attached as Ahmed Hassan's CV.

const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
// No path needed — defaults to the sample CV bundled with this project.
// You can still pass your own file instead: node seed.js "C:\path\to\file.pdf"
const cvPath = process.argv[2] || path.join(__dirname, 'sample-files', 'sample-cv.docx');

async function submit(fields, cvFilePath) {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
  if (cvFilePath) {
    const buf = fs.readFileSync(cvFilePath);
    const blob = new Blob([buf]);
    fd.append('cv', blob, path.basename(cvFilePath));
  }
  const res = await fetch(`${BASE_URL}/api/applications`, { method: 'POST', body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Submission failed');
  return data.ref;
}

const rajesh = {
  candidateType: 'expat',
  position: 'Extrusion Press Operator', jobCode: 'OPS-014', department: 'Factory / Production',
  location: 'Babil Plant', startDate: '2026-10-01',
  expectedSalary: '700', expectedCurrency: 'USD', employmentType: 'Contract', sourceOfVacancy: 'Recruitment Agency',
  fullName: 'Rajesh Kumar', nationality: 'Indian', dob: '1990-04-12', placeOfBirth: 'Hyderabad, India',
  gender: 'Male', religion: 'Hindu', maritalStatus: 'Married', dependents: '2', dependentsDetail: 'Ages 6, 9',
  idType: 'Passport', idNumber: 'N1234567', idIssueDate: '2021-05-01', idExpiryDate: '2031-05-01', idPlaceOfIssue: 'Hyderabad',
  mobile: '+91 98765 43210', email: 'rajesh.kumar@example.com', city: 'Hyderabad', country: 'India',
  langArabic: '', langKurdish: '', langEnglish: 'Speak:Fluent Read:Fluent Write:Fluent',
  otherLanguage: 'Hindi', otherLanguageLevel: 'Native',
  technicalSkills: 'Aluminum extrusion press operation, die changing, forklift licence',
  careerExperienceYears: '6', q_healthHistory: 'No', medicallyFit: 'true', q_iraqIssue: 'No',
  q_shifts: 'Yes', q_car: 'No', q_license: 'Yes', q_relocate: 'Yes', q_prevAsas: 'No', q_govt: 'No',
  signature: 'Rajesh Kumar', signDate: '2026-09-01',
  educationJSON: JSON.stringify([{ institution: 'Government ITI, Hyderabad', degree: 'Diploma', field: 'Mechanical Engineering', country: 'India', year: '2012' }]),
  jobsJSON: JSON.stringify([{ start: '01/2018', end: '12/2024', employer: 'Al Ghurair Aluminium', position: 'Extrusion Operator', country: 'United Arab Emirates', summary: 'Operated extrusion presses, die changing, quality checks.', salary: '650', currency: 'USD', refName: 'Mohammed Salim', refPositionPhone: 'Production Supervisor, +971 50 000 0000', refEmail: 'msalim@example.com' }]),
  coursesJSON: JSON.stringify([{ name: 'Forklift Operation Safety', provider: 'Al Ghurair Training Center', date: '2019-03-01', duration: '2 days', location: 'Dubai' }]),
  relativesJSON: '[]'
};

const ahmed = {
  candidateType: 'local',
  position: 'HR Officer', jobCode: 'HR-002', department: 'HR & Admin', location: 'Babil Plant', startDate: '2026-10-15',
  expectedSalary: '1500000', expectedCurrency: 'IQD', employmentType: 'Permanent', sourceOfVacancy: 'Company Website',
  fullName: 'Ahmed Hassan Al-Obaidi', nationality: 'Iraqi', dob: '1992-08-20', placeOfBirth: 'Hillah, Iraq',
  gender: 'Male', religion: 'Islam', maritalStatus: 'Single', dependents: '0',
  idType: 'National ID', idNumber: '19920820-1123', idIssueDate: '2020-01-15', idExpiryDate: '2030-01-15', idPlaceOfIssue: 'Babil',
  militaryStatus: 'Completed',
  mobile: '+964 770 123 4567', email: 'ahmed.alobaidi@example.com', city: 'Hillah', country: 'Iraq', governorate: 'Babil',
  langArabic: 'Speak:Native Read:Native Write:Native', langKurdish: '', langEnglish: 'Speak:Fluent Read:Fluent Write:Good',
  technicalSkills: 'Recruitment coordination, payroll support, personnel records management',
  computerSkills: 'MS Office, ERP / SAP',
  careerExperienceYears: '5', q_healthHistory: 'No', medicallyFit: 'true', q_iraqIssue: 'No',
  q_shifts: 'No', q_car: 'Yes', q_license: 'Yes', q_relocate: 'No', q_prevAsas: 'No', q_govt: 'No',
  signature: 'Ahmed Hassan Al-Obaidi', signDate: '2026-09-01',
  educationJSON: JSON.stringify([{ institution: 'University of Babylon', degree: "Bachelor's", field: 'Business Administration', country: 'Iraq', year: '2015', grade: 'Very Good' }]),
  jobsJSON: JSON.stringify([{ start: '03/2019', end: 'Present', employer: 'Al-Warka Company', position: 'HR Coordinator', country: 'Iraq', summary: 'Managed recruitment, onboarding, attendance and personnel files for 150+ staff.', salary: '1200000', currency: 'IQD', refName: 'Layla Kareem', refPositionPhone: 'HR Manager, +964 770 555 4444', refEmail: 'lkareem@example.com' }]),
  coursesJSON: JSON.stringify([{ name: 'Iraqi Labour Law Essentials', provider: 'Baghdad HR Institute', date: '2022-06-10', duration: '3 days', location: 'Baghdad' }]),
  relativesJSON: '[]'
};

(async () => {
  try {
    if (cvPath && !fs.existsSync(cvPath)) {
      console.error(`✗ Can't find that file: ${cvPath}`);
      console.error('Check the path and try again.');
      process.exit(1);
    }
    const ref1 = await submit(rajesh, null);
    console.log(`✔ Rajesh Kumar submitted — ${ref1}`);
    const ref2 = await submit(ahmed, cvPath);
    console.log(`✔ Ahmed Hassan Al-Obaidi submitted — ${ref2}${cvPath ? ' (with CV attached)' : ''}`);
    console.log('\nDone. Refresh the HR portal in your browser to see both.');
  } catch (err) {
    console.error('✗ Seeding failed:', err.message);
    console.error('Make sure `npm start` is running in another window first.');
  }
})();
