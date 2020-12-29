import fs, { rename } from 'fs';
import path from 'path';
import express from 'express';
import nunjucks from 'nunjucks';
import axios from 'axios';
import he from 'he';
import striptags from 'striptags'
import ytdl from 'ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import bodyParser from 'body-parser';
import {s3} from './s3-config';


const BUCKET_NAME = 'supercuts'

const uploadToS3 = (fileName) => {
  const fileContent = fs.readFileSync(fileName);
  const params = {
    Bucket: BUCKET_NAME,
    Key: 'supercut.mp4', // File name you want to save as in S3
    Body: fileContent,
    ACL:'public-read'
  };
  s3.upload(params, function(err, data) {
    if (err) {
        throw err;
    }
    console.log(`File uploaded successfully. ${data.Location}`);
  });
}


const app = express()
const port = 3000;
const jsonParser = bodyParser.json()

// middleware
app.use(express.static(path.join('build', 'src')));
app.use(express.urlencoded({
  extended: true
}))

// nunjucks template config
nunjucks.configure(path.join(__dirname, 'views'), {
  autoescape:  true,
  express:  app,
  watch: true
});

type CCBlock = {
  start: number,
  dur: number,
  text: string,
}

type VideoRequestString = {videoID: string, lang: string}

async function getDecodedVideoInfo(url:string): Promise<string> {
  const { data } = await axios.get(
  `https://youtube.com/get_video_info?video_id=${url}`
);

  return decodeURIComponent(data);
}

app.get('/p/', async (_, res) => {
  res.render('index.njk')
})

app.post('/search-video/:videoURLOrID', async (req,res) => {
  console.log(req.params)
  const userInput: string = req.params.videoURLOrID;
  try {
    const videoID: string = ytdl.getVideoID(userInput)
    const videoData = await getVideoData(videoID)
    res.send(JSON.stringify({videoData: videoData}))
  } catch(err) {
    if (err.message == `No video id found: ${userInput}`)
    res.send(JSON.stringify({errorMessage: "Please enter a youtube video ID or a full YouTube URL"}))
  }
})

app.get('/p/:videoId/:lang', async (req, res) => {
// given the video URL or ID, get video info thumbnails, title, captions
  const vs: VideoRequestString = {videoID: req.params.videoID, lang: req.params.lang}
  const decodedData = await getDecodedVideoInfo(vs.videoID)
  // ensure the decoded data has the captionTracks info
  if (!decodedData.includes('captionTracks'))
    throw new Error(`Could not find captions for video: ${vs.videoID}`);

  /* captionTracks look like this: 
    captionTracks looks like this
    [
      {
        baseUrl: 'https://www.youtube.com/api/timedtext?v=QPjhAZd1RLI&asr_langs=de,en,es,fr,it,ja,ko,nl,pt,ru&caps=asr&exp=xftt&xorp=true&xoaf=5&hl=zh-TW&ip=0.0.0.0&ipbits=0&expire=1608306851&sparams=ip,ipbits,expire,v,asr_langs,caps,exp,xorp,xoaf&signature=C6D2F64D9325491770F7F63CBC02E4587DC243A3.EB016D9708A28DDECF08A80ECE640018816F0F4C&key=yt8&kind=asr&lang=en',
        name: { simpleText: '英文+(自動產生)' },
        vssId: 'a.en',
        languageCode: 'en',
        kind: 'asr',
        isTranslatable: true
      }
    ]
  */
  
  // get caption tracks or throw an error
  const regex = /({"captionTracks":.*isTranslatable":(true|false)}])/;
  const [match]: RegExpExecArray = regex.exec(decodedData);
  const { captionTracks } = JSON.parse(`${match}}`);
  const vidData = captionTracks.find( ({ vssId })  => vssId === `.${vs.lang}` || vssId === `a.${vs.lang}` || vssId && vssId.match(`.${vs.lang}`))
  // * ensure we have found the correct vidData lang
  if (!vidData || (vidData && !vidData.baseUrl))
    throw new Error(`Could not find ${vs.lang} captions for ${vs.videoID}`);


  // get other video data after we know we can get captions
  //// title
  const titleRegex = /(?="title":{"simpleText":).*(?=},"description")/;
  const videoTitle = titleRegex.exec(decodedData)[0].replace(`"title":{"simpleText":`, '').replace(/\+/g, ' ').replace(/"/g, '')
  
  //// thumbnails
  const thumbsRegex = /(?={"thumbnails":).*(?=,"averageRating)/;
  const [thumbsMatch]: RegExpExecArray = thumbsRegex.exec(decodedData)
  type ThumbsObject = {thumbnails: [{url:string, width: number, height: number}]}
  const thumbsObj: ThumbsObject = JSON.parse(thumbsMatch)
  const thumbnails = thumbsObj.thumbnails
  // console.log(thumbsMatch.thumbnails)
  // const [titleMatch] = titleRegex.exec(decodedData);

  // convert XML transcript into an array of CCBlocks
  const lines: Array<CCBlock> = await getTranscript(vidData.baseUrl)
  
  // create video and audio cut instructions for ffmpeg based on search word
  
  const download = false;
  if (download) {
    const keyword = 'greatest'
    const {videoCutInstructions, audioCutInstructions} = createFFMPEGInstructions(lines, keyword)
    await downloadFile(`https://www.youtube.com/watch?v=${vs.videoID}`)
    const tempPath = './temp/temp.mp4'
    const permPath = `./temp/${videoTitle}.mp4`
    rename(tempPath, permPath, async () => {
      console.log('renamed the shit, start cutting the video')
      await cutVideo(permPath, videoCutInstructions, audioCutInstructions)
    });
  }
  
  const pageData = {
    title: 'Subs for your video',
    videoTitle: videoTitle,
    captions: lines,
    thumbs: thumbnails,
    videoId: vs.videoID,
    videoUrl: `https://www.youtube.com/watch?v=${vs.videoID}`

  }
    
    
    res.render('index.njk', pageData)
    return lines;
  })

async function getVideoData(videoID: string, lang = 'en') {
  const download = false
  const vs: VideoRequestString = {videoID: videoID, lang: lang}
  const decodedData = await getDecodedVideoInfo(vs.videoID)
  // ensure the decoded data has the captionTracks info
  if (!decodedData.includes('captionTracks'))
    throw new Error(`Could not find captions for video: ${vs.videoID}`);

  /* captionTracks look like this: 
    captionTracks looks like this
    [
      {
        baseUrl: 'https://www.youtube.com/api/timedtext?v=QPjhAZd1RLI&asr_langs=de,en,es,fr,it,ja,ko,nl,pt,ru&caps=asr&exp=xftt&xorp=true&xoaf=5&hl=zh-TW&ip=0.0.0.0&ipbits=0&expire=1608306851&sparams=ip,ipbits,expire,v,asr_langs,caps,exp,xorp,xoaf&signature=C6D2F64D9325491770F7F63CBC02E4587DC243A3.EB016D9708A28DDECF08A80ECE640018816F0F4C&key=yt8&kind=asr&lang=en',
        name: { simpleText: '英文+(自動產生)' },
        vssId: 'a.en',
        languageCode: 'en',
        kind: 'asr',
        isTranslatable: true
      }
    ]
  */
  
  // get caption tracks or throw an error
  const regex = /({"captionTracks":.*isTranslatable":(true|false)}])/;
  const [match]: RegExpExecArray = regex.exec(decodedData);
  const { captionTracks } = JSON.parse(`${match}}`);
  const vidData = captionTracks.find( ({ vssId })  => vssId === `.${vs.lang}` || vssId === `a.${vs.lang}` || vssId && vssId.match(`.${vs.lang}`))
  // * ensure we have found the correct vidData lang
  if (!vidData || (vidData && !vidData.baseUrl))
    throw new Error(`Could not find ${vs.lang} captions for ${vs.videoID}`);


  // get other video data after we know we can get captions
  //// title
  const titleRegex = /(?="title":{"simpleText":).*(?=},"description")/;
  const videoTitle = titleRegex.exec(decodedData)[0].replace(`"title":{"simpleText":`, '').replace(/\+/g, ' ').replace(/"/g, '')
  
  //// thumbnails
  const thumbsRegex = /(?={"thumbnails":).*(?=,"averageRating)/;
  const [thumbsMatch]: RegExpExecArray = thumbsRegex.exec(decodedData)
  type ThumbsObject = {thumbnails: [{url:string, width: number, height: number}]}
  const thumbsObj: ThumbsObject = JSON.parse(thumbsMatch)
  const thumbnails = thumbsObj.thumbnails
  // console.log(thumbsMatch.thumbnails)
  // const [titleMatch] = titleRegex.exec(decodedData);

  // convert XML transcript into an array of CCBlocks
  const lines: Array<CCBlock> = await getTranscript(vidData.baseUrl)
  
  // create video and audio cut instructions for ffmpeg based on search word
  
  
  if (download) {
    const keyword = 'greatest'
    const {videoCutInstructions, audioCutInstructions} = createFFMPEGInstructions(lines, keyword)
    await downloadFile(`https://www.youtube.com/watch?v=${vs.videoID}`)
    const tempPath = './temp/temp.mp4'
    const permPath = `./temp/${videoTitle}.mp4`
    rename(tempPath, permPath, async () => {
      console.log('renamed the shit, start cutting the video')
      await cutVideo(permPath, videoCutInstructions, audioCutInstructions)
    });
  }
  
  return {
    title: 'Subs for your video',
    videoTitle: videoTitle,
    captions: lines,
    thumbs: thumbnails,
    videoID: vs.videoID,
    videoURL: `https://www.youtube.com/watch?v=${vs.videoID}`

  }
}


async function getTranscript(videoDataURL: string): Promise<Array<CCBlock>> {
  const { data: transcript } = await axios.get(videoDataURL);
  return transcript
  .replace('<?xml version="1.0" encoding="utf-8" ?><transcript>', '')
  .replace('</transcript>', '')
  .split('</text>')
  .filter(line => line && line.trim())
  .map(line => {
    const startRegex = /start="([\d.]+)"/;
    const durRegex = /dur="([\d.]+)"/;

    const [, start] = startRegex.exec(line);
    const [, dur] = durRegex.exec(line);

    const htmlText = line
    .replace(/<text.+>/, '')
    .replace(/&amp;/gi, '&')
    .replace(/&amp;#39;/gi, "'")
    .replace(/<\/?[^>]+(>|$)/g, '');

    const decodedText = he.decode(htmlText);
    const text = striptags(decodedText);

    return {
      start,
      dur,
      text,
    };
  });
}

app.post('/download/:videoID/:title/:filterWord', jsonParser, async function (req, res) {
  try {
    console.log(req.params)
    const filterWord = req.params.filterWord;
    const title = req.params.title;
    const videoID = req.params.videoID;
    const lines: CCBlock[] = req.body.body
    const {videoCutInstructions, audioCutInstructions} = createFFMPEGInstructions(lines, filterWord)
    await downloadFile(`https://www.youtube.com/watch?v=${videoID}`)
    const tempPath = './temp/temp.mp4'
    const permPath = `./temp/${title}.mp4`
    rename(tempPath, permPath, async () => {
      console.log('renamed the shit, start cutting the video')
      await cutVideo(permPath, videoCutInstructions, audioCutInstructions)
    });
  } catch(err) {
    console.log(err)  
  }

  res.end() 
})

function createFFMPEGInstructions(lines: CCBlock[], keyword: string): {videoCutInstructions: string, audioCutInstructions: string } {
  lines = lines.filter(line => line.text.includes(keyword))
  let videoCutInstructions = "select='"
  let audioCutInstructions = "aselect='"
  for (const line of lines) {
    //select='between(t,4,6.5)+between(t,17,26)+between(t,74,91)
    const timesString = `between(t,${line.start},${Number(line.start)+Number(line.dur)})+`
    videoCutInstructions = videoCutInstructions.concat(timesString)
    audioCutInstructions = audioCutInstructions.concat(timesString)

  }
  videoCutInstructions = videoCutInstructions.slice(0, -1).concat('\', setpts=N/FRAME_RATE/TB');
  audioCutInstructions = audioCutInstructions.slice(0, -1).concat('\', asetpts=\'N/SR/TB\'');
  console.log(videoCutInstructions)
  console.log(audioCutInstructions)
  return {videoCutInstructions: videoCutInstructions, audioCutInstructions: audioCutInstructions}
}

async function downloadFile(downloadURL: string) {
  return new Promise( (resolve, reject) => {
    const stream = fs.createWriteStream('./temp/temp.mp4')
    ytdl(downloadURL).pipe(stream)
    stream.on('finish', resolve);
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
async function cutVideo(videoPath: string, videoCutInstructions: string, audioCutInstructions: string) {
  console.log("Inside cutvideo function", videoPath) 
  /* 
    working harcoded version, for reference
    ffmpeg(videoPath)
      .outputOptions(
        "-vf", "select='between(t,4,6.5)+between(t,17,26)+between(t,74,91)', setpts=N/FRAME_RATE/TB", 
        "-af", "aselect='between(t,4,6.5)+between(t,17,26)+between(t,74,91)', asetpts='N/SR/TB'"
      )
      .on('end', () => console.log("we've done it"))
      .on('error', (err) => console.error(err))
      .save('./cuts/trimmed.mp4')
  */
  
  ffmpeg(videoPath)
    .outputOptions(
      "-vf", `${videoCutInstructions}`, 
      "-af", `${audioCutInstructions}`
    )
    .on('end', () => console.log("we've done it"))
    .on('error', (err) => console.error(err))
    .save('./cuts/trimmed.mp4')
}

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
