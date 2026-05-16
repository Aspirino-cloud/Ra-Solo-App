const fs = require('fs');
const https = require('https');
const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
const { createCanvas } = require('canvas');

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, function(response) {
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 308) {
          download(response.headers.location, dest).then(resolve).catch(reject);
          return;
      }
      response.pipe(file);
      file.on('finish', function() {
        file.close(resolve);
      });
    }).on('error', function(err) {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function extract() {
  console.log("Downloading PDF...");
  await download('https://www.dicetreegames.com/ra_rules_en.pdf', 'ra.pdf');
  console.log("Loading PDF...");
  const data = new Uint8Array(fs.readFileSync('ra.pdf'));
  const pdf = await pdfjs.getDocument({data, disableFontFace: true}).promise;
  
  let imgCount = 0;
  for(let i = 1; i <= pdf.numPages; i++) {
     const page = await pdf.getPage(i);
     const operatorList = await page.getOperatorList();
     
     for (let j = 0; j < operatorList.fnArray.length; j++) {
        if (operatorList.fnArray[j] === pdfjs.OPS.paintImageXObject) {
           const objId = operatorList.argsArray[j][0];
           try {
             const imgMap = await page.objs.get(objId);
             if (imgMap && imgMap.width && imgMap.height) {
                 imgCount++;
                 console.log(`Page ${i} found image ${imgCount}: ${imgMap.width}x${imgMap.height}`);
             }
           } catch(e) {
               console.log("could not get image object", objId);
           }
        }
     }
  }
}
extract().catch(console.error);
