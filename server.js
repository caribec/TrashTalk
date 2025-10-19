const express = require('express');
const app = express();
const multer  = require('multer');
const path = require('path');
const fs = require('fs');
const { recycleAnalyzer } = require('./recycleAnalyzerAPI');

const port = 3000;




//storage engine
const storage = multer.diskStorage({
    // Sets the destination directory for the uploaded files
    destination: (req, file, cb) => {
        // 'uploads/' is the folder where images will be saved
        cb(null, 'uploadedImages/');
    },
    // Sets the filename
    filename: (req, file, cb) => {
        // Creates a unique filename: 'fieldname-timestamp.ext'
        // e.g., 'image-1678886400000.jpg'
        cb(null, "userImage");
    }
});

const upload = multer({ storage: storage });

//home page
//home page
app.get('/', (req, res) => {
  res.redirect('/upload-image');
});



let uploadHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>TrashTalk — Can I Recycle It?</title>
  <style>
    :root{
      --bg:#0f1216; --card:#161b22; --muted:#9aa4b2; --acc:#58a6ff; --acc2:#7ee787; --text:#e6edf3; --border:#2a2f37; --danger:#ff6b6b;
    }
    *{box-sizing:border-box}
    html,body{height:100%}
    body{
      margin:0; font-family: ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Inter,Helvetica,Arial;
      background:linear-gradient(180deg,#0d1117 0%,#0f1216 100%); color:var(--text);
    }
    .container{max-width: 920px; margin: 0 auto; padding: 24px;}
    header h1{margin:.3rem 0 0; font-size: clamp(28px, 4vw, 40px);}
    .subtitle{margin:8px 0 24px; color:var(--muted)}
    .card{
      background:var(--card); border:1px solid var(--border); border-radius:18px; padding:20px;
      box-shadow: 0 10px 30px rgba(0,0,0,.35);
    }
    .dropzone{
      border:2px dashed var(--border); border-radius:16px; padding:28px; text-align:center;
      background: rgba(255,255,255,0.02); transition: border-color .2s, background .2s;
    }
    .dropzone.dragover{ border-color: var(--acc); background: rgba(88,166,255,0.06); }
    .dz-title{font-size:18px; margin:4px 0 0}
    .dz-sub{color:var(--muted); margin:6px 0 14px}
    .btn{
      appearance:none; border:1px solid transparent; background:var(--acc); color:#081018;
      font-weight:600; padding:10px 14px; border-radius:12px; cursor:pointer; margin:4px 6px;
    }
    .btn:hover{filter:brightness(1.05)}
    .btn.ghost{background:transparent; border-color:transparent; color:var(--muted)}
    .btn.outline{background:transparent; color:var(--text); border-color:var(--border)}
    .actions{display:flex; gap:10px; margin-top:12px; justify-content:center; flex-wrap:wrap}
    .note{color:var(--muted); font-size:12px; margin-top:10px; text-align:center}
    .preview{margin-top:18px}
    .preview img{max-width:100%; border-radius:12px; border:1px solid var(--border)}
    .preview-info{display:flex; gap:8px; align-items:center; margin-top:10px; color:var(--muted)}
    .hidden{display:none}
    .warn{color:var(--danger); font-size:14px; margin-top:8px; text-align:center; display:none}
    .warn.show{display:block}
    footer{opacity:.7; text-align:center; margin-top:18px}
  </style>
</head>
<body>
  <header class="container">
    <h1>♻️ TrashTalk</h1>
    <p class="subtitle">Drop a photo or choose one. You need an image to analyze.</p>
  </header>

  <main class="container">
    <section class="card">
      <div class="dropzone" id="dropzone">
        <div>
          <p class="dz-title">Drag & drop an image here</p>
          <p class="dz-sub">or</p>
          <button class="btn" id="chooseBtn" type="button">Choose a photo</button>

          <form id="uploadForm" action="/upload-image" method="post" enctype="multipart/form-data">
            <input id="fileInput" name="image" type="file" accept="image/*" class="hidden" />
            <div class="actions">
              <button id="submitBtn" class="btn" type="submit">Analyze</button>
              <button id="clearBtn" class="btn ghost" type="button">Clear</button>
            </div>
            <div id="warnMsg" class="warn">Please select or drop an image before analyzing.</div>
          </form>

          <p class="note">Max 10MB • JPG/PNG recommended</p>
        </div>
      </div>

      <div id="previewWrap" class="preview hidden">
        <img id="previewImg" alt="Selected preview" />
        <div class="preview-info" id="fileMeta"></div>
      </div>
    </section>
  </main>

  <footer class="container">
    <small>Your friendly neighborhood clean team.</small>
  </footer>

  <script>
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const chooseBtn = document.getElementById('chooseBtn');
    const uploadForm = document.getElementById('uploadForm');
    const submitBtn = document.getElementById('submitBtn');
    const clearBtn = document.getElementById('clearBtn');
    const previewWrap = document.getElementById('previewWrap');
    const previewImg = document.getElementById('previewImg');
    const fileMeta = document.getElementById('fileMeta');
    const warnMsg = document.getElementById('warnMsg');

    let currentFile = null;

    chooseBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => handleFile(e.target.files[0]));

    ['dragenter','dragover'].forEach(ev =>
      dropzone.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); dropzone.classList.add('dragover'); })
    );
    ['dragleave','drop'].forEach(ev =>
      dropzone.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); dropzone.classList.remove('dragover'); })
    );
    dropzone.addEventListener('drop', e => {
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    });

    clearBtn.addEventListener('click', () => {
      currentFile = null;
      fileInput.value = '';
      previewImg.src = '';
      previewWrap.classList.add('hidden');
      fileMeta.textContent = '';
      submitBtn.disabled = true;
      warnMsg.classList.remove('show');
    });

    uploadForm.addEventListener('submit', (e) => {
      // block submit if no file chosen
      if (!fileInput.files || !fileInput.files.length) {
        e.preventDefault();
        warnMsg.classList.add('show');
        return;
      }
      warnMsg.classList.remove('show');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Analyzing…';
    });

    function handleFile(file){
      warnMsg.classList.remove('show');
      if(!file) return;
      if(!file.type.startsWith('image/')){ alert('Please choose an image file.'); return; }
      if(file.size > 10*1024*1024){ alert('File is too large (max 10MB).'); return; }

      // place file into input if came from drag&drop
      if (fileInput.files?.[0] !== file) {
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;
      }

      currentFile = file;
      const reader = new FileReader();
      reader.onload = e => {
        previewImg.src = e.target.result;
        previewWrap.classList.remove('hidden');
        fileMeta.textContent = \`\${file.name} • \${Math.round(file.size/1024)} KB\`;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Analyze';
      };
      reader.readAsDataURL(file);
    }
  </script>
</body>
</html>`;


//upload page
app.get('/upload-image', (req, res) => {
    res.send(uploadHTML)
});

//accepting photo
app.post('/upload-image', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).send('No file selected.');

  try {
    const analysis = await recycleAnalyzer(req.file.path, req.file.mimetype);
    const kb = Math.max(1, Math.round(req.file.size / 1024));

    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>TrashTalk — Result</title>
<style>
  :root{ --bg:#0f1216; --card:#161b22; --muted:#9aa4b2; --acc:#7ee787; --acc2:#58a6ff; --text:#e6edf3; --border:#2a2f37; --danger:#ff6b6b; }
  *{box-sizing:border-box}
  body{ margin:0; font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Inter,Helvetica,Arial;
        background:linear-gradient(180deg,#0d1117 0%,#0f1216 100%); color:var(--text); }
  .container{max-width:900px; margin:0 auto; padding:24px;}
  header h1{margin:.3rem 0 0; font-size:clamp(28px,4vw,40px);}
  .subtitle{margin:8px 0 24px; color:var(--muted)}
  .card{ background:var(--card); border:1px solid var(--border); border-radius:18px; padding:20px; box-shadow:0 10px 30px rgba(0,0,0,.35); }
  .meta{ color:var(--muted); font-size:14px; display:grid; grid-template-columns:max-content 1fr; gap:6px 10px; margin-top:6px }
  .meta b{ color:#c9d1d9 }
  .result{ border:1px solid var(--border); border-radius:12px; padding:14px; background:rgba(126,231,135,0.08); margin-top:16px }
  .result h2{ margin:0 0 6px; color:var(--acc); font-size:20px; }
  .actions{ display:flex; gap:10px; margin-top:16px; flex-wrap:wrap; }
  .btn{ appearance:none; border:1px solid transparent; background:var(--acc2); color:#081018;
        font-weight:600; padding:10px 14px; border-radius:12px; cursor:pointer; text-decoration:none; display:inline-block; }
  .btn.secondary{ background:transparent; color:var(--text); border-color:var(--border); }
</style>
</head>
<body>
  <header class="container">
    <h1>♻️ TrashTalk</h1>
    <p class="subtitle">Here’s what we found from your photo.</p>
  </header>

  <main class="container">
    <section class="card">
      <h3>✅ File Uploaded Successfully</h3>
      <div class="meta">
        <b>Filename:</b> <span>${escapeHtml(req.file.filename)}</span>
        <b>Path:</b> <span>${escapeHtml(req.file.path)}</span>
        <b>Size:</b> <span>${kb} KB</span>
      </div>

      <div class="result">
        <h2>Analysis</h2>
        <p>${escapeHtml(analysis)}</p>
      </div>

      <div class="actions">
        <a class="btn" href="/upload-image">Analyze another photo</a>
        <a class="btn secondary" href="/">Back to Home</a>
      </div>
    </section>
  </main>
</body>
</html>`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error trying to analyze.');
  }
});

// helper at the top or anywhere above this route
function escapeHtml(s=''){
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'}[c]));
}



app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});