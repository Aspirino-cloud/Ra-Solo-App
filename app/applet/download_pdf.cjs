import fs from 'fs';
import https from 'https';
import path from 'path';

const url = 'https://www.dicetreegames.com/ra_rules_en.pdf';
const dest = path.join(process.cwd(), 'public', 'ra_rules.pdf');

// Ensure public directory exists
if (!fs.existsSync(path.join(process.cwd(), 'public'))) {
  fs.mkdirSync(path.join(process.cwd(), 'public'));
}

const file = fs.createWriteStream(dest);
https.get(url, function(response) {
  response.pipe(file);
  file.on('finish', function() {
    file.close(() => {
      console.log('Downloaded to ' + dest);
    });
  });
}).on('error', function(err) {
  fs.unlink(dest, () => {});
  console.error('Error downloading:', err.message);
});
