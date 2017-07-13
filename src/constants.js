const NODE_PREFIX = 'octotree'
const ADDON_CLASS = 'octotree'
const SHOW_CLASS = 'octotree-show'

const STORE = {
  TOKEN                               : 'octotree.access_token',
  REMEMBER                            : 'octotree.remember',
  NONCODE                             : 'octotree.noncode_shown',
  HOTKEYS                             : 'octotree.hotkeys',
  LOADALL                             : 'octotree.loadall',
  POPUP                               : 'octotree.popup_shown',
  WIDTH                               : 'octotree.sidebar_width',
  SHOWN                               : 'octotree.sidebar_shown',
  GHEURLS                             : 'octotree.gheurls.shared',
  GLEURLS                             : 'octotree.gleurls.shared',
  SEARCH_FUZZY                        : 'octotree.search.fuzzy',
  SEARCH_CASE_SENSITIVE               : 'octotree.search.case_sensitive',
  SEARCH_SHOW_ONLY_MATCHES            : 'octotree.search.show_only_matches',
  SEARCH_SHOW_ONLY_MATCHES_CHILDREN   : 'octotree.search.show_only_matches_children',
  SEARCH_CLOSE_OPENED_ONCLEAR         : 'octotree.search.close_opened_onclear',
  SEARCH_SEARCH_LEAVES_ONLY           : 'octotree.search.search_leaves_only'
}

const DEFAULTS = {
  TOKEN                              : '',
  REMEMBER                           : true,
  NONCODE                            : true,
  LOADALL                            : true,
  HOTKEYS                            : '⌘+⇧+s, ⌃+⇧+s',
  POPUP                              : false,
  WIDTH                              : 232,
  SHOWN                              : false,
  GHEURLS                            : '',
  GLEURLS                            : '',
  SEARCH_FUZZY                       : false,
  SEARCH_CASE_SENSITIVE              : false,
  SEARCH_SHOW_ONLY_MATCHES           : false,
  SEARCH_SHOW_ONLY_MATCHES_CHILDREN  : true,
  SEARCH_CLOSE_OPENED_ONCLEAR        : true,
  SEARCH_SEARCH_LEAVES_ONLY          : false
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
