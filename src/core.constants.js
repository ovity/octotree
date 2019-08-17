const NODE_PREFIX = 'octotree';
const ADDON_CLASS = 'octotree';
const SHOW_CLASS = 'octotree-show';
const PINNED_CLASS = 'octotree-pinned';

const STORE = {
  TOKEN: 'octotree.access_token',
  HOVEROPEN: 'octotree.hover_open',
  SHOWIN_ALL: 'octotree.all_shown',
  SHOWIN_CODE_COMMIT_PR: 'octotree.code_commit_pr_shown',
  SHOWIN_CODE_COMMIT: 'octotree.code_commit_shown',
  SHOWIN_PR_ONLY: 'octotree.pr_shown',
  PR: 'octotree.prdiff_shown',
  HOTKEYS: 'octotree.hotkeys',
  ICONS: 'octotree.icons',
  LOADALL: 'octotree.loadall',
  POPUP: 'octotree.popup_shown',
  WIDTH: 'octotree.sidebar_width',
  SHOWN: 'octotree.sidebar_shown',
  PINNED: 'octotree.sidebar_pinned',
  HUGE_REPOS: 'octotree.huge_repos'
};

const CACHE = {
  CACHENAME: 'octotree.cache'
};

const DEFAULTS = {
  TOKEN: '',
  HOVEROPEN: true,
  SHOWIN_ALL: true,
  SHOWIN_CODE_COMMIT_PR: false,
  SHOWIN_CODE_COMMIT: false,
  SHOWIN_PR_ONLY: false,
  PR: true,
  LOADALL: true,
  HOTKEYS: '⌘+⇧+s, ⌃+⇧+s',
  ICONS: true,
  POPUP: false,
  WIDTH: 232,
  SHOWN: false,
  PINNED: false,
  HUGE_REPOS: {}
};

const EVENT = {
  TOGGLE: 'octotree:toggle',
  TOGGLE_PIN: 'octotree:pin',
  LOC_CHANGE: 'octotree:location',
  LAYOUT_CHANGE: 'octotree:layout',
  REQ_START: 'octotree:start',
  REQ_END: 'octotree:end',
  OPTS_CHANGE: 'octotree:change',
  VIEW_READY: 'octotree:ready',
  VIEW_CLOSE: 'octotree:close',
  VIEW_SHOW: 'octotree:show',
  FETCH_ERROR: 'octotree:error'
};

window.STORE = STORE;
window.DEFAULTS = DEFAULTS;
window.EVENT = EVENT;
