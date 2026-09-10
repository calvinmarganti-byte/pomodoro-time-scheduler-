/* ============================================================
   Learning Lab — config.js
   EDIT ME on GitHub: this is the main settings file.
   - Change Pomodoro lengths, highlight colors, supported
     file types, and the welcome document here.
   - No build step needed. Just commit and refresh the page.
   ============================================================ */

window.LearningLabConfig = {
  // ---- Pomodoro modes (minutes) ----
  // Add your own, e.g. "15": { focus: 15, break: 3, label: "15 | 3" }
  // NOTE: if you add/remove modes you must also add/remove the
  // matching <button> in index.html (search for id="mode25").
  pomodoroModes: {
    "25": { focus: 25, break: 5, label: "25 | 5" },
    "50": { focus: 50, break: 10, label: "50 | 10" },
  },
  defaultMode: "25",

  // ---- Timer chime (WebAudio frequencies) ----
  bellNotes: [
    { freq: 880, at: 0, dur: 0.3 },
    { freq: 1100, at: 0.15, dur: 0.3 },
    { freq: 1320, at: 0.3, dur: 0.4 },
    { freq: 1100, at: 0.55, dur: 0.3 },
    { freq: 880, at: 0.7, dur: 0.5 },
  ],

  // ---- Highlight palette (also edit the swatches in index.html) ----
  highlightColors: ["#ffe58a", "#a8e6cf", "#d0b4ff", "#ffb4b4"],
  defaultHighlight: "#ffe58a",

  // ---- Supported uploads (extensions, lowercase, no dots) ----
  textTypes: ["txt", "md", "markdown", "html", "htm", "css", "js", "jsx", "ts", "tsx", "json", "csv", "xml", "yaml", "yml", "py", "rb", "log"],
  imageTypes: ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "ico"],
  mediaTypes: ["mp3", "mp4", "webm"], // mp3 -> audio, rest -> video

  // ---- First-run sample document ----
  welcomeDoc: {
    name: "Welcome to Learning Lab",
    type: "guide",
    content: "This is a sample document.\nSelect any text and it will be highlighted.\nSwitch to Note mode (in the toolbar above) to attach comments to a selection.\nEverything is stored in your browser for this session.\n\nSupported files: text, code, PDFs, images, and audio/video.",
  },
};
