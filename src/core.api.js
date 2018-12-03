class OctotreeService {
  getAccessToken() {
    return window.store.get(window.STORE.TOKEN);
  }

  getInvalidTokenMessage({responseStatus, requestHeaders}) {
    return (
      'The GitHub access token is invalid. ' +
      'Please go to <a class="settings-btn" href="javascript:void(0)">Settings</a> and update the token.'
    );
  }
}

window.octotree = new OctotreeService();
