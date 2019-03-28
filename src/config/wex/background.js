chrome.runtime.onInstalled.addListener(({reason}) => {
  if (reason === 'install' || reason === 'update') {
    chrome.tabs.create({
      url: 'https://github.com/ovity/octotree/blob/v3/HISTORY.md#v300',
      active: false
    });
  }
});
