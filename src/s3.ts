import AWS from 'aws-sdk'
// Enter copied or downloaded access ID and secret key here
const ID = process.env.AWS_ID
const SECRET = process.env.AWS_SECRET

export const s3 = new AWS.S3({
  accessKeyId: ID,
  secretAccessKey: SECRET
});