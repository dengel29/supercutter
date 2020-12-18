import { getSubtitles } from 'youtube-captions-scraper';
import express from 'express';

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

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
