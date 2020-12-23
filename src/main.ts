import fs, { rename } from 'fs';
import path from 'path';
import express from 'express';
import nunjucks from 'nunjucks';
import axios from 'axios';
import he from 'he';
import striptags from 'striptags'
import ytdl from 'ytdl-core';
import ffmpeg from 'fluent-ffmpeg';


const download = true;
const app = express()
const port = 3000;
nunjucks.configure(path.join(__dirname, 'views'), {
  autoescape:  true,
  express:  app,
  watch: true
});

// app.get('/v/:videoId', (req, res) => {
//   console.log(req.params)
//   getSubtitles({
//     videoID: req.params.videoId, // youtube video id
//     lang: 'en' // default: `en`
//   }).then((captions: JSON) => {
//     res.send(captions)
//   });
// })

app.get('/p/:videoId/:lang', async (req, res) => {


type VideoString = {videoId: string, lang: string}
const vs: VideoString = {videoId: req.params.videoId, lang: req.params.lang}
const { data } = await axios.get(
  `https://youtube.com/get_video_info?video_id=${vs.videoId}`
);

  const decodedData: string = decodeURIComponent(data);
  // * ensure we have access to captions data
  if (!decodedData.includes('captionTracks'))
    throw new Error(`Could not find captions for video: ${vs.videoId}`);

  const regex = /({"captionTracks":.*isTranslatable":(true|false)}])/;
  const [match]: RegExpExecArray = regex.exec(decodedData);
  const titleRegex = /(?="title":{"simpleText":).*(?=},"description")/;
  const videoTitle = titleRegex.exec(decodedData)[0].replace(`"title":{"simpleText":`, '').replace(/\+/g, ' ').replace(/"/g, '')
  const thumbsRegex = /(?={"thumbnails":).*(?=,"averageRating)/;
  const [thumbsMatch]: RegExpExecArray = thumbsRegex.exec(decodedData)

  type ThumbsObject = {thumbnails: [{url:string, width: number, height: number}]}
  const thumbsObj: ThumbsObject = JSON.parse(thumbsMatch)
  const thumbnails = thumbsObj.thumbnails
  // console.log(thumbsMatch.thumbnails)
  // const [titleMatch] = titleRegex.exec(decodedData);
  const { captionTracks } = JSON.parse(`${match}}`);

/* captionTracks looks like this
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
  const vidData = captionTracks.find( ({ vssId })  => vssId === `.${vs.lang}` || vssId === `a.${vs.lang}` || vssId && vssId.match(`.${vs.lang}`))
  type CCBlock = {
    start: number,
    dur: number,
    text: string,
  }
  // * ensure we have found the correct vidData lang
  if (!vidData || (vidData && !vidData.baseUrl))
    throw new Error(`Could not find ${vs.lang} captions for ${vs.videoId}`);


    const { data: transcript } = await axios.get(vidData.baseUrl);
    let lines: Array<CCBlock> = transcript
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
    lines = lines.filter(line => line.text.includes('bounce'))
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
    const pageData = {
      title: 'Subs for your video',
      videoTitle: videoTitle,
      subtitleLines: lines,
      thumbs: thumbnails,
      videoId: vs.videoId,
      videoUrl: `https://www.youtube.com/watch?v=${vs.videoId}`

    }
    
    if (download) {

      await downloadFile(`https://www.youtube.com/watch?v=${vs.videoId}`)
      const tempPath = './temp/temp.mp4'
      const permPath = `./temp/${videoTitle}.mp4`
      rename(tempPath, permPath, async () => {
        console.log('renamed the shit, no going to cut the video')
        await cutVideo(permPath, videoCutInstructions, audioCutInstructions)
      });
    }
    
    res.render('index.html', pageData)
    return lines;
  })

/* eslint-disable @typescript-eslint/no-unused-vars */
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
    // working harcoded version, for reference
    // ffmpeg(videoPath)
    //   .outputOptions(
    //     "-vf", "select='between(t,4,6.5)+between(t,17,26)+between(t,74,91)', setpts=N/FRAME_RATE/TB", 
    //     "-af", "aselect='between(t,4,6.5)+between(t,17,26)+between(t,74,91)', asetpts='N/SR/TB'"
    //   )
    //   .on('end', () => console.log("we've done it"))
    //   .on('error', (err) => console.error(err))
    //   .save('./cuts/trimmed.mp4')
    
    ffmpeg(videoPath)
      .outputOptions(
        "-vf", `${videoCutInstructions}`, 
        "-af", `${audioCutInstructions}`
      )
      .on('end', () => console.log("we've done it"))
      .on('error', (err) => console.error(err))
      .save('./cuts/trimmed.mp4')
  }

// }

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
