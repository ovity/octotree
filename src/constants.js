const
    PREFIX = 'octotree'

  , STORE = {
    TOKEN    : 'octotree.github_access_token',
    COLLAPSE : 'octotree.collapse',
    REMEMBER : 'octotree.remember',
    LAZYLOAD : 'octotree.lazyload',
    HOTKEYS  : 'octotree.hotkeys',
    GHEURLS  : 'octotree.gheurls',
    WIDTH    : 'octotree.sidebar_width',
    POPUP    : 'octotree.popup_shown',
    SHOWN    : 'octotree.sidebar_shown',
  }

  , EVENT = {
    TOGGLE      : 'octotree:toggle',
    LOC_CHANGE  : 'octotree:location',
    REQ_START   : 'octotree:start',
    REQ_END     : 'octotree:end',
    OPTS_CHANGE : 'octotree:change',
    VIEW_READY  : 'octotree:ready',
    VIEW_CLOSE  : 'octotree:close',
  }