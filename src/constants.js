const PREFIX = 'octotree'

const STORE = {
  TOKEN     : 'octotree.access_token',
  REMEMBER  : 'octotree.remember',
  NONCODE   : 'octotree.noncode_shown',
  HOTKEYS   : 'octotree.hotkeys',
  LOADALL   : 'octotree.loadall',
  POPUP     : 'octotree.popup_shown',
  WIDTH     : 'octotree.sidebar_width',
  SHOWN     : 'octotree.sidebar_shown',
  GHEURLS   : 'octotree.gheurls.shared',
  GLEURLS   : 'octotree.gleurls.shared'
}

const DEFAULTS = {
  TOKEN     : '',
  REMEMBER  : true,
  NONCODE   : true,
  LOADALL   : true,
  // @ifdef SAFARI
  HOTKEYS   : '⌘+b, ⌃+b',
  // @endif
  // @ifndef SAFARI
  HOTKEYS   : '⌘+⇧+s, ⌃+⇧+s',
  // @endif
  GHEURLS   : '',
  GLEURLS   : '',
  WIDTH     : 232,
  POPUP     : false,
  SHOWN     : false
}

const EVENT = {
  TOGGLE        : 'octotree:toggle',
  LOC_CHANGE    : 'octotree:location',
  LAYOUT_CHANGE : 'octotree:layout',
  REQ_START     : 'octotree:start',
  REQ_END       : 'octotree:end',
  OPTS_CHANGE   : 'octotree:change',
  VIEW_READY    : 'octotree:ready',
  VIEW_CLOSE    : 'octotree:close',
  FETCH_ERROR   : 'octotree:error'
}
