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

    clearBtn.addEventListener('click', () => { input.value=''; results.innerHTML=''; });

    // Voice input
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const recog = new SR();
      recog.lang = 'en-US'; recog.continuous = false; recog.interimResults = false;
      voiceBtn.addEventListener('click', () => {
        try {
          recog.start();
          voiceBtn.classList.add('voice-active');
          voiceBtn.textContent = '🎙 Listening...';
        } catch(e) {}
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
      const text = input.value.trim().toLowerCase();
      results.innerHTML = '';
      if (!text) { alert('Please enter your symptoms.'); return; }
      loader.classList.remove('hidden');
      setTimeout(() => {
        loader.classList.add('hidden');
        renderResults(analyzeSymptoms(text));
      }, 1200);
    });

    function renderResults(items) {
      if (!items.length) {
        results.innerHTML = `<div class="result-card"><h3>No specific match</h3><p>We couldn't match your symptoms. Please consult a doctor for personalized advice.</p></div>`;
        return;
      }
      results.innerHTML = items.map(it => `
        <div class="result-card ${it.emergency ? 'emergency':''}">
          <h3>${it.title}</h3>
          ${it.message ? `<p>${it.message}</p>` : ''}
          ${it.suggestions ? `<p><strong>Possible causes:</strong></p><ul>${it.suggestions.map(s=>`<li>${s}</li>`).join('')}</ul>` : ''}
          ${it.precautions ? `<p><strong>Precautions:</strong></p><ul>${it.precautions.map(s=>`<li>${s}</li>`).join('')}</ul>` : ''}
          ${it.care ? `<p><strong>Home care:</strong></p><ul>${it.care.map(s=>`<li>${s}</li>`).join('')}</ul>` : ''}
        </div>
      `).join('');
    }
  }
});

// ===== Symptom analyzer =====
function analyzeSymptoms(text) {
  const emergency = ['chest pain','breathing difficulty','difficulty breathing','seizure','unconscious','unconsciousness','blood vomiting','vomiting blood'];
  for (const e of emergency) {
    if (text.includes(e)) {
      return [{
        emergency:true,
        title:'🚨 Emergency Warning',
        message:'Seek immediate medical attention and contact a healthcare professional.'
      }];
    }
  }

  const db = {
    'fever': {
      title:'Fever',
      suggestions:['Viral infection','Flu','Common infection'],
      precautions:['Rest well','Avoid cold exposure','Monitor temperature regularly'],
      care:['Drink plenty of fluids','Take a lukewarm sponge bath','Use paracetamol if needed']
    },
    'cough': {
      title:'Cough',
      suggestions:['Common cold','Throat irritation','Bronchitis'],
      precautions:['Avoid cold drinks','Cover mouth while coughing'],
      care:['Drink warm water with honey','Steam inhalation','Ginger tea']
    },
    'cold': {
      title:'Cold',
      suggestions:['Viral rhinitis','Seasonal allergy'],
      precautions:['Keep warm','Avoid dust and pollen'],
      care:['Steam inhalation','Warm soups','Adequate rest']
    },
    'headache': {
      title:'Headache',
      suggestions:['Tension','Migraine','Dehydration','Eye strain'],
      precautions:['Reduce screen time','Avoid loud noise'],
      care:['Drink water','Rest in a dark quiet room','Gentle head massage']
    },
    'sore throat': {
      title:'Sore Throat',
      suggestions:['Throat infection','Tonsillitis','Viral pharyngitis'],
      precautions:['Avoid cold foods','Don\'t strain voice'],
      care:['Warm saltwater gargle','Honey with warm water','Lozenges']
    },
    'weakness': {
      title:'Weakness',
      suggestions:['Fatigue','Low blood sugar','Anemia','Dehydration'],
      precautions:['Avoid overexertion','Maintain regular meals'],
      care:['Eat balanced diet','Hydrate well','Rest adequately']
    },
    'stomach pain': {
      title:'Stomach Pain',
      suggestions:['Indigestion','Gas','Gastritis','Food poisoning'],
      precautions:['Avoid spicy/oily food','Don\'t skip meals'],
      care:['Drink warm water','Eat light meals','Try ginger or peppermint tea']
    },
    'body pain': {
      title:'Body Pain',
      suggestions:['Viral infection','Fatigue','Muscle strain'],
      precautions:['Avoid heavy work','Stay warm'],
      care:['Warm bath','Adequate rest','Light stretching']
    }
  };

  const found = [];
  for (const key in db) {
    if (text.includes(key)) found.push(db[key]);
  }
  return found;
}
