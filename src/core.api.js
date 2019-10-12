const GH_RESERVED_USER_NAMES = [
  'settings',
  'orgs',
  'organizations',
  'site',
  'blog',
  'about',
  'explore',
  'styleguide',
  'showcases',
  'trending',
  'stars',
  'dashboard',
  'notifications',
  'search',
  'developer',
  'account',
  'pulls',
  'issues',
  'features',
  'contact',
  'security',
  'join',
  'login',
  'watching',
  'new',
  'integrations',
  'gist',
  'business',
  'mirrors',
  'open-source',
  'personal',
  'pricing',
  'sessions',
  'topics',
  'users',
  'marketplace'
];
const GH_RESERVED_REPO_NAMES = ['followers', 'following', 'repositories'];
const GH_404_SEL = '#parallax_wrapper';
const GH_RAW_CONTENT = 'body > pre';

class OctotreeService {
  constructor() {
    this.reset();
  }

  load(loadFn) {
    loadFn();
  }

  // Hooks
  activate(inputs, opts) {}

  applyOptions(opts) {
    return false;
  }

  reset() {
    this.getAccessToken = this._getAccessToken;
    this.shouldShowOctotree = this._shouldShowOctotree;
    this.getInvalidTokenMessage = this._getInvalidTokenMessage;
  }

  _getAccessToken() {
    return window.store.get(window.STORE.TOKEN);
  }

  _getInvalidTokenMessage({responseStatus, requestHeaders}) {
    return (
      'The GitHub access token is invalid. ' +
      'Please go to <a class="settings-btn" href="javascript:void(0)">Settings</a> and update the token.'
    );
  }

  _shouldShowOctotree() {
    if ($(GH_404_SEL).length) {
      return false;
    }

    // Skip raw page
    if ($(GH_RAW_CONTENT).length) {
      return false;
    }

    // (username)/(reponame)[/(type)][/(typeId)]
    const match = window.location.pathname.match(/([^\/]+)\/([^\/]+)(?:\/([^\/]+))?(?:\/([^\/]+))?/);
    if (!match) {
      return false;
    }

    const username = match[1];
    const reponame = match[2];

    // Not a repository, skip
    if (~GH_RESERVED_USER_NAMES.indexOf(username) || ~GH_RESERVED_REPO_NAMES.indexOf(reponame)) {
      return false;
    }

    return true;
  }
}

window.octotree = new OctotreeService();
