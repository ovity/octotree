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

TreeView.prototype.show = function(repo, token, treeData) {
  var self = this
    , treeContainer = self.$view.find('.octotree_view_body')
    , tree = treeContainer.jstree(true)
    , collapseTree = self.store.get(STORE.COLLAPSE)

  treeData = sort(treeData)
  if (collapseTree) treeData = collapse(treeData)

  tree.settings.core.data = function (node, cb) {
    if (node.id === "#") // Root node
      cb(treeData)
    else
      self.fetchData(node.original, function(treeData){
        treeData = sort(treeData)
        if (collapseTree) treeData = collapse(treeData)
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
      if (item.type === 'tree')
        if (item.children.length > 0)
          sort(item.children)
        else // loads children later
          item.children = true
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

TreeView.prototype.fetchData = function(opts, success) {
  // Dummy func
  throw "It must be implemented from caller when initializing this object"
}

TreeView.prototype.syncSelection = function(currentPath) {
  var self = this
    , tree = this.$view.find('.octotree_view_body').jstree(true)
    , path = decodeURIComponent(location.pathname)

  if (!tree) return

  var nodeId
    , paths = []
  
  if (currentPath){
    paths = currentPath.split('/')
  }
  else{
    // e.g. converts /buunguyen/octotree/type/branch/path/path1/path2 to path/path1/path2
    var match = path.match(/(?:[^\/]+\/){4}(.*)/)
    if (match)
      paths = match[1].split('/')
    else 
      return
  }

  // includes parent path to child e.g. lib/controllers to ["lib", "lib/controllers"]
  var fullPath = ''
  var optimizedPaths = []
  paths.forEach(function(path){
    optimizedPaths.push(fullPath + path)
    fullPath = fullPath + path + '/'
  })

  optimizedPaths.forEach(function(path){
    nodeId = PREFIX + path
    if (tree.get_node(nodeId)){
      tree.deselect_all()
      tree.select_node(nodeId)
      tree.open_node(nodeId)
    }
    else
      // 300ms seems enough to fetch new items
      // it will repeat if there is no node found
      setTimeout(function(){
        self.syncSelection(path)
      }, 300)
  })
}
