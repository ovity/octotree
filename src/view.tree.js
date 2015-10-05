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

      var href  = $target.attr('href')
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

TreeView.prototype.showHeader = function(repo) {
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
    , recursiveLoad = self.store.get(STORE.RECURSIVE)

  function fetchData(node, success) {
    var selectedNode = node.original
    if (node.id === '#') selectedNode = {path: ''}
    self.adapter.getCodeTree({ repo: repo, token: token, node: recursiveLoad ? null : selectedNode}, function(err, treeData) {
      if (err) $(self).trigger(EVENT.FETCH_ERROR, [err])
      else success(treeData)
    })
  }

  tree.settings.core.data = function (node, cb) {
    fetchData(node, function(treeData) {
      treeData = sort(treeData)
      if (collapseTree && recursiveLoad)
        treeData = collapse(treeData)
      cb(treeData)
    })
  }

  treeContainer.one('refresh.jstree', function() {
    self.syncSelection()
    $(self).trigger(EVENT.VIEW_READY)
  })

  tree.refresh(true)

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
    , path = decodeURIComponent(location.pathname)
    , recursiveLoad = this.store.get(STORE.RECURSIVE)

  if (!tree) return

  // e.g. converts /buunguyen/octotree/type/branch/path to path
  var match = path.match(/(?:[^\/]+\/){4}(.*)/)
  if (!match) return

  currentPath = match[1]

  // e.g. converts ["lib/controllers"] to ["lib", "lib/controllers"]
  function createPaths(fullPath) {
    var paths = fullPath.split("/")
      , arrResult = [paths[0]]

    paths.reduce(function(lastPath, curPath) {
      var path = (lastPath + "/" + curPath)
      arrResult.push(path)
      return path
    })
    return arrResult
  }

  function openPathAtIndex (paths, index) {
    nodeId = PREFIX + paths[index]
    if (tree.get_node(nodeId)) {
      tree.deselect_all()
      tree.select_node(nodeId)
      tree.open_node(nodeId, function(node){
        if (index < paths.length - 1) openPathAtIndex(paths, index + 1)
      })
    }
  }

  var paths = recursiveLoad ? [currentPath] : createPaths(currentPath)
  openPathAtIndex(paths, 0)
}
