import {CCBlock} from './types'



export default function createFFMPEGInstructions(lines: CCBlock[], keyword: string): {videoCutInstructions: string, audioCutInstructions: string } {
  lines = lines.filter(line => line.text.includes(keyword))
  // is single word or is multi-word
  let videoCutInstructions = "select='"
  let audioCutInstructions = "aselect='"
  for (const line of lines) {
    // check if single- or multi-word
    let timesString;
    // if (keyword.trim().split(' ').length > 1) {
    //   console.log('multiword')
    //   timesString = `between(t,${line.start},${Number(line.start)+Number(line.dur)})+`
    // } else {
      const stringArray =line.text.split(' ');
      const pos = stringArray.findIndex(el=> el == keyword);
      const end = Number(line.start) + Number(line.dur);
      const adjuster = line.dur * .7 ;
      console.table({...line, end: end, adjuster: adjuster})
      // eslint-disable-next-line prefer-const
      timesString = (stringArray.length - pos) > (stringArray.length / 2) ?
       `between(t,${line.start},${end - adjuster})+` : `between(t,${end - adjuster},${end})+`
    // }
    

  console.log(timesString)
    //select='between(t,4,6.5)+between(t,17,26)+between(t,74,91)
    // const timesString = `between(t,${line.start},${Number(line.start)+Number(line.dur)})+`
    videoCutInstructions = videoCutInstructions.concat(timesString)
    audioCutInstructions = audioCutInstructions.concat(timesString)

  }
  videoCutInstructions = videoCutInstructions.slice(0, -1).concat('\', setpts=N/FRAME_RATE/TB');
  audioCutInstructions = audioCutInstructions.slice(0, -1).concat('\', asetpts=\'N/SR/TB\'');
  return {
    videoCutInstructions: videoCutInstructions, 
    audioCutInstructions: audioCutInstructions
  }
}

