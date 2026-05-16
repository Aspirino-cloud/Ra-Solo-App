const https = require('https');

https.get('https://melodice.org', (res) => {
  console.log(res.headers);
});
