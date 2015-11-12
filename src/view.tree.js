class TreeView {
  constructor($dom, store, adapter) {
    this.$view = $dom.find('.octotree_treeview')
    this.store = store
    this.adapter = adapter
    this.$view
      .find('.octotree_view_body')
      .on('click.jstree', '.jstree-open>a', function () {
        $.jstree.reference(this).close_node(this)
      })
      .on('click.jstree', '.jstree-closed>a', function () {
        $.jstree.reference(this).open_node(this)
      })
      .on('click', function (event) {
        const self = this
        let $target = $(event.target)
        let download = false

        // handle icon click, fix #122
        if ($target.is('i.jstree-icon')) {
          $target = $target.parent()
          download = true
        }

        if (!$target.is('a.jstree-anchor')) return

        const href = $target.attr('href')
        const $icon = $target.children().length
          ? $target.children(':first')
          : $target.siblings(':first') // handles child links in submodule

        if ($icon.hasClass('commit')) {
          refocusAfterCompletion()
          adapter.selectSubmodule(href)
        }
        else if ($icon.hasClass('blob')) {
          if (download) {
            adapter.downloadFile(href, $target.text())
          }
          else {
            refocusAfterCompletion()
            adapter.selectFile(href)
          }
        }

        // refocus after complete so that keyboard navigation works, fix #158
        function refocusAfterCompletion() {
          $(document).one('pjax:success', () => {
            $.jstree.reference(self).get_container().focus()
          })
        }
      })
      .jstree({
        core: { multiple: false, themes : { responsive : false } },
        plugins: ['wholerow']
      })
  }

  show(repo, token) {
    const treeContainer = this.$view.find('.octotree_view_body')
    const tree = treeContainer.jstree(true)

    tree.settings.core.data = (node, cb) => {
      const loadAll = this.adapter.canLoadEntireTree() &&

                                      this.store.get(STORE.LOADALL)
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

    treeContainer.one('refresh.jstree', () => {
      this.syncSelection()
      $(this).trigger(EVENT.VIEW_READY)
    })

    this._showHeader(repo)
    tree.refresh(true)
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
           repo.branch +
         '</div>'
      )
      .on('click', 'a[data-pjax]', function (event) {
        event.preventDefault()
        adapter.selectFile($(this).attr('href') /* a.href always return absolute URL, don't want that */)
      })
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

  syncSelection() {
    const tree = this.$view.find('.octotree_view_body').jstree(true)
    if (!tree) return

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
      const nodeId = PREFIX + paths[index]

      if (tree.get_node(nodeId)) {
        tree.deselect_all()
        tree.select_node(nodeId)
        tree.open_node(nodeId, () => {
          if (++index < paths.length) {
            selectPath(paths, index)
          }
        })
      }
    }
  }
}
