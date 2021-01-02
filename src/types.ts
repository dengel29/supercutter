export type CCBlock = {
  start: number,
  dur: number,
  text: string,
}

export type VideoRequestString = {
  videoID: string, 
  lang: string
}
export type ThumbsObject = {
  thumbnails: [
    {
      url:string, 
      width: number, 
      height: number
    }
  ]
}

export type ThumbsArray = [
  {
    url:string, 
    width: number, 
    height: number
  }
]

export type VideoData = {
  title: string,
  videoTitle: string,
  captions: Array<CCBlock>,
  thumbs: ThumbsArray,
  videoID: string,
  videoURL: string
}