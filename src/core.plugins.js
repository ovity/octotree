/**
 * Class to manage Octotree plugins.
 */
class PluginManager {
  /**
   * @constructor
   */
  constructor() {
    this._plugins = [];
    this._forward({
      activate: null,
      applyOptions: (results) => results.some((shouldReload) => !!shouldReload)
    });
  }

  /**
   * Registers a plugin class.
   * @param {!Plugin} pluginClass.
   */
  register(plugin) {
    this._plugins.push(plugin);
  }

  /**
   * Forwards the specified methods to every plugins.
   * @private {!Object<!String, !function(Array<*>): *} methods
   * @return the value returned by the collector function associated with each
   * method.
   */
  _forward(methods) {
    for (const method of Object.keys(methods)) {
      this[method] = async (...args) => {
        const promises = this._plugins.map((plugin) => plugin[method](...args));
        const results = await Promise.all(promises);
        const resultHandler = methods[method];

        if (!resultHandler) return results;
        else return resultHandler(results);
      };
    }
  }
}

/**
 * Base plugin class.
 */
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
   * @return {!Promise<undefined>}
   */
  async activate(opts) {
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

window.pluginManager = new PluginManager();
window.Plugin = Plugin;
