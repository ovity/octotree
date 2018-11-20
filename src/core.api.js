class OctotreeService {
  getAccessToken() {
    return window.store.get(window.STORE.TOKEN);
  }

  getInvalidTokenMessage({responseStatus, requestHeaders}) {
    let message = '';

    switch (responseStatus) {
      case 401:
        message =
          'The GitHub access token is invalid. ' +
          'Please go to <a class="settings-btn" href="javascript:void(0)">Settings</a> and update the token.';
        break;
    }

    return message;
  }
}

window.octotree = new OctotreeService();
