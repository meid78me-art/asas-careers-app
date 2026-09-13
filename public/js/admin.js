let authToken = sessionStorage.getItem('asas_admin_token') || null;
let applications = [];
let selectedApp = null;
let filterText='', filterStatus='';

// Pipeline stages, in order. Add/remove/reorder here and every dropdown,
// filter, and count on this page updates automatically.
const STATUS_OPTIONS = ['New','Interviewing','Passed','Offer','Accepted','Notice','Visa process','Joined','Rejected'];
const STATUS_COLORS = {
  New: '#6B7785', Interviewing: '#0EA9B7', Passed: '#3F8455', Offer: '#C98A2C',
  Accepted: '#3F8455', Notice: '#8E6FCE', 'Visa process': '#C98A2C', Joined: '#1E7A44', Rejected: '#C0392B'
};
function statusColor(s){ return STATUS_COLORS[s] || '#6B7785'; }

function lbl(en,ar){ return `<span class="lbl-en">${en}</span><span class="lbl-ar">${ar}</span>`; }

async function api(path, opts){
  opts = opts || {};
  opts.headers = Object.assign({}, opts.headers, authToken ? { Authorization: 'Bearer ' + authToken } : {});
  const res = await fetch(path, opts);
  if(res.status === 401){ authToken = null; sessionStorage.removeItem('asas_admin_token'); renderAdmin(); throw new Error('Session expired'); }
  return res;
}

function renderAdmin(){
  const el = document.getElementById('adminView');
  if(!authToken){
    el.innerHTML = `
      <div class="admin-login">
        <div style="font-weight:700; font-size:15px; margin-bottom:4px;">HR Portal Login</div>
        <div style="font-size:11.5px; color:var(--text-soft);">Applications and attachments are only visible to people with this password.</div>
        <input type="password" id="adminPass" placeholder="Password">
        <button onclick="tryAdminLogin()">Sign In</button>
        <div class="err" id="loginErr">Incorrect password.</div>
      </div>`;
    return;
  }
  loadAndRenderDashboard();
}

async function tryAdminLogin(){
  const pass = document.getElementById('adminPass').value;
  try{
    const res = await fetch('/api/admin/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ password: pass }) });
    if(!res.ok){ document.getElementById('loginErr').style.display='block'; return; }
    const data = await res.json();
    authToken = data.token;
    sessionStorage.setItem('asas_admin_token', authToken);
    renderAdmin();
  }catch(e){ document.getElementById('loginErr').style.display='block'; }
}
function logout(){ authToken=null; sessionStorage.removeItem('asas_admin_token'); renderAdmin(); }

async function loadAndRenderDashboard(){
  try{
    const res = await api('/api/admin/applications');
    applications = await res.json();
  }catch(e){ return; }
  renderAdminDashboard();
}

function renderAdminDashboard(){
  const el = document.getElementById('adminView');
  const counts = {};
  applications.forEach(a=>{ const s = a.status || 'New'; counts[s] = (counts[s]||0)+1; });
  const chips = STATUS_OPTIONS.filter(s => counts[s]).map(s =>
    `<div class="chip"><b style="color:${statusColor(s)}">${counts[s]}</b>${s}</div>`
  ).join('');
  el.innerHTML = `
    <div class="stat-chips">
      <div class="chip"><b>${applications.length}</b>Total</div>
      ${chips}
      <button class="nav-btn" style="margin-left:auto;" onclick="logout()">Log Out</button>
    </div>
    <div class="admin-toolbar">
      <input type="text" id="searchBox" placeholder="Search name, position, ref, email…" value="${filterText}">
      <select id="statusFilter">
        <option value="">All statuses</option>
        ${STATUS_OPTIONS.map(s=>`<option ${filterStatus===s?'selected':''}>${s}</option>`).join('')}
      </select>
      <a class="export-btn" href="#" onclick="downloadExport(); return false;">⬇ Download Excel</a>
    </div>
    <div id="tableHolder"></div>`;
  document.getElementById('searchBox').addEventListener('input', e=>{filterText=e.target.value; renderTable();});
  document.getElementById('statusFilter').addEventListener('change', e=>{filterStatus=e.target.value; renderTable();});
  renderTable();
}

async function downloadExport(){
  const res = await api('/api/admin/export');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `ASAS-Applications-${new Date().toISOString().slice(0,10)}.xlsx`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function getFiltered(){
  return applications.filter(a=>{
    if(filterStatus && a.status!==filterStatus) return false;
    if(filterText){
      const hay = `${a.ref} ${a.fullName} ${a.position} ${a.email} ${a.department}`.toLowerCase();
      if(!hay.includes(filterText.toLowerCase())) return false;
    }
    return true;
  });
}

function renderTable(){
  const list = getFiltered();
  const holder = document.getElementById('tableHolder');
  if(list.length===0){ holder.innerHTML = `<div class="empty-state">No applications yet. Once candidates submit the form, they'll appear here.</div>`; return; }
  holder.innerHTML = `<table class="appl">
    <tr><th>Ref</th><th>Name</th><th>Position</th><th>Dept</th><th>Type</th><th>Submitted</th><th>Status</th></tr>
    ${list.map(a=>`
      <tr onclick="openDetail('${a.ref}')">
        <td>${a.ref}</td><td>${a.fullName}</td><td>${a.position}</td><td>${a.department}</td>
        <td>${a.candidateType==='expat'?'Expat':'Local'}</td>
        <td>${new Date(a.submittedAt).toLocaleDateString()}</td>
        <td><span class="status-pill" style="background:${statusColor(a.status)}">${a.status}</span></td>
      </tr>`).join('')}
  </table>`;
}

function openDetail(ref){
  selectedApp = applications.find(a=>a.ref===ref);
  if(!selectedApp) return;
  const a = selectedApp;
  const d = (label,val)=>`<div><span>${label}</span>${val||'—'}</div>`;
  const attachBtns = ['cv','idDoc','photo'].filter(k=>a.attachments && a.attachments[k])
    .map(k=>`<a onclick="downloadAttachment('${a.ref}','${k}'); return false;" href="#">⬇ ${a.attachments[k].name}</a>`).join('');
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-bg" id="modalBg" onclick="if(event.target.id==='modalBg')closeDetail()">
      <div class="modal">
        <button class="close-x" onclick="closeDetail()">✕</button>
        <h2>${a.ref}</h2>
        <div class="detail-grid">
          ${d('Full Name', a.fullName)}
          ${d('Position', a.position)}
          ${d('Job Code', a.jobCode)}
          ${d('Department', a.department)}
          ${d('Candidate Type', a.candidateType)}
          ${d('Nationality', a.nationality)}
          ${d('ID Type / No.', `${a.idType} — ${a.idNumber}`)}
          ${d('Location', `${a.city}, ${a.country}`)}
          ${d('Mobile', a.mobile)}
          ${d('Email', a.email)}
          ${d('Expected Salary', `${a.expectedSalary||'—'} ${a.expectedCurrency||''}`)}
          ${d('Submitted', new Date(a.submittedAt).toLocaleString())}
        </div>
        <div class="mini-list"><b>Attachments</b>
          <div class="attach-links">${attachBtns || '—'}</div>
        </div>
        <div class="mini-list"><b>Education</b>
          ${(a.education||[]).filter(e=>e.institution||e.degree).map(e=>`${e.degree||'—'} — ${e.institution||'—'} (${e.year||'?'})`).join('<br>') || '—'}
        </div>
        <div class="mini-list"><b>Work Experience</b>
          ${(a.jobs||[]).filter(j=>j.position||j.employer).map(j=>`${j.position||'—'} at ${j.employer||'—'} (${j.start||'?'} – ${j.end||'present'}) — ${j.salary||'—'} ${j.currency||''}`).join('<br>') || '—'}
        </div>
        <div class="hr-panel">
          <b style="font-size:12px;">FOR OFFICE USE ONLY — HR</b>
          <div class="row2" style="margin-top:9px;">
            <div class="field"><label>${lbl('Status','الحالة')}</label>
              <select id="d_status">${STATUS_OPTIONS.map(s=>`<option ${a.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
            <div class="field"><label>${lbl('Job Assigned Code','رمز الوظيفة المعيّنة')}</label><input type="text" id="d_jobAssignedCode" value="${a.jobAssignedCode||''}" placeholder="e.g. OPS-014"></div>
          </div>
          <div class="row2">
            <div class="field"><label>${lbl('Interview Date','تاريخ المقابلة')}</label><input type="date" id="d_interviewDate" value="${a.interviewDate||''}"></div>
            <div class="field"><label>${lbl('Interview Result','نتيجة المقابلة')}</label>
              <select id="d_interviewResult">${['','Shortlisted','Accepted','Hold','Rejected'].map(s=>`<option ${a.interviewResult===s?'selected':''}>${s}</option>`).join('')}</select></div>
          </div>
          <div class="row2">
            <div class="field"><label>${lbl('Assessment Result','نتيجة التقييم')}</label><input type="text" id="d_assessmentResult" value="${a.assessmentResult||''}"></div>
            <div class="field"><label>${lbl('Reviewer','المراجع')}</label><input type="text" id="d_reviewer" value="${a.reviewer||''}"></div>
          </div>
          <div class="field"><label>${lbl('Notes','ملاحظات')}</label><textarea id="d_notes">${a.notes||''}</textarea></div>
        </div>
        <div class="hr-panel">
          <b style="font-size:12px;">OFFER &amp; ONBOARDING</b>
          <div class="subhead">Screening</div>
          <div class="row3">
            <div class="field"><label>${lbl('CV Received','السيرة الذاتية مستلمة')}</label><select id="d_cvReceived"><option value=""></option>${['Yes','No'].map(o=>`<option ${a.cvReceived===o?'selected':''}>${o}</option>`).join('')}</select></div>
            <div class="field"><label>${lbl('Application Accepted','الطلب مقبول')}</label><select id="d_applicationAccepted"><option value=""></option>${['Yes','No'].map(o=>`<option ${a.applicationAccepted===o?'selected':''}>${o}</option>`).join('')}</select></div>
            <div class="field"><label>${lbl('Candidate Status','حالة المرشح')}</label><select id="d_candidateStatus"><option value=""></option>${['Interview','Shortlisted','Hold','Offer','Accepted','Notice','Join','Rejected'].map(o=>`<option ${a.candidateStatus===o?'selected':''}>${o}</option>`).join('')}</select></div>
          </div>
          <div class="subhead">Offer</div>
          <div class="row2">
            <div class="field"><label>${lbl('Offer Date','تاريخ العرض')}</label><input type="date" id="d_offerDate" value="${a.offerDate||''}"></div>
            <div class="field"><label>${lbl('Offer Status','حالة العرض')}</label><select id="d_offerStatus"><option value=""></option>${['Sent','Accepted','Rejected'].map(o=>`<option ${a.offerStatus===o?'selected':''}>${o}</option>`).join('')}</select></div>
          </div>
          <div class="subhead">Work Authorization (Expatriates)</div>
          <div class="row2">
            <div class="field"><label>${lbl('Work Permit / Approval Status','حالة تصريح العمل')}</label><select id="d_workPermitStatus"><option value=""></option>${['Not Started','In Process','Approved','On Hold (Authority)','Rejected','N/A'].map(o=>`<option ${a.workPermitStatus===o?'selected':''}>${o}</option>`).join('')}</select></div>
            <div class="field"><label>${lbl('Visa / Travel Status','حالة التأشيرة والسفر')}</label><select id="d_visaTravelStatus"><option value=""></option>${['Not Started','Documents Submitted','Visa Approved','Travel Scheduled','Travel Completed','Cancelled','N/A'].map(o=>`<option ${a.visaTravelStatus===o?'selected':''}>${o}</option>`).join('')}</select></div>
          </div>
          <div class="subhead">Onboarding</div>
          <div class="row2">
            <div class="field"><label>${lbl('Expected Join Date','تاريخ الالتحاق المتوقع')}</label><input type="date" id="d_expectedJoinDate" value="${a.expectedJoinDate||''}"></div>
            <div class="field"><label>${lbl('Join Date','تاريخ الالتحاق')}</label><input type="date" id="d_joinDate" value="${a.joinDate||''}"></div>
          </div>
          <div class="row2">
            <div class="field"><label>${lbl('Net Salary (Offered)','الراتب الصافي المعروض')}</label>
              <div class="unit-input"><input type="number" id="d_offeredSalary" value="${a.offeredSalary||''}">
                <select id="d_offeredCurrency" style="width:90px; border-radius:0 5px 5px 0;"><option value=""></option>${['IQD','USD','Other'].map(c=>`<option ${a.offeredCurrency===c?'selected':''}>${c}</option>`).join('')}</select>
              </div>
            </div>
            <div class="field"><label>${lbl('Job Title (Final)','المسمى الوظيفي النهائي')}</label><input type="text" id="d_jobTitleFinal" value="${a.jobTitleFinal||''}"></div>
          </div>
          <div class="row2">
            <div class="field"><label>${lbl('Accommodation Provided','سكن مؤمّن')}</label><select id="d_accommodation"><option value=""></option>${['Yes','No'].map(o=>`<option ${a.accommodation===o?'selected':''}>${o}</option>`).join('')}</select></div>
            <div class="field"><label>${lbl('Meals per Day','عدد الوجبات يومياً')}</label><select id="d_meals"><option value=""></option>${['1','2','3'].map(o=>`<option ${a.meals===o?'selected':''}>${o}</option>`).join('')}</select></div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="save-btn" onclick="saveDetail()">Save Changes</button>
          <button class="nav-btn" style="flex:1; border-color:var(--teal); color:var(--teal-dark);" onclick="printApplication('${a.ref}')">🖨 Print / Save as PDF</button>
          <button class="del-btn" onclick="deleteApp()">Delete</button>
        </div>
      </div>
    </div>`);
}
function closeDetail(){ const m=document.getElementById('modalBg'); if(m) m.remove(); selectedApp=null; }

async function downloadAttachment(ref, kind){
  try{
    const res = await api(`/api/admin/applications/${ref}/file/${kind}`);
    if(!res.ok){ alert('File not found.'); return; }
    const blob = await res.blob();
    const a = applications.find(x=>x.ref===ref);
    const name = (a.attachments[kind]||{}).name || `${ref}-${kind}`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = name;
    document.body.appendChild(link); link.click(); link.remove();
    URL.revokeObjectURL(url);
  }catch(e){ alert('Could not retrieve this file.'); }
}

async function saveDetail(){
  if(!selectedApp) return;
  const updates = {
    status: document.getElementById('d_status').value,
    jobAssignedCode: document.getElementById('d_jobAssignedCode').value,
    interviewDate: document.getElementById('d_interviewDate').value,
    interviewResult: document.getElementById('d_interviewResult').value,
    assessmentResult: document.getElementById('d_assessmentResult').value,
    reviewer: document.getElementById('d_reviewer').value,
    notes: document.getElementById('d_notes').value,
    cvReceived: document.getElementById('d_cvReceived').value,
    applicationAccepted: document.getElementById('d_applicationAccepted').value,
    candidateStatus: document.getElementById('d_candidateStatus').value,
    offerDate: document.getElementById('d_offerDate').value,
    offerStatus: document.getElementById('d_offerStatus').value,
    workPermitStatus: document.getElementById('d_workPermitStatus').value,
    visaTravelStatus: document.getElementById('d_visaTravelStatus').value,
    expectedJoinDate: document.getElementById('d_expectedJoinDate').value,
    joinDate: document.getElementById('d_joinDate').value,
    offeredSalary: document.getElementById('d_offeredSalary').value,
    offeredCurrency: document.getElementById('d_offeredCurrency').value,
    accommodation: document.getElementById('d_accommodation').value,
    meals: document.getElementById('d_meals').value,
    jobTitleFinal: document.getElementById('d_jobTitleFinal').value
  };
  await api(`/api/admin/applications/${selectedApp.ref}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(updates) });
  closeDetail();
  loadAndRenderDashboard();
}

async function deleteApp(){
  if(!selectedApp) return;
  if(!confirm(`Delete application ${selectedApp.ref}? This cannot be undone.`)) return;
  await api(`/api/admin/applications/${selectedApp.ref}`, { method:'DELETE' });
  closeDetail();
  loadAndRenderDashboard();
}

/* ---------- Print / Save as PDF ---------- */
function printApplication(ref){
  const a = applications.find(x=>x.ref===ref);
  if(!a) return;
  const row = (label,val)=>`<tr><td class="pk">${label}</td><td>${val||'—'}</td></tr>`;
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>${a.ref} — ${a.fullName}</title>
    <style>
      body{font-family:Arial,sans-serif; font-size:12px; color:#1a1a1a; padding:30px; max-width:800px; margin:0 auto;}
      .ph{display:flex; align-items:center; gap:14px; border-bottom:3px solid #0EA9B7; padding-bottom:12px; margin-bottom:16px;}
      .ph img{height:40px;}
      .ph .t1{font-size:18px; font-weight:700;} .ph .t2{font-size:11px; color:#666;}
      h3{background:#1E2A38; color:#fff; padding:6px 10px; font-size:12px; margin:18px 0 6px;}
      table{width:100%; border-collapse:collapse; margin-bottom:6px;}
      td{border:1px solid #ddd; padding:5px 8px; font-size:11.5px; vertical-align:top;}
      td.pk{width:220px; font-weight:600; background:#f7f8f9;}
      .footer{margin-top:24px; font-size:10px; color:#888; border-top:1px solid #ddd; padding-top:8px;}
      @media print{ body{padding:10px;} }
    </style></head><body>
    <div class="ph">
      <img src="${location.origin}/assets/logo.png">
      <div><div class="t1">ASAS Global Aluminum Extrusion — Employment Application</div><div class="t2">Reference: ${a.ref} · Printed ${new Date().toLocaleString()}</div></div>
    </div>
    <h3>Position</h3><table>${row('Position Applied For',a.position)}${row('Job Code',a.jobCode)}${row('Department',a.department)}${row('Location',a.location)}${row('Expected Salary',(a.expectedSalary||'—')+' '+(a.expectedCurrency||''))}</table>
    <h3>Personal Information</h3><table>${row('Full Name',a.fullName)}${row('Nationality',a.nationality)}${row('Candidate Type',a.candidateType)}${row('Date of Birth',a.dob)}${row('Gender',a.gender)}${row('Marital Status',a.maritalStatus+(a.dependents?` (${a.dependents} dependents)`:''))}</table>
    <h3>Identification &amp; Contact</h3><table>${row('ID Type / No.',`${a.idType} — ${a.idNumber}`)}${row('Mobile',a.mobile)}${row('Email',a.email)}${row('Location',`${a.city}, ${a.country}`)}</table>
    <h3>Education</h3><table>${(a.education||[]).filter(e=>e.institution||e.degree).map(e=>row(e.degree||'Education',`${e.institution||''} — ${e.field||''} (${e.year||''})`)).join('') || row('Education','—')}</table>
    <h3>Employment History</h3><table>${(a.jobs||[]).filter(j=>j.employer||j.position).map(j=>row(`${j.position||''} — ${j.employer||''}`,`${j.start||'?'} to ${j.end||'present'} · Net salary ${j.salary||'—'} ${j.currency||''} · Ref: ${j.refName||'—'}`)).join('') || row('Employment','—')}</table>
    <h3>Screening &amp; Health</h3><table>${row('Years of Experience',a.careerExperienceYears)}${row('Willing to Work Shifts',a.q_shifts)}${row('Issue Working in Iraq',a.q_iraqIssue + (a.iraqIssueDetail?': '+a.iraqIssueDetail:''))}${row('History of Illness/Surgery',a.q_healthHistory + (a.healthHistoryDetail?': '+a.healthHistoryDetail:''))}${row('Medically Fit',a.medicallyFit?'Yes':'No')}</table>
    <h3>For Office Use Only — HR</h3><table>${row('Status',a.status)}${row('Job Assigned Code',a.jobAssignedCode)}${row('Interview Date',a.interviewDate)}${row('Interview Result',a.interviewResult)}${row('Assessment Result',a.assessmentResult)}${row('Reviewer',a.reviewer)}${row('Notes',a.notes)}</table>
    <h3>Offer &amp; Onboarding</h3><table>${row('CV Received',a.cvReceived)}${row('Application Accepted',a.applicationAccepted)}${row('Candidate Status',a.candidateStatus)}${row('Offer Date / Status',`${a.offerDate||'—'} / ${a.offerStatus||'—'}`)}${row('Work Permit Status',a.workPermitStatus)}${row('Visa / Travel Status',a.visaTravelStatus)}${row('Expected Join Date',a.expectedJoinDate)}${row('Join Date',a.joinDate)}${row('Net Salary (Offered)',(a.offeredSalary||'—')+' '+(a.offeredCurrency||''))}${row('Job Title (Final)',a.jobTitleFinal)}${row('Accommodation / Meals',`${a.accommodation||'—'} / ${a.meals||'—'} per day`)}</table>
    <div class="footer">Signature on file: ${a.signature||'—'} · Signed ${a.signDate||'—'} · Confidential — for internal HR use only.</div>
    </body></html>`);
  win.document.close();
  win.onload = () => win.print();
}

renderAdmin();
