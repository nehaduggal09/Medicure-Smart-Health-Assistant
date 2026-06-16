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
      results.innerHTML = items.map(it => `
        <div class="result-card ${it.emergency ? 'emergency' : ''} fade-in">
          <h3>${it.icon || '🩺'} ${it.title}</h3>
          ${it.message ? `<p class="result-msg">${it.message}</p>` : ''}
          ${it.suggestions ? `<div class="result-section"><h4>💡 Possible Health Suggestions</h4><ul>${it.suggestions.map(s => `<li>${s}</li>`).join('')}</ul></div>` : ''}
          ${it.precautions ? `<div class="result-section"><h4>🛡 Precautions</h4><ul>${it.precautions.map(s => `<li>${s}</li>`).join('')}</ul></div>` : ''}
          ${it.care ? `<div class="result-section"><h4>🏠 Home Care Recommendations</h4><ul>${it.care.map(s => `<li>${s}</li>`).join('')}</ul></div>` : ''}
          ${it.doctor ? `<div class="result-section"><h4>👨‍⚕️ When to Consult a Doctor</h4><ul>${it.doctor.map(s => `<li>${s}</li>`).join('')}</ul></div>` : ''}
        </div>
      `).join('');
    }
  }
});

// ===== Symptom analyzer (multilingual: English / Hindi / Hinglish) =====
function analyzeSymptoms(rawText) {
  const text = ' ' + rawText.toLowerCase().replace(/[.,!?;:()]/g, ' ').replace(/\s+/g, ' ') + ' ';

  const has = (arr) => arr.some(k => text.includes(' ' + k + ' ') || text.includes(k));

  // Emergency conditions first
  const emergencyChecks = [
    { keys: ['severe chest pain', 'heart attack', 'dil ka daura', 'chhati me tez dard', 'chest me tez dard', 'seene me tez dard'], label: 'Severe chest pain / possible heart attack' },
    { keys: ['unconscious', 'unconsciousness', 'behosh', 'behoshi', 'faint ho gaya'], label: 'Unconsciousness' },
    { keys: ['seizure', 'fits', 'mirgi', 'daura'], label: 'Seizure / fits' },
    { keys: ['severe breathing', 'cannot breathe', 'saans nahi', 'saans band', 'dam ghut', 'breathless'], label: 'Severe breathing difficulty' },
    { keys: ['blood vomit', 'vomiting blood', 'khoon ki ulti', 'khoon wali ulti'], label: 'Blood vomiting' },
    { keys: ['stroke', 'paralysis', 'lakwa', 'mooh teda', 'face droop'], label: 'Stroke symptoms' },
    { keys: ['severe injury', 'heavy bleeding', 'bahut khoon', 'gambhir chot'], label: 'Severe injury / heavy bleeding' },
    { keys: ['very high fever', '105 fever', '104 fever', 'bahut tez bukhar', 'uncontrolled fever'], label: 'Dangerously high fever' },
    { keys: ['severe allergic', 'anaphylaxis', 'throat swelling', 'gala band', 'face swelling'], label: 'Severe allergic reaction' }
  ];
  const emergencies = emergencyChecks.filter(e => has(e.keys));
  if (emergencies.length) {
    return [{
      emergency: true,
      icon: '🚨',
      title: 'Emergency Warning',
      message: 'Detected: ' + emergencies.map(e => e.label).join(', ') + '. Seek immediate medical attention. Contact a healthcare professional or emergency services immediately.',
      doctor: ['Call emergency services (e.g. 102 / 108) right away', 'Do not drive yourself — get help', 'Stay calm and seated until help arrives']
    }];
  }

  // Condition database with multilingual keywords
  const conditions = [
    {
      keys: ['fever', 'bukhar', 'bukhaar', 'tap', 'jwar', 'temperature', 'tez body'],
      icon: '🌡', title: 'Fever',
      suggestions: ['Viral infection', 'Flu / influenza', 'Common bacterial infection'],
      precautions: ['Rest well', 'Avoid cold exposure', 'Monitor temperature every few hours'],
      care: ['Drink plenty of fluids (water, ORS, soup)', 'Lukewarm sponge bath', 'Paracetamol as per dosage'],
      doctor: ['Fever above 102°F for more than 2 days', 'Fever with rash, stiff neck, or confusion']
    },
    {
      keys: ['flu', 'influenza', 'mausami bukhar'],
      icon: '🤒', title: 'Flu / Influenza',
      suggestions: ['Seasonal influenza', 'Viral fever with body ache'],
      precautions: ['Isolate from others', 'Wear a mask', 'Wash hands often'],
      care: ['Rest, fluids, warm soups', 'Steam inhalation', 'Paracetamol for fever'],
      doctor: ['Breathing difficulty', 'Symptoms worsening after 3-4 days']
    },
    {
      keys: ['cough', 'khansi', 'khaansi', 'khasi', 'kaf'],
      icon: '😷', title: 'Cough',
      suggestions: ['Common cold', 'Throat irritation', 'Bronchitis', 'Allergy'],
      precautions: ['Avoid cold drinks', 'Cover mouth while coughing', 'Avoid dust'],
      care: ['Warm water with honey', 'Steam inhalation', 'Ginger / tulsi tea'],
      doctor: ['Cough lasting more than 2 weeks', 'Cough with blood']
    },
    {
      keys: ['cold', 'common cold', 'zukam', 'sardi', 'naak behna', 'running nose', 'runny nose', 'naak band'],
      icon: '🤧', title: 'Common Cold',
      suggestions: ['Viral rhinitis', 'Seasonal allergy'],
      precautions: ['Keep warm', 'Avoid dust and pollen', 'Wash hands frequently'],
      care: ['Steam inhalation', 'Warm soups', 'Adequate rest'],
      doctor: ['Symptoms persist beyond 10 days', 'High fever develops']
    },
    {
      keys: ['sore throat', 'gala kharab', 'gale me dard', 'gala dukh', 'throat pain', 'gale me khich'],
      icon: '🗣', title: 'Sore Throat',
      suggestions: ['Throat infection', 'Tonsillitis', 'Viral pharyngitis'],
      precautions: ['Avoid cold foods', "Don't strain voice", 'Avoid smoking'],
      care: ['Warm saltwater gargle', 'Honey with warm water', 'Lozenges'],
      doctor: ['Difficulty swallowing', 'High fever or pus on tonsils']
    },
    {
      keys: ['headache', 'sir dard', 'sar dard', 'sir me dard', 'sardard', 'head pain'],
      icon: '🤕', title: 'Headache',
      suggestions: ['Tension headache', 'Dehydration', 'Eye strain', 'Sinusitis'],
      precautions: ['Reduce screen time', 'Avoid loud noise', 'Stay hydrated'],
      care: ['Drink water', 'Rest in a dark, quiet room', 'Gentle head/neck massage'],
      doctor: ['Sudden severe headache', 'Headache with vision changes or vomiting']
    },
    {
      keys: ['migraine', 'adha sir dard', 'aadha sir dard'],
      icon: '🧠', title: 'Migraine',
      suggestions: ['Migraine attack', 'Cluster headache'],
      precautions: ['Identify triggers (light, food)', 'Maintain sleep schedule'],
      care: ['Dark, quiet room', 'Cold compress on forehead', 'Hydrate'],
      doctor: ['Frequent migraines', 'New neurological symptoms']
    },
    {
      keys: ['ear pain', 'kaan me dard', 'kaan dard', 'earache'],
      icon: '👂', title: 'Ear Pain',
      suggestions: ['Ear infection', 'Wax buildup', 'Sinus pressure'],
      precautions: ['Keep ears dry', 'Avoid inserting objects'],
      care: ['Warm compress', 'OTC pain reliever'],
      doctor: ['Discharge from ear', 'Hearing loss or high fever']
    },
    {
      keys: ['tooth pain', 'toothache', 'dant dard', 'daant me dard'],
      icon: '🦷', title: 'Tooth Pain',
      suggestions: ['Cavity', 'Gum infection', 'Tooth sensitivity'],
      precautions: ['Avoid very hot/cold food', 'Brush gently twice daily'],
      care: ['Warm saltwater rinse', 'Clove oil on affected area'],
      doctor: ['Severe pain or facial swelling', 'Persistent pain beyond 2 days']
    },
    {
      keys: ['neck pain', 'gardan dard', 'gardan me dard'],
      icon: '💆', title: 'Neck Pain',
      suggestions: ['Muscle strain', 'Poor posture', 'Cervical spondylosis'],
      precautions: ['Maintain good posture', 'Avoid heavy pillows'],
      care: ['Warm compress', 'Gentle stretching', 'Rest'],
      doctor: ['Pain radiating to arms', 'Numbness or weakness']
    },
    {
      keys: ['back pain', 'kamar dard', 'peeth dard', 'kamar me dard'],
      icon: '🧎', title: 'Back Pain',
      suggestions: ['Muscle strain', 'Poor posture', 'Disc issue'],
      precautions: ['Avoid heavy lifting', 'Sit with support'],
      care: ['Hot/cold compress', 'Gentle stretching', 'Rest'],
      doctor: ['Pain with numbness in legs', 'Loss of bladder control']
    },
    {
      keys: ['joint pain', 'jod dard', 'jodon me dard', 'arthritis'],
      icon: '🦴', title: 'Joint Pain',
      suggestions: ['Arthritis', 'Viral arthralgia', 'Overuse injury'],
      precautions: ['Avoid overexertion', 'Maintain healthy weight'],
      care: ['Warm compress', 'Gentle exercise', 'Anti-inflammatory diet'],
      doctor: ['Swollen red joints', 'Persistent pain limiting movement']
    },
    {
      keys: ['body pain', 'body ache', 'badan dard', 'sharir dard', 'pure body me dard'],
      icon: '💪', title: 'Body Pain',
      suggestions: ['Viral infection', 'Fatigue', 'Muscle strain', 'Dehydration'],
      precautions: ['Avoid heavy work', 'Stay warm and hydrated'],
      care: ['Warm bath', 'Adequate rest', 'Light stretching'],
      doctor: ['Pain with high fever', 'Severe weakness']
    },
    {
      keys: ['chest pain', 'chhati me dard', 'seene me dard', 'chest me dard'],
      icon: '❤️', title: 'Chest Pain',
      suggestions: ['Acidity / gas', 'Muscle strain', 'Possible cardiac cause'],
      precautions: ['Avoid heavy meals', 'Avoid smoking'],
      care: ['Rest', 'Sit upright', 'Avoid exertion'],
      doctor: ['ANY persistent chest pain — seek medical evaluation promptly', 'Pain with sweating, breathlessness — emergency']
    },
    {
      keys: ['stomach pain', 'pet dard', 'pet me dard', 'pet dukh', 'abdominal pain'],
      icon: '🤢', title: 'Stomach Pain',
      suggestions: ['Indigestion', 'Gas', 'Gastritis', 'Food poisoning'],
      precautions: ['Avoid spicy/oily food', "Don't skip meals"],
      care: ['Drink warm water', 'Eat light meals', 'Ginger or peppermint tea'],
      doctor: ['Severe or persistent pain', 'Pain with vomiting blood or black stools']
    },
    {
      keys: ['acidity', 'acid reflux', 'khatti dakar', 'jalan seene me', 'heartburn'],
      icon: '🔥', title: 'Acidity',
      suggestions: ['Acid reflux', 'GERD', 'Gastritis'],
      precautions: ['Avoid spicy/fried food', "Don't lie down right after eating"],
      care: ['Cold milk', 'Small frequent meals', 'Antacid if needed'],
      doctor: ['Frequent heartburn', 'Difficulty swallowing']
    },
    {
      keys: ['gas', 'bloating', 'gas ki problem', 'pet phulna', 'pet fulna'],
      icon: '💨', title: 'Gas / Bloating',
      suggestions: ['Indigestion', 'IBS', 'Food intolerance'],
      precautions: ['Eat slowly', 'Avoid carbonated drinks'],
      care: ['Ajwain / fennel water', 'Walk after meals', 'Warm water'],
      doctor: ['Persistent bloating', 'Severe pain with bloating']
    },
    {
      keys: ['indigestion', 'badhajmi', 'apach', 'khana hajam nahi'],
      icon: '🍽', title: 'Indigestion',
      suggestions: ['Dyspepsia', 'Gastritis', 'Overeating'],
      precautions: ['Eat smaller portions', 'Avoid late-night meals'],
      care: ['Warm water', 'Ginger tea', 'Light food (khichdi)'],
      doctor: ['Persistent symptoms', 'Weight loss']
    },
    {
      keys: ['constipation', 'kabz', 'pet saaf nahi', 'motion nahi'],
      icon: '🚽', title: 'Constipation',
      suggestions: ['Low fiber diet', 'Dehydration', 'Sedentary lifestyle'],
      precautions: ['Eat fiber-rich foods', 'Drink enough water', 'Exercise daily'],
      care: ['Warm water in the morning', 'Fruits like papaya, banana', 'Isabgol if needed'],
      doctor: ['Constipation > 1 week', 'Blood in stool']
    },
    {
      keys: ['diarrhea', 'loose motion', 'dast', 'patle dast', 'loose motions'],
      icon: '💧', title: 'Diarrhea',
      suggestions: ['Food poisoning', 'Viral gastroenteritis', 'Bacterial infection'],
      precautions: ['Avoid outside / oily food', 'Wash hands often'],
      care: ['ORS / electrolytes', 'Banana, rice, curd', 'Plenty of fluids'],
      doctor: ['Blood in stool', 'Signs of dehydration', 'Lasting > 2 days']
    },
    {
      keys: ['vomiting', 'ulti', 'ulty', 'vomit', 'qai'],
      icon: '🤮', title: 'Vomiting',
      suggestions: ['Food poisoning', 'Gastritis', 'Viral infection', 'Migraine'],
      precautions: ['Avoid solid food briefly', 'Sip fluids slowly'],
      care: ['ORS', 'Plain rice / toast', 'Ginger / lemon water'],
      doctor: ['Vomiting > 24 hours', 'Blood in vomit — emergency']
    },
    {
      keys: ['nausea', 'jee michalna', 'matli', 'ulti jaisa'],
      icon: '😵', title: 'Nausea',
      suggestions: ['Indigestion', 'Motion sickness', 'Early pregnancy', 'Migraine'],
      precautions: ['Avoid strong smells', 'Eat smaller meals'],
      care: ['Ginger', 'Lemon water', 'Fresh air'],
      doctor: ['Persistent nausea with weight loss']
    },
    {
      keys: ['food poisoning', 'kharab khana', 'food spoil'],
      icon: '🍱', title: 'Food Poisoning',
      suggestions: ['Bacterial / viral GI infection'],
      precautions: ['Avoid stale or street food', 'Wash hands'],
      care: ['ORS', 'Light food', 'Rest'],
      doctor: ['Severe dehydration', 'High fever']
    },
    {
      keys: ['asthma', 'wheezing', 'dama', 'damma'],
      icon: '🫁', title: 'Asthma Symptoms',
      suggestions: ['Asthma flare-up', 'Allergic bronchitis'],
      precautions: ['Avoid triggers (dust, smoke, cold air)', 'Carry inhaler'],
      care: ['Use prescribed inhaler', 'Steam inhalation', 'Sit upright'],
      doctor: ['Inhaler not helping', 'Severe breathlessness — emergency']
    },
    {
      keys: ['breathing problem', 'breathing difficulty', 'saans lene me dikkat', 'saans phulna', 'short of breath'],
      icon: '🫁', title: 'Breathing Difficulty',
      suggestions: ['Asthma', 'Respiratory infection', 'Anxiety'],
      precautions: ['Avoid smoke and dust', 'Sit upright'],
      care: ['Slow deep breathing', 'Fresh air'],
      doctor: ['Persistent or severe — seek urgent care']
    },
    {
      keys: ['allergy', 'allergies', 'allergic', 'chhinke', 'sneezing'],
      icon: '🌼', title: 'Allergies',
      suggestions: ['Allergic rhinitis', 'Dust / pollen allergy'],
      precautions: ['Avoid known triggers', 'Wear mask outdoors'],
      care: ['Antihistamine if needed', 'Saline nasal spray'],
      doctor: ['Breathing difficulty', 'Severe swelling — emergency']
    },
    {
      keys: ['sinus', 'sinus congestion', 'sinusitis', 'naak band'],
      icon: '👃', title: 'Sinus Congestion',
      suggestions: ['Sinusitis', 'Allergic rhinitis'],
      precautions: ['Avoid cold air', 'Stay hydrated'],
      care: ['Steam inhalation', 'Warm compress on face', 'Saline rinse'],
      doctor: ['Pain or fever lasting > 10 days']
    },
    {
      keys: ['itching', 'khujli', 'khaj', 'itchy skin'],
      icon: '🤲', title: 'Itching',
      suggestions: ['Allergy', 'Dry skin', 'Fungal infection'],
      precautions: ['Avoid scratching', 'Use mild soap'],
      care: ['Moisturize skin', 'Cool compress', 'Antihistamine if needed'],
      doctor: ['Spreading rash', 'Itching with fever']
    },
    {
      keys: ['rash', 'rashes', 'daane', 'chakatte', 'skin allergy'],
      icon: '🩹', title: 'Skin Rash',
      suggestions: ['Allergic reaction', 'Heat rash', 'Eczema'],
      precautions: ['Identify and avoid trigger', 'Wear loose cotton clothes'],
      care: ['Cool compress', 'Calamine lotion', 'Antihistamine if needed'],
      doctor: ['Rash with fever', 'Rapidly spreading rash']
    },
    {
      keys: ['redness', 'skin red', 'laal nishan'],
      icon: '🟥', title: 'Skin Redness',
      suggestions: ['Irritation', 'Allergic reaction', 'Infection'],
      precautions: ['Avoid harsh products', 'Keep area clean'],
      care: ['Cool compress', 'Mild moisturizer'],
      doctor: ['Spreading redness', 'Pain or pus']
    },
    {
      keys: ['stress', 'tanav', 'tension'],
      icon: '🧘', title: 'Stress',
      suggestions: ['Work / life stress', 'Anxiety'],
      precautions: ['Take regular breaks', 'Limit caffeine'],
      care: ['Deep breathing', 'Walks in nature', 'Talk to a friend'],
      doctor: ['Stress affecting daily life', 'Persistent low mood']
    },
    {
      keys: ['anxiety', 'ghabrahat', 'chinta', 'panic'],
      icon: '💭', title: 'Anxiety',
      suggestions: ['Generalized anxiety', 'Panic episodes'],
      precautions: ['Limit caffeine and alcohol', 'Regular sleep schedule'],
      care: ['Slow breathing exercises', 'Mindfulness / meditation', 'Light exercise'],
      doctor: ['Frequent panic attacks', 'Interfering with daily life']
    },
    {
      keys: ['sleep issue', 'insomnia', 'neend nahi', 'neend na aana', 'sleeplessness'],
      icon: '🌙', title: 'Sleep Issues',
      suggestions: ['Insomnia', 'Stress-related', 'Poor sleep hygiene'],
      precautions: ['Avoid screens before bed', 'Maintain fixed bedtime'],
      care: ['Warm milk', 'Reading', 'Relaxation techniques'],
      doctor: ['Chronic insomnia', 'Daytime drowsiness affecting work']
    },
    {
      keys: ['fatigue', 'thakaan', 'thakavat', 'tired', 'thakka'],
      icon: '😴', title: 'Fatigue',
      suggestions: ['Overwork', 'Anemia', 'Poor sleep', 'Vitamin deficiency'],
      precautions: ['Get 7-8 hours sleep', 'Balanced diet'],
      care: ['Hydrate', 'Iron-rich foods', 'Light exercise'],
      doctor: ['Persistent fatigue > 2 weeks', 'Unexplained weight loss']
    },
    {
      keys: ['weakness', 'kamzori', 'kamjori', 'energy nahi'],
      icon: '🥺', title: 'Weakness',
      suggestions: ['Fatigue', 'Low blood sugar', 'Anemia', 'Dehydration'],
      precautions: ['Avoid overexertion', 'Regular meals'],
      care: ['Balanced diet', 'Hydrate well', 'Adequate rest'],
      doctor: ['Sudden weakness on one side — emergency', 'Persistent weakness']
    },
    {
      keys: ['dehydration', 'pani ki kami', 'paani ki kami'],
      icon: '🚰', title: 'Dehydration',
      suggestions: ['Fluid loss from heat, diarrhea, or vomiting'],
      precautions: ['Drink water regularly', 'Avoid prolonged sun'],
      care: ['ORS', 'Coconut water', 'Fruits with high water content'],
      doctor: ['Confusion, very low urine', 'Severe weakness']
    },
    {
      keys: ['dizziness', 'chakkar', 'chakkar aana', 'sir ghoomna', 'vertigo'],
      icon: '🌀', title: 'Dizziness',
      suggestions: ['Low blood pressure', 'Dehydration', 'Inner ear issue', 'Low sugar'],
      precautions: ['Stand up slowly', 'Avoid sudden head movements'],
      care: ['Sit/lie down', 'Drink water or juice', 'Eat something light'],
      doctor: ['Frequent dizziness', 'With chest pain or weakness — emergency']
    },
    {
      keys: ['loss of appetite', 'bhookh nahi', 'bhook nahi lagti', 'no appetite'],
      icon: '🍚', title: 'Loss of Appetite',
      suggestions: ['Infection', 'Stress', 'Digestive issue'],
      precautions: ['Avoid heavy meals', 'Eat small portions'],
      care: ['Light, tasty foods', 'Stay hydrated'],
      doctor: ['Persistent > 1 week', 'With weight loss']
    },
    {
      keys: ['period pain', 'menstrual cramp', 'periods me dard', 'mahwari dard'],
      icon: '🌸', title: 'Menstrual Cramps',
      suggestions: ['Primary dysmenorrhea', 'Hormonal'],
      precautions: ['Avoid cold drinks', 'Reduce caffeine'],
      care: ['Warm compress on abdomen', 'Light walking', 'Pain reliever if needed'],
      doctor: ['Very severe pain', 'Heavy bleeding']
    }
  ];

  const found = [];
  const seen = new Set();
  for (const c of conditions) {
    if (has(c.keys) && !seen.has(c.title)) {
      seen.add(c.title);
      found.push(c);
    }
  }

  if (!found.length) {
    return [{
      icon: 'ℹ️',
      title: 'More Information Needed',
      message: 'We could not confidently identify the condition from the provided symptoms. Please provide more details or consult a healthcare professional.',
      doctor: ['Describe location, duration and severity of symptoms', 'Mention any fever, recent travel, or medication', 'If symptoms feel severe, consult a doctor promptly']
    }];
  }

  return found;
}
