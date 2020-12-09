const GH_RESERVED_USER_NAMES = [
  'about',
  'account',
  'blog',
  'business',
  'contact',
  'dashboard',
  'developer',
  'explore',
  'features',
  'gist',
  'integrations',
  'issues',
  'join',
  'login',
  'marketplace',
  'mirrors',
  'new',
  'notifications',
  'open-source',
  'organizations',
  'orgs',
  'personal',
  'pricing',
  'pulls',
  'search',
  'security',
  'sessions',
  'settings',
  'showcases',
  'site',
  'sponsors',
  'stars',
  'styleguide',
  'topics',
  'trending',
  'watching',
];
const GH_RESERVED_REPO_NAMES = ['followers', 'following', 'repositories'];
const GH_404_SEL = '#parallax_wrapper';
const GH_RAW_CONTENT = 'body > pre';

class OctotreeService {
  constructor() {
    this.reset();
  }

  // Hooks
  activate(inputs, opts) {}

  applyOptions(opts) {
    return false;
  }

  // Public
  load(loadFn) {
    loadFn();
  }

  reset() {
    this.getAccessToken = this._getAccessToken;
    this.shouldShowOctotree = this._shouldShowOctotree;
    this.getInvalidTokenMessage = this._getInvalidTokenMessage;
    this.setNodeIconAndText = this._setNodeIconAndText;
  }

  // Private
  _getAccessToken() {
    return window.extStore.get(window.STORE.TOKEN);
  }

  _getInvalidTokenMessage({responseStatus, requestHeaders}) {
    return (
      'The GitHub access token is invalid. ' +
      'Please go to <a class="settings-btn">Settings</a> and update the token.'
    );
  }

  async _setNodeIconAndText(context, item) {
    if (item.type === 'blob') {
      if (await extStore.get(STORE.ICONS)) {
        const className = FileIcons.getClassWithColor(item.text);
        item.icon += ' ' + (className || 'file-generic');
      } else {
        item.icon += ' file-generic';
      }
    }
  }

  async _shouldShowOctotree() {
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
