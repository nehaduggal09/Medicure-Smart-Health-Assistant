// ===== Mobile nav toggle =====
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
  }

  // ===== Login page =====
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    const pwToggle = document.getElementById('pwToggle');
    const pw = document.getElementById('password');
    pwToggle.addEventListener('click', () => {
      pw.type = pw.type === 'password' ? 'text' : 'password';
      pwToggle.textContent = pw.type === 'password' ? '👁' : '🙈';
    });

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = pw.value.trim();
      const emailErr = document.getElementById('emailErr');
      const pwErr = document.getElementById('pwErr');
      emailErr.textContent = ''; pwErr.textContent = '';

      let valid = true;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) { emailErr.textContent = 'Please enter a valid email.'; valid = false; }
      if (password.length < 6) { pwErr.textContent = 'Password must be at least 6 characters.'; valid = false; }
      if (!valid) return;

      localStorage.setItem('medicure_logged_in', 'true');
      localStorage.setItem('medicure_email', email);
      window.location.href = 'symptom.html';
    });
  }

  // ===== Symptom page =====
  const analyzeBtn = document.getElementById('analyzeBtn');
  if (analyzeBtn) {
    if (localStorage.getItem('medicure_logged_in') !== 'true') {
      window.location.href = 'login.html';
      return;
    }

    const input = document.getElementById('symptomInput');
    const clearBtn = document.getElementById('clearBtn');
    const voiceBtn = document.getElementById('voiceBtn');
    const loader = document.getElementById('loader');
    const results = document.getElementById('results');
    const logoutBtn = document.getElementById('logoutBtn');

    logoutBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('medicure_logged_in');
      window.location.href = 'index.html';
    });

    clearBtn.addEventListener('click', () => { input.value = ''; results.innerHTML = ''; });

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const recog = new SR();
      recog.lang = 'en-IN'; recog.continuous = false; recog.interimResults = false;
      voiceBtn.addEventListener('click', () => {
        try {
          recog.start();
          voiceBtn.classList.add('voice-active');
          voiceBtn.textContent = '🎙 Listening...';
        } catch (e) {}
      });
      recog.onresult = (e) => {
        const txt = e.results[0][0].transcript;
        input.value = input.value ? input.value + ' ' + txt : txt;
      };
      recog.onend = () => { voiceBtn.classList.remove('voice-active'); voiceBtn.textContent = '🎙 Voice Input'; };
      recog.onerror = () => { voiceBtn.classList.remove('voice-active'); voiceBtn.textContent = '🎙 Voice Input'; };
    } else {
      voiceBtn.addEventListener('click', () => alert('Voice recognition not supported in this browser.'));
    }

    analyzeBtn.addEventListener('click', () => {
      const text = input.value.trim();
      results.innerHTML = '';
      if (!text) { alert('Please enter your symptoms.'); return; }
      loader.classList.remove('hidden');
      setTimeout(() => {
        loader.classList.add('hidden');
        renderResults(analyzeSymptoms(text));
      }, 1000);
    });

    function renderResults(items) {
      results.innerHTML = items.map(it => {
        const sev = (it.severity || '').toUpperCase();
        const sevBadge = sev ? `<span class="sev-badge sev-${sev.toLowerCase()}">${sev}</span>` : '';
        return `
        <div class="result-card glass ${it.emergency ? 'emergency' : ''} fade-in">
          <div class="result-head">
            <h3>${it.icon || '🩺'} ${it.title}</h3>
            ${sevBadge}
          </div>
          ${it.message ? `<p class="result-msg">${it.message}</p>` : ''}
          ${it.causes ? `<div class="result-section"><h4>🔎 Likely Causes</h4><ul>${it.causes.map(s => `<li>${s}</li>`).join('')}</ul></div>` : ''}
          ${it.suggestions ? `<div class="result-section"><h4>💡 Possible Health Suggestions</h4><ul>${it.suggestions.map(s => `<li>${s}</li>`).join('')}</ul></div>` : ''}
          ${it.precautions ? `<div class="result-section"><h4>🛡 General Precautions</h4><ul>${it.precautions.map(s => `<li>${s}</li>`).join('')}</ul></div>` : ''}
          ${it.care ? `<div class="result-section"><h4>🏠 Home Care Recommendations</h4><ul>${it.care.map(s => `<li>${s}</li>`).join('')}</ul></div>` : ''}
          ${it.doctor ? `<div class="result-section"><h4>👨‍⚕️ When to Consult a Doctor</h4><ul>${it.doctor.map(s => `<li>${s}</li>`).join('')}</ul></div>` : ''}
        </div>`;
      }).join('') + `<p class="disclaimer-note">⚠ This website provides general health information only and is not a substitute for professional medical advice.</p>`;
    }
  }
});

