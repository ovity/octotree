require('./helper')

const SELENIUM_SERVER_PATH = path.resolve(__dirname, '../node_modules/selenium-server/lib/runner/selenium-server-standalone-2.47.1.jar')
const CHROME_DRIVER_PATH = path.resolve(__dirname, '../node_modules/chromedriver/lib/chromedriver/chromedriver')
const CHROME_CRX_PATH = path.resolve(__dirname, '../dist/chrome.crx')
const FIREFOX_XPI_PATH = path.resolve(__dirname, '../dist/firefox.xpi')

exports.chromeDriver = function (cb) {
  var options = new chrome.Options()
  options.addExtensions(CHROME_CRX_PATH)
  var service = new chrome.ServiceBuilder(CHROME_DRIVER_PATH).build()
  cb(null, new chrome.Driver(options, service))
}

exports.firefoxDriver = function (cb) {
  var server = new SeleniumServer(SELENIUM_SERVER_PATH, {port: 4444})
  server.start()

  var profile = new FirefoxProfile();
  profile.addExtension(FIREFOX_XPI_PATH, function () {
    profile.encoded(function (profile) {
      var capabilities = webdriver.Capabilities.firefox()
      capabilities.set('firefox_profile', profile)

      var driver = new webdriver.Builder()
        .withCapabilities(capabilities)
        .build()
      cb(null, driver)
    })
  })
}
