global.assert = require('assert')
global.path = require('path')
global.request = require('request')
global.async = require('async')
global._ = require('underscore')
global._s = require('underscore.string')

global.starx = require('starx')
global.sleep = starx.sleep
global.yieldable = starx.yieldable

global.webdriver = require('selenium-webdriver')
global.test = require('selenium-webdriver/testing')
global.chrome = require('selenium-webdriver/chrome')
global.firefox = require('selenium-webdriver/firefox')
global.FirefoxProfile = require('firefox-profile')
global.SeleniumServer = require('selenium-webdriver/remote').SeleniumServer

global.$tag = webdriver.By.tagName
global.$css = webdriver.By.css
global.$id = webdriver.By.id
global.$xpath = webdriver.By.xpath
global.$class = webdriver.By.className

global.yit = function (title, block) {
  it(title, function (cb) {
    starx(block)(cb)
  })
}

global.rand = function (arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

global.getJson = function (url, token, cb) {
  var headers = {
    'User-Agent': 'buunguyen/octotree (unit test)'
  }
  if (token) headers.Authorization = 'token ' + token

  request({
    url    : url,
    headers: headers
  }, function (err, response, body) {
    if (err) return cb(err)
    cb(null, JSON.parse(body))
  })
}

global.isGenerator = function (fn) {
  return fn.constructor.name === 'GeneratorFunction'
}