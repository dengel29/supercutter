import { getSubtitles } from 'youtube-captions-scraper';
import express from 'express';
import axios from 'axios';
import he from 'he';
import striptags from 'striptags'


const app = express()
const port = 3000

app.get('/v/:videoId', (req, res) => {
  console.log(req.params)
  getSubtitles({
    videoID: req.params.videoId, // youtube video id
    lang: 'en' // default: `en`
  }).then((captions: JSON) => {
    res.send(captions)
  });
})

app.get('/p/:videoId/:lang', async (req) => {


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
  const [match] = regex.exec(decodedData);
  console.log(match)
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

  // * ensure we have found the correct vidData lang
  if (!vidData || (vidData && !vidData.baseUrl))
    throw new Error(`Could not find ${vs.lang} captions for ${vs.videoId}`);


    const { data: transcript } = await axios.get(vidData.baseUrl);
    const lines = transcript
    .replace('<?xml version="1.0" encoding="utf-8" ?><transcript>', '')
    .replace('</transcript>', '')
    .split('</text>')
    .filter(line => line && line.trim())
    .map(line => {
      console.log(line);
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

    return lines;
  })


// }

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
