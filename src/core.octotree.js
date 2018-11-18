class OctotreeService {
  getAccessToken() {
    return window.store.get(window.STORE.TOKEN);
  }

  getAccessTokenErrorMessage(jqXHR) {
    let message = '';

    switch (jqXHR.status) {
      case 401:
        message =
          'The GitHub access token is invalid. ' +
          'Please go to <a class="settings-btn" href="javascript:void(0)">Settings</a> and update the token.';
        break;
      case 404:
        message =
          'Accessing private repositories requires a GitHub access token. ' +
          'Please go to <a class="settings-btn" href="javascript:void(0)">Settings</a> and enter a token.';
        break;
      case 403:
        if (~jqXHR.getAllResponseHeaders().indexOf('X-RateLimit-Remaining: 0')) {
          // It's kinda specific for GitHub
          message =
            'You have exceeded the <a href="https://developer.github.com/v3/#rate-limiting">GitHub API rate limit</a>. ' +
            'To continue using Octotree, you need to provide a GitHub access token. ' +
            'Please go to <a class="settings-btn" href="javascript:void(0)">Settings</a> and enter a token.';
          break;
        } else {
          message =
            'Accessing private repositories requires a GitHub access token. ' +
            'Please go to <a class="settings-btn" href="javascript:void(0)">Settings</a> and enter a token.';
          break;
        }
    }

    return message;
  }
}

window.octotreeService = new OctotreeService();
