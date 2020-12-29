// import AWS from 'aws-sdk'
var AWS = require('aws-sdk')
// Enter copied or downloaded access ID and secret key here
const ID = 'AKIAISQKAAM6MQSJTAGQ';
const SECRET = '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';

// The name of the bucket that you have created
const BUCKET_NAME = 'supercuts';

module.exports = new AWS.S3({
  accessKeyId: ID,
  secretAccessKey: SECRET
});
