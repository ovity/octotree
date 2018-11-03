const NODE_PREFIX = 'octotree';
const ADDON_CLASS = 'octotree';
const SHOW_CLASS = 'octotree-show';
const PINNED_CLASS = 'octotree_pinned';
const SIDEBAR_HIDING_DELAY = 3000;

const STORE = {
  TOKEN: 'octotree.access_token',
  NONCODE: 'octotree.noncode_shown',
  PR: 'octotree.pr_shown',
  HOTKEYS: 'octotree.hotkeys',
  ICONS: 'octotree.icons',
  LOADALL: 'octotree.loadall',
  POPUP: 'octotree.popup_shown',
  WIDTH: 'octotree.sidebar_width',
  SHOWN: 'octotree.sidebar_shown',
  GHEURLS: 'octotree.gheurls.shared',
  PINNED: 'octotree.sidebar_pinned'
};

const DEFAULTS = {
  TOKEN: '',
  NONCODE: true,
  PR: true,
  LOADALL: true,
  HOTKEYS: '⌘+⇧+s, ⌃+⇧+s',
  ICONS: true,
  POPUP: false,
  WIDTH: 232,
  SHOWN: false
};

const EVENT = {
  TOGGLE: 'octotree:toggle',
  PIN: 'octotree:pin',
  LOC_CHANGE: 'octotree:location',
  LAYOUT_CHANGE: 'octotree:layout',
  REQ_START: 'octotree:start',
  REQ_END: 'octotree:end',
  OPTS_CHANGE: 'octotree:change',
  VIEW_READY: 'octotree:ready',
  VIEW_CLOSE: 'octotree:close',
  FETCH_ERROR: 'octotree:error',
  HOTKEYS_CHANGED: 'octotree:change'
};

window.STORE = STORE;
window.DEFAULTS = DEFAULTS;
window.EVENT = EVENT;
