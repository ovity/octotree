class Plugin {
  /**
   * Activates the plugin.
   * @param {!{
   *   adapter: !Adapter,
   *   $sidebar: !JQuery,
   *   $toggler: !JQuery,
   *   $views: !JQuery,
   *   treeView: !TreeView,
   *   optsView: !OptionsView,
   *   errorView: !ErrorView,
   * }}
   *
   * @param {{
   *  state: UserState,
   * }}
   *
   * @return {!Promise<undefined>}
   */
  async activate(opts, payload) {
    return undefined;
  }

  /**
   * Deactivate the plugin.
   *
   * @param {{
   *  state: UserState,
   * }} payload
   */
  async deactivate(payload) {
    return undefined;
  }

  /**
   * Applies the option changes user has made.
   * @param {!Object<!string, [(string|boolean), (string|boolean)]>} changes
   * @return {!Promise<boolean>} iff the tree should be reloaded.
   */
  async applyOptions(changes) {
    return false;
  }
}

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

  load(loadFn) {
    loadFn();
  }

  activate(inputs, opts) {}

  applyOptions(opts) {
    return false;
  }
}

window.octotree = new OctotreeService();
window.Plugin = Plugin;
