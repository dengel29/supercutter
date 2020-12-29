// import { s3 } from './s3-config';
// import fs, { rename } from 'fs';
var s3 = require('./s3-config.js')
var fs = require('fs')

const BUCKET_NAME = 'supercuts'

const uploadToS3 = (fileName) => {
  const fileContent = fs.readFileSync(fileName);

  const params = {
    Bucket: BUCKET_NAME,
    Key: 'trimmed2.mp4', // File name you want to save as in S3
    Body: fileContent,
    ContentType: 'video/mp4',
    ACL: 'public-read'
  };
  s3.upload(params, function (err, data) {
    if (err) {
      throw err;
    }
    console.log(`File uploaded successfully. ${data.Location}`);
  });
}

uploadToS3('./cuts/trimmed.mp4')