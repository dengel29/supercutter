import axios from 'axios';
import he from 'he';
import striptags from 'striptags';
import {CCBlock} from './types'

export default async function getTranscript(videoDataURL: string): Promise<Array<CCBlock>> {
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