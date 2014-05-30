var data = require('sdk/self').data
  , pageMod = require('sdk/page-mod')

pageMod.PageMod({
  include: '*.github.com',
  contentScriptFile : [data.url('inject.js')],
  contentStyleFile  : [data.url('inject.css')],
  contentScriptWhen : 'start'
})