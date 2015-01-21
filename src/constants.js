const
    PREFIX = 'octotree'

  , STORE = {
    TOKEN    : 'octotree.github_access_token',
    COLLAPSE : 'octotree.collapse',
    TABSIZE  : 'octotree.tabsize',
    REMEMBER : 'octotree.remember',
    LAZYLOAD : 'octotree.lazyload',
    HOTKEYS  : 'octotree.hotkeys',
    GHEURLS  : 'octotree.gheurls',
    WIDTH    : 'octotree.sidebar_width',
    POPUP    : 'octotree.popup_shown',
    SHOWN    : 'octotree.sidebar_shown',
    NONCODE  : 'octotree.noncode_shown',
  }

  , DEFAULTS = {
    TOKEN    : '',
    COLLAPSE : false,
    TABSIZE  : '',
    REMEMBER : false,
    LAZYLOAD : false,
    // @ifdef SAFARI
    HOTKEYS  : '⌘+b, ⌃+b',
    // @endif
    // @ifndef SAFARI
    HOTKEYS  : '⌘+⇧+s, ⌃+⇧+s',
    // @endif
    GHEURLS  : '',
    WIDTH    : 250,
    POPUP    : false,
    SHOWN    : false,
    NONCODE  : false,
  }

  , EVENT = {
    TOGGLE        : 'octotree:toggle',
    LOC_CHANGE    : 'octotree:location',
    LAYOUT_CHANGE : 'octotree:layout',
    REQ_START     : 'octotree:start',
    REQ_END       : 'octotree:end',
    OPTS_CHANGE   : 'octotree:change',
    VIEW_READY    : 'octotree:ready',
    VIEW_CLOSE    : 'octotree:close',
  }