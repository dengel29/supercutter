import dotenv from 'dotenv';

dotenv.config()
export const config = {
  AWS: {
    ID: process.env.AWS_ID,
    SECRET:  process.env.AWS_SECRET
  },
  BASE_URL: process.env.NODE_ENV == 'development' ? 'http://localhost' : 'http://134.122.13.169'
}