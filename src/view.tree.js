function TreeView($dom, store, adapter) {
  this.$view = $dom.find('.octotree_treeview')
  this.store = store
  this.adapter = adapter
  this.$view
    .find('.octotree_view_body')
    .on('click.jstree', '.jstree-open>a', function() {
      $.jstree.reference(this).close_node(this)
    })
    .on('click.jstree', '.jstree-closed>a', function() {
      $.jstree.reference(this).open_node(this)
    })
    .on('click', function(event) {
      var $target = $(event.target)
      var self = this
      var download = false

      // handle icon click, fix #122
      if ($target.is('i.jstree-icon')) {
        $target = $target.parent()
        download = true
      }

      if (!$target.is('a.jstree-anchor')) return

      var href = $target.attr('href')
        , $icon = $target.children().length
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
          adapter.selectFile(href, store.get(STORE.TABSIZE))
        }
      }

      // refocus after complete so that keyboard navigation works, fix #158
      function refocusAfterCompletion() {
        $(document).one('pjax:success', function () {
          $.jstree.reference(self).get_container().focus()
        })
      }
    })
    .jstree({
      core    : { multiple: false, themes : { responsive : false } },
      plugins : ['wholerow']
    })
}

TreeView.prototype._showHeader = function(repo) {
  var adapter = this.adapter
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
    .on('click', 'a[data-pjax]', function(event) {
      event.preventDefault()
      adapter.selectFile($(this).attr('href') /* a.href always return absolute URL, don't want that */)
    })
}

TreeView.prototype.show = function(repo, token) {
  var self = this
    , treeContainer = self.$view.find('.octotree_view_body')
    , tree = treeContainer.jstree(true)
    , collapseTree = self.store.get(STORE.COLLAPSE)
    , loadAll = self.store.get(STORE.RECURSIVE)

  tree.settings.core.data = function (node, cb) {
    fetchData(node, function(treeData) {
      var treeData = sort(treeData)
      if (collapseTree && loadAll) {
        treeData = collapse(treeData)
      }
      cb(treeData)
    })
  }

  treeContainer.one('refresh.jstree', function() {
    self.syncSelection()
    $(self).trigger(EVENT.VIEW_READY)
  })

  self._showHeader(repo)
  tree.refresh(true)

  function fetchData(node, success) {
    var selectedNode = loadAll
      ? null
      : (node.id === '#' ? {path: ''} : node.original)

    self.adapter.getCodeTree({ repo: repo, token: token, node: selectedNode}, function(err, treeData) {
      if (err) $(self).trigger(EVENT.FETCH_ERROR, [err])
      else success(treeData)
    })
  }

  function sort(folder) {
    folder.sort(function(a, b) {
      if (a.type === b.type) return a.text === b.text ? 0 : a.text < b.text ? -1 : 1
      return a.type === 'blob' ? 1 : -1
    })
    folder.forEach(function(item) {
      if (item.type === 'tree' && item.children !== true && item.children.length > 0) sort(item.children)
    })
    return folder
  }

  function collapse(folder) {
    return folder.map(function(item) {
      if (item.type === 'tree') {
        item.children = collapse(item.children)
        if (item.children.length === 1 && item.children[0].type === 'tree') {
          var onlyChild = item.children[0]
          onlyChild.text = item.text + '/' + onlyChild.text
          return onlyChild
        }
      }
      return item
    })
  }
}

TreeView.prototype.syncSelection = function() {
  var tree = this.$view.find('.octotree_view_body').jstree(true)

  if (!tree) return

  // converts /username/reponame/object_type/branch/path to path
  var path = decodeURIComponent(location.pathname)
    , match = path.match(/(?:[^\/]+\/){4}(.*)/)

  if (!match) return

  var currentPath = match[1]
    , loadAll = this.store.get(STORE.RECURSIVE)

  selectPath(loadAll ? [currentPath] : breakPath(currentPath), 0)

  // converts ['a/b'] to ['a', 'a/b']
  function breakPath(fullPath) {
    return fullPath.split('/').reduce(function (res, path, idx) {
      res.push(idx === 0 ? path : (res[idx-1] + '/' + path))
      return res
    }, [])
  }

  function selectPath(paths, index) {
    var nodeId = PREFIX + paths[index]
    if (tree.get_node(nodeId)) {
      tree.deselect_all()
      tree.select_node(nodeId)
      tree.open_node(nodeId, function() {
        if (++index < paths.length) {
          selectPath(paths, index)
        }
      })
    }
  }
}
