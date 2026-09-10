# Pomodoro Learning Lab

This is your personal pomodoro with files app, so LEARN FOCUSED, STAY FOCUSED, LADS. 

## Files

| File | What to edit |
|------|--------------|
| `index.html` | Page structure, buttons, text, mode buttons |
| `config.js` | timer lengths, chime, colors, file types, welcome doc |
| `styles.css` | Theme — edit `:root` colors, layout, fonts |
| `app.js` | Behavior — timer logic, annotations, uploads |

config.js for timers, style.css for colors yo. 

## Edit on GitHub (no local setup)

1. Push this folder to GitHub (see below).
2. On github.com, open `pomodoro-learning-lab/config.js` → click ✏️ **pencil icon** → edit → **Commit changes**.
3. Refresh your GitHub Pages URL. Done.

### Common tweaks

**Timer lengths** (`config.js`):
```js
pomodoroModes: {
  "25": { focus: 25, break: 5, label: "25 | 5" },
  "15": { focus: 15, break: 3, label: "15 | 3" }, // add your own
},
```
> If you add a mode, also add its `<button id="mode15">` in `index.html`
> and wire it in `app.js` (search for `mode25Btn`).

**Theme color** (`styles.css`):
```css
:root {
  --primary: #ee5a24;  /* change this */
}
```

**Highlight colors** (`config.js` + swatches in `index.html`):
```js
highlightColors: ["#ffe58a", "#a8e6cf", "#d0b4ff", "#ffb4b4"],
```

## Run locally

No dependencies. Either:
- Double-click `index.html`, **or**
- Serve properly (recommended, avoids `file://` quirks):
  ```bash
  cd pomodoro-learning-lab
  python3 -m http.server 8000
  # open http://localhost:8000
  ```

## Push to GitHub

From the repo root:
```bash
git add pomodoro-learning-lab
git commit -m "Add GitHub-editable Pomodoro Learning Lab"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

## Enable GitHub Pages

1. GitHub repo → **Settings → Pages**.
2. **Source:** `Deploy from a branch`, Branch: `main`, Folder: `/pomodoro-learning-lab` (or `/ (root)` if you move files up).
3. Save → open the `https://<you>.github.io/<repo>/` URL after ~1 min.

## Notes

- Data (docs, annotations, sessions) is stored **in-memory per page load** (original behavior preserved). Nothing is sent to a server.
- Uploads supported: text/code (`.txt .md .html .js .py` …), images, PDF, audio/video — lists editable in `config.js`.
- Original monolith preserved at `../learning-lab.html` for reference.
