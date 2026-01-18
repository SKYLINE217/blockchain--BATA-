const e = React.createElement;
function setThemeLight(on) { document.body.classList.toggle('light', !!on); }
function saveSession(user) { localStorage.setItem('acms_user', JSON.stringify(user || {})); }
function loadSession() { try { return JSON.parse(localStorage.getItem('acms_user')||'{}'); } catch(_) { return {}; } }
async function fetchJSON(url, opts) { const r = await fetch(url, opts); const ok = r.ok; let data; try { data = await r.json(); } catch(_) { data = null; } return { ok, data }; }
function Button(props) { return e('button', { onClick: props.onClick, style: props.style }, props.children); }
function Field(props) { return e('div', { className:'form-grid', style:{marginTop:8}}, [e('label',{htmlFor:props.id}, props.label), e('input',{id:props.id, type:props.type||'text', placeholder:props.placeholder||'', value:props.value||'', onChange:ev=>props.onChange?.(ev.target.value)})]); }
function HeaderBar(props) { return e('div',{className:'row', style:{justifyContent:'space-between', alignItems:'center'}}, [e('div',null, props.left||null), e('div',null, props.right||null)]); }
function ThemeToggle() { const [light,setLight]=React.useState(document.body.classList.contains('light')); return e('div',null, e(Button,{onClick:()=>{setThemeLight(!light); setLight(!light);}}, light?'Dark Mode':'Light Mode')); }
function RoleTag({role}) { const map={student:{emoji:'🎓',color:'#4da3ff'}, teacher:{emoji:'👨‍🏫',color:'#7bda91'}, employee:{emoji:'🧑‍💼',color:'#f6a623'}}; const m=map[role]||map.student; return e('span',{className:'pill', style:{background:'rgba(24,34,49,0.6)', borderColor:'var(--border)'}}, `${m.emoji} ${role[0].toUpperCase()+role.slice(1)}`); }
function RoleTab({role, active, onSelect}) { const map={student:{emoji:'🎓',color:'#4da3ff'}, teacher:{emoji:'👨‍🏫',color:'#7bda91'}, employee:{emoji:'🧑‍💼',color:'#f6a623'}}; const m=map[role]; const style={background: active?m.color:'var(--card)', color: active?'#02101f':'var(--text)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', cursor:'pointer', flex:1, textAlign:'center'}; return e('div',{style, onClick:()=>onSelect(role)}, `${m.emoji} ${role[0].toUpperCase()+role.slice(1)}`); }
function NavSidebar({items, active, onSelect, title}) { const list=items.map(it=>e('div',{key:it.key, className:`nav-item ${active===it.key?'active':''}`, onClick:()=>onSelect(it.key)}, it.label)); return e('aside',{className:'sidebar'}, [e('div',{className:'brand'}, title||'ACMS'), e('nav',{className:'nav'}, list)]); }
function Layout({sidebar, children}) { return e('div',{className:'layout'}, [sidebar, e('div',{className:'content'}, children)]); }
function Badge({type, children}) { const cls=type==='ok'?'badge badge-ok':type==='fail'?'badge badge-fail':'badge'; return e('span',{className:cls}, children); }
function Table({head, rows}) { return e('div',{className:'scroll-x'}, e('table',{className:'table'}, [head?e('thead',null, head):null, e('tbody',null, rows)])); }
function CredHint({role}) { return null; }
function RoleLogin() { const [role,setRole]=React.useState('student'); const [email,setEmail]=React.useState(''); const [password,setPassword]=React.useState(''); const [error,setError]=React.useState(''); const [loading,setLoading]=React.useState(false); const login=async()=>{ setLoading(true); setError(''); const r=await fetchJSON('/data/credentials'); setLoading(false); if(!r.ok||!r.data) { setError('Unable to load credentials'); return; } const emailNorm=(email||'').trim().toLowerCase(); const passNorm=(password||'').trim(); if(role==='student'){ const list=(r.data.students||[]); const found=list.find(u=> String(u.email||'').toLowerCase()===emailNorm && String(u.password||'')===passNorm); if(!found){ setError('Invalid email or password'); return; } const user={role, email:found.email, name:[found.first_name,found.last_name].filter(Boolean).join(' '), id:found.enrollment}; saveSession(user); window.location.href='/static/student.html'; return; } const list=(role==='teacher'?(r.data.teachers||[]):(r.data.employees||[])); const found=list.find(u=> String(u.email||'').toLowerCase()===emailNorm && String(u.password||'')===passNorm); if(!found) { setError('Invalid credentials'); return; } const user={role, email:found.email, name:found.name, id:found.id}; saveSession(user); const t={teacher:'/static/teacher.html', employee:'/static/employee.html'}; window.location.href=t[role]; }; const tabs=e('div',{className:'row', style:{gap:8, marginBottom:12}}, ['student','teacher','employee'].map(r=>e(RoleTab,{key:r, role:r, active:role===r, onSelect:setRole}))); const brand=e('div',{className:'brand-banner'}, [e('div',{className:'avatar'}, 'AC'), e('div',null,[e('h2',null,'Academic Credential Management System'), e('div',{className:'muted'}, 'Secure multi-role access')])]); const form=e('div',null,[Field({id:'email', label:'Email', value:email, onChange:setEmail, placeholder:`${role==='student'?'STU001@students.demo.edu':role==='teacher'?'teacher1@demo.com':'employee1@demo.com'}`}), Field({id:'password', label:'Password', type:'password', value:password, onChange:setPassword, placeholder:'Enter password'}), e('div',{style:{marginTop:6}}, e(CredHint,{role})), e('div',{className:'row',style:{marginTop:12}}, e(Button,{onClick:login, style:{minWidth:120}}, loading?'Signing in...':'Login'))]); const err=error?e('div',{className:'muted',style:{marginTop:8,color:'#f3a4a4'}}, error):null; return e('div',null,[brand, tabs, form, err]); }

function StudentCard({student}) {
  const fullName = [student.first_name, student.last_name].filter(Boolean).join(' ');
  const header = e('div',null,[e('h2',null, fullName || student.student_id), e('div',{className:'muted'}, `Enrollment: ${student.student_id}`)]);
  let det = student.credential_data || {};
  if (det && typeof det === 'object' && det.raw && typeof det.raw === 'string') {
    try { det = JSON.parse(det.raw); } catch(_) {}
  }
  const type = student.credential_type || '-';
  let body;
  if (type === 'degree') {
    body = e('div',null,[
      e('div',null, `Degree: ${det.degree_name||'-'}`),
      e('div',null, `Major: ${det.major||'-'}`),
      e('div',null, `Graduation Date: ${det.graduation_date||student.issue_date||'-'}`),
      e('div',null, `GPA: ${det.gpa!=null?det.gpa:'-'}`),
    ]);
  } else if (type === 'transcript') {
    const courses = Array.isArray(det.courses)?det.courses:[];
    body = e('div',null,[
      e('div',null, `Semester: ${det.semester||'-'}`),
      e('div',null, `Semester GPA: ${det.semester_gpa!=null?det.semester_gpa:'-'}`),
      e('div',{className:'scroll-x', style:{marginTop:8}}, e('table',{className:'table'}, [
        e('thead',null, e('tr',null,[e('th',null,'Course'), e('th',null,'Grade')])),
        e('tbody',null, courses.map((c,i)=>e('tr',{key:i}, [e('td',null,c.course||'-'), e('td',null,c.grade||'-')]))),
      ])),
    ]);
  } else if (type === 'certificate') {
    body = e('div',null,[
      e('div',null, `Certificate: ${det.certificate_name||'-'}`),
      e('div',null, `Grade: ${det.grade||'-'}`),
      e('div',null, `Instructor: ${det.instructor||'-'}`),
      e('div',null, `Completion Date: ${det.completion_date||student.issue_date||'-'}`),
    ]);
  } else {
    body = e('div',null,'No credential details');
  }
  const meta = e('div',{className:'muted', style:{marginTop:8}}, `Issued by ${student.issuer||'-'} on ${student.issue_date||'-'}`);
  return e('div',null,[header, e('div',{className:'card', style:{marginTop:12}}, body), meta]);
}

function StudentDetails({history}) {
  const blocks = Array.isArray(history)?history:[];
  const latestBase = blocks.find(b=>b.student_record && b.student_record.type!=='update');
  const base = latestBase?latestBase.student_record:{};
  const initials = [base?.first_name, base?.last_name].filter(Boolean).map(s=>s[0]).join('').slice(0,2).toUpperCase() || 'ST';
  const items = blocks.filter(b=>{
    const sr=b.student_record||{}; return (sr.type!=='update');
  }).map((b,idx)=>{
    const sr=b.student_record||{}; let det=sr.credential_data||{}; if(det && typeof det==='object' && det.raw){ try{ det=JSON.parse(det.raw);}catch(_){} }
    const type=sr.credential_type||sr.type||'-';
    const title = type==='degree'?'Degree': type==='transcript'?'Transcript': type==='certificate'?'Certificate':'Record';
    let body;
    if(type==='degree'){
      body = e('div',null,[
        e('div',null, `Degree: ${det.degree_name||'-'}`),
        e('div',null, `Major: ${det.major||'-'}`),
        e('div',null, `Graduation Date: ${det.graduation_date||sr.issue_date||'-'}`),
        e('div',null, `GPA: ${det.gpa!=null?det.gpa:'-'}`),
      ]);
    } else if(type==='transcript'){
      const courses = Array.isArray(det.courses)?det.courses:[];
      body = e('div',null,[
        e('div',null, `Semester: ${det.semester||'-'}`),
        e('div',null, `Semester GPA: ${det.semester_gpa!=null?det.semester_gpa:'-'}`),
        e('div',{className:'scroll-x', style:{marginTop:8}}, e('table',{className:'table'}, [
          e('thead',null, e('tr',null,[e('th',null,'Course'), e('th',null,'Grade')])),
          e('tbody',null, courses.map((c,i)=>e('tr',{key:i}, [e('td',null,c.course||'-'), e('td',null,c.grade||'-')]))),
        ]))
      ]);
    } else if(type==='certificate'){
      body = e('div',null,[
        e('div',null, `Certificate: ${det.certificate_name||'-'}`),
        e('div',null, `Grade: ${det.grade||'-'}`),
        e('div',null, `Instructor: ${det.instructor||'-'}`),
        e('div',null, `Completion Date: ${det.completion_date||sr.issue_date||'-'}`),
      ]);
    } else {
      body = e('div',null,'No details');
    }
    return e('div',{key:idx, className:'card'}, [e('h3',null, title), body, e('div',{className:'muted',style:{marginTop:8}}, `Issued by ${sr.issuer||'-'} on ${sr.issue_date||'-'}`)]);
  });
  const sr = base||{}; const name=[sr?.first_name, sr?.last_name].filter(Boolean).join(' ');
  const header = e('div',{className:'hero-banner'}, [e('div',{className:'avatar'}, initials), e('div',null,[e('div',{style:{fontSize:'1.25rem', fontWeight:700}}, name || sr?.student_id || 'Student'), e('div',{className:'pill', style:{marginTop:6}}, `Enrollment: ${sr?.student_id || '-'}`)])]);
  return e('div',null,[header, e('div',{className:'grid', style:{marginTop:12}}, items)]);
}

function QRBox({value}) { const url=`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(value||'')}`; const img=e('img',{src:url, alt:'QR', style:{width:160,height:160,borderRadius:8,border:'1px solid var(--border)'}}); const dl=e('a',{href:url, download:'certificate-qr.png', style:{display:'inline-block',marginTop:8}}, 'Download'); return e('div',{className:'qr-box'}, [img, dl]); }
function VerifyPanel() { const [ok,setOk]=React.useState(null); React.useEffect(()=>{ (async()=>{ const r=await fetchJSON('/blockchain/verify'); if(r.ok) setOk(!!r.data?.verification?.valid); })(); },[]); return e('div',null,[e('h3',null,'Verification'), ok===null?e('div',{className:'muted'},'Checking...'): ok?e(Badge,{type:'ok'},'Chain Valid'):e(Badge,{type:'fail'},'Chain Invalid')]); }
function StudentDashboard() { const user = loadSession(); const [history,setHistory] = React.useState(null); React.useEffect(()=>{ (async()=>{ if(user.id) { const r=await fetch(`/blockchain/student/${encodeURIComponent(user.id)}`); if(r.ok){ const d=await r.json(); setHistory(d.history||[]);} else { setHistory([]);} } })(); },[]); const latest = Array.isArray(history)&&history.length? history[history.length-1] : null; const top=e(HeaderBar,{left:e('div',{className:'row',style:{gap:8}}, [e('div',null,'🎓 Student'), user?.name? e('span',{className:'pill'}, user.name):null]), right:e('div',{className:'row',style:{gap:8}}, [e(RoleTag,{role:'student'}), e(ThemeToggle), e(Button,{onClick:()=>{localStorage.removeItem('acms_user'); window.location.href='/static/login.html';}}, 'Logout')])}); const content = history? e('div',{className:'grid'}, [e('div',null, e(StudentDetails,{history})), e('div',null,[e('h3',null,'Certificate QR'), latest? e(QRBox,{value: latest.hash||''}) : e('div',{className:'muted'},'No certificate')]), e('div',null, e(VerifyPanel))]) : e('div',{className:'muted'}, 'Loading...'); return e('div',null,[top, content]); }

function ChainTableSimple() {
  const [chain,setChain]=React.useState(null);
  React.useEffect(()=>{ (async()=>{ const r=await fetchJSON('/blockchain/chain'); if(r.ok) setChain(r.data); })(); },[]);
  const rows=(chain?.chain||[]).map((b,idx)=>{ const sr=b.student_record||{}; const name=[sr.first_name,sr.last_name].filter(Boolean).join(' '); return e('tr',{key:idx}, [e('td',null, sr.student_id||'-'), e('td',null, name||'-'), e('td',null, e('span',{className:'badge'}, sr.credential_type||sr.type||'-')), e('td',{className:'nowrap'}, new Date((b.timestamp||0)*1000).toLocaleString())]); });
  return e('div',{className:'scroll-x'}, e('table',{className:'table'}, [e('thead',null, e('tr',null,[e('th',null,'Enrollment'), e('th',null,'Name'), e('th',null,'Type'), e('th',null,'Timestamp')])), e('tbody',null, rows)]));
}

function TeacherUpload() {
  const [out,setOut]=React.useState(null);
  const onUpload=async()=>{
    const fileInput=document.getElementById('teacher_csv');
    const f=fileInput?.files?.[0];
    if(!f) { setOut({error:'Select a CSV file'}); return; }
    const fd=new FormData(); fd.append('file', f);
    const r=await fetch('/teacher/upload',{method:'POST', body:fd}); const data=await r.json(); setOut(data);
  };
  return e('div',null,[
    e('h3',null,'Upload Student Records (CSV)'),
    e('div',{className:'form-grid'}, [e('label',{htmlFor:'teacher_csv'}, 'CSV File'), e('input',{id:'teacher_csv', type:'file', accept:'.csv'})]),
    e('div',{className:'row',style:{marginTop:8}}, e(Button,{onClick:onUpload}, 'Upload')),
    e('div',{className:'output',style:{marginTop:12}}, out?JSON.stringify(out):'')
  ]);
}

function VerifyForms() {
  const [enrollment,setEnrollment]=React.useState('');
  const [fn,setFn]=React.useState('');
  const [ln,setLn]=React.useState('');
  const [roll,setRoll]=React.useState('');
  const [resEnroll,setResEnroll]=React.useState(null);
  const [historyEnroll,setHistoryEnroll]=React.useState(null);
  const [currentEnroll,setCurrentEnroll]=React.useState(null);
  const [resNameRoll,setResNameRoll]=React.useState(null);
  const [historyNameRoll,setHistoryNameRoll]=React.useState(null);
  const [currentNameRoll,setCurrentNameRoll]=React.useState(null);
  const verifyEnrollment=async()=>{ if(!enrollment) { setResEnroll({error:'Enter enrollment number'}); setHistoryEnroll(null); setCurrentEnroll(null); return; } const r=await fetch(`/verify/enrollment/${encodeURIComponent(enrollment)}`); const d=await r.json(); setResEnroll(d); let cur=d && d.found? (d.student||{}) : null; if(cur && (!(cur.first_name)||!(cur.last_name))){ const creds=await fetchJSON('/data/credentials'); if(creds.ok){ const stu=(creds.data.students||[]).find(s=>s.enrollment===enrollment); if(stu){ cur.first_name=cur.first_name||stu.first_name; cur.last_name=cur.last_name||stu.last_name; } } } setCurrentEnroll(cur); if(d && d.found){ const h=await fetch(`/blockchain/student/${encodeURIComponent(enrollment)}`); const hd=await h.json(); setHistoryEnroll(hd.history||[]);} };
  const verifyNameRoll=async()=>{ if(!roll) { setResNameRoll({error:'Enter roll number'}); setHistoryNameRoll(null); setCurrentNameRoll(null); return; } const r=await fetch('/verify/name_roll',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({first_name:fn, last_name:ln, roll_no:roll})}); const d=await r.json(); setResNameRoll(d); let cur=d && d.found? (d.student||{}) : null; if(cur && (!(cur.first_name)||!(cur.last_name))){ const creds=await fetchJSON('/data/credentials'); if(creds.ok){ const stu=(creds.data.students||[]).find(s=>s.enrollment===roll); if(stu){ cur.first_name=cur.first_name||stu.first_name; cur.last_name=cur.last_name||stu.last_name; } } } setCurrentNameRoll(cur); if(d && d.found){ const h=await fetch(`/blockchain/student/${encodeURIComponent(roll)}`); const hd=await h.json(); setHistoryNameRoll(hd.history||[]);} };
  const showEnroll = historyEnroll ? e(StudentDetails,{history:historyEnroll}) : e('div',{className:'output'}, resEnroll?JSON.stringify(resEnroll):'');
  const showNameRoll = historyNameRoll ? e(StudentDetails,{history:historyNameRoll}) : e('div',{className:'output'}, resNameRoll?JSON.stringify(resNameRoll):'');
  return e('div',{className:'grid'}, [
    e('div',null,[e('h3',null,'Verify by Enrollment'), Field({id:'v_enroll', label:'Enrollment Number', value:enrollment, onChange:setEnrollment, placeholder:'STU001'}), e('div',{className:'row',style:{marginTop:8}}, e(Button,{onClick:verifyEnrollment}, 'Verify')), (currentEnroll? e('div',{className:'card', style:{marginTop:8}}, [ e('div',{className:'row',style:{justifyContent:'space-between'}}, [ e('div',null, e('strong',null, [currentEnroll.first_name,currentEnroll.last_name].filter(Boolean).join(' ')||currentEnroll.student_id||'-')), e('div',null, e('span',{className:'pill'}, currentEnroll.student_id||currentEnroll.roll_no||'-')) ]) ]) : null), e('div',{style:{marginTop:8}}, showEnroll)]),
    e('div',null,[e('h3',null,'Verify by Name + Roll No'), Field({id:'v_fn', label:'First Name', value:fn, onChange:setFn, placeholder:'Alex'}), Field({id:'v_ln', label:'Last Name', value:ln, onChange:setLn, placeholder:'Smith'}), Field({id:'v_roll', label:'Roll Number', value:roll, onChange:setRoll, placeholder:'STU001'}), e('div',{className:'row',style:{marginTop:8}}, e(Button,{onClick:verifyNameRoll}, 'Verify')), (currentNameRoll? e('div',{className:'card', style:{marginTop:8}}, [ e('div',{className:'row',style:{justifyContent:'space-between'}}, [ e('div',null, e('strong',null, [currentNameRoll.first_name,currentNameRoll.last_name].filter(Boolean).join(' ')||currentNameRoll.student_id||'-')), e('div',null, e('span',{className:'pill'}, currentNameRoll.student_id||currentNameRoll.roll_no||'-')) ]) ]) : null), e('div',{style:{marginTop:8}}, showNameRoll)])
  ]);
}

function StudentOverview({current, history}) { const sr=current||{}; const initials=[sr.first_name,sr.last_name].filter(Boolean).map(s=>s[0]).join('').slice(0,2).toUpperCase()||'ST'; const name=[sr.first_name,sr.last_name].filter(Boolean).join(' ')||sr.student_id||'Student'; const hero=e('div',{className:'hero-banner'}, [e('div',{className:'avatar'}, initials), e('div',null,[e('div',{style:{fontSize:'1.25rem',fontWeight:700}}, name), e('div',{className:'pill',style:{marginTop:6}}, `Enrollment: ${sr.student_id||sr.roll_no||'-'}`)])]); const profileRows=[[ 'First Name', sr.first_name||'-'],['Last Name', sr.last_name||'-'],['Enrollment', sr.student_id||sr.roll_no||'-'],['Issuer', sr.issuer||'-'],['Issue Date', sr.issue_date||'-'],['Credential Type', sr.credential_type||sr.type||'-']].map((kv,i)=> e('tr',{key:i}, [e('th',null,kv[0]), e('td',null,String(kv[1]))])); const profile=e('div',{className:'card'}, [e('h3',null,'Profile'), e('div',{className:'scroll-x'}, e('table',{className:'table'}, [e('tbody',null, profileRows)]))]); const blocks=Array.isArray(history)?history:[]; const items=blocks.filter(b=>{ const s=b.student_record||{}; return (s.type!=='update'); }).map((b,idx)=>{ const s=b.student_record||{}; let det=s.credential_data||{}; if(det && typeof det==='object' && det.raw){ try{ det=JSON.parse(det.raw);}catch(_){ } } const type=s.credential_type||s.type||'-'; const title=type==='degree'?'Degree': type==='transcript'?'Transcript': type==='certificate'?'Certificate':'Record'; let body; if(type==='degree'){ body=e('div',null,[ e('div',null,`Degree: ${det.degree_name||'-'}`), e('div',null,`Major: ${det.major||'-'}`), e('div',null,`Graduation Date: ${det.graduation_date||s.issue_date||'-'}`), e('div',null,`GPA: ${det.gpa!=null?det.gpa:'-'}`)]);} else if(type==='transcript'){ const courses=Array.isArray(det.courses)?det.courses:[]; body=e('div',null,[ e('div',null,`Semester: ${det.semester||'-'}`), e('div',null,`Semester GPA: ${det.semester_gpa!=null?det.semester_gpa:'-'}`), e('div',{className:'scroll-x',style:{marginTop:8}}, e('table',{className:'table'}, [ e('thead',null, e('tr',null,[e('th',null,'Course'), e('th',null,'Grade')])), e('tbody',null, courses.map((c,i)=> e('tr',{key:i}, [e('td',null,c.course||'-'), e('td',null,c.grade||'-')])))]))]); } else if(type==='certificate'){ body=e('div',null,[ e('div',null,`Certificate: ${det.certificate_name||'-'}`), e('div',null,`Grade: ${det.grade||'-'}`), e('div',null,`Instructor: ${det.instructor||'-'}`), e('div',null,`Completion Date: ${det.completion_date||s.issue_date||'-'}`)]);} else { body=e('div',null,'No details'); } return e('div',{key:idx, className:'card'}, [e('h3',null, title), body, e('div',{className:'muted',style:{marginTop:8}}, `Issued by ${s.issuer||'-'} on ${s.issue_date||'-'}`)]); }); const creds=e('div',null,[e('h3',null,'Credentials'), e('div',{className:'grid',style:{marginTop:8}}, items)]); return e('div',null,[hero, e('div',{className:'grid',style:{marginTop:12}}, [profile, creds])]); }

function VerifyEnrollmentDetailed() { const [enrollment,setEnrollment]=React.useState(''); const [current,setCurrent]=React.useState(null); const [history,setHistory]=React.useState(null); const [error,setError]=React.useState(''); const verify=async()=>{ setError(''); if(!enrollment){ setError('Enter enrollment number'); setCurrent(null); setHistory(null); return; } const r=await fetch(`/verify/enrollment/${encodeURIComponent(enrollment)}`); const d=await r.json(); if(!r.ok || !d || !d.found){ setError('Student not found'); setCurrent(null); setHistory(null); return; } let cur=d.student||{}; if(!(cur.first_name)||!(cur.last_name)){ const creds=await fetchJSON('/data/credentials'); if(creds.ok){ const stu=(creds.data.students||[]).find(s=>s.enrollment===enrollment); if(stu){ cur.first_name=cur.first_name||stu.first_name; cur.last_name=cur.last_name||stu.last_name; } } } setCurrent(cur); const h=await fetch(`/blockchain/student/${encodeURIComponent(enrollment)}`); const hd=await h.json(); setHistory(hd.history||[]); }; return e('div',null,[ e('h3',null,'Verify by Enrollment'), Field({id:'v_enroll2', label:'Enrollment Number', value:enrollment, onChange:setEnrollment, placeholder:'STU001'}), e('div',{className:'row',style:{marginTop:8}}, e(Button,{onClick:verify}, 'Verify')), error? e('div',{className:'muted',style:{marginTop:8,color:'#f3a4a4'}}, error):null, (current? e('div',{className:'card', style:{marginTop:8}}, [ e('div',{className:'row',style:{justifyContent:'space-between'}}, [ e('div',null, e('strong',null, [current.first_name,current.last_name].filter(Boolean).join(' ')||current.student_id||'-')), e('div',null, e('span',{className:'pill'}, current.student_id||current.roll_no||'-')) ]) ]) : null), current&&history? e('div',{style:{marginTop:12}}, e(StudentOverview,{current, history})) : null ]); }

function StudentList() { const [list,setList]=React.useState([]); React.useEffect(()=>{ (async()=>{ const r=await fetchJSON('/blockchain/chain'); if(r.ok){ const chain=r.data?.chain||[]; const map={}; chain.forEach(b=>{ const sr=b.student_record||{}; const id=sr.student_id; if(!id) return; const isUpdate=(sr.type==='update' || sr.credential_type==='update'); if(!isUpdate){ map[id]={ id, first_name:sr.first_name, last_name:sr.last_name, type:sr.credential_type||sr.type, issue_date:sr.issue_date, issuer:sr.issuer, hash:b.hash, timestamp:b.timestamp }; } }); setList(Object.values(map)); } })(); },[]); const head=e('tr',null,[e('th',null,'Enrollment'), e('th',null,'Name'), e('th',null,'Type'), e('th',null,'Issued'), e('th',null,'Actions')]); const rows=list.map((s,i)=> e('tr',{key:i}, [e('td',null,s.id), e('td',null,[s.first_name,s.last_name].filter(Boolean).join(' ')||'-'), e('td',null,e('span',{className:'badge'}, s.type||'-')), e('td',null, new Date((s.timestamp||0)*1000).toLocaleString()), e('td',null, e(Button,{onClick:()=>window.dispatchEvent(new CustomEvent('edit_student',{detail:s}))}, 'Edit'))])); return e('div',null,[e('h3',null,'Students'), e(Table,{head, rows})]); }
function EditPanel() { const [data,setData]=React.useState(null); React.useEffect(()=>{ const onEdit=ev=>setData(ev.detail); window.addEventListener('edit_student', onEdit); return ()=>window.removeEventListener('edit_student', onEdit); },[]); const [fn,setFn]=React.useState(''); const [ln,setLn]=React.useState(''); const [raw,setRaw]=React.useState(''); React.useEffect(()=>{ if(data){ setFn(data.first_name||''); setLn(data.last_name||''); setRaw(''); } },[data]); const submit=async()=>{ if(!data) return; const upd={}; if(fn) upd.first_name=fn; if(ln) upd.last_name=ln; if(raw) { try { const j=JSON.parse(raw); upd.updated_fields=j; } catch(_) {} } const r=await fetchJSON('/blockchain/update',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({student_id:data.id, updated_data:upd})}); }; if(!data) return e('div',{className:'muted'},'Select a student to edit'); return e('div',null,[e('h3',null,`Edit ${data.id}`), Field({id:'ed_fn', label:'First Name', value:fn, onChange:setFn, placeholder:'First name'}), Field({id:'ed_ln', label:'Last Name', value:ln, onChange:setLn, placeholder:'Last name'}), Field({id:'ed_raw', label:'Extra Updates (JSON)', value:raw, onChange:setRaw, placeholder:'{"certificate_status":"Updated"}'}), e('div',{className:'row',style:{marginTop:8}}, e(Button,{onClick:submit}, 'Save'))]); }
function TeacherDashboard() { const [tab,setTab]=React.useState('dashboard'); const sidebar=e(NavSidebar,{title:'Teacher', items:[{key:'dashboard',label:'Dashboard'},{key:'students',label:'Student Management'},{key:'profile',label:'Profile'},{key:'logout',label:'Logout'}], active:tab, onSelect:(k)=>{ if(k==='logout'){ localStorage.removeItem('acms_user'); window.location.href='/static/login.html'; return;} setTab(k);} }); const content = tab==='dashboard'? e('div',{className:'grid'}, [e(VerifyEnrollmentDetailed), e('div',null, e(ChainTableSimple))]) : tab==='students'? e('div',{className:'grid'}, [e(StudentList), e(EditPanel)]) : e('div',null, e('div',{className:'muted'}, 'Signed in')); return e(Layout,{sidebar}, content); }

function CreateRecordForm() { const [sid,setSid]=React.useState(''); const [fn,setFn]=React.useState(''); const [ln,setLn]=React.useState(''); const [type,setType]=React.useState('degree'); const [dataRaw,setDataRaw]=React.useState(''); const [issuer,setIssuer]=React.useState('University System'); const [date,setDate]=React.useState(''); const [out,setOut]=React.useState(null); const submit=async()=>{ let credData={}; try{ credData=dataRaw?JSON.parse(dataRaw):{} }catch(e){ setOut({error:String(e)}); return; } const payload={student_id:sid, first_name:fn||undefined, last_name:ln||undefined, credential_type:type, credential_data:credData, issuer:issuer||undefined, issue_date:date||undefined}; const r=await fetch('/blockchain/add',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)}); const d=await r.json(); setOut(d); }; return e('div',null,[e('h3',null,'Create Record'), Field({id:'cr_sid', label:'Enrollment', value:sid, onChange:setSid, placeholder:'STU001'}), Field({id:'cr_fn', label:'First Name', value:fn, onChange:setFn, placeholder:'Alex'}), Field({id:'cr_ln', label:'Last Name', value:ln, onChange:setLn, placeholder:'Smith'}), Field({id:'cr_type', label:'Type', value:type, onChange:setType, placeholder:'degree | transcript | certificate'}), Field({id:'cr_data', label:'Data (JSON)', value:dataRaw, onChange:setDataRaw, placeholder:'{"degree_name":"BSc"}' }), Field({id:'cr_issuer', label:'Issuer', value:issuer, onChange:setIssuer, placeholder:'University System'}), Field({id:'cr_date', label:'Issue Date', value:date, onChange:setDate, placeholder:'YYYY-MM-DD'}), e('div',{className:'row',style:{marginTop:8}}, e(Button,{onClick:submit}, 'Create')), e('div',{className:'output',style:{marginTop:12}}, out?JSON.stringify(out):'')]); }
function CSVUpload() { return e('div',null,[e('h3',null,'Bulk Create (CSV)'), e('div',{className:'form-grid'}, [e('label',{htmlFor:'emp_csv'}, 'CSV File'), e('input',{id:'emp_csv', type:'file', accept:'.csv'})]), e('div',{className:'row',style:{marginTop:8}}, e(Button,{onClick:async()=>{ const f=document.getElementById('emp_csv')?.files?.[0]; if(!f) return; const fd=new FormData(); fd.append('file', f); const r=await fetch('/teacher/upload',{method:'POST', body:fd}); const d=await r.json(); const el=document.getElementById('emp_csv_out'); if(el) el.textContent=JSON.stringify(d); }}, 'Upload')), e('div',{id:'emp_csv_out', className:'output', style:{marginTop:12}})]); }
function EmployeeDashboard() { const [tab,setTab]=React.useState('create'); const sidebar=e(NavSidebar,{title:'Employee', items:[{key:'create',label:'Create Record'},{key:'records',label:'View Records'},{key:'verify',label:'Verify Credentials'},{key:'logout',label:'Logout'}], active:tab, onSelect:(k)=>{ if(k==='logout'){ localStorage.removeItem('acms_user'); window.location.href='/static/login.html'; return;} setTab(k);} }); const content = tab==='create'? e('div',{className:'grid'}, [e(CreateRecordForm), e(CSVUpload)]) : tab==='records'? e('div',null, e(ChainTableSimple)) : e('div',null, e(VerifyEnrollmentDetailed)); return e(Layout,{sidebar}, content); }

function mount(id, comp) { const el=document.getElementById(id); if(el) ReactDOM.createRoot(el).render(e(comp)); }
document.addEventListener('DOMContentLoaded', ()=>{ if(document.getElementById('app-login')) mount('app-login', RoleLogin); if(document.getElementById('app-student')) mount('app-student', StudentDashboard); if(document.getElementById('app-teacher')) mount('app-teacher', TeacherDashboard); if(document.getElementById('app-employee')) mount('app-employee', EmployeeDashboard); });
