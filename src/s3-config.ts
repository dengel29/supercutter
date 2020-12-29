import AWS from 'aws-sdk'
// Enter copied or downloaded access ID and secret key here
const ID = 'AKIAISQKAAM6MQSJTAGQ';
const SECRET = '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';

export const s3 = new AWS.S3({
  accessKeyId: ID,
  secretAccessKey: SECRET
});
