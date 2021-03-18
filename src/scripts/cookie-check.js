function cookies() {
  return {
    hide: true,
    allowCookies() {
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

        let acceptedCookieRequest = cookies.find(
          (item) => item['cookieType'] === 'cookieRequest',
        );
        if (acceptedCookieRequest) {
          this.hide = acceptedCookieRequest.allow === 'true';
        } else {
          this.hide = false;
        }
      });
    },
  };
}
