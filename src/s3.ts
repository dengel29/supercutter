import AWS from 'aws-sdk'
import {config} from './environment'

export const s3 = new AWS.S3({
  accessKeyId: config.AWS.ID,
  secretAccessKey: config.AWS.SECRET
});