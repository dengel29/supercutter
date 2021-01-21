import dotenv from 'dotenv';
import path from 'path';

const development = process.env.NODE_ENV == 'development'

dotenv.config({path: path.join(__dirname, '.env')})
export const config = {
  AWS: {
    ID: process.env.AWS_ID,
    SECRET:  process.env.AWS_SECRET
  },
  BASE_URL: development ? 'http://localhost' : 'http://139.59.242.210',
  PORT: 3000
}