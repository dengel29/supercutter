import dotenv from 'dotenv';

const development = process.env.NODE_ENV == 'development'

dotenv.config()
export const config = {
  AWS: {
    ID: process.env.AWS_ID,
    SECRET:  process.env.AWS_SECRET
  },
  BASE_URL: development ? 'http://localhost' : 'http://134.122.13.169',
  PORT: development ? 3000 : 80
}