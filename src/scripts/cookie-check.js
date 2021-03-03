function cookies() {
  return {
    hide: true,
    allowCookies() {
      console.log('clicked');
      let cookie = {
        cookieType: 'cookieRequest',
        allow: 'true',
      };
      window.localStorage.setItem(`allowCookies`, JSON.stringify(cookie));
      this.hide = true;
    },
    disallowCookies() {
      let cookie = {
        cookieType: 'cookieRequest',
        allow: 'false',
      };
      window.localStorage.setItem(`allowCookies`, JSON.stringify(cookie));
      this.hide = false;
    },
    initialize() {
      document.addEventListener('DOMContentLoaded', (event) => {
        let cookies = Object.keys(localStorage).map((k) => {
          return JSON.parse(localStorage[k]);
        });
        console.log(cookies);
        let acceptedCookieRequest = cookies.find(
          (item) => item['cookieType'] === 'cookieRequest',
        );
        if (acceptedCookieRequest) {
          this.hide = acceptedCookieRequest.allow === 'true';
          console.log(this.hide);
        } else {
          this.hide = false;
        }
      });
    },
  };
}
