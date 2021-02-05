// express packages
import express from 'express';
import fs, { rename } from 'fs';
import path from 'path';
import cors from 'cors';
import nunjucks from 'nunjucks';
import bodyParser from 'body-parser';

// 3rd party packages
import ytdl from 'ytdl-core';
import ffmpeg from 'fluent-ffmpeg';

// my modules
import uploadToS3 from './upload-s3';
import getVideoData from './get-video-data';
import {config} from './environment';
import createFFMPEGInstructions from './ffmpeg-instructions';

// types
import {CCBlock} from './types';

// create app 
const app = express();
const port = config.PORT;
const baseURL = config.BASE_URL
const jsonParser = bodyParser.json();



// apply middleware
app.use(express.static(path.join('build', 'src')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use(express.urlencoded({
  extended: true
}))
app.use(cors())

// nunjucks template config
nunjucks.configure(path.join(__dirname, 'views'), {
  autoescape:  true,
  express:  app,
  watch: true
});

app.get('/p/', async (_, res) => {
  res.render('index.njk')
})

app.post('/search-video/:videoURLOrID', async (req,res) => {
  const userInput: string = req.params.videoURLOrID;
  try {
    const videoID: string = ytdl.getVideoID(userInput)
    const videoData = await getVideoData(videoID, 'en')
    res.send(JSON.stringify({videoData: videoData}))
  } catch(err) {
    if (err.message == `No video id found: ${userInput}`) {
      res.send(JSON.stringify({errorMessage: "Please enter a youtube video ID or a full YouTube URL"}))
    } else if (err.message == `Could not find captions for video: ${userInput}`) {
      res.send(JSON.stringify({errorMessage: "Sorry, couldn't find captions data for the video. Try another one"}))
    } else {
      res.send(JSON.stringify({errorMessage: err.message}))
    }
  }
  return
})

app.post('/download/:videoID/:title/:filterWord', jsonParser, async function (req, res) {
  req.setTimeout(0);
  try {
    const filterWord = req.params.filterWord;
    const title = req.params.title;
    const videoID = req.params.videoID;
    const lines: CCBlock[] = req.body.body
    const {videoCutInstructions, audioCutInstructions} = createFFMPEGInstructions(lines, filterWord)
    await downloadFile(`https://www.youtube.com/watch?v=${videoID}`)
    console.log('next....')
    const uploadInProgressPath = path.join('.', 'temp', 'temp.mp4');
    const permPath = path.join('.', 'temp', `${title}.mp4`);
    const supercutPath = path.join('.', 'cuts', `${title}-supercut.mp4`);
    rename(uploadInProgressPath, permPath, async () => {
      await cutVideo(permPath, supercutPath, videoCutInstructions, audioCutInstructions);
      const uploadResult = await uploadToS3(supercutPath);
      console.log('past the upload')
      console.log('uploadResult', uploadResult)
      res.send(JSON.stringify(uploadResult))
    })
    
  } catch(err) {
    console.log(err)  
  }
})

async function downloadFile(downloadURL: string) {
  console.log('downloading file')
  return new Promise<void>( (resolve, reject) => {
    const stream = fs.createWriteStream(path.join('.', 'temp', 'temp.mp4'))
    stream.on('open', () => {

      ytdl(downloadURL).pipe(stream)
    })
    stream.on('finish', () => {
      console.log('finished streaming video')
      resolve()
    });
    stream.on('error', reject);
  })
}

/* 
  translate this to the fluent-ffmpeg 
  ffmpeg -i video \
      -vf "select='between(t,4,6.5)+between(t,17,26)+between(t,74,91)',
          setpts=N/FRAME_RATE/TB" \
      -af "aselect='between(t,4,6.5)+between(t,17,26)+between(t,74,91)',
          asetpts=N/SR/TB" out.mp4
  source: https://stackoverflow.com/questions/50594412/cut-multiple-parts-of-a-video-with-ffmpeg
*/
async function cutVideo(videoPath: string, permPath: string, videoCutInstructions: string, audioCutInstructions: string) {
  console.log("Inside cutvideo function", videoPath) 
  return new Promise<void>( (resolve, reject)  => {
    ffmpeg(videoPath)
      .outputOptions(
        "-vf", `${videoCutInstructions}`, 
        "-af", `${audioCutInstructions}`
      )
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(permPath)
  })
}

app.listen(port, () => {
  console.log(`Example app listening at ${baseURL}:${port}`)
})

