const GH_RESERVED_USER_NAMES = [
  'settings',
  'orgs',
  'organizations',
  'site',
  'blog',
  'about',
  'explore',
  'styleguide',
  'showcases',
  'trending',
  'stars',
  'dashboard',
  'notifications',
  'search',
  'developer',
  'account',
  'pulls',
  'issues',
  'features',
  'contact',
  'security',
  'join',
  'login',
  'watching',
  'new',
  'integrations',
  'gist',
  'business',
  'mirrors',
  'open-source',
  'personal',
  'pricing',
  'marketplace',
];
const GH_RESERVED_REPO_NAMES = ['followers', 'following', 'repositories'];
const GH_404_SEL = '#parallax_wrapper';
const GH_PJAX_CONTAINER_SEL = '#js-repo-pjax-container, .context-loader-container, [data-pjax-container]';
const GH_CONTAINERS = '.container, .container-lg, .container-responsive';
const GH_HEADER = '.js-header-wrapper > header';
const GH_RAW_CONTENT = 'body > pre';
const GH_MAX_HUGE_REPOS_SIZE = 50;

class GitHub extends PjaxAdapter {
  constructor(store) {
    super(store);
  }

  // @override
  init($sidebar) {
    const pjaxContainer = $(GH_PJAX_CONTAINER_SEL)[0];
    super.init($sidebar, {pjaxContainer: pjaxContainer});

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
  _getCssClass() {
    return 'octotree_github_sidebar';
  }

  // @override
  canLoadEntireTree(repo) {
    const key = `${repo.username}/${repo.reponame}`;
    const hugeRepos = this.store.get(STORE.HUGE_REPOS);
    if (hugeRepos[key]) {
      // Update the last load time of the repo
      hugeRepos[key] = new Date().getTime();
      this.store.set(STORE.HUGE_REPOS, hugeRepos);
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
  updateLayout(togglerVisible, sidebarVisible, sidebarWidth) {
    const SPACING = 10;
    const $header = $(GH_HEADER);
    const $containers = $(GH_CONTAINERS);
    const autoMarginLeft = ($(document).width() - $containers.width()) / 2;
    const shouldPushEverything = sidebarVisible && autoMarginLeft <= sidebarWidth + SPACING;

    $('html').css('margin-left', shouldPushEverything ? sidebarWidth : '');
    $containers.css('margin-left', shouldPushEverything ? SPACING : '');

    const headerPadding =
      shouldPushEverything || (!togglerVisible && !sidebarVisible)
        ? '' // Nothing is visible or already pushed, leave as-is
        : !sidebarVisible
        ? 25 // Sidebar is collapsed, move the logo to avoid hiding the toggler
        : sidebarWidth; // Otherwise, move the header from the sidebar
    $header.css('padding-left', headerPadding);
  }

  // @override
  getRepoFromPath(currentRepo, token, cb) {
    // 404 page, skip
    if ($(GH_404_SEL).length) {
      return cb();
    }

    // Skip raw page
    if ($(GH_RAW_CONTENT).length) {
      return cb();
    }

    // (username)/(reponame)[/(type)][/(typeId)]
    const match = window.location.pathname.match(/([^\/]+)\/([^\/]+)(?:\/([^\/]+))?(?:\/([^\/]+))?/);
    if (!match) {
      return cb();
    }

    const username = match[1];
    const reponame = match[2];
    const type = match[3];
    const typeId = match[4];

    // Not a repository, skip
    if (~GH_RESERVED_USER_NAMES.indexOf(username) || ~GH_RESERVED_REPO_NAMES.indexOf(reponame)) {
      return cb();
    }

    // Check if we should show in non-code pages
    const isPR = type === 'pull';
    const isCodePage = !type || isPR || ['tree', 'blob', 'commit'].indexOf(type) >= 0;
    const showInNonCodePage = this.store.get(STORE.NONCODE);
    if (!showInNonCodePage && !isCodePage) {
      return cb();
    }

    // Get branch by inspecting URL or DOM, quite fragile so provide multiple fallbacks.
    // TODO would be great if there's a more robust way to do this
    /**
     * Github renders the branch name in one of below structure depending on the length
     * of branch name
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
    const branchDropdownMenuSummary = $('.branch-select-menu summary');
    const branchNameInTitle = branchDropdownMenuSummary.attr('title');
    const branchNameInSpan = branchDropdownMenuSummary.find('span').text();
    const branchFromSummary =
      branchNameInTitle && branchNameInTitle.toLowerCase().startsWith('switch branches')
        ? branchNameInSpan
        : branchNameInTitle;

    const branch =
      // Pick the commit ID as branch name when the code page is listing tree in a particular commit
      (type === 'commit' && typeId) ||
      // Pick the commit ID or branch name from the DOM
      branchFromSummary ||
      ($('.overall-summary .numbers-summary .commits a').attr('href') || '').replace(
        `/${username}/${reponame}/commits/`,
        ''
      ) ||
      // Pull requests page
      ($('.commit-ref.base-ref').attr('title') || ':').match(/:(.*)/)[1] ||
      // Reuse last selected branch if exist
      (currentRepo.username === username && currentRepo.reponame === reponame && currentRepo.branch) ||
      // Get default branch from cache
      this._defaultBranch[username + '/' + reponame];

    const showOnlyChangedInPR = this.store.get(STORE.PR);
    const pullNumber = isPR && showOnlyChangedInPR ? typeId : null;
    const repo = {username, reponame, branch, pullNumber};
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
  selectFile(path) {
    super.selectFile(path, {pjaxContainerSel: GH_PJAX_CONTAINER_SEL});
  }

  // @override
  loadCodeTree(opts, cb) {
    opts.encodedBranch = encodeURIComponent(decodeURIComponent(opts.repo.branch));
    opts.path = (opts.node && (opts.node.sha || opts.encodedBranch)) || opts.encodedBranch + '?recursive=1';
    this._loadCodeTreeInternal(opts, null, cb);
  }

  // @override
  _getTree(path, opts, cb) {
    if (opts.repo.pullNumber) {
      this._getPatch(opts, cb);
    } else {
      this._get(`/git/trees/${path}`, opts, (err, res) => {
        // Console.log('****', res.tree);
        if (err) cb(err);
        else cb(null, res.tree);
      });
    }
  }

  /**
   * Get files that were patched in Pull Request.
   * The diff map that is returned contains changed files, as well as the parents of the changed files.
   * This allows the tree to be filtered for only folders that contain files with diffs.
   * @param {Object} opts: {
   *                  path: the starting path to load the tree,
   *                  repo: the current repository,
   *                  node (optional): the selected node (null to load entire tree),
   *                  token (optional): the personal access token
   *                 }
   * @param {Function} cb(err: error, diffMap: Object)
   */
  _getPatch(opts, cb) {
    const {pullNumber} = opts.repo;

    this._get(`/pulls/${pullNumber}/files?per_page=300`, opts, (err, res) => {
      if (err) cb(err);
      else {
        const diffMap = {};

        res.forEach((file, index) => {
          // Record file patch info
          diffMap[file.filename] = {
            type: 'blob',
            diffId: index,
            action: file.status,
            additions: file.additions,
            blob_url: file.blob_url,
            deletions: file.deletions,
            filename: file.filename,
            path: file.path,
            sha: file.sha
          };

          // Record ancestor folders
          const folderPath = file.filename
            .split('/')
            .slice(0, -1)
            .join('/');
          const split = folderPath.split('/');

          // Aggregate metadata for ancestor folders
          split.reduce((path, curr) => {
            if (path.length) path = `${path}/${curr}`;
            else path = `${curr}`;

            if (diffMap[path] == null) {
              diffMap[path] = {
                type: 'tree',
                filename: path,
                filesChanged: 1,
                additions: file.additions,
                deletions: file.deletions
              };
            } else {
              diffMap[path].additions += file.additions;
              diffMap[path].deletions += file.deletions;
              diffMap[path].filesChanged++;
            }
            return path;
          }, '');
        });

        // Transform to emulate response from get `tree`
        const tree = Object.keys(diffMap).map((fileName) => {
          const patch = diffMap[fileName];
          return {
            patch,
            path: fileName,
            sha: patch.sha,
            type: patch.type,
            url: patch.blob_url
          };
        });

        // Sort by path, needs to be alphabetical order (so parent folders come before children)
        // Note: this is still part of the above transform to mimic the behavior of get tree
        tree.sort((a, b) => a.path.localeCompare(b.path));

        cb(null, tree);
      }
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
    const host =
      location.protocol + '//' + (location.host === 'github.com' ? 'api.github.com' : location.host + '/api/v3');
    const url = `${host}/repos/${opts.repo.username}/${opts.repo.reponame}${path || ''}`;
    const cfg = {url, method: 'GET', cache: false};

    if (opts.token) {
      cfg.headers = {Authorization: 'token ' + opts.token};
    }

    $.ajax(cfg)
      .done((data) => {
        if (path && path.indexOf('/git/trees') === 0 && data.truncated) {
          const hugeRepos = this.store.get(STORE.HUGE_REPOS);
          const repo = `${opts.repo.username}/${opts.repo.reponame}`;
          const repos = Object.keys(hugeRepos);
          if (!hugeRepos[repo]) {
            // If there are too many repos memoized, delete the oldest one
            if (repos.length >= GH_MAX_HUGE_REPOS_SIZE) {
              const oldestRepo = repos.reduce((min, p) => hugeRepos[p] < hugeRepos[min] ? p : min);
              delete hugeRepos[oldestRepo];
            }
            hugeRepos[repo] = new Date().getTime();
            this.store.set(STORE.HUGE_REPOS, hugeRepos);
          }
          this._handleError({status: 206}, cb);
        } else cb(null, data);
      })
      .fail((jqXHR) => this._handleError(jqXHR, cb));
  }
}
