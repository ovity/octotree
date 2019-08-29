/**
 * Mimic logic from JSTree
 * https://github.com/vakata/jstree/blob/master/src/misc.js#L148
 *
 * Plugin wrap patch container between patch divs
 */
(function($, undefined) {
  'use strict';
  $.jstree.defaults.patch = $.noop;
  $.jstree.plugins.patch = function(options, parent) {
    this.redraw_node = function(obj, deep, callback, force_draw) {
      obj = parent.redraw_node.call(this, obj, deep, callback, force_draw);
      if (obj) {
        $(obj)
          .find('.jstree-anchor')
          .html(function(index, htmlString) {
            /**
             * Wrap the patch container except the icon and the last octotree patch
             *
             * Example: 'octotree/src/file.js'
             *
             * <div class="jstree-anchor">
             *  <i>file icon</i>
             *  <div class="octotree-patch-container">
             *   octotree
             *   <span class="octotree-patch">
             *     14 files +123 -12
             *   </span>
             *   /src
             *   <span class="octotree-patch">
             *     14 files +123 -12
             *   </span>
             *  </div>
             *  <span class="octotree-patch">
             *     14 files +123 -12
             *  </span>
             * </div>
             */

            return `${htmlString
              .replace('</i>', '</i><div class="octotree-patch-container">')
              .replace(
                /<span class="octotree-patch">(?!.*<span class="octotree-patch">)/,
                '</div><span class="octotree-patch">'
              )}`;
          });
      }

      return obj;
    };
  };
})($);
