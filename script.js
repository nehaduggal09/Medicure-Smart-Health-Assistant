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


// ===== Advanced rule-based symptom engine (EN / Hindi / Hinglish) =====
function analyzeSymptoms(rawText) {
  // Normalize: lowercase, strip punctuation, collapse spaces
  let text = ' ' + String(rawText || '').toLowerCase()
    .replace(/[.,!?;:()\[\]\/\\"']/g, ' ')
    .replace(/\s+/g, ' ') + ' ';

  // Light spelling normalization (common misspellings -> canonical)
  const spellMap = [
    [/\bheadach\w*\b/g, 'headache'],
    [/\bfeaver\b|\bfevr\b|\bfvr\b/g, 'fever'],
    [/\bcoff\b|\bcof\b|\bkof\b/g, 'cough'],
    [/\bsoar throat\b|\bsorethroat\b/g, 'sore throat'],
    [/\bstomack\b|\bstomac\b/g, 'stomach'],
    [/\bdiarea\b|\bdiarhea\b|\bdiarrea\b/g, 'diarrhea'],
    [/\bvomitting\b|\bvomitin\b/g, 'vomiting'],
    [/\bbukhaar\b|\bbukar\b|\bbukhr\b/g, 'bukhar'],
    [/\bkhasi\b|\bkhansee\b|\bkhansii\b/g, 'khansi'],
    [/\bdrd\b|\bdar\b/g, 'dard'],
    [/\bsr dard\b|\bsirdard\b/g, 'sir dard'],
    [/\bpeit\b|\bpait\b/g, 'pet'],
    [/\bchakar\b|\bchkkar\b/g, 'chakkar'],
    [/\bkmzori\b|\bkamzor\b/g, 'kamzori'],
    [/\bsaas\b|\bsans\b/g, 'saans'],
    [/\bjukam\b|\bjukaam\b|\bzukaam\b/g, 'zukam'],
  ];
  spellMap.forEach(([re, rep]) => { text = text.replace(re, rep); });

  const has = (...keys) => keys.flat().some(k => text.includes(k));
  const countHits = (keys) => keys.reduce((n, k) => n + (text.includes(k) ? 1 : 0), 0);

  // ---------- Emergency detection ----------
  const emergencyChecks = [
    { keys: ['chest pain', 'chhati me dard', 'seene me dard', 'dil me dard', 'heart pain'], label: 'Possible Cardiac Emergency' },
    { keys: ['severe breathing', 'cant breathe', "can't breathe", 'saans nahi', 'dam ghut', 'breathless', 'gasping'], label: 'Severe Breathing Difficulty' },
    { keys: ['blood vomit', 'khoon ki ulti', 'vomiting blood', 'coughing blood', 'khoon wali khansi'], label: 'Bleeding Emergency' },
    { keys: ['unconscious', 'behosh', 'fainted', 'pass out', 'passed out'], label: 'Loss of Consciousness' },
    { keys: ['seizure', 'fits', 'mirgi', 'convulsion'], label: 'Seizure / Convulsion' },
    { keys: ['stroke', 'face droop', 'slurred speech', 'sudden paralysis', 'lakwa', 'paralysis'], label: 'Possible Stroke' },
    { keys: ['severe bleeding', 'heavy bleeding', 'bahut khoon', 'zyada khoon'], label: 'Severe Bleeding' },
    { keys: ['suicidal', 'khudkushi', 'end my life'], label: 'Mental Health Emergency' },
  ];
  const emergencies = emergencyChecks.filter(e => has(e.keys));
  if (emergencies.length) {
    return [{
      emergency: true,
      icon: '🚨',
      title: 'EMERGENCY — ' + emergencies.map(e => e.label).join(', '),
      severity: 'HIGH',
      message: 'Seek immediate medical attention and contact a healthcare professional immediately.',
      precautions: [
        'Call your local emergency number or visit the nearest hospital now.',
        'Do not drive yourself if you feel faint — ask someone for help.',
        'Stay calm, sit or lie down in a safe position.',
        'If unconscious or not breathing, ask a bystander to start CPR while help arrives.',
      ],
      doctor: ['This is urgent — please get in-person medical care immediately.'],
    }];
  }

  // ---------- Vocabulary ----------
  const BODY_PARTS = {
    head:        ['head', 'sir', 'sar'],
    eye:         ['eye', 'eyes', 'aankh', 'ankh'],
    ear:         ['ear', 'ears', 'kaan', 'kan'],
    nose:        ['nose', 'naak', 'nak'],
    mouth:       ['mouth', 'muh', 'munh'],
    teeth:       ['teeth', 'tooth', 'daant', 'dant'],
    tongue:      ['tongue', 'jeebh', 'jeeb'],
    throat:      ['throat', 'gala', 'galaa'],
    neck:        ['neck', 'gardan'],
    shoulder:    ['shoulder', 'kandha'],
    arm:         ['arm', 'bazu', 'baazu'],
    hand:        ['hand', 'hath', 'haath'],
    finger:      ['finger', 'ungli', 'ungali'],
    chest:       ['chest', 'chhati', 'seena', 'seene'],
    heart:       ['heart', 'dil'],
    back:        ['back', 'peeth', 'pith'],
    spine:       ['spine', 'reedh'],
    stomach:     ['stomach', 'pet', 'abdomen', 'belly'],
    waist:       ['waist', 'kamar'],
    hip:         ['hip', 'hips'],
    kidney:      ['kidney', 'gurda', 'gurde'],
    leg:         ['leg', 'pair', 'paer', 'tang'],
    knee:        ['knee', 'ghutna', 'ghutne'],
    foot:        ['foot', 'feet'],
    ankle:       ['ankle', 'takhna'],
    heel:        ['heel', 'edi', 'eddi'],
    skin:        ['skin', 'twacha', 'chamdi'],
  };

  const SYMPTOM_TYPES = {
    pain:        ['pain', 'ache', 'dard', 'dukh'],
    burning:     ['burning', 'jalan', 'jalna'],
    swelling:    ['swelling', 'swollen', 'sujan', 'soojan'],
    itching:     ['itching', 'itchy', 'khujli', 'khaj'],
    rash:        ['rash', 'chakatte', 'daane'],
    redness:     ['redness', 'red ', 'laal'],
    weakness:    ['weakness', 'weak', 'kamzori', 'kamzor'],
    fatigue:     ['fatigue', 'tired', 'thakan', 'thaka'],
    dizziness:   ['dizzy', 'dizziness', 'chakkar', 'lightheaded'],
    fever:       ['fever', 'bukhar', 'temperature', 'high temp'],
    cold:        ['cold', 'zukam', 'sardi'],
    cough:       ['cough', 'khansi'],
    sneeze:      ['sneeze', 'sneezing', 'chhink', 'chink'],
    vomiting:    ['vomit', 'vomiting', 'ulti', 'ulty'],
    nausea:      ['nausea', 'nauseous', 'jee michla', 'mitli'],
    diarrhea:    ['diarrhea', 'loose motion', 'dast', 'patla pakhana'],
    constipation:['constipation', 'kabz'],
    gas:         ['gas', 'bloating', 'gas ban'],
    acidity:     ['acidity', 'acid', 'khatti dakar', 'heartburn'],
    appetite:    ['loss of appetite', 'no appetite', 'bhukh nahi', 'bhook nahi'],
    sleep:       ['insomnia', 'cant sleep', 'neend nahi', 'sleep problem'],
    stress:      ['stress', 'tension', 'pareshan'],
    anxiety:     ['anxiety', 'anxious', 'ghabrahat', 'ghabraht'],
    breathing:   ['breathing', 'shortness of breath', 'saans', 'breathless'],
    allergy:     ['allergy', 'allergic'],
    bodyPain:    ['body pain', 'body ache', 'badan dard', 'pure badan'],
    jointPain:   ['joint pain', 'joints', 'jodon', 'jodo'],
    musclePain:  ['muscle pain', 'muscle ache', 'masal', 'maspeshi'],
  };

  const bodyHits = Object.entries(BODY_PARTS).filter(([, arr]) => has(arr)).map(([k]) => k);
  const symHits  = Object.entries(SYMPTOM_TYPES).filter(([, arr]) => has(arr)).map(([k]) => k);

  // ---------- Category inference ----------
  const results = [];
  const add = (r) => results.push(r);

  const flagFever  = symHits.includes('fever');
  const flagCough  = symHits.includes('cough');
  const flagCold   = symHits.includes('cold') || symHits.includes('sneeze');
  const flagThroat = bodyHits.includes('throat');
  const flagBody   = symHits.includes('bodyPain') || symHits.includes('weakness') || symHits.includes('fatigue');

  // Flu-like / viral
  if (flagFever && (flagCough || flagCold || flagBody || flagThroat)) {
    add({
      icon: '🤒', title: 'Flu-like Viral Infection', severity: 'MODERATE',
      causes: ['Seasonal viral infection (influenza, common viral fever)', 'Recent exposure to someone with similar symptoms', 'Weakened immunity or weather change'],
      suggestions: ['Rest well and stay warm', 'Drink plenty of warm fluids', 'Steam inhalation for congestion', 'Paracetamol may help fever and body pain (as per label)'],
      precautions: ['Isolate to avoid spreading', 'Cover mouth while coughing/sneezing', 'Wash hands frequently'],
      care: ['Warm soups, herbal tea, honey-ginger water', 'Adequate sleep (7–9 hours)', 'Light, easily digestible diet'],
      doctor: ['Fever above 102°F (39°C) for more than 2 days', 'Difficulty breathing or chest discomfort', 'Symptoms not improving in 3–5 days'],
    });
  } else if (flagCold || (flagCough && !flagFever)) {
    add({
      icon: '🤧', title: 'Common Cold / Upper Respiratory Issue', severity: 'LOW',
      causes: ['Rhinovirus or other common cold viruses', 'Cold weather, dust or allergens', 'Low immunity'],
      suggestions: ['Steam inhalation 2–3 times daily', 'Warm saline gargles for throat', 'Stay hydrated with warm fluids'],
      precautions: ['Avoid cold drinks and oily food', 'Use a mask in dusty/cold environments', 'Maintain hand hygiene'],
      care: ['Honey + ginger + tulsi tea', 'Adequate rest', 'Vitamin-C rich fruits'],
      doctor: ['Cough persisting beyond 2 weeks', 'Thick green/yellow mucus with fever', 'Wheezing or chest tightness'],
    });
  } else if (flagFever) {
    add({
      icon: '🌡', title: 'Fever — Likely Minor Infection', severity: 'MODERATE',
      causes: ['Viral or bacterial infection', 'Dehydration or heat exposure', 'Inflammation in the body'],
      suggestions: ['Monitor temperature every few hours', 'Cool compress on forehead', 'Paracetamol as per label dose'],
      precautions: ['Avoid self-medication with antibiotics', 'Do not over-bundle in heavy clothes'],
      care: ['Hydration with water, ORS, coconut water', 'Light meals — khichdi, dal, fruits', 'Rest in a well-ventilated room'],
      doctor: ['Fever > 102°F for 48+ hours', 'Rash, stiff neck, or severe headache', 'Fever with vomiting or dehydration'],
    });
  }

  // Throat
  if (flagThroat && !flagFever) {
    add({
      icon: '👅', title: 'Sore Throat / Throat Irritation', severity: 'LOW',
      causes: ['Viral throat infection', 'Cold drinks, ice cream, or pollution', 'Voice strain or allergies'],
      suggestions: ['Warm saline gargles 3–4 times a day', 'Sip warm water frequently', 'Lozenges may soothe pain'],
      precautions: ['Avoid cold and spicy foods', 'Rest your voice', 'Avoid smoking and dust'],
      care: ['Honey-ginger tea, turmeric milk', 'Steam inhalation'],
      doctor: ['Pain > 1 week or trouble swallowing', 'White patches on tonsils with fever', 'Swollen neck glands'],
    });
  }

  // Digestive issues
  if (symHits.includes('vomiting') || symHits.includes('nausea') || symHits.includes('diarrhea') ||
      symHits.includes('gas') || symHits.includes('acidity') || symHits.includes('constipation') ||
      (bodyHits.includes('stomach') && symHits.includes('pain'))) {
    const severity = symHits.includes('diarrhea') || symHits.includes('vomiting') ? 'MODERATE' : 'LOW';
    add({
      icon: '🍽', title: 'Digestive / Gastrointestinal Issue', severity,
      causes: ['Food poisoning or contaminated food/water', 'Indigestion, acidity, or gas', 'Stomach infection (viral/bacterial)', 'Stress-related gut upset'],
      suggestions: ['Sip ORS or coconut water frequently', 'Eat small, bland meals (rice, banana, curd)', 'Avoid spicy, oily and fried foods'],
      precautions: ['Drink only clean/boiled water', 'Wash hands before meals', 'Avoid street food until recovered'],
      care: ['Khichdi, banana, curd-rice', 'Ginger or fennel water for nausea/gas', 'Adequate rest'],
      doctor: ['Vomiting/diarrhea > 24 hours', 'Signs of dehydration (dry mouth, low urine)', 'Blood in stool or vomit', 'High fever with abdominal pain'],
    });
  }

  // Headache
  if (bodyHits.includes('head') && (symHits.includes('pain') || has('headache', 'sir dard', 'sirdard'))) {
    add({
      icon: '🧠', title: 'Headache — Possible Tension or Migraine', severity: 'LOW',
      causes: ['Stress, lack of sleep, eye strain', 'Dehydration or skipped meals', 'Sinus pressure or migraine trigger'],
      suggestions: ['Rest in a quiet, dark room', 'Hydrate well', 'Gentle head/neck massage'],
      precautions: ['Limit screen time', 'Avoid skipping meals', 'Maintain regular sleep schedule'],
      care: ['Cold or warm compress on forehead', 'Deep breathing / meditation'],
      doctor: ['Sudden, severe "thunderclap" headache', 'Headache with vision changes, weakness, or vomiting', 'Daily headaches > 1 week'],
    });
  }

  // Dizziness / weakness / fatigue
  if (symHits.includes('dizziness') || symHits.includes('weakness') || symHits.includes('fatigue')) {
    add({
      icon: '💤', title: 'Fatigue / Weakness / Dizziness', severity: 'LOW',
      causes: ['Dehydration or low blood sugar', 'Poor sleep, overwork, stress', 'Low haemoglobin / nutritional deficiency'],
      suggestions: ['Sit or lie down until dizziness passes', 'Eat a balanced meal with iron & protein', 'Improve sleep routine'],
      precautions: ['Avoid sudden standing', 'Do not drive when dizzy'],
      care: ['Hydration, fruits, nuts, dates', 'Light exercise and fresh air'],
      doctor: ['Frequent fainting episodes', 'Weakness on one side of body', 'Persistent fatigue > 2 weeks'],
    });
  }

  // Breathing
  if (symHits.includes('breathing')) {
    add({
      icon: '🫁', title: 'Respiratory Discomfort', severity: 'MODERATE',
      causes: ['Asthma or allergic reaction', 'Respiratory infection', 'Anxiety-related hyperventilation'],
      suggestions: ['Sit upright, breathe slowly through nose', 'Use prescribed inhaler if any', 'Move to fresh, clean air'],
      precautions: ['Avoid smoke, dust and strong perfumes', 'Avoid heavy exertion'],
      care: ['Steam inhalation', 'Calm breathing exercises (4-7-8)'],
      doctor: ['Breathlessness at rest', 'Bluish lips or fingertips', 'Chest pain with breathing'],
    });
  }

  // Skin
  if (bodyHits.includes('skin') || symHits.includes('rash') || symHits.includes('itching') || symHits.includes('redness') || symHits.includes('allergy')) {
    add({
      icon: '🧴', title: 'Skin Irritation / Allergy', severity: 'LOW',
      causes: ['Contact allergy (soap, fabric, food)', 'Heat rash or fungal/bacterial infection', 'Insect bite or dryness'],
      suggestions: ['Avoid scratching the area', 'Cool compress to reduce itching', 'Wear loose, cotton clothing'],
      precautions: ['Identify and avoid triggers', 'Keep skin clean and moisturized'],
      care: ['Calamine lotion or aloe vera gel', 'Mild, fragrance-free soap'],
      doctor: ['Rash spreading rapidly or with fever', 'Swelling of face/lips/tongue', 'Pus, severe pain, or no improvement in a week'],
    });
  }

  // Joint / muscle / body part pain (generic musculoskeletal)
  const muscPartHit = ['neck','shoulder','arm','hand','finger','back','spine','waist','hip','leg','knee','foot','ankle','heel'].some(p => bodyHits.includes(p));
  if (symHits.includes('jointPain') || symHits.includes('musclePain') ||
      (muscPartHit && (symHits.includes('pain') || symHits.includes('swelling') || symHits.includes('burning')))) {
    const where = bodyHits.filter(p => ['neck','shoulder','arm','hand','finger','back','spine','waist','hip','leg','knee','foot','ankle','heel'].includes(p));
    add({
      icon: '🦴', title: 'Muscle / Joint Discomfort' + (where.length ? ` (${where.join(', ')})` : ''),
      severity: symHits.includes('swelling') ? 'MODERATE' : 'LOW',
      causes: ['Muscle strain or overuse', 'Poor posture or prolonged sitting', 'Minor injury or inflammation', 'Vitamin D / calcium deficiency'],
      suggestions: ['Rest the affected area', 'Apply warm or cold compress as comfortable', 'Gentle stretching after rest'],
      precautions: ['Avoid heavy lifting until pain settles', 'Maintain good posture', 'Use supportive footwear'],
      care: ['Warm oil massage', 'Pain-relief balm as per label', 'Adequate hydration'],
      doctor: ['Severe swelling, bruising or inability to move', 'Pain lasting more than 7–10 days', 'Joint pain with fever or rash'],
    });
  }

  // Eye/Ear/Nose/Tooth specific
  if (bodyHits.includes('eye') && (symHits.includes('pain') || symHits.includes('redness') || symHits.includes('itching') || symHits.includes('burning'))) {
    add({
      icon: '👁', title: 'Eye Irritation / Conjunctivitis', severity: 'LOW',
      causes: ['Allergy, dust or pollution', 'Viral/bacterial conjunctivitis', 'Excess screen time / dry eyes'],
      suggestions: ['Avoid rubbing eyes', 'Rinse with clean water', 'Reduce screen time'],
      precautions: ['Do not share towels', 'Wash hands frequently'],
      care: ['Cold compress', 'Lubricating eye drops (OTC)'],
      doctor: ['Severe pain, blurred vision, or light sensitivity', 'Heavy yellow discharge', 'Eye injury'],
    });
  }
  if (bodyHits.includes('ear') && (symHits.includes('pain') || symHits.includes('itching'))) {
    add({
      icon: '👂', title: 'Ear Discomfort', severity: 'LOW',
      causes: ['Earwax buildup', 'Ear infection (often after cold)', 'Water trapped in ear'],
      suggestions: ['Keep ear dry', 'Do not insert cotton buds deep inside', 'Warm compress on the ear'],
      precautions: ['Avoid loud noises', 'Treat colds promptly'],
      care: ['Warm cloth on the ear', 'OTC pain relief if needed'],
      doctor: ['Severe pain, fever or discharge', 'Hearing loss', 'Symptoms in young children > 1 day'],
    });
  }
  if (bodyHits.includes('teeth') && (symHits.includes('pain') || symHits.includes('swelling'))) {
    add({
      icon: '🦷', title: 'Dental Pain', severity: 'MODERATE',
      causes: ['Cavity or tooth decay', 'Gum infection', 'Sensitive teeth or wisdom tooth'],
      suggestions: ['Warm saline rinse', 'Avoid very hot/cold/sweet foods', 'Soft toothbrush, gentle brushing'],
      precautions: ['Maintain oral hygiene twice daily', 'Floss regularly'],
      care: ['Clove oil dab on the painful tooth', 'OTC pain relief as per label'],
      doctor: ['Severe swelling of face/jaw', 'Pain lasting > 2 days', 'Fever with tooth pain'],
    });
  }

  // Mental health / stress / sleep
  if (symHits.includes('stress') || symHits.includes('anxiety') || symHits.includes('sleep')) {
    add({
      icon: '🧘', title: 'Stress / Anxiety / Sleep Disturbance', severity: 'LOW',
      causes: ['Work or personal stress', 'Excess caffeine / screen time at night', 'Irregular routine'],
      suggestions: ['Practice deep breathing or meditation', 'Maintain a fixed sleep schedule', 'Limit caffeine after evening'],
      precautions: ['Reduce news / social-media overload', 'Avoid alcohol and tobacco as coping tools'],
      care: ['Light walk, yoga, journaling', 'Warm milk before bed', 'Talk to a trusted friend or family member'],
      doctor: ['Persistent low mood > 2 weeks', 'Panic attacks or inability to function', 'Thoughts of self-harm — seek help immediately'],
    });
  }

  // Loss of appetite alone
  if (symHits.includes('appetite') && results.length === 0) {
    add({
      icon: '🥣', title: 'Loss of Appetite', severity: 'LOW',
      causes: ['Stress, fatigue, or minor infection', 'Digestive disturbance', 'Side effect of medication'],
      suggestions: ['Eat small, frequent, light meals', 'Stay hydrated', 'Include fruits and curd'],
      precautions: ['Avoid heavy/oily food until appetite returns'],
      care: ['Lemon water, ginger before meals', 'Light walk after meals'],
      doctor: ['Appetite loss > 1 week with weight loss', 'Associated nausea, jaundice or pain'],
    });
  }

  // ---------- Fallback intelligence ----------
  if (results.length === 0) {
    // Try to still infer something from body part + any symptom-ish word
    if (bodyHits.length || symHits.length) {
      add({
        icon: '🩺',
        title: 'General Health Concern' + (bodyHits.length ? ` (${bodyHits.join(', ')})` : ''),
        severity: 'LOW',
        message: 'Based on the words detected, here is a general assessment.',
        causes: ['Possible minor strain, irritation, or early-stage infection', 'Fatigue, dehydration or stress', 'Reaction to weather, food or environment'],
        suggestions: ['Rest and observe symptoms for 24–48 hours', 'Stay hydrated and eat light meals', 'Avoid known triggers (cold, dust, spicy food)'],
        precautions: ['Monitor for new symptoms (fever, swelling, bleeding)', 'Avoid self-medication'],
        care: ['Warm fluids, adequate sleep', 'Gentle stretching if pain-related'],
        doctor: ['If symptoms worsen or last more than 3 days', 'If new severe symptoms appear'],
      });
    } else {
      add({
        icon: 'ℹ️', title: 'More Information Needed', severity: 'LOW',
        message: 'Your symptoms are not fully clear. Please provide more details for a better assessment.',
        suggestions: ['Mention the body part affected (e.g. head, chest, stomach)', 'Describe the type of symptom (pain, burning, swelling, fever)', 'Mention how long it has been happening'],
        precautions: ['Avoid self-medication without proper diagnosis'],
        doctor: ['If you feel unwell or symptoms worsen, consult a healthcare professional.'],
      });
    }
  }

  return results;
}