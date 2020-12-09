class TreeView {
  constructor($dom, adapter) {
    this.adapter = adapter;
    this.$view = $dom.find('.octotree-tree-view');
    this.$tree = this.$view
      .find('.octotree-view-body')
      .on('click.jstree', '.jstree-open>a', ({target}) => {
        this.$jstree.close_node(target);
      })
      .on('click.jstree', '.jstree-closed>a', ({target}) => {
        this.$jstree.open_node(target);
      })
      .on('click', this._onItemClick.bind(this))
      .jstree({
        core: {multiple: false, animation: 50, worker: false, themes: {responsive: false}},
        plugins: ['wholerow', 'search', 'truncate']
      });
  }

  get $jstree() {
    return this.$tree.jstree(true);
  }

  focus() {
    this.$jstree.get_container().focus();
  }

  show(repo, token) {
    const $jstree = this.$jstree;

    $jstree.settings.core.data = (node, cb) => {
      // This function does not accept an async function as its value
      // Thus, we use an async anonymous function inside to fix it
      (async () => {
        const startTime = Date.now();
        const loadAll = await this.adapter.shouldLoadEntireTree(repo);
        node = !loadAll && (node.id === '#' ? {path: ''} : node.original);

        this.adapter.loadCodeTree({repo, token, node}, (err, treeData) => {
          if (err) {
            if (err.status === 206 && loadAll) {
              // The repo is too big to load all, need to retry
              $jstree.refresh(true);
            } else {
              $(this).trigger(EVENT.FETCH_ERROR, [err]);
            }
            return;
          }

          cb(treeData);
          $(document).trigger(EVENT.REPO_LOADED, {repo, loadAll, duration: Date.now() - startTime});
        });
      })()
    };

    this.$tree.one('refresh.jstree', async () => {
      await this.syncSelection(repo);
      $(this).trigger(EVENT.VIEW_READY);
    });

    this._showHeader(repo);
    $jstree.refresh(true);
  }

  _showHeader(repo) {
    const adapter = this.adapter;

    this.$view
      .find('.octotree-view-header')
      .html(
        `<div class="octotree-header-summary">
          <div class="octotree-header-repo">
            <i class="octotree-icon-repo"></i>
            <a href="/${repo.username}">${repo.username}</a> /
            <a data-pjax href="/${repo.username}/${repo.reponame}">${repo.reponame}</a>
          </div>
          <div class="octotree-header-branch">
            <i class="octotree-icon-branch"></i>
            ${deXss((repo.displayBranch || repo.branch).toString())}
          </div>
        </div>`
      )
      .on('click', 'a[data-pjax]', function(event) {
        event.preventDefault();
        // A.href always return absolute URL, don't want that
        const href = $(this).attr('href');
        const newTab = event.shiftKey || event.ctrlKey || event.metaKey;
        newTab ? adapter.openInNewTab(href) : adapter.selectFile(href);
      });
  }

  /**
   * Intercept the _onItemClick method
   * return true to stop the current execution
   * @param {Event} event
   */
  onItemClick(event) {
    return false;
  }

  _onItemClick(event) {
    let $target = $(event.target);
    let download = false;

    if (this.onItemClick(event)) return;

    // Handle icon click, fix #122
    if ($target.is('i.jstree-icon')) {
      $target = $target.parent();
      download = true;
    }

    $target = $target.is('a.jstree-anchor') ? $target : $target.parent();

    if ($target.is('.octotree-patch')) {
      $target = $target.parent();
    }

    if (!$target.is('a.jstree-anchor')) return;

    // Refocus after complete so that keyboard navigation works, fix #158
    const refocusAfterCompletion = () => {
      $(document).one('pjax:success page:load', () => {
        this.$jstree.get_container().focus();
      });
    };

    const adapter = this.adapter;
    const newTab = event.shiftKey || event.ctrlKey || event.metaKey;
    const href = $target.attr('href');
    // The 2nd path is for submodule child links
    const $icon = $target.children().length ? $target.children(':first') : $target.siblings(':first');

    if ($icon.hasClass('commit')) {
      refocusAfterCompletion();
      newTab ? adapter.openInNewTab(href) : adapter.selectSubmodule(href);
    } else if ($icon.hasClass('blob')) {
      if (download) {
        const downloadUrl = $target.attr('data-download-url');
        const downloadFileName = $target.attr('data-download-filename');
        adapter.downloadFile(downloadUrl, downloadFileName);
      } else {
        refocusAfterCompletion();
        newTab ? adapter.openInNewTab(href) : adapter.selectFile(href);
      }
    }
  }

  async syncSelection(repo) {
    const $jstree = this.$jstree;
    if (!$jstree) return;

    // Convert /username/reponame/object_type/branch/path to path
    const path = decodeURIComponent(location.pathname);
    const match = path.match(/(?:[^\/]+\/){4}(.*)/);
    if (!match) return;

    const currentPath = match[1];
    const loadAll = await this.adapter.shouldLoadEntireTree(repo);

    selectPath(loadAll ? [currentPath] : breakPath(currentPath));

    // Convert ['a/b'] to ['a', 'a/b']
    function breakPath(fullPath) {
      return fullPath.split('/').reduce((res, path, idx) => {
        res.push(idx === 0 ? path : `${res[idx - 1]}/${path}`);
        return res;
      }, []);
    }

    function selectPath(paths, index = 0) {
      const nodeId = NODE_PREFIX + paths[index];

      if ($jstree.get_node(nodeId)) {
        $jstree.deselect_all();
        $jstree.select_node(nodeId);
        $jstree.open_node(nodeId, () => {
          if (++index < paths.length) {
            selectPath(paths, index);
          }
        });
      }
    }
  }
}
