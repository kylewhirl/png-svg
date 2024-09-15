const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const potrace = require('potrace');
const { Readable } = require('stream');

const app = express();

// Use the PORT environment variable assigned by the platform, or default to 5070 for local testing
const port = process.env.PORT || 5070;

// Configure multer to handle image uploads
const upload = multer({ storage: multer.memoryStorage() });

// Function to convert PNG buffer to SVG
function pngBufferToSvg(buffer, callback) {
  console.log('Processing image buffer. Buffer length:', buffer.length);

  sharp(buffer)
    .greyscale()
    .normalize()  // Enhance contrast
    .threshold(128) // Apply thresholding to make the image binary
    .toBuffer((err, processedBuffer) => {
      if (err) {
        console.error("Error converting image to buffer:", err);
        return callback(err);
      }

      console.log('Image successfully converted to buffer. Buffer length:', processedBuffer.length);

      potrace.trace(processedBuffer, {
        type: 'svg',
        turdSize: 0, // Lower turd size for higher detail
        optTolerance: 0.1 // Lower tolerance for higher precision
      }, (err, svg) => {
        if (err) {
          console.error("Error tracing image:", err);
          return callback(err);
        }

        console.log('SVG successfully generated. SVG length:', svg.length);

        const cleanedSvg = svg.replace(/fill="[^"]*"/g, '');
        callback(null, cleanedSvg);
      });
    });
}

app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  pngBufferToSvg(req.file.buffer, (err, svg) => {
    if (err) {
      return res.status(500).send('Error processing image.');
    }

    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  });
});

app.listen(port, () => {
  console.log(`Server running at public URL, listening on port: ${port}`);
});
