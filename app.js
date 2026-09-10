/* ============================================================
   Learning Lab — app.js
   Main application logic (Pomodoro + Library + annotations).
   - Settings live in config.js (window.LearningLabConfig).
   - You can edit behavior here on GitHub, but most tweaks
     (timer lengths, colors, file types) only need config.js.
   ============================================================ */
'use strict';

/* Read config with safe fallbacks so the app still works if
   config.js fails to load (e.g. opened as file://). */
const CFG = window.LearningLabConfig || {};
const _MODES_MIN = CFG.pomodoroModes || {
  "25": { focus: 25, break: 5, label: "25 | 5" },
  "50": { focus: 50, break: 10, label: "50 | 10" },
};
const _DEFAULT_MODE = CFG.defaultMode || "25";
const _BELL = CFG.bellNotes || [
  { freq: 880, at: 0, dur: 0.3 },
  { freq: 1100, at: 0.15, dur: 0.3 },
  { freq: 1320, at: 0.3, dur: 0.4 },
  { freq: 1100, at: 0.55, dur: 0.3 },
  { freq: 880, at: 0.7, dur: 0.5 },
];
const _TEXT_TYPES = CFG.textTypes || ["txt", "md", "markdown", "html", "htm", "css", "js", "jsx", "ts", "tsx", "json", "csv", "xml", "yaml", "yml", "py", "rb", "log"];
const _IMAGE_TYPES = CFG.imageTypes || ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "ico"];
const _MEDIA_TYPES = CFG.mediaTypes || ["mp3", "mp4", "webm"];
const _DEFAULT_HL = CFG.defaultHighlight || "#ffe58a";

// ================= POMODORO =================

    function playBell() {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const playTone = (freq, startTime, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.6, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      const now = ctx.currentTime;
      _BELL.forEach(n => playTone(n.freq, now + (n.at || 0), n.dur || 0.3));
    }

    // Built from config.js (minutes -> seconds). Edit config.js to change.
    const MODES = {};
    Object.keys(_MODES_MIN).forEach(k => {
      const m = _MODES_MIN[k];
      MODES[k] = { focus: m.focus * 60, break: m.break * 60, label: m.label || (m.focus + ' | ' + m.break) };
    });

    let currentMode = MODES[_DEFAULT_MODE] ? _DEFAULT_MODE : Object.keys(MODES)[0];
    let phase = 'focus';
    let timeLeft = MODES[currentMode].focus;
    let phaseDuration = MODES[currentMode].focus;
    let interval = null;
    let running = false;
    let focusCount = 0;
    let breakCount = 0;
    let totalFocusMins = 0;

    const sessions = []; // { type: 'focus'|'break', time, label, completed }

    const timerEl = document.getElementById('timer');
    const phaseEl = document.getElementById('phase');
    const progressFill = document.getElementById('progressFill');
    const startPauseBtn = document.getElementById('startPause');
    const resetBtn = document.getElementById('reset');
    const mode25Btn = document.getElementById('mode25');
    const mode50Btn = document.getElementById('mode50');
    const focusCountEl = document.getElementById('focusCount');
    const breakCountEl = document.getElementById('breakCount');
    const focusMinsEl = document.getElementById('focusMins');
    const sessionListEl = document.getElementById('sessionList');

    function fmt(sec) {
      const m = Math.floor(sec / 60).toString().padStart(2, '0');
      const s = (sec % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    }

    function updateTimer() {
      timerEl.textContent = fmt(timeLeft);
      const pct = Math.max(0, (timeLeft / phaseDuration) * 100);
      progressFill.style.width = pct + '%';
    }

    function updatePhase() {
      phaseEl.textContent = phase === 'focus' ? 'Focus' : 'Break';
    }

    function updateModeButtons() {
      mode25Btn.classList.toggle('active', currentMode === '25');
      mode50Btn.classList.toggle('active', currentMode === '50');
    }

    function updateStats() {
      focusCountEl.textContent = focusCount;
      breakCountEl.textContent = breakCount;
      focusMinsEl.textContent = totalFocusMins;
    }

    function renderSessions() {
      sessionListEl.innerHTML = '';
      if (sessions.length === 0) {
        sessionListEl.innerHTML = '<div class="empty">No sessions yet. Start the timer!</div>';
        return;
      }
      sessions.forEach((s, i) => {
        const dotClass = s.type === 'focus'
          ? (s.completed ? 'done' : '')
          : (s.completed ? 'break-done' : 'break');
        const st = document.createElement('div');
        st.className = 'session';
        st.innerHTML = `
          <span class="dot ${dotClass}"></span>
          <div class="meta">
            <div>${s.label} • ${s.type === 'focus' ? 'Focus' : 'Break'}</div>
            <div class="sub">${s.time} ${s.completed ? '• completed' : '• running'}</div>
          </div>`;
        sessionListEl.prepend(st);
      });
    }

    function setPhaseTime(sec) {
      phaseDuration = sec;
      timeLeft = sec;
    }

    function setMode(mode) {
      stop();
      currentMode = mode;
      phase = 'focus';
      setPhaseTime(MODES[mode].focus);
      updateModeButtons();
      updatePhase();
      updateTimer();
    }

    function startVibe() {
      document.body.style.background = phase === 'focus'
        ? 'var(--bg)'
        : 'linear-gradient(135deg,#ffeaa7,#fdcb6e)';
      document.querySelector('.container').style.background = 'transparent';
    }

    function start() {
      if (timeLeft === 0) return;
      running = true;
      startPauseBtn.textContent = 'Pause';
      startVibe();
      interval = setInterval(() => {
        timeLeft--;
        updateTimer();
        if (timeLeft <= 0) {
          clearInterval(interval);
          running = false;
          recordCompleted();
          playBell();
          if (phase === 'focus') {
            phase = 'break';
            setPhaseTime(MODES[currentMode].break);
          } else {
            phase = 'focus';
            setPhaseTime(MODES[currentMode].focus);
          }
          updatePhase();
          updateTimer();
          start();
        }
      }, 1000);
    }

    function recordCompleted() {
      const type = phase;
      const label = MODES[currentMode].label;
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      sessions.push({ type, label, time, completed: true });
      if (type === 'focus') {
        focusCount++;
        totalFocusMins += MODES[currentMode].focus / 60;
      } else {
        breakCount++;
      }
      updateStats();
      renderSessions();
    }

    function recordStarted() {
      if (sessions.some(s => !s.completed)) return;
      const type = phase;
      const label = MODES[currentMode].label;
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      sessions.push({ type, label, time, completed: false });
      renderSessions();
    }

    function stop() {
      running = false;
      clearInterval(interval);
      startPauseBtn.textContent = 'Start';
      document.body.style.background = 'var(--bg)';
      sessions.forEach(s => { if (!s.completed && s.type === 'focus' && phase !== 'focus') s.completed = true; });
    }

    function reset() {
      stop();
      phase = 'focus';
      setPhaseTime(MODES[currentMode].focus);
      updatePhase();
      updateTimer();
    }

    startPauseBtn.addEventListener('click', () => {
      if (running) { stop(); }
      else { recordStarted(); start(); }
    });
    resetBtn.addEventListener('click', reset);
    mode25Btn.addEventListener('click', () => setMode('25'));
    mode50Btn.addEventListener('click', () => setMode('50'));

    updateTimer();
    updateStats();

    // ================= LIBRARY =================
    const docs = [];
    let activeDocId = null;
    let highlightColor = _DEFAULT_HL;
    let activeTool = 'highlight';

    const docListEl = document.getElementById('docList');
    const pageEl = document.getElementById('page');
    const paperEl = document.getElementById('paper');
    const placeholderEl = document.getElementById('placeholder');
    const activeDocTitle = document.getElementById('activeDocTitle');
    const docCountEl = document.getElementById('docCount');
    const annotationBar = document.getElementById('annotationBar');
    const printBtn = document.getElementById('printBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    // Modals
    const newDocModal = document.getElementById('newDocModal');
    const fileModal = document.getElementById('fileModal');
    const fileInput = document.getElementById('fileInput');
    const fileLabel = document.getElementById('fileLabel');

    function renderDocList() {
      docListEl.innerHTML = '';
      if (docs.length === 0) {
        docListEl.innerHTML = '<div class="doc-item" style="cursor:default;color:var(--muted);">No documents yet</div>';
      }
      docs.forEach(doc => {
        const item = document.createElement('div');
        item.className = 'doc-item' + (doc.id === activeDocId ? ' active' : '');
        const size = (doc.content.length / 1024).toFixed(1);
        item.innerHTML = `
          <div class="doc-name">${escapeHtml(doc.name)}</div>
          <div class="doc-meta">${doc.type} • ${size} KB • ${doc.annotations.length} notes</div>`;
        item.addEventListener('click', () => selectDoc(doc.id));
        docListEl.appendChild(item);
      });
      docCountEl.textContent = docs.length + ' document' + (docs.length === 1 ? '' : 's');
    }

    function escapeHtml(s) {
      const d = document.createElement('div');
      d.textContent = s;
      return d.innerHTML;
    }

    function renderPaper(doc) {
      placeholderEl.style.display = 'none';
      paperEl.style.display = 'block';
      paperEl.innerHTML = '';
      annotationBar.style.display = doc.kind === 'text' ? 'flex' : 'none';

      const h1 = document.createElement('h1');
      h1.textContent = doc.name;
      const sub = document.createElement('div');
      sub.className = 'subtitle';
      sub.textContent = doc.type + ' document • ' + doc.annotations.length + ' annotations';
      paperEl.appendChild(h1);
      paperEl.appendChild(sub);

      // Render body based on kind
      const body = document.createElement('div');
      body.className = 'doc-body';
      if (doc.kind === 'image') {
        renderImageBody(body, doc);
      } else if (doc.kind === 'pdf') {
        renderPdfBody(body, doc);
      } else if (doc.kind === 'audio') {
        renderAudioBody(body, doc);
      } else if (doc.kind === 'video') {
        renderVideoBody(body, doc);
      } else {
        body.innerHTML = renderAnnotated(doc);
      }
      paperEl.appendChild(body);

      // Footnotes/notes section
      const notesSection = document.createElement('div');
      notesSection.className = 'notes';
      notesSection.innerHTML = '<h3>Annotations</h3>';
      if (doc.annotations.length === 0) {
        const empty = document.createElement('p');
        empty.style.color = 'var(--muted)';
        empty.style.fontSize = '0.85rem';
        empty.textContent = doc.kind === 'text'
          ? 'Select text to highlight. Switch to Note mode to add comments.'
          : 'No annotations yet. Click "Add note" to pin a comment.';
        notesSection.appendChild(empty);
      } else {
        doc.annotations.forEach((a, idx) => {
          const note = document.createElement('div');
          note.className = 'note';
          const anchorText = a.anchor ? `<span style="color:var(--muted);font-size:0.75rem;">at ${a.anchor}</span>` : '';
          note.innerHTML = `
            <span class="color-dot" style="background:${a.color || '#f39c12'};"></span>
            <div class="note-text">
              <strong style="font-size:0.8rem;">${escapeHtml(a.text || 'Note')}</strong>
              ${anchorText}
              ${a.note ? '<br>' + escapeHtml(a.note) : ''}
            </div>
            <button class="delete" data-idx="${idx}">✕</button>`;
          note.querySelector('.delete').addEventListener('click', (e) => {
            e.stopPropagation();
            doc.annotations.splice(idx, 1);
            renderDocList();
            renderPaper(doc);
          });
          notesSection.appendChild(note);
        });
      }
      paperEl.appendChild(notesSection);
    }

    function renderImageBody(body, doc) {
      const hint = document.createElement('div');
      hint.className = 'image-hint';
      hint.textContent = 'Click anywhere on the image to pin a note.';
      body.appendChild(hint);

      const wrap = document.createElement('div');
      wrap.className = 'image-wrap';
      const img = document.createElement('img');
      img.src = doc.url;
      img.alt = doc.name;
      wrap.appendChild(img);

      doc.annotations.forEach(a => {
        if (!a.x && !a.y) return;
        const pin = document.createElement('span');
        pin.className = 'pin';
        pin.style.left = a.x + '%';
        pin.style.top = a.y + '%';
        pin.style.background = a.color || '#f39c12';
        pin.title = a.note || a.text;
        wrap.appendChild(pin);
      });

      wrap.addEventListener('click', (e) => {
        const rect = wrap.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        const noteText = prompt('New note for this spot:');
        if (noteText === null || noteText === '') return;
        doc.annotations.push({ text: '', note: noteText, x: x.toFixed(1), y: y.toFixed(1), color: highlightColor });
        renderDocList();
        renderPaper(doc);
      });

      body.appendChild(wrap);
    }

    function renderPdfBody(body, doc) {
      const hint = document.createElement('div');
      hint.className = 'pdf-hint';
      hint.textContent = 'Use "Add note" below to annotate this PDF.';
      body.appendChild(hint);

      const addBtn = document.createElement('button');
      addBtn.className = 'add-note-btn';
      addBtn.textContent = '+ Add note';
      addBtn.addEventListener('click', () => {
        const noteText = prompt('New annotation:');
        if (noteText === null || noteText === '') return;
        const page = prompt('Page number (optional):') || 'PDF';
        doc.annotations.push({ text: '', note: noteText, anchor: page, color: highlightColor });
        renderDocList();
        renderPaper(doc);
      });
      body.appendChild(addBtn);

      const iframe = document.createElement('iframe');
      iframe.className = 'pdf-frame';
      iframe.src = doc.url;
      iframe.type = 'application/pdf';
      body.appendChild(iframe);
    }

    function renderMediaBody(body, doc) {
      const addBtn = document.createElement('button');
      addBtn.className = 'add-note-btn';
      addBtn.textContent = '+ Add note';
      addBtn.addEventListener('click', () => {
        const noteText = prompt('New note:');
        if (noteText === null || noteText === '') return;
        doc.annotations.push({ text: '', note: noteText, color: highlightColor });
        renderDocList();
        renderPaper(doc);
      });
      body.appendChild(addBtn);

      const audio = document.createElement('audio');
      audio.src = doc.url;
      audio.controls = true;
      audio.style.width = '100%';
      audio.style.margin = '16px 0';
      body.appendChild(audio);
    }

    function renderVideoBody(body, doc) {
      const addBtn = document.createElement('button');
      addBtn.className = 'add-note-btn';
      addBtn.textContent = '+ Add note';
      addBtn.addEventListener('click', () => {
        const noteText = prompt('New note:');
        if (noteText === null || noteText === '') return;
        doc.annotations.push({ text: '', note: noteText, color: highlightColor });
        renderDocList();
        renderPaper(doc);
      });
      body.appendChild(addBtn);

      const video = document.createElement('video');
      video.src = doc.url;
      video.controls = true;
      video.style.maxWidth = '100%';
      video.style.maxHeight = '60vh';
      video.style.borderRadius = '8px';
      video.style.margin = '16px 0';
      body.appendChild(video);
    }

    function renderAnnotated(doc) {
      // Split paragraphs and wrap annotations
      let html = '';
      doc.paragraphs.forEach(p => {
        html += '<p>' + p + '</p>';
      });
      // Apply highlights as <mark>
      doc.annotations.forEach(a => {
        html = html.split(a.text).join(`<mark style="background:${a.color};" title="${escapeHtml(a.note || '')}">${escapeHtml(a.text)}</mark>`);
      });
      // Also handle quotes
      if (doc.quote) {
        html = `<blockquote>${escapeHtml(doc.quote)}</blockquote>` + html;
      }
      return html;
    }

    function selectDoc(id) {
      activeDocId = id;
      const doc = docs.find(d => d.id === id);
      if (!doc) return;
      activeDocTitle.textContent = doc.name;
      printBtn.disabled = false;
      downloadBtn.disabled = false;
      renderDocList();
      renderPaper(doc);
    }

    function addDoc({ name, type, content, paragraphs, quote, isNote, kind, url }) {
      const doc = {
        id: 'doc-' + Date.now(),
        name,
        type: isNote ? 'note' : (type || 'text'),
        content: content || '',
        paragraphs: paragraphs || (typeof content === 'string' ? content.split('\n').filter(l => l.trim()) : []),
        quote: quote || null,
        annotations: [],
        createdAt: new Date().toLocaleDateString(),
        isNote: !!isNote,
        kind: kind || 'text',
        url: url || null,
      };
      docs.unshift(doc);
      renderDocList();
      selectDoc(doc.id);
    }

    // Navigation
    document.querySelectorAll('.navbar nav button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.navbar nav button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (btn.dataset.nav === 'about') {
          placeholderEl.style.display = 'flex';
          paperEl.style.display = 'none';
          annotationBar.style.display = 'none';
          activeDocTitle.textContent = 'About Learning Lab';
          placeholderEl.innerHTML = `
            <div class="inner">
              <div class="big">🧪</div>
              <h2>Learning Lab</h2>
              <p>Upload files: text (.txt, .md, .html), code, PDFs, images (PNG, JPG), audio/video, and more.</p>
              <p>Use the Pomodoro timer on the left to stay focused.</p>
            </div>`;
        } else {
          const doc = docs.find(d => d.id === activeDocId);
          if (doc) renderPaper(doc);
          else {
            placeholderEl.style.display = 'flex';
            placeholderEl.innerHTML = `
              <div class="inner">
                <div class="big">📚</div>
                <p>Upload a document to start learning.</p>
                <p>Select text to highlight or add annotations.</p>
              </div>`;
          }
          activeDocTitle.textContent = doc ? doc.name : 'Learning Library';
        }
      });
    });

    // New note
    document.getElementById('newDocBtn').addEventListener('click', () => {
      newDocModal.classList.add('show');
    });
    document.getElementById('cancelNewDoc').addEventListener('click', () => {
      newDocModal.classList.remove('show');
    });
    document.getElementById('saveNewDoc').addEventListener('click', () => {
      const title = document.getElementById('newDocTitle').value.trim();
      const content = document.getElementById('newDocContent').value.trim();
      if (!title) { alert('Please add a title'); return; }
      addDoc({ name: title, content: content || 'New note', isNote: true });
      newDocModal.classList.remove('show');
      document.getElementById('newDocTitle').value = '';
      document.getElementById('newDocContent').value = '';
    });

    // Upload file
    document.getElementById('uploadBtn').addEventListener('click', () => {
      fileModal.classList.add('show');
    });
    document.getElementById('cancelFile').addEventListener('click', () => {
      fileModal.classList.remove('show');
      fileInput.value = '';
      fileLabel.value = '';
    });
    document.getElementById('saveFile').addEventListener('click', () => {
      const file = fileInput.files[0];
      if (!file) { alert('Please choose a file'); return; }
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      const label = fileLabel.value.trim() || file.name;
      const type = ext.toUpperCase();

      // Editable in config.js
      const textTypes = _TEXT_TYPES;
      const imageTypes = _IMAGE_TYPES;
      const mediaTypes = _MEDIA_TYPES;

      const finish = () => {
        fileModal.classList.remove('show');
        fileInput.value = '';
        fileLabel.value = '';
      };

      if (imageTypes.includes(ext)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          addDoc({ name: label, type, kind: 'image', url: e.target.result });
          finish();
        };
        reader.readAsDataURL(file);
        return;
      }

      if (ext === 'pdf') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const blob = new Blob([e.target.result], { type: 'application/pdf' });
          addDoc({ name: label, type, kind: 'pdf', url: URL.createObjectURL(blob) });
          finish();
        };
        reader.readAsArrayBuffer(file);
        return;
      }

      if (mediaTypes.includes(ext)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const mediaKind = ext === 'mp3' ? 'audio' : 'video';
          addDoc({ name: label, type, kind: mediaKind, url: e.target.result });
          finish();
        };
        reader.readAsDataURL(file);
        return;
      }

      // Fallback: try to read as text
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        let firstLine = content.split('\n')[0] || '';
        let quote = null;
        if (/\.md$/i.test(file.name)) {
          const headings = content.match(/^#{1,3} .+/gm);
          firstLine = headings ? headings[0].replace(/^#+\s*/, '') : firstLine;
        }
        addDoc({
          name: label,
          type: textTypes.includes(ext) ? type : 'text',
          content,
          quote: quote,
          isNote: false,
        });
        finish();
      };
      reader.readAsText(file);
    });

    // Print & Download
    printBtn.addEventListener('click', () => {
      const doc = docs.find(d => d.id === activeDocId);
      if (!doc) return;
      window.print();
    });
    downloadBtn.addEventListener('click', () => {
      const doc = docs.find(d => d.id === activeDocId);
      if (!doc) return;
      const blob = new Blob([doc.content + '\n\n--- ANNOTATIONS ---\n'
        + doc.annotations.map(a => `[${a.color}] ${a.text}${a.note ? ': ' + a.note : ''}`).join('\n')],
        { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name + '-annotated.txt';
      a.click();
      URL.revokeObjectURL(url);
    });

    // Annotation tools
    document.querySelectorAll('.color-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        sw.classList.add('active');
        highlightColor = sw.dataset.color;
      });
    });
    document.getElementById('highlightTool').addEventListener('click', () => {
      activeTool = 'highlight';
      document.getElementById('highlightTool').classList.add('active');
      document.getElementById('noteTool').classList.remove('active');
    });
    document.getElementById('noteTool').addEventListener('click', () => {
      activeTool = 'note';
      document.getElementById('noteTool').classList.add('active');
      document.getElementById('highlightTool').classList.remove('active');
    });

    // Selection handler
    document.addEventListener('mouseup', () => {
      const doc = docs.find(d => d.id === activeDocId);
      if (!doc) return;
      const sel = window.getSelection();
      const text = sel ? sel.toString().trim() : '';
      if (text.length < 2) return;
      if (!paperEl.contains(sel.anchorNode)) return;

      if (activeTool === 'note') {
        const noteText = prompt('Add a note for: "' + text.slice(0, 40) + '"');
        if (noteText === null) { sel.removeAllRanges(); return; }
        doc.annotations.push({ text, color: highlightColor, note: noteText });
        sel.removeAllRanges();
        renderDocList();
        renderPaper(doc);
        sel.removeAllRanges();
      } else {
        doc.annotations.push({ text, color: highlightColor, note: '' });
        sel.removeAllRanges();
        renderDocList();
        renderPaper(doc);
      }
    });

    // Init
    // Editable in config.js -> welcomeDoc
    (function initWelcome() {
      const w = CFG.welcomeDoc || { name: 'Welcome to Learning Lab', type: 'guide', content: 'Welcome!' };
      addDoc({ name: w.name, type: w.type || 'guide', content: w.content || '', paragraphs: [], quote: null, isNote: false });
    })();
