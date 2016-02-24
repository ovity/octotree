require('./helper')

module.exports = PageObject

/**
 * PageObject
 * @param driver
 * @param repoUrl
 * @constructor
 */
function PageObject(driver, repoUrl) {
  this.driver = driver
  this.one = driver.findElement.bind(driver)
  this.all = driver.findElements.bind(driver)
  this.repoUrl = repoUrl
}

PageObject.prototype = {
  getUrl: function *() {
    return yield this.driver.getCurrentUrl()
  },

  setUrl: function *(url) {
    var driver = this.driver
    driver.get(url)
    yield driver.wait(function () {
      return driver.getCurrentUrl().then(function (_url) {
        return url === _url
      })
    }, 5000)
    yield sleep(1000) // since 1.7.2, Octotree uses longer timeout for loc change
  },

  close: function *() {
    yield this.driver.quit()
  },

  reset: function *() {
    yield this.setUrl(this.repoUrl)
  },

  refresh: function *() {
    yield this.driver.navigate().refresh()
    yield sleep(100)
  },

  toggleSidebar: function *() {
    yield this.toggleButton.click()
    yield sleep(200) // transition
  },

  toggleOptsView: function *() {
    yield this.optsButton.click()
  },

  isSidebarShown: function *() {
    var hasCssClass = yield this.driver.isElementPresent($css('html.octotree-show'))
    var btnRight = yield this.toggleButton.getCssValue('right')
    return hasCssClass && btnRight === '5px'
  },

  isSidebarHidden: function *() {
    var hasCssClass = yield this.driver.isElementPresent($css('html.octotree-show'))
    var btnRight = yield this.toggleButton.getCssValue('right')
    return !hasCssClass && btnRight === '-35px'
  },

  saveSettings: function *() {
    yield this.saveButton.click()
    yield sleep(500) // transition + async storage
  },

  nodeFor: function (path) {
    return this.one($id('octotree' + path))
  },

  clickNode: function (node) {
    // Firefox driver can't click li, has to click li a instead.
    return node.findElement($css('a')).click()
  },

  childrenOfNode: function (node) {
    return node.findElements($css('.jstree-children li'))
  },

  isNodeSelected: function (node) {
    return node.findElement($css('.jstree-wholerow-clicked')).isDisplayed()
  },

  isNodeOpen: function *(node) {
    var classes = yield node.getAttribute('class')
    return ~classes.indexOf('jstree-open')
  }
}

// UI elements
var controls = {
  ghBreadcrumb    : '.breadcrumb .final-path',
  ghSearch        : '.js-site-search-field',

  helpPopup       : '.popup',
  toggleButton    : '.octotree_toggle',
  sidebar         : '.octotree_sidebar',
  branchLabel     : '.octotree_header_branch',

  treeView        : '.octotree_treeview',
  treeHeaderLinks : '.octotree_header_repo a',
  treeNodes       : '.jstree .jstree-node',

  optsButton      : '.octotree_opts',
  optsView        : '.octotree_optsview',
  tokenInput      : '//input[@data-store="TOKEN"]',
  hotkeysInput    : '//input[@data-store="HOTKEYS"]',
  rememberCheck   : '//input[@data-store="REMEMBER"]',
  nonCodeCheck    : '//input[@data-store="NONCODE"]',
  saveButton      : '.octotree_optsview .btn',

  errorView       : '.octotree_errorview',
  errorViewHeader : '.octotree_errorview .octotree_view_header'
}

Object.keys(controls).forEach(function (name) {
  var selector = controls[name]
    , met = name.indexOf('s') === name.length - 1 ? 'all' : 'one'
    , sel = selector.indexOf('//') === 0 ? $xpath : $css
    , cond = sel(selector)

  Object.defineProperty(PageObject.prototype, name, {
    get: function () {
      return new WebElementPromiseWrapper(this.driver, this[met](cond), cond)
    }
  })
})

/**
 * WebElementPromiseWrapper
 * @param driver
 * @param wep
 * @param cond
 * @constructor
 */
function WebElementPromiseWrapper(driver, wep, cond) {
  this.driver = driver
  this.wep = wep
  this.cond = cond
}

WebElementPromiseWrapper.prototype.then = function () {
  return this.wep.then.apply(this.wep, arguments)
}

Object.keys(webdriver.WebElement.prototype).forEach(function (prop) {
  if (_.isFunction(webdriver.WebElement.prototype[prop])) {
    WebElementPromiseWrapper.prototype[prop] = function *() {
      var driver = this.driver
        , wep = this.wep
        , cond = this.cond

      yield driver.wait(function () {
        return driver.isElementPresent(cond) // TODO: vary condition per action
      }, 5000)
      var elm = yield wep
      return yield elm[prop].apply(elm, arguments)
    }
  }
})
