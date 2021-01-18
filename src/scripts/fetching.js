function videoSearch() {
  return {
    videoData: null,
    baseURL: null,
    videoSearchError: null,
    videoFound: false,
    isLoading: false,
    filterWord: '',
    title: null,
    videoURLOrID: '',
    video: null,
    filteredCaptions: null,
    sendableCaptions: '',
    supercutSuccess: null,
    supercutURL: '',
    searchYoutube() {
      // send the ID or URL to see if the video exists;
      // returns to client subtitles if it does exist;
      // returns an error message if it does not exist;
      this.baseURL = window.location.hostname
      this.isLoading = true;
      fetch(`/search-video/${encodeURIComponent(this.videoURLOrID)}`, {
        method: 'POST'
      })
        .then(res => res.json())
        .then(data => {
          this.isLoading = false;
          if (data.errorMessage) {
            this.videoSearchError = data.errorMessage;
            this.videoData = null;
            this.filteredCaptions = null;
            this.videoFound = false;
          } else {
            this.videoSearchError = null;
            console.log(data.videoData);
            this.videoFound = true;
            this.videoData = data.videoData
            this.filteredCaptions = data.videoData.captions
          }
        })
    },
    filterCaptions() {
      // filter captions that have already been returned;
      this.filteredCaptions = this.videoData.captions.filter(line => line.text.includes(this.filterWord))

    },

    downloadVideo() {
      const body = { body: this.filteredCaptions }

      // vsY0pdCW9N0
      // send the filtered captions to create the supercut;
      // TODO return a link to video download
      const title = encodeURIComponent(this.videoData.videoTitle.replace(/\/\?/g, ''))
      fetch(`/download/${this.videoData.videoID}/${title}/${this.filterWord}`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then(res => res.json())
        .then(data => {
          this.supercutSuccess = data.success
          this.supercutURL = data.value;
        })
    }
  }
}