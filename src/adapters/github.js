// When Github page loads at repo path e.g. https://github.com/jquery/jquery, the HTML tree has
// <main id="js-repo-pjax-container"> to contain server-rendered HTML in response of pjax.
// However, that <main> element doesn't have "id" attribute if the Github page loads at specific
// File e.g. https://github.com/jquery/jquery/blob/master/.editorconfig.
// Therefore, the below selector uses many path but only points to the same <main> element
const GH_PJAX_CONTAINER_SEL =
  '#js-repo-pjax-container, div[itemtype="http://schema.org/SoftwareSourceCode"] main, [data-pjax-container]';

const GH_CONTAINERS = '.pagehead > nav, .container, .container-lg, .container-responsive';
const GH_FULL_WIDTH_CONTAINERS = '.js-header-wrapper > header, .application-main .full-width, .flash-full';
const GH_MAX_HUGE_REPOS_SIZE = 50;
const GH_HIDDEN_RESPONSIVE_CLASS = '.d-none';
const GH_RESPONSIVE_BREAKPOINT = 1010;

class GitHub extends PjaxAdapter {
  constructor() {
    super(GH_PJAX_CONTAINER_SEL);
  }

  // @override
  init($sidebar) {
    super.init($sidebar);

    // Fix #151 by detecting when page layout is updated.
    // In this case, split-diff page has a wider layout, so need to recompute margin.
    // Note that couldn't do this in response to URL change, since new DOM via pjax might not be ready.
    const diffModeObserver = new window.MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (~mutation.oldValue.indexOf('split-diff') || ~mutation.target.className.indexOf('split-diff')) {
          return $(document).trigger(EVENT.LAYOUT_CHANGE);
        }
      });
    });

    diffModeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
      attributeOldValue: true
    });
  }

  // @override
  getCssClass() {
    return 'octotree-github-sidebar';
  }

  // @override
  async shouldLoadEntireTree(repo) {
    const isGlobalLazyLoad = await extStore.get(STORE.LAZYLOAD);
    if (isGlobalLazyLoad) {
      return false;
    }

    // Else, return true only if it isn't in a huge repo list, which we must lazy load
    const key = `${repo.username}/${repo.reponame}`;
    const hugeRepos = await extStore.get(STORE.HUGE_REPOS);
    if (hugeRepos[key] && isValidTimeStamp(hugeRepos[key])) {
      // Update the last load time of the repo
      hugeRepos[key] = new Date().getTime();
      await extStore.set(STORE.HUGE_REPOS, hugeRepos);
    }
    return !hugeRepos[key];
  }

  // @override
  getCreateTokenUrl() {
    return (
      `${location.protocol}//${location.host}/settings/tokens/new?` +
      'scopes=repo&description=Octotree%20browser%20extension'
    );
  }

  // @override
  updateLayout(sidebarPinned, sidebarVisible, sidebarWidth) {
    const SPACING = 20;
    const $fullWidthContainers = $(GH_FULL_WIDTH_CONTAINERS);
    const $html = $('html');
    const dockSide = this.getDockSide();

    if (sidebarPinned && sidebarVisible) {
      const screenWidth = $(window).width();
      const $containers = screenWidth <= GH_RESPONSIVE_BREAKPOINT
        ? $(GH_CONTAINERS).not(GH_HIDDEN_RESPONSIVE_CLASS)
        : $(GH_CONTAINERS);
      const autoMarginLeft = Math.max(0, (screenWidth - $containers.outerWidth()) / 2);
      const htmlMarginLeft = Math.min(sidebarWidth, Math.max(0, sidebarWidth - autoMarginLeft + SPACING) * 2);
      const fullWidthsPaddingLeft = Math.max(0, sidebarWidth - htmlMarginLeft + SPACING);

      $fullWidthContainers.attr('style', `padding-${dockSide}: ${fullWidthsPaddingLeft}px !important`);
      $html.css(`margin-${dockSide}`, `${htmlMarginLeft}px`);
    } else {
      $fullWidthContainers.removeAttr('style');
      $html.css(`margin-${dockSide}`, '');
    }
  }

  getDockSide() {
    return 'left';
  }

  // @override
  async getRepoFromPath(currentRepo, token, cb) {
    if (!await octotree.shouldShowOctotree()) {
      return cb();
    }

    // (username)/(reponame)[/(type)][/(typeId)]
    const match = window.location.pathname.match(/([^\/]+)\/([^\/]+)(?:\/([^\/]+))?(?:\/([^\/]+))?/);

    const username = match[1];
    const reponame = match[2];
    const type = match[3];
    const typeId = match[4];

    const isPR = type === 'pull';

    // Not a repository, skip
    if (~GH_RESERVED_USER_NAMES.indexOf(username) || ~GH_RESERVED_REPO_NAMES.indexOf(reponame)) {
      return cb();
    }

    // Get branch by inspecting URL or DOM, quite fragile so provide multiple fallbacks.
    // TODO would be great if there's a more robust way to do this
    /**
     * Github renders the branch name in one of below structure depending on the length
     * of branch name. We're using this for default code page or tree/blob.
     *
     * Option 1: when the length is short enough
     * <summary title="Switch branches or tags">
     *   <span class="css-truncate-target">feature/1/2/3</span>
     * </summary>
     *
     * Option 2: when the length is too long
     * <summary title="feature/1/2/3/4/5/6/7/8">
     *   <span class="css-truncate-target">feature/1/2/3...</span>
     * </summary>
     */
    const branchDropdownMenuSummary = $('.branch-select-menu summary').first();
    const branchNameInTitle = branchDropdownMenuSummary.attr('title');
    const branchNameInSpan = branchDropdownMenuSummary.find('span').text();
    const branchFromSummary =
      branchNameInTitle && branchNameInTitle.toLowerCase().startsWith('switch branches')
        ? branchNameInSpan
        : branchNameInTitle;

    const branch =
      // Use the commit ID when showing a particular commit
      (type === 'commit' && typeId) ||
      // Use 'master' when viewing repo's releases or tags
      ((type === 'releases' || type === 'tags') && 'master') ||
      // Get commit ID or branch name from the DOM
      branchFromSummary ||
      ($('.overall-summary .numbers-summary .commits a').attr('href') || '').replace(
        `/${username}/${reponame}/commits/`,
        ''
      ) ||
      // The above should work for tree|blob, but if DOM changes, fallback to use ID from URL
      ((type === 'tree' || type === 'blob') && typeId) ||
      // Use target branch in a PR page
      (isPR ? ($('.commit-ref').not('.head-ref').attr('title') || ':').match(/:(.*)/)[1] : null) ||
      // Reuse last selected branch if exist
      (currentRepo.username === username && currentRepo.reponame === reponame && currentRepo.branch) ||
      // Get default branch from cache
      this._defaultBranch[username + '/' + reponame];

    const pullHead = isPR ? ($('.commit-ref.head-ref').attr('title') || ':').match(/:(.*)/)[1] : null;
    const pullNumber = isPR ? typeId : null;
    const displayBranch = isPR && pullHead ? `${branch} < ${pullHead}` : null;
    const repo = {username, reponame, branch, displayBranch, pullNumber};
    if (repo.branch) {
      cb(null, repo);
    } else {
      // Still no luck, get default branch for real
      this._get(null, {repo, token}, (err, data) => {
        if (err) return cb(err);
        repo.branch = this._defaultBranch[username + '/' + reponame] = data.default_branch || 'master';
        cb(null, repo);
      });
    }
  }

  // @override
  loadCodeTree(opts, cb) {
    opts.encodedBranch = encodeURIComponent(decodeURIComponent(opts.repo.branch));
    opts.path = (opts.node && (opts.node.sha || opts.encodedBranch)) || opts.encodedBranch + '?recursive=1';
    this._loadCodeTreeInternal(opts, null, cb);
  }

  get currentPageType() {
    const match = window.location.pathname.match(/([^\/]+)\/([^\/]+)(?:\/([^\/]+))?(?:\/([^\/]+))?/);
    return match ? match[3] : null;
  }

  get isOnPRPage() {
    return this.currentPageType === 'pull';
  }

  get isOnFilePage() {
    return this.currentPageType === 'blob';
  }

  // @override
  _getTree(path, opts, cb) {
    this._get(`/git/trees/${path}`, opts, (err, res) => {
      if (err) cb(err);
      else cb(null, res.tree);
    });
  }

  // @override
  _getSubmodules(tree, opts, cb) {
    const item = tree.filter((item) => /^\.gitmodules$/i.test(item.path))[0];
    if (!item) return cb();

    this._get(`/git/blobs/${item.sha}`, opts, (err, res) => {
      if (err) return cb(err);
      const data = atob(res.content.replace(/\n/g, ''));
      cb(null, parseGitmodules(data));
    });
  }

  _get(path, opts, cb) {
    let url;

    if (path && path.startsWith('http')) {
      url = path;
    } else {
      const host =
        location.protocol + '//' + (location.host === 'github.com' ? 'api.github.com' : location.host + '/api/v3');
      url = `${host}/repos/${opts.repo.username}/${opts.repo.reponame}${path || ''}`;
    }

    const cfg = {url, method: 'GET', cache: false};

    if (opts.token) {
      cfg.headers = {Authorization: 'token ' + opts.token};
    }

    $.ajax(cfg)
      .done((data, textStatus, jqXHR) => {
        (async () => {
          if (path && path.indexOf('/git/trees') === 0 && data.truncated) {
            try {
              const hugeRepos = await extStore.get(STORE.HUGE_REPOS);
              const repo = `${opts.repo.username}/${opts.repo.reponame}`;
              const repos = Object.keys(hugeRepos).filter((hugeRepoKey) => isValidTimeStamp(hugeRepos[hugeRepoKey]));
              if (!hugeRepos[repo]) {
                // If there are too many repos memoized, delete the oldest one
                if (repos.length >= GH_MAX_HUGE_REPOS_SIZE) {
                  const oldestRepo = repos.reduce((min, p) => (hugeRepos[p] < hugeRepos[min] ? p : min));
                  delete hugeRepos[oldestRepo];
                }
                hugeRepos[repo] = new Date().getTime();
                await extStore.set(STORE.HUGE_REPOS, hugeRepos);
              }
            } catch (ignored) {
            } finally {
              await this._handleError(cfg, {status: 206}, cb);
            }
          } else {
            cb(null, data, jqXHR);
          }
        })();
      })
      .fail((jqXHR) => this._handleError(cfg, jqXHR, cb));
  }
}
