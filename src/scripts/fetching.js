function videoSearch() {
  return {
    videoData: null,
    baseURL: null,
    videoSearchError: null,
    videoFound: false,
    isLoading: false,
    filterWord: '',
    searchedFilterWord: '',
    title: null,
    videoURLOrID: '',
    video: null,
    filteredCaptions: null,
    noMatch: null,
    sendableCaptions: '',
    supercutSuccess: null,
    supercutURL: '',
    hasFiltered: false,
    totalDuration: 0,
    searchYoutube(e) {
      console.log('working');
      // send the ID or URL to see if the video exists;
      // returns to client subtitles if it does exist;
      // returns an error message if it does not exist;
      this.videoData = null;
      this.videoSearchError = null;
      this.filterWord = '';
      this.title = null;
      this.filteredCaptions = null;
      this.videoFound = false;
      this.baseURL = window.location.hostname;
      this.isLoading = true;
      fetch(`/search-video/${encodeURIComponent(this.videoURLOrID)}`, {
        method: 'POST',
      })
        .then((res) => res.json())
        .then((data) => {
          this.isLoading = false;
          if (data.errorMessage) {
            e.target.previousElementSibling.focus();
            this.videoSearchError = data.errorMessage;
            this.videoData = null;
            this.filteredCaptions = null;
            this.videoFound = false;
          } else {
            this.videoSearchError = null;
            this.videoFound = true;
            this.videoData = data.videoData;
            this.filteredCaptions = data.videoData.captions;
          }
        });
    },
    filterCaptions() {
      // filter captions that have already been returned;
      let filter = new RegExp(this.filterWord, 'i');
      this.filteredCaptions = this.videoData.captions.filter((line) =>
        line.text.match(filter),
      );
      this.hasFiltered = true;
      this.noMatch = this.filteredCaptions.length < 1;
      this.searchedFilterWord = this.filterWord;
      console.log(this.filteredCaptions[0]);
      this.totalDuration = this.filteredCaptions.reduce(
        (sum, cap) => sum + Number(cap.dur),
        0,
      );
    },
    downloadVideo() {
      this.isLoading = true;
      const body = { body: this.filteredCaptions };

      // send the filtered captions to create the supercut;
      const title = encodeURIComponent(
        this.videoData.videoTitle.replace(/[\W\s\/]/g, '-').toLowerCase(),
      );
      var supercutObject = {
        title: this.videoData.videoTitle,
        filter: this.filterWord,
        videoURL: `https://supercuts.s3.amazonaws.com/cuts-${title}-${this.filterWord}-supercut.mp4`,
        cookieType: 'supercut',
      };
      window.localStorage.setItem(
        `${this.videoData.videoTitle}:${this.filterWord}`,
        JSON.stringify(supercutObject),
      );

      fetch(`/download/${this.videoData.videoID}/${title}/${this.filterWord}`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then((res) => res.json())
        .then((data) => {
          this.isLoading = false;
          this.supercutSuccess = data.success;
          this.supercutURL = data.value;
        });
    },
  };
}
