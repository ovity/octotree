chrome.runtime.onMessage.addListener((req, sender, sendRes) => {
  const handler = {
    requestPermissions: () => {
      const urls = (req.urls || []).filter((url) => url.trim() !== '').map((url) => {
        if (url.slice(-2) === '/*') {
          return url;
        }
        if (url.slice(-1) === '/') {
          return url + '*';
        }
        return url + '/*';
      });

      if (urls.length === 0) {
        sendRes(true);
        removeUnnecessaryPermissions();
      } else {
        chrome.permissions.request({origins: urls}, (granted) => {
          sendRes(granted);
          removeUnnecessaryPermissions();
        });
      }
      return true;

      function removeUnnecessaryPermissions() {
        const whitelist = urls.concat(['https://github.com/*']);
        chrome.permissions.getAll((permissions) => {
          const toBeRemovedUrls = permissions.origins.filter((url) => {
            return !~whitelist.indexOf(url);
          });

          if (toBeRemovedUrls.length) {
            chrome.permissions.remove({origins: toBeRemovedUrls});
          }
        });
      }
    }
  };

  return handler[req.type]();
});
