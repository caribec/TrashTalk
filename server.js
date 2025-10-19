const express = require('express');
const app = express();
const multer  = require('multer');
const path = require('path');
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
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

//home page
app.get('/', (req, res) => {
  res.send('<h1>Image Upload Server Running</h1><p>Visit /upload to see the form.</p>');
});


let uploadHTML = 
`<!DOCTYPE html>
        <html>
        <head>
            <title>Image Upload</title>
        </head>
        <body>
            <h1>Can I recycle it?</h1>
            <p>Upload an image and see if you can recycle it or not!</p>
            <form action="/upload" method="post" enctype="multipart/form-data">
                <input type="file" name="image" accept="image/*" required>
                <button type="submit">Upload Image</button>
            </form>
        </body>
        </html>`;

//upload page
app.get('/upload-image', (req, res) => {
    res.send(uploadHTML)
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});