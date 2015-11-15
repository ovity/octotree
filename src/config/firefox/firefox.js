const data = require('sdk/self').data
const pageMod = require('sdk/page-mod')

pageMod.PageMod({
  include: ['https://github.com/*', 'https://gitlab.com/*'],
  contentScriptFile : [data.url('jquery.js'),
                       data.url('jquery-ui.js'),
                       data.url('jquery.pjax.js'),
                       data.url('jstree.js'),
                       data.url('keymaster.js'),
                       data.url('octotree.js')
                      ],
  contentStyleFile  : [data.url('jstree.css'),
                       data.url('octotree.css')
                      ],
  contentScriptWhen : 'start'
})
