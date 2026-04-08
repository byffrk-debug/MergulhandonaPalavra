const fs = require('fs');
const https = require('https');

https.get('https://lh3.googleusercontent.com/d/1XWBN6QFOTcRTmAWR_XEs1LAmYflSLw_6', (res) => {
  if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 303) {
    https.get(res.headers.location, (res2) => {
      const file = fs.createWriteStream('public/certificado-bg.png');
      res2.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('Download completed');
      });
    });
  } else {
    const file = fs.createWriteStream('public/certificado-bg.png');
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Download completed');
    });
  }
});
