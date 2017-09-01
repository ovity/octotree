class TreeView {
  constructor($dom, store, adapter) {
    this.store = store
    this.adapter = adapter
    this.$view = $dom.find('.octotree_treeview')
    this.$tree = this.$view.find('.octotree_view_body')
      .on('click.jstree', '.jstree-open>a', ({target}) => this.$jstree.close_node(target))
      .on('click.jstree', '.jstree-closed>a', ({target}) => this.$jstree.open_node(target))
      .on('click', this._onItemClick.bind(this))
      .jstree({
        core: { multiple: false, worker: false, themes : { responsive : false } },
        plugins: ['wholerow']
      })
  }

  get $jstree() {
    return this.$tree.jstree(true)
  }

  show(repo, token) {
    const $jstree = this.$jstree

    $jstree.settings.core.data = (node, cb) => {
      const prMode = this.store.get(STORE.PR) && repo.pullNumber
      const loadAll = this.adapter.canLoadEntireTree() && (prMode || this.store.get(STORE.LOADALL))

      node = !loadAll && (node.id === '#' ? {path: ''} : node.original)

      this.adapter.loadCodeTree({repo, token, node}, (err, treeData) => {
        if (err) {
          $(this).trigger(EVENT.FETCH_ERROR, [err])
        }
        else {
          treeData = this._sort(treeData)
          if (loadAll) {
            treeData = this._collapse(treeData)
          }
          cb(treeData)
        }
      })
    }

    this.$tree.one('refresh.jstree', () => {
      this.syncSelection()
      $(this).trigger(EVENT.VIEW_READY)
    })

    this._showHeader(repo)
    $jstree.refresh(true)
  }

  _showHeader(repo) {
    const adapter = this.adapter

    this.$view.find('.octotree_view_header')
      .html(
        '<div class="octotree_header_repo">' +
           '<a href="/' + repo.username + '">' + repo.username +'</a>'  +
           ' / ' +
           '<a data-pjax href="/' + repo.username + '/' + repo.reponame + '">' + repo.reponame +'</a>' +
         '</div>' +
         '<div class="octotree_header_branch">' +
           this._deXss(repo.branch.toString()) +
         '</div>'
      )
      .on('click', 'a[data-pjax]', function (event) {
        event.preventDefault()
        const href = $(this).attr('href'); /* a.href always return absolute URL, don't want that */
        const newTab = event.shiftKey || event.ctrlKey || event.metaKey
        newTab ? adapter.openInNewTab(href) : adapter.selectFile(href)
      })
  }

  _deXss(str) {
    return str && str.replace(/[<>'"&]/g, '-')
  }

  _sort(folder) {
    folder.sort((a, b) => {
      if (a.type === b.type) return a.text === b.text ? 0 : a.text < b.text ? -1 : 1
      return a.type === 'blob' ? 1 : -1
    })

    folder.forEach((item) => {
      if (item.type === 'tree' && item.children !== true && item.children.length > 0) {
        this._sort(item.children)
      }
    })

    return folder
  }

  _collapse(folder) {
    return folder.map((item) => {
      if (item.type === 'tree') {
        item.children = this._collapse(item.children)
        if (item.children.length === 1 && item.children[0].type === 'tree') {
          const onlyChild = item.children[0]
          onlyChild.text = item.text + '/' + onlyChild.text
          return onlyChild
        }
      }
      return item
    })
  }

  _onItemClick(event) {
    let $target = $(event.target)
    let download = false

    // handle middle click
    if (event.which === 2) return

    // handle icon click, fix #122
    if ($target.is('i.jstree-icon')) {
      $target = $target.parent()
      download = true
    }

    if (!$target.is('a.jstree-anchor')) return

    // refocus after complete so that keyboard navigation works, fix #158
    const refocusAfterCompletion = () => {
      $(document).one('pjax:success page:load', () => {
        this.$jstree.get_container().focus()
      })
    }

    const adapter = this.adapter
    const newTab = event.shiftKey || event.ctrlKey || event.metaKey
    const href = $target.attr('href')
    const $icon = $target.children().length
      ? $target.children(':first')
      : $target.siblings(':first') // handles child links in submodule

    if ($icon.hasClass('commit')) {
      refocusAfterCompletion()
      newTab ? adapter.openInNewTab(href) : adapter.selectSubmodule(href)
    }
    else if ($icon.hasClass('blob')) {
      if (download) {
        const downloadUrl = $target.attr('data-download-url')
        const downloadFileName = $target.attr('data-download-filename')
        adapter.downloadFile(downloadUrl, downloadFileName)
      }
      else {
        refocusAfterCompletion()
        newTab ? adapter.openInNewTab(href) : adapter.selectFile(href)
      }
    }
  }

  syncSelection() {
    const $jstree = this.$jstree
    if (!$jstree) return

    // converts /username/reponame/object_type/branch/path to path
    const path = decodeURIComponent(location.pathname)
    const match = path.match(/(?:[^\/]+\/){4}(.*)/)
    if (!match) return

    const currentPath = match[1]
    const loadAll = this.adapter.canLoadEntireTree() &&
                    this.store.get(STORE.LOADALL)

    selectPath(loadAll ? [currentPath] : breakPath(currentPath))

    // converts ['a/b'] to ['a', 'a/b']
    function breakPath(fullPath) {
      return fullPath.split('/').reduce((res, path, idx) => {
        res.push(idx === 0 ? path : (res[idx-1] + '/' + path))
        return res
      }, [])
    }

    function selectPath(paths, index = 0) {
      const nodeId = NODE_PREFIX + paths[index]

      if ($jstree.get_node(nodeId)) {
        $jstree.deselect_all()
        $jstree.select_node(nodeId)
        $jstree.open_node(nodeId, () => {
          if (++index < paths.length) {
            selectPath(paths, index)
          }
        })
      }
    }
  }
}
