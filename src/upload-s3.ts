import fs from 'fs';
import {s3} from './s3';
type S3UploadResult = {
  success: boolean,
  value: string
};

const BUCKET_NAME = 'supercuts'

export default async function uploadToS3(filePath:string): Promise<S3UploadResult> {
  return new Promise<S3UploadResult> ((resolve, reject) => {
    console.log('made it to upload')
    const fileContent = fs.readFileSync(filePath);
    const title = filePath.replace(/.\/cuts/, '').replace(/[/|\s|-]/g, '-')
    const params = {
      Bucket: BUCKET_NAME,
      Key: title, // File name you want to save as in S3
      Body: fileContent,
      ACL:'public-read'
    };
    console.log('getting ready to upload the thing')
    let uploadOutcome: S3UploadResult
    const upload = s3.upload(params)
    upload.promise().then(data => {
      console.log(`File uploaded successfully. ${data.Location}`);
      uploadOutcome = {
        success: true,
        value: data.Location
      }
      console.log(uploadOutcome)
      resolve(uploadOutcome)
    }, err => {
      uploadOutcome = {
        success: false, 
        value: err.message
      }
      console.log(uploadOutcome)
      reject(uploadOutcome)
    })
  })
}