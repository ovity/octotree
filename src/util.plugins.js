// Add custom JS Tree Plugins here

/**
 * Mimic logic from JSTree
 * https://github.com/vakata/jstree/blob/master/src/misc.js#L148
 *
 * Plugin truncate path name
 */
(function($) {
  'use strict';
  $.jstree.defaults.truncate = $.noop;
  $.jstree.plugins.truncate = function(opts, parent) {
    this.redraw_node = function(obj, deep, callback, force_draw) {
      obj = parent.redraw_node.call(this, obj, deep, callback, force_draw);
      if (obj) {
        $(obj)
          .find('.jstree-anchor')
          .contents()
          .filter(function() {
            // Get text node which is path name
            return this.nodeType === 3;
          })
          .wrap('<div style="overflow: hidden;text-overflow: ellipsis;"></div>')
          .end();
      }

      return obj;
    };
  };
})($);
