require('./helper')

var factory    = require('./factory')
  , PageObject = require('./pageobject')
  , token = process.env.GHPAT
  , files

before(function (cb) {
  getJson('https://api.github.com/repos/buunguyen/octotree/git/trees/master?recursive=true', token, function (err, data) {
    if (err) return cb(err)
    files = data.tree
    cb()
  })
})

;['chrome', 'firefox'].forEach(runTest)

function runTest(browser) {
  var po

  describe(browser, function () {
    before(function (cb) {
      starx(function *() {
        var driver = yield factory[browser + 'Driver']
        yield sleep(5000) // wait for browser to start up
        po = new PageObject(driver, 'https://github.com/buunguyen/octotree')
      })(cb)
    })

    after(function (cb) {
      starx(function *() {
        yield po.close()
      })(cb)
    })

    describe('init', function () {
      before(function (cb) {
        starx(function *() {
          yield po.reset()
        })(cb)
      })

      yit('should create toggle button and sidebar', function *() {
        assert.ok(yield po.toggleButton.isDisplayed())
        assert.equal(yield po.sidebar.getCssValue('width'), '232px')
      })

      yit('should display help popup', function *() {
        yield sleep(100) // animation
        assert.ok(yield po.helpPopup.isDisplayed())
      })

      yit('should toggle upon button click', function *() {
        yield po.toggleSidebar()
        assert.ok(yield po.isSidebarShown())

        yield po.toggleSidebar()
        assert.ok(yield po.isSidebarHidden())
      })

      yit('should match branches', function *() {
        yield po.toggleSidebar()
        assert.equal(yield po.branchLabel.getText(), 'master')

        yield po.setUrl('https://github.com/buunguyen/octotree/tree/v1.6.2')
        assert.equal(yield po.branchLabel.getText(), 'v1.6.2')
      })
    })

    describe('main', function () {
      before(function (cb) {
        starx(function *() {
          yield po.reset()
          if (token) {
            yield po.toggleOptsView()
            yield po.tokenInput.sendKeys(token)
            yield po.saveSettings()
          }
        })(cb)
      })

      describe('tree', function () {
        yit('should show tree view by default', function *() {
          assert.ok(~(yield po.treeView.getAttribute('class')).indexOf('current'))
        })

        yit('should show repository information', function *() {
          var links = yield po.treeHeaderLinks
          assert.equal(yield links[0].getText(), 'buunguyen')
          assert.equal(yield links[1].getText(), 'octotree')
        })

        yit('should show code tree', function *() {
          var nodes = yield po.treeNodes
          var _files = files.filter(function (file) {
            return file.path.indexOf('/') === -1
          })
          assert.ok(nodes.length, _files.length)
        })

        yit('should navigate to code files', function *() {
          var seen = []
          for (var i = 0; i < 3; i++) {
            var someFile = rand(files.filter(function (file) {
              return file.type === 'blob' && file.path.indexOf('/') === -1 && seen.indexOf(file) === -1
            }))
            seen.push(someFile)

            var node = po.nodeFor(someFile.path)
            yield po.clickNode(node)
            assert.ok(yield po.isNodeSelected(node))
            assert.equal(yield po.getUrl(), 'https://github.com/buunguyen/octotree/blob/master/' + someFile.path)
            yield sleep(200) // pjax
            assert.equal(yield po.ghBreadcrumb.getText(), someFile.path)
          }
        })

        yit('should expand directories', function *() {
          var seen = []
          for (var i = 0; i < 3; i++) {
            var someDir = rand(files.filter(function (file) {
              return file.type === 'tree' && file.path.indexOf('/') === -1 && seen.indexOf(file) === -1
            }))
            seen.push(someDir)
            var someDirChildren = files.filter(function (file) {
              return file.path.indexOf(someDir.path) === 0 && _s.count(file.path, '/') === 1
            })

            var node = yield po.nodeFor(someDir.path)
            yield po.clickNode(node)
            yield sleep(50) // tree expand transition
            assert.ok(yield po.isNodeOpen(po.nodeFor(someDir.path)))
            assert.equal((yield po.childrenOfNode(po.nodeFor(someDir.path))).length, someDirChildren.length)
          }
        })
      })

      describe('opts', function () {
        yit('should toggle options view', function *() {
          yield po.toggleOptsView()
          assert.ok(~(yield po.optsButton.getAttribute('class')).indexOf('selected'))
          assert.ok(~(yield po.optsView.getAttribute('class')).indexOf('current'))

          yield po.toggleOptsView()
          assert.ok(!~(yield po.optsButton.getAttribute('class')).indexOf('selected'))
          assert.ok(!~(yield po.optsView.getAttribute('class')).indexOf('current'))
        })

        describe('values', function () {
          beforeEach(function(cb) {
            starx(function *() {
              yield po.toggleOptsView()

              yield po.tokenInput.clear()
              if (token) yield po.tokenInput.sendKeys(token)

              yield po.hotkeysInput.clear()

              if (yield po.rememberCheck.isSelected()) yield po.rememberCheck.click()
              if (yield po.nonCodeCheck.isSelected()) yield po.nonCodeCheck.click()

              yield po.saveSettings()
            })(cb)
          })

          describe('token', function () {
            yit('should show error if token is invalid', function *() {
              yield po.toggleOptsView()
              yield po.tokenInput.clear()
              yield po.tokenInput.sendKeys('invalid token')
              yield po.saveSettings()

              assert.ok(~(yield po.errorView.getAttribute('class')).indexOf('current'))
              assert.ok(~(yield po.errorViewHeader.getText(), 'Error: Invalid token'))
            })

            yit('should not show error if no token is given', function *() {
              yield po.toggleOptsView()
              yield po.tokenInput.clear()
              yield po.saveSettings()
              assert.ok(~(yield po.treeView.getAttribute('class')).indexOf('current'))
            })
          })

          describe('hotkey', function () {
            yit('should allow configure hotkey', function *() {
              yield po.toggleOptsView()
              yield po.hotkeysInput.clear()
              yield po.hotkeysInput.sendKeys('`')
              yield po.saveSettings()

              // Hack: get error when sending key if not focusing on an element first
              yield po.ghSearch.sendKeys('`')
              yield sleep(100) // transition
              assert.ok(yield po.isSidebarHidden())

              yield po.ghSearch.sendKeys('`')
              yield sleep(100) // transition
              assert.ok(yield po.isSidebarShown())
            })
          })

          describe('remember', function () {
            yit('should remember sidebar state after reload', function *() {
              yield po.toggleOptsView()
              yield po.rememberCheck.click()
              yield po.saveSettings()
              yield po.refresh()

              assert.ok(yield po.isSidebarShown())
            })
          })

          describe('non-code', function () {
            var pages = [
              'https://github.com/buunguyen/octotree/issues',
              'https://github.com/buunguyen/octotree/pulls',
              'https://github.com/buunguyen/octotree/pulse',
              'https://github.com/buunguyen/octotree/graphs/contributors'
            ]

            yit('should hide in non-code pages', function *() {
              for (var i = 0; pages[i]; i++) {
                yield po.setUrl(pages[i])
                assert.ok(yield po.isSidebarHidden())
              }
              yield po.reset()
            })

            yit('should show in non-code pages if option is set', function *() {
              yield po.toggleOptsView()
              yield po.rememberCheck.click()
              yield po.nonCodeCheck.click()
              yield po.saveSettings()

              for (var i = 0; pages[i]; i++) {
                yield po.setUrl(pages[i])
                assert.ok(yield po.isSidebarShown())
              }
              yield po.reset()
            })
          })

          describe('lazy load', function () {

          })

          describe('collapse', function () {

          })

          if (browser === 'chrome') {
            describe('ghe', function () {

            })
          }
        })
      })
    })
  })
}
