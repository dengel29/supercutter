import {CCBlock} from './types'

export default function createFFMPEGInstructions(lines: CCBlock[], keyword: string): {videoCutInstructions: string, audioCutInstructions: string } {
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
  return {videoCutInstructions: videoCutInstructions, audioCutInstructions: audioCutInstructions}
}