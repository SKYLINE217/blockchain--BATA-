const baseUrl = '';

function getEl(id) { return document.getElementById(id); }
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function fmtDate(ts) {
  if (ts == null) return '-';
  const d = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts);
  return d.toLocaleString();
}
function truncateHash(h, len = 12) {
  if (!h) return '-';
  return `${h.slice(0, len)}…${h.slice(-len)}`;
}
function showHTML(id, html) {
  const el = getEl(id);
  if (el) el.innerHTML = html;
}
function showText(id, text) {
  const el = getEl(id);
  if (el) el.textContent = text;
}

function renderKV(obj) {
  if (!obj || typeof obj !== 'object') return `<div class="muted">No data</div>`;
  const rows = Object.entries(obj).map(([k, v]) => {
    const val = typeof v === 'object' ? escapeHtml(JSON.stringify(v)) : escapeHtml(String(v));
    return `<tr><th class="nowrap">${escapeHtml(k)}</th><td class="mono">${val}</td></tr>`;
  }).join('');
  return `<div class="scroll-x"><table class="table">${rows}</table></div>`;
}

function renderInfo(data) {
  return renderKV(data);
}
function renderVerify(data) {
  return renderKV(data);
}
function renderChain(data) {
  if (!data || !Array.isArray(data.chain)) return `<div class="muted">No chain data</div>`;
  const rows = data.chain.map((b, idx) => {
    const sr = b.student_record || {};
    const sid = sr.student_id || '-';
    const type = sr.type || sr.credential_type || '-';
    const ts = fmtDate(b.timestamp);
    const hh = truncateHash(b.hash);
    return `<tr>
      <td class="mono">${idx}</td>
      <td>${escapeHtml(sid)}</td>
      <td><span class="badge">${escapeHtml(type)}</span></td>
      <td class="nowrap">${escapeHtml(ts)}</td>
      <td class="mono hash">${escapeHtml(hh)}</td>
    </tr>`;
  }).join('');
  return `<div class="muted">Length: ${data.length}</div>
    <div class="scroll-x"><table class="table">
      <thead><tr><th>#</th><th>Student</th><th>Type</th><th>Timestamp</th><th>Hash</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}

function summarizeRecord(sr) {
  if (!sr || typeof sr !== 'object') return '-';
  const type = sr.type || sr.credential_type || 'record';
  if (type === 'update') {
    const upd = sr.updated_data || {};
    const keys = Object.keys(upd);
    return keys.length ? `Updated: ${keys.join(', ')}` : 'Update';
  }
  if (type === 'degree') {
    const dn = sr.credential_data?.degree_name || 'Degree';
    const major = sr.credential_data?.major || '';
    const gpa = sr.credential_data?.gpa;
    return [dn, major && `(${major})`, gpa != null && `GPA ${gpa}`].filter(Boolean).join(' ');
  }
  if (type === 'transcript') {
    const sem = sr.credential_data?.semester || 'Transcript';
    const sgpa = sr.credential_data?.semester_gpa;
    return [sem, sgpa != null && `GPA ${sgpa}`].filter(Boolean).join(' ');
  }
  if (type === 'certificate') {
    const cn = sr.credential_data?.certificate_name || 'Certificate';
    const grade = sr.credential_data?.grade;
    return [cn, grade && `(${grade})`].filter(Boolean).join(' ');
  }
  // Fallback
  return type;
}

function renderHistory(data) {
  if (!data || !Array.isArray(data.history)) return `<div class="muted">No history</div>`;
  const rows = data.history.map((b, idx) => {
    const sr = b.student_record || {};
    const type = sr.type || sr.credential_type || '-';
    const ts = fmtDate(b.timestamp);
    const hh = b.hash || '-';
    const summary = summarizeRecord(sr);
    return `<tr>
      <td class="mono">${idx}</td>
      <td><span class="badge">${escapeHtml(type)}</span></td>
      <td>${escapeHtml(summary)}</td>
      <td class="nowrap">${escapeHtml(ts)}</td>
      <td class="mono hash">${escapeHtml(hh)}</td>
    </tr>`;
  }).join('');
  return `<div class="muted">Records: ${data.record_count}</div>
    <div class="scroll-x"><table class="table">
      <thead><tr><th>#</th><th>Type</th><th>Summary</th><th>Timestamp</th><th>Hash</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}

async function safeFetch(path, options = {}) {
  try {
    const res = await fetch(`${baseUrl}${path}`, options);
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      return { ok: res.ok, status: res.status, data: json };
    } catch (e) {
      return { ok: res.ok, status: res.status, data: text };
    }
  } catch (err) {
    return { ok: false, status: 0, data: String(err) };
  }
}

// Health
document.getElementById('btn-health')?.addEventListener('click', async () => {
  const r = await safeFetch('/health');
  showHTML('out-health', renderKV(r.data));
});

// Info
document.getElementById('btn-info')?.addEventListener('click', async () => {
  const r = await safeFetch('/blockchain/info');
  showHTML('out-info', renderInfo(r.data));
});

// Verify
document.getElementById('btn-verify')?.addEventListener('click', async () => {
  const r = await safeFetch('/blockchain/verify');
  showHTML('out-verify', renderVerify(r.data));
});

// Full chain
document.getElementById('btn-chain')?.addEventListener('click', async () => {
  const r = await safeFetch('/blockchain/chain');
  showHTML('out-chain', renderChain(r.data));
});

// Student history
document.getElementById('btn-history')?.addEventListener('click', async () => {
  const idEl = document.getElementById('history-student-id');
  const studentId = idEl?.value?.trim();
  if (!studentId) {
    showJSON('out-history', 'Please enter a student ID');
    return;
  }
  const r = await safeFetch(`/blockchain/student/${encodeURIComponent(studentId)}`);
  showHTML('out-history', renderHistory(r.data));
});

// Add credential
document.getElementById('btn-add')?.addEventListener('click', async () => {
  const studentId = document.getElementById('add-student-id')?.value?.trim();
  const credType = document.getElementById('add-credential-type')?.value?.trim();
  const credDataRaw = document.getElementById('add-credential-data')?.value?.trim();
  const issuer = document.getElementById('add-issuer')?.value?.trim();
  const issueDate = document.getElementById('add-issue-date')?.value?.trim();

  if (!studentId || !credType || !credDataRaw) {
    showJSON('out-add', 'Please fill student ID, credential type, and data JSON');
    return;
  }

  let credData;
  try {
    credData = JSON.parse(credDataRaw);
  } catch (e) {
    showJSON('out-add', `Invalid credential_data JSON: ${e}`);
    return;
  }

  const payload = {
    student_id: studentId,
    credential_type: credType,
    credential_data: credData,
  };
  if (issuer) payload.issuer = issuer;
  if (issueDate) payload.issue_date = issueDate;

  const r = await safeFetch('/blockchain/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const msg = r.ok ? `<div>Added block <span class="mono">#${r.data.block_index}</span> at ${fmtDate(r.data.timestamp)}<br/>Hash: <span class="mono hash">${truncateHash(r.data.block_hash)}</span></div>` : renderKV(r.data);
  showHTML('out-add', msg);
});

// Update record
document.getElementById('btn-update')?.addEventListener('click', async () => {
  const studentId = document.getElementById('upd-student-id')?.value?.trim();
  const updRaw = document.getElementById('upd-data')?.value?.trim();
  if (!studentId || !updRaw) {
    showJSON('out-update', 'Please fill student ID and updated data JSON');
    return;
  }

  let updatedData;
  try {
    updatedData = JSON.parse(updRaw);
  } catch (e) {
    showJSON('out-update', `Invalid updated_data JSON: ${e}`);
    return;
  }

  const payload = {
    student_id: studentId,
    updated_data: updatedData,
  };

  const r = await safeFetch('/blockchain/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const msg = r.ok ? `<div>Updated block <span class="mono">#${r.data.block_index}</span> at ${fmtDate(r.data.timestamp)}<br/>Hash: <span class="mono hash">${truncateHash(r.data.block_hash)}</span></div>` : renderKV(r.data);
  showHTML('out-update', msg);
});

// Auto-load health and info on page load
window.addEventListener('DOMContentLoaded', async () => {
  const h = await safeFetch('/health');
  showHTML('out-health', renderKV(h.data));
  const i = await safeFetch('/blockchain/info');
  showHTML('out-info', renderInfo(i.data));
});

document.getElementById('btn-hash-search')?.addEventListener('click', async () => {
  const hash = document.getElementById('hash-search-input')?.value?.trim() || '';
  const hashed_path = document.getElementById('hash-search-path')?.value?.trim() || 'data/students_hashed.csv';
  if (!hash) { showHTML('out-hash-search', '<div class="muted">Enter a hash</div>'); return; }
  const r = await safeFetch('/tools/find_student_by_hash', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hash, hashed_path }),
  });
  if (!r.ok) { showHTML('out-hash-search', renderKV(r.data)); return; }
  const d = r.data || {};
  if (d.found) {
    if (d.source === 'csv' && d.row) {
      const rows = Object.entries(d.row || {}).map(([k, v]) => `<tr><th class="nowrap">${escapeHtml(k)}</th><td class="mono">${escapeHtml(String(v))}</td></tr>`).join('');
      const html = `<div>
        <div><span class="badge badge-ok">Match (CSV)</span></div>
        <div class="scroll-x" style="margin-top:8px"><table class="table">${rows}</table></div>
      </div>`;
      showHTML('out-hash-search', html);
    } else if (d.source === 'blockchain' && d.block) {
      const b = d.block;
      const html = `<div>
        <div><span class="badge badge-ok">Match (Blockchain)</span></div>
        <div>Hash: <span class="mono hash">${escapeHtml(b.hash || '')}</span></div>
        <div class="muted">Timestamp: ${escapeHtml(fmtDate(b.timestamp || 0))}</div>
        <div style="margin-top:8px">${renderKV(b.student_record || {})}</div>
      </div>`;
      showHTML('out-hash-search', html);
    } else {
      showHTML('out-hash-search', renderKV(d));
    }
  } else {
    showHTML('out-hash-search', '<div class="muted">No data</div>');
  }
});

// CSV: Generate
document.getElementById('btn-gen')?.addEventListener('click', async () => {
  const count = parseInt(document.getElementById('gen-count')?.value || '50', 10);
  const path = document.getElementById('gen-path')?.value || 'data/students.csv';
  const r = await safeFetch('/tools/generate_csv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count, output_path: path }),
  });
  showHTML('out-gen', renderKV(r.data));
});

// CSV: Hash
document.getElementById('btn-hash')?.addEventListener('click', async () => {
  const input_path = document.getElementById('hash-in')?.value || 'data/students.csv';
  const output_path = document.getElementById('hash-out')?.value || 'data/students_hashed.csv';
  const r = await safeFetch('/tools/hash_csv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input_path, output_path }),
  });
  showHTML('out-hash', renderKV(r.data));
});

// CSV: Import
document.getElementById('btn-import')?.addEventListener('click', async () => {
  const input_path = document.getElementById('import-in')?.value || 'data/students.csv';
  const r = await safeFetch('/tools/import_csv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input_path }),
  });
  showHTML('out-import', renderKV(r.data));
  // Refresh info to reflect new chain length
  const i = await safeFetch('/blockchain/info');
  showHTML('out-info', renderInfo(i.data));
});

// Hash Verifier: Arbitrary content
document.getElementById('btn_verify_hash')?.addEventListener('click', async () => {
  const content = document.getElementById('hv_content')?.value || '';
  const expected_hash = document.getElementById('hv_expected')?.value?.trim() || undefined;
  const r = await safeFetch('/tools/verify_hash', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, expected_hash }),
  });
  if (!r.ok) { showHTML('hv_result', renderKV(r.data)); return; }
  const data = r.data || {};
  let badge;
  if (data.expected_hash) {
    badge = data.matches ? '<span class="badge badge-ok">Match</span>' : '<span class="badge badge-fail">Mismatch</span>';
  } else {
    badge = '<span class="badge">Computed</span>';
  }
  const html = `<div>
    <div>${badge}</div>
    <div>Computed: <span class="mono hash">${escapeHtml(data.computed_hash || '')}</span></div>
    ${data.expected_hash ? `<div>Expected: <span class="mono">${escapeHtml(data.expected_hash)}</span></div>` : ''}
  </div>`;
  showHTML('hv_result', html);
});

// Hash Verifier: CSV rows cross-check
document.getElementById('btn_verify_csv')?.addEventListener('click', async () => {
  const input_path = document.getElementById('hv_csv_input_path')?.value || 'data/students.csv';
  const hashed_path = document.getElementById('hv_csv_hashed_path')?.value || 'data/students_hashed.csv';
  const r = await safeFetch('/tools/verify_csv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input_path, hashed_path }),
  });
  if (!r.ok) { showHTML('hv_csv_result', renderKV(r.data)); return; }
  const d = r.data || {};
  const rows = (d.mismatches || []).map(m => `<tr>
    <td class="mono">${escapeHtml(String(m.row))}</td>
    <td>${escapeHtml(m.student_id || '-')}</td>
    <td class="mono">${escapeHtml(truncateHash(m.computed))}</td>
    <td class="mono">${escapeHtml(truncateHash(m.given))}</td>
  </tr>`).join('');
  const badge = (d.mismatches_count || 0) === 0 ? '<span class="badge badge-ok">All rows match</span>' : `<span class="badge badge-fail">${escapeHtml(String(d.mismatches_count))} mismatches</span>`;
  const html = `<div>
    <div>${badge}</div>
    <div class="muted">Total rows: ${escapeHtml(String(d.total || 0))}</div>
    <div class="scroll-x"><table class="table"><thead><tr><th>#</th><th>Student</th><th>Computed</th><th>Given</th></tr></thead><tbody>${rows}</tbody></table></div>
  </div>`;
  showHTML('hv_csv_result', html);
});

// Hash Verifier: Verify student row against expected hash
document.getElementById('btn_verify_student')?.addEventListener('click', async () => {
  const sid = document.getElementById('hv_sid')?.value?.trim() || '';
  const fn = document.getElementById('hv_fn')?.value?.trim() || '';
  const ln = document.getElementById('hv_ln')?.value?.trim() || '';
  const ctype = document.getElementById('hv_ctype')?.value?.trim() || '';
  const cdataRaw = document.getElementById('hv_cdata')?.value?.trim() || '';
  const issuer = document.getElementById('hv_issuer')?.value?.trim() || '';
  const date = document.getElementById('hv_date')?.value?.trim() || '';
  const expected_hash = document.getElementById('hv_expected2')?.value?.trim() || '';

  let cdata;
  try {
    cdata = cdataRaw ? JSON.parse(cdataRaw) : {};
  } catch (e) {
    showHTML('hv_student_result', renderKV({ error: `Invalid credential_data JSON: ${e}` }));
    return;
  }

  const row = {
    student_id: sid,
    first_name: fn,
    last_name: ln,
    credential_type: ctype,
    credential_data: cdataRaw ? JSON.stringify(cdata) : '',
    issuer: issuer,
    issue_date: date,
  };

  const r = await safeFetch('/tools/verify_student_hash', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ row, expected_hash }),
  });
  if (!r.ok) { showHTML('hv_student_result', renderKV(r.data)); return; }
  const d = r.data || {};
  const badge = d.matches ? '<span class="badge badge-ok">Match</span>' : '<span class="badge badge-fail">Wrong hash</span>';
  const rows = Object.entries(d.row || {}).map(([k, v]) => `<tr><th class="nowrap">${escapeHtml(k)}</th><td class="mono">${escapeHtml(String(v))}</td></tr>`).join('');
  const html = `<div>
    <div>${badge}</div>
    <div>Computed: <span class="mono hash">${escapeHtml(d.computed_hash || '')}</span></div>
    ${d.expected_hash ? `<div>Expected: <span class="mono">${escapeHtml(d.expected_hash)}</span></div>` : ''}
    <div class="scroll-x" style="margin-top:8px"><table class="table">${rows}</table></div>
  </div>`;
  showHTML('hv_student_result', html);
});

// Hash Verifier: Find student by hash from hashed CSV
document.getElementById('btn_find_by_hash')?.addEventListener('click', async () => {
  const hash = document.getElementById('hv_find_hash')?.value?.trim() || '';
  const hashed_path = document.getElementById('hv_find_path')?.value?.trim() || 'data/students_hashed.csv';
  const r = await safeFetch('/tools/find_student_by_hash', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hash, hashed_path }),
  });
  if (!r.ok) { showHTML('hv_find_result', renderKV(r.data)); return; }
  const d = r.data || {};
  if (d.found) {
    if (d.source === 'csv' && d.row) {
      const rows = Object.entries(d.row || {}).map(([k, v]) => `<tr><th class="nowrap">${escapeHtml(k)}</th><td class="mono">${escapeHtml(String(v))}</td></tr>`).join('');
      const html = `<div>
        <div><span class="badge badge-ok">Match (CSV)</span></div>
        <div class="scroll-x" style="margin-top:8px"><table class="table">${rows}</table></div>
      </div>`;
      showHTML('hv_find_result', html);
    } else if (d.source === 'blockchain' && d.block) {
      const b = d.block;
      const html = `<div>
        <div><span class="badge badge-ok">Match (Blockchain)</span></div>
        <div>Hash: <span class="mono hash">${escapeHtml(b.hash || '')}</span></div>
        <div class="muted">Timestamp: ${escapeHtml(fmtDate(b.timestamp || 0))}</div>
        <div style="margin-top:8px">${renderKV(b.student_record || {})}</div>
      </div>`;
      showHTML('hv_find_result', html);
    } else {
      showHTML('hv_find_result', renderKV(d));
    }
  } else {
    showHTML('hv_find_result', '<div class="muted">No data</div>');
  }
});
