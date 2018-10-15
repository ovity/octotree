/**
 * Class to manage Octotree plugins.
 */
class PluginManager {
  /**
   * @constructor
   */
  constructor() {
    this._pluginClasses = [];
    this._plugins = [];

    this._forward({
      optionsChanged: (res) => res.some((val) => !!val),
    });
  }

  /**
   * Registers a plugin class.
   * @param {function(): Plugin} pluginClass.
   */
  register(PluginClass) {
    this._pluginClasses.push(PluginClass);
  }

  /**
   * Activates the plugins.
   * @param {!Object} opts
   */
  activate(opts) {
    this._pluginClasses.forEach((PluginClass) => {
      this._plugins.push(new PluginClass(opts));
    });
  }

  /**
   * Forwards the specified methods to every plugins.
   * @private {!Object<!String, !function(Array<*>): *} methods
   * @return the value returned by the collector function associated with each
   * method.
   */
  _forward(methods) {
    for (const method of Object.keys(methods)) {
      this[method] = (...args) => {
        const results = this._plugins.map((plugin) => plugin[method](...args));
        const resultHandler = methods[method];
        return resultHandler(results);
      };
    }
  }
}

/**
 * Base plugin class.
 */
class Plugin {
  /**
   * Invoked when the user saves the option changes in the option view.
   * @param {!Object<!string, [(string|boolean), (string|boolean)]>} changes
   * @return {boolean} iff the tree should be reloaded.
   */
  optionsChanged(changes) {
    return false;
  }
}

const pluginManager = new PluginManager();
