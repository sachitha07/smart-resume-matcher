/* Smart Resume Matcher — Frontend JS */

const uploadZone  = document.getElementById('uploadZone');
const resumeFile  = document.getElementById('resumeFile');
const browseBtn   = document.getElementById('browseBtn');
const fileBadge   = document.getElementById('fileBadge');
const fileName    = document.getElementById('fileName');
const removeFile  = document.getElementById('removeFile');
const jobDesc     = document.getElementById('jobDesc');
const charCount   = document.getElementById('charCount');
const matchBtn    = document.getElementById('matchBtn');
const errorBox    = document.getElementById('errorBox');
const idleState   = document.getElementById('idleState');
const resultsContent = document.getElementById('resultsContent');

// ── File upload handling ──────────────────────

browseBtn.addEventListener('click', () => resumeFile.click());
uploadZone.addEventListener('click', (e) => {
  if (e.target !== browseBtn && !fileBadge.contains(e.target)) resumeFile.click();
});

resumeFile.addEventListener('change', () => {
  const f = resumeFile.files[0];
  if (f) showFile(f.name);
});

removeFile.addEventListener('click', (e) => {
  e.stopPropagation();
  resumeFile.value = '';
  fileBadge.style.display = 'none';
  document.querySelector('.upload-icon').style.display = '';
  document.querySelector('.upload-primary').style.display = '';
  document.querySelector('.upload-secondary').style.display = '';
});

uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('dragover'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  const f = e.dataTransfer.files[0];
  if (f && f.name.endsWith('.pdf')) {
    const dt = new DataTransfer();
    dt.items.add(f);
    resumeFile.files = dt.files;
    showFile(f.name);
  } else {
    showError('Please drop a PDF file.');
  }
});

function showFile(name) {
  fileName.textContent = name.length > 28 ? name.slice(0, 25) + '…' : name;
  fileBadge.style.display = 'inline-flex';
  document.querySelector('.upload-icon').style.display = 'none';
  document.querySelector('.upload-primary').style.display = 'none';
  document.querySelector('.upload-secondary').style.display = 'none';
}

// ── Char counter ──────────────────────────────

jobDesc.addEventListener('input', () => {
  const len = jobDesc.value.length;
  charCount.textContent = len.toLocaleString() + ' character' + (len !== 1 ? 's' : '');
});

// ── Match button ──────────────────────────────

matchBtn.addEventListener('click', async () => {
  hideError();

  const file = resumeFile.files[0];
  const jd   = jobDesc.value.trim();

  if (!file)  return showError('Please upload a PDF resume first.');
  if (!jd)    return showError('Please paste a job description.');
  if (jd.length < 50) return showError('Job description seems too short. Please add more detail.');

  // Loading state
  matchBtn.disabled = true;
  matchBtn.classList.add('loading');

  const formData = new FormData();
  formData.append('resume', file);
  formData.append('job_description', jd);

  try {
    const res  = await fetch('/match', { method: 'POST', body: formData });
    const data = await res.json();

    if (!res.ok) {
      showError(data.error || 'Something went wrong. Please try again.');
      return;
    }

    renderResults(data);

  } catch (err) {
    showError('Network error — make sure the Flask server is running.');
  } finally {
    matchBtn.disabled = false;
    matchBtn.classList.remove('loading');
  }
});

// ── Render results ────────────────────────────

function renderResults(data) {
  idleState.style.display = 'none';
  resultsContent.style.display = 'block';

  // Score ring
  const score = data.score;
  const circumference = 314;
  const offset = circumference - (score / 100) * circumference;

  // Ensure SVG gradient is defined
  ensureRingGradient();

  const ring = document.getElementById('ringFill');
  ring.style.strokeDashoffset = circumference; // reset
  setTimeout(() => { ring.style.strokeDashoffset = offset; }, 50);

  // Animate number
  animateNumber('scoreValue', 0, score, 1000);

  // Verdict
  const verdict = document.getElementById('scoreVerdict');
  if (score >= 80) {
    verdict.textContent = '🎉 Excellent Match!';
    verdict.style.color = 'var(--green)';
  } else if (score >= 60) {
    verdict.textContent = '👍 Good Match';
    verdict.style.color = 'var(--accent3)';
  } else if (score >= 40) {
    verdict.textContent = '⚠️ Moderate Match';
    verdict.style.color = 'var(--yellow)';
  } else {
    verdict.textContent = '❌ Low Match';
    verdict.style.color = 'var(--red)';
  }

  // Meta pills
  document.getElementById('metaResume').textContent = `📄 Resume: ${data.resume_word_count} words`;
  document.getElementById('metaJD').textContent     = `📋 JD: ${data.jd_word_count} words`;

  // Matched skills
  renderChips('matchedSkills', 'matchedCount', 'matchedEmpty', data.matched_skills, 'chip-green');
  renderChips('missingSkills', 'missingCount', 'missingEmpty', data.missing_skills, 'chip-red');

  // Tips
  renderTips(score, data.missing_skills);
}

function renderChips(containerId, countId, emptyId, skills, chipClass) {
  const container = document.getElementById(containerId);
  const countEl   = document.getElementById(countId);
  const emptyEl   = document.getElementById(emptyId);

  container.innerHTML = '';
  countEl.textContent = skills.length;

  if (skills.length === 0) {
    emptyEl.style.display = 'block';
  } else {
    emptyEl.style.display = 'none';
    skills.forEach((skill, i) => {
      const chip = document.createElement('span');
      chip.className = `chip ${chipClass}`;
      chip.style.animationDelay = `${i * 40}ms`;
      chip.textContent = skill;
      container.appendChild(chip);
    });
  }
}

function renderTips(score, missingSkills) {
  const tips = document.getElementById('tipsCard');
  let html = '<div class="tip-title">💡 Next Steps</div>';

  if (score >= 80) {
    html += 'Your resume is a strong match for this role. Make sure to <strong>tailor your summary</strong> to echo the exact language used in the job description before applying.';
  } else if (score >= 60) {
    html += 'Good alignment! Consider adding <strong>specific metrics and achievements</strong> to strengthen your application. ';
    if (missingSkills.length > 0) {
      html += `You could highlight experience with: <strong>${missingSkills.slice(0, 3).join(', ')}</strong>.`;
    }
  } else if (score >= 40) {
    html += 'Your resume needs work before applying. ';
    if (missingSkills.length > 0) {
      html += `Focus on adding relevant experience for: <strong>${missingSkills.slice(0, 4).join(', ')}</strong>. `;
    }
    html += 'Consider including a <strong>skills section</strong> that mirrors the job description keywords.';
  } else {
    html += 'This role may require significant skill development. ';
    if (missingSkills.length > 0) {
      html += `Key gaps include: <strong>${missingSkills.slice(0, 5).join(', ')}</strong>. `;
    }
    html += 'Look for <strong>entry-level roles or courses</strong> to build these skills first.';
  }

  tips.innerHTML = html;
}

function animateNumber(elId, from, to, duration) {
  const el  = document.getElementById(elId);
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(from + (to - from) * eased);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function ensureRingGradient() {
  const svg = document.querySelector('.score-ring');
  if (svg.querySelector('#ringGrad')) return;
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#818cf8"/>
      <stop offset="100%" stop-color="#4f46e5"/>
    </linearGradient>`;
  svg.prepend(defs);
}

function showError(msg) {
  errorBox.textContent = '⚠ ' + msg;
  errorBox.style.display = 'block';
}
function hideError() {
  errorBox.style.display = 'none';
}
