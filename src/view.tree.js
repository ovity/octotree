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
      if (!$target.is('a.jstree-anchor')) return

      var href  = $target.attr('href')
        , $icon = $target.children().length
          ? $target.children(':first')
          : $target.siblings(':first') // handles child links in submodule

      if ($icon.hasClass('commit')) adapter.selectSubmodule(href)
      else if ($icon.hasClass('blob')) adapter.selectPath(href)
    })
    .jstree({
      core    : { multiple: false, themes : { responsive : false } },
      plugins : ['wholerow', 'state']
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
      adapter.selectPath($(this).attr('href') /* a.href always return absolute URL, don't want that */)
    })
}

TreeView.prototype.show = function(repo, treeData) {
  var self = this

  self.store.get(STORE.COLLAPSE, function(collapseTree) {
    var treeContainer = self.$view.find('.octotree_view_body')
      , tree = treeContainer.jstree(true)

    treeData = sort(treeData)
    if (collapseTree) treeData = collapse(treeData)
    tree.settings.core.data = treeData
    tree.settings.state.key = PREFIX + '.' + repo.username + '/' + repo.reponame

    treeContainer.one('refresh.jstree', function() {
      self.syncSelection()
      $(self).trigger(EVENT.VIEW_READY)
    })

    tree.refresh(true)
  })

  function sort(folder) {
    folder.sort(function(a, b) {
      if (a.type === b.type) return a.text === b.text ? 0 : a.text < b.text ? -1 : 1
      return a.type === 'blob' ? 1 : -1
    })
    folder.forEach(function(item) {
      if (item.type === 'tree') sort(item.children)
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
    , path = location.pathname

  if (!tree) return
  tree.deselect_all()

  // e.g. converts /buunguyen/octotree/type/branch/path to path
  var match = path.match(/(?:[^\/]+\/){4}(.*)/)
    , nodeId
  if (match) {
    nodeId = PREFIX + decodeURIComponent(match[1])
    tree.select_node(nodeId)
    tree.open_node(nodeId)
  }
}