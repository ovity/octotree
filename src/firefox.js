var data = require('sdk/self').data
  , pageMod = require('sdk/page-mod')

pageMod.PageMod({
  include: '*.github.com',
  contentScriptFile: [data.url('lib/js/underscore.js'),
                      data.url('lib/js/jquery.js'),
                      data.url('lib/js/jstree.js'),
                      data.url('lib/js/jquery.pjax.js'),
                      data.url('lib/js/base64.js'),
                      data.url('lib/js/github.js'),
                      data.url('inject.js')],
  contentStyleFile: [data.url('lib/css/jstree.css'),
                     data.url('inject.css'),],
  contentScriptWhen: 'start'
})