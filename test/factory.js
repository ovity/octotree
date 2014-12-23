require('./helper')

const SELENIUM_SERVER_PATH = path.resolve(__dirname, './selenium/selenium-server-standalone-2.43.1.jar')
const CHROME_DRIVER_PATH = path.resolve(__dirname, './selenium/chromedriver')
const CHROME_CRX_PATH = path.resolve(__dirname, '../dist/chrome.crx')
const FIREFOX_XPI_PATH = path.resolve(__dirname, '../dist/firefox.xpi')

exports.chromeDriver = function (cb) {
  var options = new chrome.Options()
  options.addExtensions(CHROME_CRX_PATH)
  var service = new chrome.ServiceBuilder(CHROME_DRIVER_PATH).build()
  cb(null, chrome.createDriver(options, service))
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
        .usingServer(server.address())
        .withCapabilities(capabilities)
        .build()
      cb(null, driver)
    })
  })
}