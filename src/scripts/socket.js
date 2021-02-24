// const url = "http://localhost:3000";
const socket = io();
function superCutStarted() {
  let message = {
    videoTitle: 'test',
    videoDuration: 900,
    supercutDuration: 400,
    supercutKeyword: 'ok',
  };
  socket.emit('supercutStarted', message);
}

// document
//   .createElement('p')
//   .innerHtml('Supercut is <mark>downloading</mark> the video from Youtube');
socket.on('youtubeVideoDownloadStarted', () => {
  document.getElementById('download-progress').innerHTML =
    'Supercut is <mark>downloading</mark> the video from Youtube';
});
socket.on('youtubeVideoDownloadComplete', () => {
  document.getElementById('download-progress').innerHTML =
    '<p>Supercut has <mark>finished downloading</mark> the video</p>';
});
socket.on('supercutStarted', () => {
  document.getElementById('download-progress').innerHTML =
    '<p>Supercut has <mark>started cutting</mark> the video</p>';
});
socket.on('supercutComplete', () => {
  document.getElementById('download-progress').innerHTML =
    '<p>Supercut has <mark>finished cutting</mark> up your video</p>';
});
socket.on('uploadStarted', () => {
  document.getElementById('download-progress').innerHTML =
    '<p>Your supercut <mark>is being uploaded</mark> to the cloud<p>';
});
socket.on('uploadComplete', () => {
  document.getElementById('download-progress').innerHTML =
    '<p>Your supercut <mark>is uploaded to the cloud!</mark> Watch the video here <mark>or</mark> right-click the link to download the file<p>';
});
socket.on('error', () => {
  document.getElementById('download-progress').innerHTML =
    'There has been an error :( give our servers a few minutes and try again';
});

let p = document.createElement('p');
p.innerHtml += 'Supercut is <mark>downloading</mark> the video from Youtube';

// progress.replaceWith(p);
