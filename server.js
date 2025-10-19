const express = require('express');
const app = express();
const multer  = require('multer');
const { recycleAnalyzer } = require('./recycleAnalyzerAPI');
const path = require('path');
const fs = require('fs')
const analyzeResult = path.join(".", 'analyzeResult.html')
const mainPage = path.join(".", 'main.html')
const port = 3000;





//storage engine
const storage = multer.diskStorage({
    // Sets the destination directory for the uploaded files
    destination: (req, file, cb) => {
        cb(null, 'uploadedImages/');
    },
    // Sets the filename
    filename: (req, file, cb) => {
        cb(null, "userImage");
    }
});


const upload = multer({ storage: storage });

//home page to be redirected
app.get('/', (req, res) => {
  res.redirect('/upload-image');
});



//upload page
app.get('/upload-image', (req, res) => {
    try {
    mainHTML = fs.readFileSync(mainPage, 'utf-8'); //main page html
    res.send(mainHTML)
    } catch (err) {
        res.status(404).send('Page could not be uploaded.');
        console.log(err)
    }
});

//accepting photo
app.post('/upload-image', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).send('No file selected.');
    resultHTML = fs.readFileSync(analyzeResult, 'utf-8');
  try {
    const analysis = await recycleAnalyzer(req.file.path, req.file.mimetype);
    resultHTML = resultHTML.replace('${analysis}', escapeHtml(analysis))

    res.send(resultHTML);

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