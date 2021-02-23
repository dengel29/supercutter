import axios from 'axios';
import {CCBlock, ThumbsObject, VideoData, VideoRequestString} from './types';
import getTranscript from './get-transcript'

async function getDecodedVideoInfo(url:string): Promise<string> {
  let msg;
  try {
    const { data } = await axios.get(
    `https://youtube.com/get_video_info?video_id=${url}`
    );
    msg = decodeURIComponent(data);
    
  } catch(e) {
    msg = "There was an error decoding the video data. Try again."
  }
  return msg
}

export default async function getVideoData(videoID: string, lang: string): Promise<VideoData> {
  console.log('inside videodata method')
  const vs: VideoRequestString = {videoID: videoID, lang: lang}
  const decodedData = await getDecodedVideoInfo(vs.videoID)
  // ensure the decoded data has the captionTracks info
  // console.log(decodedData)
  //// title
  const titleRegex = /(?="title":{"simpleText":).*(?=},"description")/;
  const videoTitle = titleRegex.exec(decodedData)[0].replace(`"title":{"simpleText":`, '').replace(/\+/g, ' ').replace(/"/g, '')
  const uploadDateRegex = /\d\d\d\d-\d\d-\d\d/;
  const uploadDate = uploadDateRegex.exec(decodedData)[0]
  // console.log(uploadDate)
  if (!decodedData.includes('captionTracks')) {
    let uploadedTime: number = Math.round(((new Date().getTime() - new Date(uploadDate).getTime()) / 86400000))
    console.log(uploadedTime)
    if (uploadedTime < 10) {
      throw new Error(`Could not find captions for video: ${videoTitle}. It was only uploaded in the past 10 days, so Google or the uploader might not have created subtitles for it. Try again in a few days, or try another video`)
    }
    throw new Error(`Could not find captions for video: ${videoTitle}`);
  }

  /* captionTracks look like this: 
    captionTracks looks like this
    [
      {
        baseUrl: 'https://www.youtube.com/api/timedtext?v=QPjhAZd1RLI&po_langs=de,en,es,fr,it,ja,ko,nl,pt,ru&caps=asr&exp=xftt&xorp=true&xoaf=5&hl=zh-TW&ip=0.0.0.0&ipbits=0&expire=1608306851&sparams=ip,ipbits,expire,v,asr_langs,caps,exp,xorp,xoaf&signature=C6D2F64D9325491770F7F63CBC02E4587DC243A3.EB016D9708A28DDECF08A80ECE640018816F0F4C&key=yt8&kind=asr&lang=en',
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
  // console.log(decodedData)
  const { captionTracks } = JSON.parse(`${match}}`);
  const vidData = captionTracks.find( ({ vssId })  => vssId === `.${vs.lang}` || vssId === `a.${vs.lang}` || vssId && vssId.match(`.${vs.lang}`))
  // * ensure we have found the correct vidData lang
  console.log("video data", vidData)
  if (!vidData || (vidData && !vidData.baseUrl))
    throw new Error(`Could not find ${vs.lang} captions for ${vs.videoID}`);


  // get other video data after we know we can get captions

  
  //// thumbnails
  const thumbsRegex = /(?={"thumbnails":).*(?=,"averageRating)/;
  const [thumbsMatch]: RegExpExecArray = thumbsRegex.exec(decodedData)
  const thumbsObj: ThumbsObject = JSON.parse(thumbsMatch)
  const thumbnails = thumbsObj.thumbnails

  // convert XML transcript into an array of CCBlocks
  const lines: Array<CCBlock> = await getTranscript(vidData.baseUrl)
  console.log(lines)
  return {
    title: 'Subs for your video',
    videoTitle: videoTitle,
    captions: lines,
    thumbs: thumbnails,
    videoID: vs.videoID,
    videoURL: `https://www.youtube.com/watch?v=${vs.videoID}`
  }
}