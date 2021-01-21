import {CCBlock} from './types'

/* 
all commented-out code here is regarding tightening the video cuts – it's not yet consistent enough so defaulting to previous implementation until further improvement
*/
export default function createFFMPEGInstructions(lines: CCBlock[], keyword: string): {videoCutInstructions: string, audioCutInstructions: string } {
  lines = lines.filter(line => line.text.includes(keyword))
  // is single word or is multi-word
  let videoCutInstructions = "select='"
  let audioCutInstructions = "aselect='"
  for (const line of lines) {
    // check if single- or multi-word
    // let timesString: string;
    // const stringArray =line.text.replace(/[.,/#!$%^&*;:{}=\-_`~()\n]/g, '').split(' ');
    // const pos = stringArray.findIndex(el=> el == keyword);
    // const end = Number(line.start) + Number(line.dur);
    // const mid = stringArray.length / 2
    // const len =  stringArray.length
    // adjuster works okay for some videos, less so for others
    // let adjuster = line.dur * .7 ;

    // if len - pos is less than mid that means the position is in the upper half
    // if len - pos is greater than mid that means the position is in the lower half
    // if len - pos is greater than pos - mid, pos is closer to mid than end (if in upper half)

    // timestring ~ select='between(t,4,6.5)+between(t,17,26)+between(t,74,91)
    
    // if (true || line.dur <= 3) {
    const timesString = `between(t,${line.start},${Number(line.start)+Number(line.dur)})+`
    // }
    // // all this code is to test tightening up the video cuts
    // else if (len >= 5 && ((len - pos) <= mid) && (len - pos) > (pos - mid) ) {
    //   // in middle, after mid
    //   adjuster = line.dur * .15
    //   timesString = `between(t,${Number(line.start) + Number(line.dur) / 2},${end - adjuster})+`
    // } else if (len >= 5 && ((len - pos) >= mid) && (mid - pos) < (mid / 2) )  {
    //   // in middle, before mid
    //   adjuster = line.dur * .15
    //   timesString = `between(t,${Number(line.start) + adjuster},${end - adjuster})+`
    // }
    // else if ((len - pos) > mid) {
    //   // towards start
    //   timesString = `between(t,${Number(line.start) - 0.25},${end - adjuster})+`;
    // } else if ((len - pos) <= mid) {
    //   // towards end
    //   timesString = `between(t,${end - adjuster},${end + 0.25})+`
    // }
    // console.table({...line, end: end, adjuster: adjuster, timesString: timesString, length: len, position: pos, mid: mid})
    
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

