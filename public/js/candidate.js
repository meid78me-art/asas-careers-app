/* ============================= CONSTANTS ============================= */
const DEPARTMENTS = ["HR & Admin","Finance","Environmental","Quality & Safety","Factory / Production","Engineering & Maintenance","Supply Chain","IT"];
const DEPARTMENT_SECTIONS = {
  "HR & Admin": "e.g. payroll, security, accommodation, training, recruitment",
  "Finance": "e.g. accounts payable, treasury, cost control, budgeting",
  "Environmental": "e.g. compliance, waste management, sustainability",
  "Quality & Safety": "e.g. QA/QC, HSE, lab testing",
  "Factory / Production": "e.g. extrusion, casting, anodizing, packing",
  "Engineering & Maintenance": "e.g. mechanical, electrical, utilities, projects",
  "Supply Chain": "e.g. procurement, warehousing, logistics, planning",
  "IT": "e.g. infrastructure, applications, ERP support"
};
const LOCATIONS = ["Babil Plant"];
const EMPLOYMENT_TYPES = ["Permanent","Contract","Temporary","Internship"];
const VACANCY_SOURCES = ["Company Website","Job Portal","Referral","Recruitment Agency","Other"];
const GENDERS = ["Male","Female"];
const RELIGIONS = ["Islam","Christianity","Yazidi","Other","Prefer not to say"];
const MARITAL = ["Single","Married","Divorced","Widowed"];
const MILITARY_STATUS = ["Completed","Exempted","Postponed","Not Applicable"];
const CURRENCIES = ["IQD","USD","Other"];
const COMPUTER_SKILLS = ["MS Office","ERP / SAP","AutoCAD","SolidWorks / Inventor","PLC / SCADA","Accounting Software","None"];
const DEGREES = ["High School","Diploma","Bachelor's","Master's","PhD","Vocational / Trade"];
const PROFICIENCY = ["Basic","Good","Fluent","Native"];
const YESNO = ["Yes","No"];
const COUNTRIES = ["Iraq","Egypt","Syria","India","Pakistan","Bangladesh","Jordan","Lebanon","Turkey","Philippines","United States","United Kingdom","Other"];
const NATIONALITIES = ["Afghan","Algerian","American","Argentine","Armenian","Australian","Austrian","Azerbaijani","Bahraini","Bangladeshi","Belarusian","Belgian","Bosnian","Brazilian","British","Bulgarian","Cambodian","Cameroonian","Canadian","Chadian","Chilean","Chinese","Colombian","Croatian","Cuban","Cypriot","Czech","Danish","Dutch","Ecuadorian","Egyptian","Emirati","Eritrean","Estonian","Ethiopian","Filipino","Finnish","French","Georgian","German","Ghanaian","Greek","Hungarian","Indian","Indonesian","Iranian","Iraqi","Irish","Israeli","Italian","Ivorian","Japanese","Jordanian","Kazakh","Kenyan","Korean (South)","Kuwaiti","Kyrgyz","Lao","Latvian","Lebanese","Libyan","Lithuanian","Malaysian","Malian","Mauritanian","Mexican","Moldovan","Mongolian","Moroccan","Nepalese","New Zealander","Nigerian","Norwegian","Omani","Pakistani","Palestinian","Peruvian","Polish","Portuguese","Qatari","Romanian","Russian","Saudi Arabian","Senegalese","Serbian","Singaporean","Slovak","Slovenian","Somali","South African","Spanish","Sri Lankan","Sudanese","Swedish","Swiss","Syrian","Taiwanese","Tajik","Tanzanian","Thai","Tunisian","Turkish","Turkmen","Ugandan","Ukrainian","Uzbek","Venezuelan","Vietnamese","Yemeni","Other"];
const GOVERNORATES = ["Baghdad","Basra","Nineveh","Erbil","Sulaymaniyah","Duhok","Kirkuk","Anbar","Babil","Karbala","Najaf","Wasit","Diyala","Salah al-Din","Maysan","Dhi Qar","Muthanna","Qadisiyyah"];

let jobRowCount=0, courseRowCount=0, eduRowCount=0, relRowCount=0;

/* ============================= HELPERS ============================= */
function lbl(en,ar){ return `<span class="lbl-en">${en}</span><span class="lbl-ar">${ar}</span>`; }
function fieldHTML(id,en,ar,type,extra,opts){
  extra = extra||''; opts = opts||{};
  const req = extra.includes('required') ? '<span class="req">*</span>' : '';
  if(type==='select'){
    return `<div class="field"><label>${lbl(en,ar)}${req}</label><select id="${id}" ${extra}>
      <option value="">— Select —</option>${(opts.list||[]).map(o=>`<option>${o}</option>`).join('')}
    </select></div>`;
  }
  if(type==='textarea'){
    return `<div class="field"><label>${lbl(en,ar)}${req}</label><textarea id="${id}" ${extra} placeholder="${opts.placeholder||''}"></textarea></div>`;
  }
  return `<div class="field"><label>${lbl(en,ar)}${req}</label><input type="${type}" id="${id}" ${extra} placeholder="${opts.placeholder||''}">${opts.hint?`<div class="hint">${opts.hint}</div>`:''}</div>`;
}
function ynSelect(id,en,ar,onchangeId){
  return `<div class="yn-row"><span>${lbl(en,ar)}</span><select id="${id}" ${onchangeId?`onchange="toggleConditional('${onchangeId}', this.value)"`:''}><option value="">—</option>${YESNO.map(o=>`<option>${o}</option>`).join('')}</select></div>`;
}
function toggleConditional(wrapId, val){ document.getElementById(wrapId).style.display = (val==='Yes') ? 'block' : 'none'; }

function eduRow(idx){
  return `<div class="repeat-block" data-edu="${idx}">
    <button type="button" class="remove-row" onclick="this.parentElement.remove()">Remove</button>
    <div class="block-tag">Education ${idx}</div>
    <div class="row2">
      ${fieldHTML(`edu_institution_${idx}`,'Institution / University','المؤسسة / الجامعة','text')}
      <div class="field"><label>${lbl('Qualification','المؤهل')}</label><select id="edu_degree_${idx}"><option value="">— Select —</option>${DEGREES.map(d=>`<option>${d}</option>`).join('')}</select></div>
    </div>
    <div class="row4">
      ${fieldHTML(`edu_field_${idx}`,'Field of Study','التخصص','text')}
      ${fieldHTML(`edu_country_${idx}`,'Country','الدولة','text')}
      ${fieldHTML(`edu_year_${idx}`,'Graduation Year','سنة التخرج','text')}
      ${fieldHTML(`edu_grade_${idx}`,'GPA / Grade','المعدل التراكمي','text')}
    </div>
  </div>`;
}
function addEduRow(){ eduRowCount++; document.getElementById('eduRows').insertAdjacentHTML('beforeend', eduRow(eduRowCount)); }

function jobRow(idx){
  return `<div class="repeat-block" data-job="${idx}">
    <button type="button" class="remove-row" onclick="removeJobRow(this)">Remove</button>
    <div class="block-tag">Employer ${idx}</div>
    <div class="row2">
      ${fieldHTML(`job_start_${idx}`,'From (MM/YYYY)','من (شهر/سنة)','text','',{placeholder:'e.g. 03/2020'})}
      ${fieldHTML(`job_end_${idx}`,'To (MM/YYYY)','إلى (شهر/سنة)','text','',{placeholder:'Present'})}
    </div>
    <div class="row2">
      ${fieldHTML(`job_employer_${idx}`,'Employer','جهة العمل','text')}
      ${fieldHTML(`job_position_${idx}`,'Position','المسمى الوظيفي','text')}
    </div>
    <div class="row2">
      <div class="field"><label>${lbl('Country','البلد')}</label><select id="job_country_${idx}"><option value="">— Select —</option>${COUNTRIES.map(c=>`<option>${c}</option>`).join('')}</select></div>
      ${fieldHTML(`job_reason_${idx}`,'Reason for Leaving','سبب ترك العمل','text')}
    </div>
    ${fieldHTML(`job_summary_${idx}`,'Job Role Summary','ملخص المهام','textarea','',{placeholder:'Brief summary of responsibilities and achievements'})}
    <div class="row2">
      <div class="field"><label>${lbl('Net Salary','الراتب الصافي')}</label>
        <div class="unit-input"><input type="number" id="job_salary_${idx}">
          <select id="job_currency_${idx}" style="width:90px; border-radius:0 5px 5px 0;"><option value="">—</option>${CURRENCIES.map(c=>`<option>${c}</option>`).join('')}</select>
        </div>
      </div>
      <div></div>
    </div>
    <div class="subhead">Reference for this job / المعرّف لهذه الوظيفة</div>
    <div class="row3">
      ${fieldHTML(`job_ref_name_${idx}`,'Reference Name','اسم المعرّف','text')}
      ${fieldHTML(`job_ref_position_${idx}`,'Position &amp; Phone No.','المسمى والهاتف','text','',{placeholder:'e.g. HR Manager, +964…'})}
      ${fieldHTML(`job_ref_email_${idx}`,'Reference Email','البريد الإلكتروني','email')}
    </div>
  </div>`;
}
function addJobRow(){
  if(jobRowCount>=3) return;
  jobRowCount++;
  document.getElementById('jobRows').insertAdjacentHTML('beforeend', jobRow(jobRowCount));
  document.getElementById('addJobBtn').disabled = jobRowCount>=3;
}
function removeJobRow(btn){
  btn.parentElement.remove();
  jobRowCount = document.querySelectorAll('[data-job]').length;
  document.getElementById('addJobBtn').disabled = jobRowCount>=3;
}

function courseRow(idx){
  return `<div class="repeat-block" data-course="${idx}">
    <button type="button" class="remove-row" onclick="this.parentElement.remove()">Remove</button>
    <div class="block-tag">Course ${idx}</div>
    <div class="row2">
      ${fieldHTML(`course_name_${idx}`,'Course / Certificate Name','اسم الدورة / الشهادة','text')}
      ${fieldHTML(`course_provider_${idx}`,'Provider Company','مقدم الدورة','text')}
    </div>
    <div class="row3">
      ${fieldHTML(`course_date_${idx}`,'Date','التاريخ','date')}
      ${fieldHTML(`course_duration_${idx}`,'Duration','المدة','text','',{placeholder:'e.g. 3 days'})}
      ${fieldHTML(`course_location_${idx}`,'Location / Online','المكان','text','',{placeholder:'City or "Online"'})}
    </div>
  </div>`;
}
function addCourseRow(){ courseRowCount++; document.getElementById('courseRows').insertAdjacentHTML('beforeend', courseRow(courseRowCount)); }

function relRow(idx){
  return `<div class="repeat-block" data-rel="${idx}">
    <button type="button" class="remove-row" onclick="this.parentElement.remove()">Remove</button>
    <div class="row3">
      ${fieldHTML(`rel_name_${idx}`,'Name','الاسم','text')}
      ${fieldHTML(`rel_relation_${idx}`,'Relationship','صلة القرابة','text')}
      ${fieldHTML(`rel_city_${idx}`,'Employment City / Site','مدينة العمل','text')}
    </div>
  </div>`;
}
function addRelRow(){ relRowCount++; document.getElementById('relRows').insertAdjacentHTML('beforeend', relRow(relRowCount)); }

function langRow(name,ar){
  return `<tr><td style="font-size:12px; font-weight:600;">${name} <span dir="rtl" style="color:var(--text-soft); font-weight:500;">${ar}</span></td>
  ${['speak','read','write'].map(k=>`<td><select id="lang_${name}_${k}"><option value="">—</option>${PROFICIENCY.map(l=>`<option>${l}</option>`).join('')}</select></td>`).join('')}
  </tr>`;
}

function fileDrop(id, en, ar, required, accept){
  return `<div class="field">
    <label>${lbl(en,ar)}${required?'<span class="req">*</span>':''}</label>
    <div class="file-drop" onclick="document.getElementById('${id}').click()">
      <input type="file" id="${id}" accept="${accept||''}" onchange="document.getElementById('${id}_name').textContent = this.files[0] ? this.files[0].name + ' (' + (this.files[0].size/1024).toFixed(0) + ' KB)' : 'No file selected'">
      <div class="fd-label">Choose file</div>
      <div class="fd-name" id="${id}_name">No file selected</div>
      <div class="fd-hint">Max 10MB</div>
    </div>
  </div>`;
}

const TC_TEXT = `
<h4>1. Eligibility &amp; Application</h4>
Candidates must be 18 years or older and legally entitled to work. Local candidates must provide a valid Iraqi national ID. Expatriate candidates must hold a valid passport and agree to obtain the required work permit and residence visa through company sponsorship.
<h4>2. Verification &amp; Background Checks</h4>
Shortlisted candidates undergo education, employment and background verification. Original documents must be presented at interview upon request. Any falsification results in automatic disqualification.
<h4>3. Selection Process</h4>
Screening → interview(s) → technical/psychometric assessments → medical examination → offer. The company may modify, shorten or extend any stage.
<h4>4. Employment Offer</h4>
An offer is valid only in written form, signed by an authorized company representative, and is subject to successful verification, medical fitness and (for expats) visa/work-permit approval.
<h4>5. Confidentiality &amp; Data Protection</h4>
All information is confidential and used solely for recruitment purposes, stored securely and disposed of per the retention policy.
<h4>6. Equal Opportunity</h4>
Fair, transparent and non-discriminatory hiring regardless of gender, ethnicity, religion, origin or disability, except for genuine occupational qualifications.
<h4>7. No Guarantee of Employment</h4>
Application or participation does not create an employment relationship; only a signed employment contract is binding.
<h4>8. Costs &amp; Fees</h4>
The company charges no fees at any recruitment stage. Report any request for payment to HR immediately.
<h4>9. Declaration</h4>
By submitting, the candidate declares that all information in this form is correct, and understands that any breach of accuracy may result in disqualification or disciplinary consequences under company bylaws.
<h4>10. Contact</h4>
HR Department, ASAS Global Aluminum Extrusion — Career@asalcoalu.com
`;

/* ============================= CANDIDATE FORM ============================= */
function renderCandidateForm(){
  const c = document.getElementById('candidateView');
  c.innerHTML = `
  <div class="welcome-card">
    <div class="wt en">Welcome to ASAS Global Aluminum Extrusion</div>
    <div class="wt ar" dir="rtl">مرحباً بكم في أسس جلوبال ألمنيوم</div>
    <p class="en">We're one of Iraq's growing aluminum manufacturers, and we're glad you're considering a career with us. This application takes about 15 minutes — have your ID or passport and CV ready before you start.</p>
    <p class="ar" dir="rtl">نحن إحدى شركات تصنيع الألمنيوم الرائدة في العراق، ويسعدنا أنك تفكر في الانضمام إلى فريقنا. تستغرق هذه الاستمارة حوالي 15 دقيقة — يرجى تجهيز الهوية أو جواز السفر والسيرة الذاتية قبل البدء.</p>
  </div>

  <div class="intro-card">
    <p class="en">This application is intended for Iraqi nationals (local candidates) and expatriate (international) candidates seeking employment with ASAS Global Aluminum Extrusion. Please read all sections carefully and complete them fully. Incomplete applications will not be processed. All answers must be written in English.</p>
    <p class="ar" dir="rtl">هذه الاستمارة مخصصة للمواطنين العراقيين (المرشحين المحليين) والمرشحين الأجانب الراغبين في العمل لدى أسس جلوبال ألمنيوم. يرجى قراءة جميع الأقسام بعناية وتعبئتها بالكامل. لن يتم النظر في الطلبات غير المكتملة. يجب تعبئة جميع الحقول باللغة الإنجليزية.</p>
    <div class="notice-box">
      <span class="en">⚠ All answers must be written in English. Fields marked * are mandatory.</span>
      <span class="ar" dir="rtl">⚠ يجب تعبئة جميع الحقول باللغة الإنجليزية. الحقول المؤشرة بعلامة * إلزامية.</span>
    </div>
  </div>

  <div class="field"><label>${lbl('Candidate Type','نوع المرشح')}<span class="req">*</span></label></div>
  <div class="type-select">
    <div class="type-card active" id="typeCardLocal" onclick="setCandidateType('local')">
      <div class="en">Local (Iraqi national)</div><div class="ar" dir="rtl">محلي (مواطن عراقي)</div>
    </div>
    <div class="type-card" id="typeCardExpat" onclick="setCandidateType('expat')">
      <div class="en">Expatriate (international)</div><div class="ar" dir="rtl">أجنبي (دولي)</div>
    </div>
  </div>

  <form id="applicationForm" novalidate>

    <div class="section">
      <div class="section-head"><div class="section-num">01</div><div class="section-title-en">Position Applied For</div><div class="section-title-ar" dir="rtl">الوظيفة المتقدم إليها</div></div>
      <div class="row2">
        ${fieldHTML('position','Position Applied For','الوظيفة المتقدم إليها','text','required',{placeholder:'e.g. Extrusion Press Operator'})}
        <div class="field"><label>${lbl('Department','القسم')}<span class="req">*</span></label>
          <select id="department" required onchange="document.getElementById('deptHint').textContent = DEPARTMENT_SECTIONS[this.value] || ''"><option value="">— Select —</option>${DEPARTMENTS.map(d=>`<option>${d}</option>`).join('')}</select>
          <div class="hint" id="deptHint"></div>
        </div>
      </div>
      <div class="row2">
        ${fieldHTML('jobCode','Job Code (if applicable)','رمز الوظيفة (إن وجد)','text','',{placeholder:'e.g. OPS-014'})}
        <div class="field"><label>${lbl('Location / Site','الموقع')}</label><select id="location">${LOCATIONS.map(l=>`<option>${l}</option>`).join('')}</select></div>
      </div>
      <div class="row2">
        ${fieldHTML('startDate','Date Available to Start','تاريخ الجاهزية للبدء','date')}
        <div></div>
      </div>
      <div class="row2">
        <div class="field"><label>${lbl('Expected Monthly Salary','الراتب الشهري المتوقع')}</label>
          <div class="unit-input"><input type="number" id="expectedSalary" placeholder="e.g. 1,200,000">
            <span class="unit-suffix" id="salaryUnit">IQD</span>
          </div>
          <div class="hint" id="salaryHint">Local candidates: state the amount in IQD.</div>
        </div>
        <div class="field"><label>${lbl('Employment Type','نوع التوظيف')}</label><select id="employmentType"><option value="">— Select —</option>${EMPLOYMENT_TYPES.map(o=>`<option>${o}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label>${lbl('Source of Vacancy','مصدر الإعلان')}</label><select id="sourceOfVacancy"><option value="">— Select —</option>${VACANCY_SOURCES.map(o=>`<option>${o}</option>`).join('')}</select></div>
    </div>

    <div class="section">
      <div class="section-head"><div class="section-num">02</div><div class="section-title-en">Personal Information</div><div class="section-title-ar" dir="rtl">المعلومات الشخصية</div></div>
      ${fieldHTML('fullName','Full Name (as in passport)','الاسم الكامل (كما في الجواز)','text','required',{placeholder:'First Middle Last — exactly as in your passport'})}
      <div class="row2">
        <div class="field"><label>${lbl('Nationality','الجنسية')}<span class="req">*</span></label><select id="nationality" required><option value="">— Select —</option>${NATIONALITIES.map(n=>`<option>${n}</option>`).join('')}</select></div>
        ${fieldHTML('dob','Date of Birth','تاريخ الميلاد','date','required')}
      </div>
      <div class="row2">
        ${fieldHTML('placeOfBirth','Place of Birth','مكان الميلاد','text')}
        <div class="field"><label>${lbl('Gender','الجنس')}<span class="req">*</span></label><select id="gender" required><option value="">— Select —</option>${GENDERS.map(g=>`<option>${g}</option>`).join('')}</select></div>
      </div>
      <div class="row3">
        <div class="field"><label>${lbl('Marital Status','الحالة الاجتماعية')}<span class="req">*</span></label><select id="maritalStatus" required><option value="">— Select —</option>${MARITAL.map(m=>`<option>${m}</option>`).join('')}</select></div>
        ${fieldHTML('dependents','Number of Dependents','عدد المعالين','number','',{placeholder:'0'})}
        <div class="field"><label>${lbl('Religion','الديانة')}</label><select id="religion"><option value="">— Select —</option>${RELIGIONS.map(r=>`<option>${r}</option>`).join('')}</select></div>
      </div>
      ${fieldHTML('dependentsDetail',"Dependents' Ages (if any)",'أعمار المعالين','text','',{placeholder:'e.g. 5, 8, 12'})}
    </div>

    <div class="section">
      <div class="section-head"><div class="section-num">03</div><div class="section-title-en">Identification</div><div class="section-title-ar" dir="rtl">الهوية</div></div>
      <div class="toggle-row">
        <button type="button" id="btnPassport" onclick="setIdType('Passport')">Passport</button>
        <button type="button" id="btnNationalId" class="active" onclick="setIdType('National ID')">National ID</button>
      </div>
      <div class="row4">
        ${fieldHTML('idNumber','ID / Passport Number','رقم الهوية أو الجواز','text','required')}
        ${fieldHTML('idIssueDate','Issue Date','تاريخ الإصدار','date')}
        ${fieldHTML('idExpiryDate','Expiry Date','تاريخ الانتهاء','date')}
        ${fieldHTML('idPlaceOfIssue','Place of Issue','مكان الإصدار','text')}
      </div>
      <div id="militaryWrap">
        <div class="field"><label>${lbl('Military Service Status','حالة الخدمة العسكرية')}</label><select id="militaryStatus"><option value="">— Select —</option>${MILITARY_STATUS.map(m=>`<option>${m}</option>`).join('')}</select></div>
      </div>
    </div>

    <div class="section">
      <div class="section-head"><div class="section-num">04</div><div class="section-title-en">Contact &amp; Residence</div><div class="section-title-ar" dir="rtl">التواصل ومكان الإقامة</div></div>
      <div class="row2">
        ${fieldHTML('mobile','Mobile Number','رقم الهاتف','tel','required',{placeholder:'+964 770 000 0000'})}
        ${fieldHTML('altPhone','Alternative Number','رقم بديل','tel')}
      </div>
      ${fieldHTML('email','Email Address','البريد الإلكتروني','email','required',{placeholder:'name@example.com'})}
      <div class="row2">
        ${fieldHTML('city','Current City of Residence','مدينة الإقامة الحالية','text','required')}
        <div class="field"><label>${lbl('Current Country of Residence','بلد الإقامة الحالية')}<span class="req">*</span></label><select id="country" required><option value="">— Select —</option>${COUNTRIES.map(c=>`<option>${c}</option>`).join('')}</select></div>
      </div>
      ${fieldHTML('address','Street / Building / Address','العنوان','text')}
      <div id="governorateWrap" class="field"><label>${lbl('Home Governorate (Iraq)','المحافظة (العراق)')}</label><select id="governorate"><option value="">— Select —</option>${GOVERNORATES.map(g=>`<option>${g}</option>`).join('')}</select></div>
    </div>

    <div class="section">
      <div class="section-head"><div class="section-num">05</div><div class="section-title-en">Emergency Contact</div><div class="section-title-ar" dir="rtl">جهة الاتصال في حالات الطوارئ</div></div>
      <div class="row2">
        ${fieldHTML('emergName','Name','الاسم','text')}
        ${fieldHTML('emergRelation','Relationship','صلة القرابة','text')}
      </div>
      <div class="row2">
        ${fieldHTML('emergCountry','Country','البلد','text')}
        ${fieldHTML('emergCity','City','المدينة','text')}
      </div>
      ${fieldHTML('emergPhone','Mobile Number','رقم الجوال','tel')}
    </div>

    <div class="section">
      <div class="section-head"><div class="section-num">06</div><div class="section-title-en">Language &amp; Skills</div><div class="section-title-ar" dir="rtl">اللغات والمهارات</div></div>
      <div class="section-sub">Rate each language: Basic / Good / Fluent / Native.</div>
      <table style="width:100%; border-collapse:collapse; margin-bottom:12px;">
        <tr style="font-size:10.5px; color:var(--text-soft); text-align:left;"><th></th><th>Speaking</th><th>Reading</th><th>Writing</th></tr>
        ${langRow('Arabic','العربية')}${langRow('Kurdish','الكردية')}${langRow('English','الإنجليزية')}
      </table>
      <div class="row2">
        ${fieldHTML('otherLanguage','Other Language','لغة أخرى','text','',{placeholder:'e.g. Turkish'})}
        <div class="field"><label>${lbl('Level','المستوى')}</label><select id="otherLanguageLevel"><option value="">— Select —</option>${PROFICIENCY.map(l=>`<option>${l}</option>`).join('')}</select></div>
      </div>
      ${fieldHTML('technicalSkills','Technical / Professional Skills','المهارات الفنية / المهنية','textarea','',{placeholder:'e.g. Aluminum extrusion press operation, die changing, anodizing line control, welding, forklift licence…'})}
      <div class="field"><label>${lbl('Computer Literacy','المهارات الحاسوبية')}</label>
        <div class="pill-group">${COMPUTER_SKILLS.map((o,i)=>`<input type="checkbox" id="cs_${i}" name="computerSkills" value="${o}"><label for="cs_${i}">${o}</label>`).join('')}</div>
      </div>
      ${fieldHTML('computerOther','Other Software','برامج أخرى','text')}
    </div>

    <div class="section">
      <div class="section-head"><div class="section-num">07</div><div class="section-title-en">Education</div><div class="section-title-ar" dir="rtl">التعليم</div></div>
      <div class="section-sub">Most recent first.</div>
      <div id="eduRows"></div>
      <button type="button" class="add-row-btn" onclick="addEduRow()">+ Add Education</button>
    </div>

    <div class="section">
      <div class="section-head"><div class="section-num">08</div><div class="section-title-en">Employment History</div><div class="section-title-ar" dir="rtl">السجل الوظيفي</div></div>
      <div class="section-sub">Most recent employer first, up to 3 — each with net salary and a reference. Leave blank if you are a fresh graduate.</div>
      <div id="jobRows"></div>
      <button type="button" class="add-row-btn" id="addJobBtn" onclick="addJobRow()">+ Add Another Employer</button>
    </div>

    <div class="section">
      <div class="section-head"><div class="section-num">09</div><div class="section-title-en">Courses &amp; Certificates</div><div class="section-title-ar" dir="rtl">الدورات والشهادات</div></div>
      <div id="courseRows"></div>
      <button type="button" class="add-row-btn" onclick="addCourseRow()">+ Add Course / Certificate</button>
    </div>

    <div class="section">
      <div class="section-head"><div class="section-num">10</div><div class="section-title-en">Health &amp; Safety</div><div class="section-title-ar" dir="rtl">الصحة والسلامة</div></div>
      ${ynSelect('q_healthHistory','Do you have any history of illness, operation, or surgery?','هل لديك تاريخ مرضي أو عملية جراحية سابقة؟','healthHistoryWrap')}
      <div class="conditional" id="healthHistoryWrap" style="display:none;">
        ${fieldHTML('healthHistoryDetail','Please describe (what, when, where)','يرجى الوصف (ماذا، متى، أين)','textarea')}
      </div>
      <div class="consent-item"><input type="checkbox" id="medicallyFit"><label for="medicallyFit">${lbl('I confirm I am medically fit for the physical demands of a manufacturing environment.','أؤكد لياقتي الطبية للمتطلبات البدنية لبيئة العمل الصناعية.')}</label></div>
    </div>

    <div class="section">
      <div class="section-head"><div class="section-num">11</div><div class="section-title-en">Screening Questions</div><div class="section-title-ar" dir="rtl">أسئلة تمهيدية</div></div>
      ${fieldHTML('careerExperienceYears','Years of Experience in Your Career','سنوات الخبرة في مسيرتك المهنية','number','',{placeholder:'e.g. 6'})}
      ${ynSelect('q_iraqIssue','Do you have any issue working in Iraq?','هل لديك أي مانع من العمل في العراق؟','iraqIssueWrap')}
      <div class="conditional" id="iraqIssueWrap" style="display:none;">
        ${fieldHTML('iraqIssueDetail','Please describe','يرجى التوضيح','text')}
      </div>
      ${ynSelect('q_shifts','Are you willing to work on shifts?','هل أنت على استعداد للعمل في نوبات؟')}
      ${ynSelect('q_car','Do you have your own car?','هل تملك سيارة خاصة؟')}
      ${ynSelect('q_license','Do you hold a driving license?','هل تحمل رخصة قيادة؟')}
      ${ynSelect('q_relocate','Will you be able to relocate to another site?','هل توافق على النقل لموقع آخر؟')}
      ${ynSelect('q_prevAsas','Have you been previously employed by ASAS?','هل سبق أن عملت مع شركة أساس؟','prevAsasWrap')}
      <div class="conditional" id="prevAsasWrap" style="display:none;">
        <div class="row3">
          ${fieldHTML('prevAsasPosition','Position Held','الوظيفة','text')}
          ${fieldHTML('prevAsasPeriod','Period','المدة','text')}
          ${fieldHTML('prevAsasLocation','Location','الموقع','text')}
        </div>
      </div>
      ${ynSelect('q_govt','Were you employed by any Iraqi Government Institution?','هل سبق أن عملت في أي جهة حكومية عراقية؟','govtWrap')}
      <div class="conditional" id="govtWrap" style="display:none;">
        ${fieldHTML('govtPlace','Which Institution / Where','في أي جهة','text')}
      </div>
    </div>

    <div class="section">
      <div class="section-head"><div class="section-num">12</div><div class="section-title-en">Relatives Working at ASAS</div><div class="section-title-ar" dir="rtl">أقارب يعملون في أساس</div></div>
      <div class="section-sub">Including in-laws, if any.</div>
      <div id="relRows"></div>
      <button type="button" class="add-row-btn" onclick="addRelRow()">+ Add Relative</button>
    </div>

    <div class="section">
      <div class="section-head"><div class="section-num">13</div><div class="section-title-en">Attachments</div><div class="section-title-ar" dir="rtl">المرفقات</div></div>
      <div class="section-sub">Max 10MB per file.</div>
      <div class="row2">
        ${fileDrop('cvFile','Curriculum Vitae (CV)','السيرة الذاتية',true,'.pdf,.doc,.docx')}
        ${fileDrop('idFile','ID or Passport','الهوية أو جواز السفر',false,'.pdf,.jpg,.jpeg,.png')}
      </div>
      ${fileDrop('photoFile','Recent Photo','صورة شخصية حديثة',false,'.jpg,.jpeg,.png,.webp')}
    </div>

    <div class="section">
      <div class="section-head"><div class="section-num">14</div><div class="section-title-en">Declaration, Terms &amp; Consent</div><div class="section-title-ar" dir="rtl">الإقرار والشروط والموافقة</div></div>
      <div class="tc-box">${TC_TEXT}</div>
      <div class="consent-item"><input type="checkbox" id="consentAll" required>
        <label for="consentAll">${lbl('I hereby declare that all the information in this form is correct, and I have read and accept the Terms &amp; Conditions of the Hiring Process.','أقر بأن جميع المعلومات المدونة في هذا النموذج صحيحة، وأنني قرأت ووافقت على الشروط والأحكام الخاصة بعملية التوظيف.')}</label>
      </div>
      <div class="row2">
        ${fieldHTML('signature','Typed Signature (Full Name)','التوقيع','text','required')}
        ${fieldHTML('signDate','Date','التاريخ','date','required')}
      </div>
    </div>

    <div class="submit-bar">
      <button type="submit" class="submit-btn" id="submitBtn" disabled>Submit Application</button>
      <div class="err" id="formErr"></div>
    </div>
  </form>`;

  document.getElementById('eduRows').innerHTML=''; eduRowCount=0; addEduRow();
  document.getElementById('jobRows').innerHTML=''; jobRowCount=0; addJobRow();
  document.getElementById('courseRows').innerHTML=''; courseRowCount=0; addCourseRow();
  document.getElementById('relRows').innerHTML=''; relRowCount=0; addRelRow();
  document.getElementById('consentAll').addEventListener('change', function(){ document.getElementById('submitBtn').disabled = !this.checked; });
  document.getElementById('applicationForm').addEventListener('submit', handleSubmit);
  window._idType = 'National ID';
  setCandidateType('local');
}

function setCandidateType(type){
  window._candidateType = type;
  document.getElementById('typeCardLocal').classList.toggle('active', type==='local');
  document.getElementById('typeCardExpat').classList.toggle('active', type==='expat');
  document.getElementById('salaryUnit').textContent = type==='expat' ? 'USD' : 'IQD';
  document.getElementById('salaryHint').textContent = type==='expat' ? 'Expatriate candidates: state the amount in USD.' : 'Local candidates: state the amount in IQD.';
  document.getElementById('governorateWrap').style.display = type==='expat' ? 'none' : 'block';
  document.getElementById('militaryWrap').style.display = type==='expat' ? 'none' : 'block';
  setIdType(type==='expat' ? 'Passport' : 'National ID');
}
function setIdType(type){
  document.getElementById('btnPassport').classList.toggle('active', type==='Passport');
  document.getElementById('btnNationalId').classList.toggle('active', type==='National ID');
  window._idType = type;
}

async function handleSubmit(e){
  e.preventDefault();
  const v = id => (document.getElementById(id)||{}).value || '';
  const required = ['position','department','fullName','nationality','dob','gender','maritalStatus','idNumber','mobile','email','city','country','signature','signDate'];
  let ok = true;
  required.forEach(id=>{ if(!v(id)) ok=false; });
  const cvFile = document.getElementById('cvFile').files[0];
  if(!document.getElementById('consentAll').checked) ok=false;
  if(!cvFile) ok=false;
  const errBox = document.getElementById('formErr');
  if(!ok){ errBox.textContent = 'Please complete all required fields, attach your CV, and accept the Terms & Conditions.'; errBox.style.display='block'; return; }
  errBox.style.display='none';

  const btn = document.getElementById('submitBtn');
  btn.disabled = true; btn.textContent = 'Submitting…';

  const jobs = [...document.querySelectorAll('[data-job]')].map(el=>{
    const i = el.getAttribute('data-job');
    return { start:v(`job_start_${i}`), end:v(`job_end_${i}`), employer:v(`job_employer_${i}`), position:v(`job_position_${i}`),
      country:v(`job_country_${i}`), reason:v(`job_reason_${i}`), summary:v(`job_summary_${i}`),
      salary:v(`job_salary_${i}`), currency:v(`job_currency_${i}`),
      refName:v(`job_ref_name_${i}`), refPositionPhone:v(`job_ref_position_${i}`), refEmail:v(`job_ref_email_${i}`) };
  });
  const education = [...document.querySelectorAll('[data-edu]')].map(el=>{
    const i = el.getAttribute('data-edu');
    return { institution:v(`edu_institution_${i}`), degree:v(`edu_degree_${i}`), field:v(`edu_field_${i}`), country:v(`edu_country_${i}`), year:v(`edu_year_${i}`), grade:v(`edu_grade_${i}`) };
  });
  const courses = [...document.querySelectorAll('[data-course]')].map(el=>{
    const i = el.getAttribute('data-course');
    return { name:v(`course_name_${i}`), provider:v(`course_provider_${i}`), date:v(`course_date_${i}`), duration:v(`course_duration_${i}`), location:v(`course_location_${i}`) };
  });
  const relatives = [...document.querySelectorAll('[data-rel]')].map(el=>{
    const i = el.getAttribute('data-rel');
    return { name:v(`rel_name_${i}`), relation:v(`rel_relation_${i}`), city:v(`rel_city_${i}`) };
  });
  const computerSkills = [...document.querySelectorAll('input[name=computerSkills]:checked')].map(c=>c.value);

  const fd = new FormData();
  const plain = {
    candidateType: window._candidateType || 'local',
    position:v('position'), jobCode:v('jobCode'), department:v('department'), location:v('location'), startDate:v('startDate'),
    expectedSalary:v('expectedSalary'), expectedCurrency: document.getElementById('salaryUnit').textContent,
    employmentType:v('employmentType'), sourceOfVacancy:v('sourceOfVacancy'),
    fullName:v('fullName'), nationality:v('nationality'), dob:v('dob'), placeOfBirth:v('placeOfBirth'),
    gender:v('gender'), religion:v('religion'), maritalStatus:v('maritalStatus'), dependents:v('dependents'), dependentsDetail:v('dependentsDetail'),
    idType: window._idType || 'National ID', idNumber:v('idNumber'), idIssueDate:v('idIssueDate'), idExpiryDate:v('idExpiryDate'), idPlaceOfIssue:v('idPlaceOfIssue'),
    militaryStatus:v('militaryStatus'),
    mobile:v('mobile'), altPhone:v('altPhone'), email:v('email'), city:v('city'), country:v('country'), address:v('address'), governorate:v('governorate'),
    emergName:v('emergName'), emergRelation:v('emergRelation'), emergCountry:v('emergCountry'), emergCity:v('emergCity'), emergPhone:v('emergPhone'),
    langArabic:`Speak:${v('lang_Arabic_speak')} Read:${v('lang_Arabic_read')} Write:${v('lang_Arabic_write')}`,
    langKurdish:`Speak:${v('lang_Kurdish_speak')} Read:${v('lang_Kurdish_read')} Write:${v('lang_Kurdish_write')}`,
    langEnglish:`Speak:${v('lang_English_speak')} Read:${v('lang_English_read')} Write:${v('lang_English_write')}`,
    otherLanguage:v('otherLanguage'), otherLanguageLevel:v('otherLanguageLevel'),
    technicalSkills:v('technicalSkills'), computerSkills: computerSkills.join(', '), computerOther:v('computerOther'),
    careerExperienceYears:v('careerExperienceYears'),
    q_healthHistory:v('q_healthHistory'), healthHistoryDetail:v('healthHistoryDetail'), medicallyFit: document.getElementById('medicallyFit').checked,
    q_iraqIssue:v('q_iraqIssue'), iraqIssueDetail:v('iraqIssueDetail'),
    q_shifts:v('q_shifts'), q_car:v('q_car'), q_license:v('q_license'), q_relocate:v('q_relocate'),
    q_prevAsas:v('q_prevAsas'), prevAsasPosition:v('prevAsasPosition'), prevAsasPeriod:v('prevAsasPeriod'), prevAsasLocation:v('prevAsasLocation'),
    q_govt:v('q_govt'), govtPlace:v('govtPlace'),
    signature:v('signature'), signDate:v('signDate')
  };
  Object.entries(plain).forEach(([k,val])=>fd.append(k, val));
  fd.append('educationJSON', JSON.stringify(education));
  fd.append('jobsJSON', JSON.stringify(jobs));
  fd.append('coursesJSON', JSON.stringify(courses));
  fd.append('relativesJSON', JSON.stringify(relatives));
  if(cvFile) fd.append('cv', cvFile);
  const idFile = document.getElementById('idFile').files[0];
  if(idFile) fd.append('idDoc', idFile);
  const photoFile = document.getElementById('photoFile').files[0];
  if(photoFile) fd.append('photo', photoFile);

  try{
    const res = await fetch('/api/applications', { method:'POST', body: fd });
    const data = await res.json();
    if(!res.ok || !data.ok){ throw new Error(data.error || 'Submission failed'); }
    showConfirmation(data.ref);
  }catch(err){
    btn.disabled=false; btn.textContent='Submit Application';
    errBox.textContent = 'Something went wrong: ' + err.message;
    errBox.style.display='block';
  }
}

function showConfirmation(ref){
  document.getElementById('candidateView').innerHTML = `
    <div class="confirm">
      <div style="font-size:36px;">✓</div>
      <div style="font-weight:700; font-size:17px;">Application Received</div>
      <div class="ref">${ref}</div>
      <p>Thank you for applying to ASAS Global Aluminum Extrusion. Please keep this reference number for your records. Our HR team will contact you if your profile matches an open position.</p>
      <button class="nav-btn" style="background:var(--teal); border-color:var(--teal); color:#fff;" onclick="renderCandidateForm()">Submit Another Application</button>
    </div>`;
}

renderCandidateForm();
