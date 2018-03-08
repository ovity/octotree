import gulp from 'gulp'
import fs from 'fs'
import os from 'os'
import path from 'path'
import {merge} from 'event-stream'
import map from 'map-stream'
import {spawn} from 'child_process'
const $ = require('gulp-load-plugins')()

// Tasks
gulp.task('clean', () => {
  return pipe('./tmp', $.clean())
})

gulp.task('build', (cb) => {
  $.runSequence('clean', 'styles', 'chrome', 'opera', 'safari', 'firefox', cb)
})

gulp.task('default', ['build'], () => {
  gulp.watch(['./libs/**/*', './src/**/*', './package.json'], ['default'])
})

gulp.task('dist', ['build'], (cb) => {
  $.runSequence('firefox:zip', 'chrome:zip', 'chrome:crx', 'opera:nex', cb)
})

gulp.task('test', ['build'], (cb) => {
  const ps = spawn(
    './node_modules/.bin/mocha',
    ['--harmony', '--reporter', 'spec', '--bail', '--recursive', '--timeout', '-1']
  )
  ps.stdout.pipe(process.stdout);
  ps.stderr.pipe(process.stderr);
  ps.on('close', cb)
})

gulp.task('styles', () => {
  return pipe(
    './src/styles/octotree.less',
    $.plumber(),
    $.less({relativeUrls: true}),
    $.autoprefixer({cascade: true}),
    './tmp'
  )
})

gulp.task('lib:ondemand', (cb) => {
  const dir = './libs/ondemand'
  const code = fs.readdirSync(dir).map(file => {
    return `window['${file}'] = function () {
      ${fs.readFileSync(path.join(dir, file))}
    };\n`
  }).join('')

  fs.writeFileSync('./tmp/ondemand.js', code)

  cb()
})

// Chrome
gulp.task('chrome:template', () => {
  return buildTemplate({SUPPORT_FILE_ICONS: true, SUPPORT_GHE: true})
})

gulp.task('chrome:js', ['chrome:template', 'lib:ondemand'], () => {
  return buildJs(['./src/config/chrome/overrides.js'], {SUPPORT_FILE_ICONS: true, SUPPORT_GHE: true})
})

gulp.task('chrome', ['chrome:js'], () => {
  return merge(
    pipe('./icons/**/*', './tmp/chrome/icons'),
    pipe(['./libs/**/*', '!./libs/ondemand{,/**}', './tmp/octotree.*', './tmp/ondemand.js'], './tmp/chrome/'),
    pipe('./libs/file-icons.css', $.replace('../fonts', 'chrome-extension://__MSG_@@extension_id__/fonts'), './tmp/chrome/'),
    pipe('./src/config/chrome/background.js', $.babel(), './tmp/chrome/'),
    pipe('./src/config/chrome/manifest.json', $.replace('$VERSION', getVersion()), './tmp/chrome/')
  )
})

gulp.task('chrome:zip', () => {
  return pipe('./tmp/chrome/**/*', $.zip('chrome.zip'), './dist')
})

gulp.task('chrome:crx', () => {
  // This will package the crx using a private key.
  // For the convenience of people who want to build locally without having to
  // manage their own Chrome key, this code will use the bundled test key if
  // a real key is not found in ~/.ssh.
  const real = path.join(os.homedir() + '.ssh/chrome.pem')
  const test = './chrome_test_key.pem'
  const privateKey = fs.existsSync(real) ? fs.readFileSync(real) : fs.readFileSync(test)

  return pipe('./tmp/chrome', $.crxPack({
    privateKey: privateKey,
    filename: 'chrome.crx'
  }), './dist')
})

// Opera
gulp.task('opera', ['chrome'], () => {
  return pipe('./tmp/chrome/**/*', './tmp/opera')
})

gulp.task('opera:nex', () => {
  return pipe('./dist/chrome.crx', $.rename('opera.nex'), './dist')
})

// Firefox
gulp.task('firefox:template', () => {
  return buildTemplate({SUPPORT_FILE_ICONS: true})
})

gulp.task('firefox:js', ['firefox:template', 'lib:ondemand'], () => {
  return buildJs([], {SUPPORT_FILE_ICONS: true})
})

gulp.task('firefox', ['firefox:js'], () => {
  return merge(
    pipe('./icons/**/*', './tmp/firefox/icons'),
    pipe(['./libs/**/*', '!./libs/ondemand{,/**}', './tmp/octotree.*', './tmp/ondemand.js'], './tmp/firefox'),
    pipe('./libs/file-icons.css', $.replace('../fonts', 'moz-extension://__MSG_@@extension_id__/fonts'), './tmp/firefox/'),
    pipe('./src/config/firefox/background.js', $.babel(), './tmp/firefox/'),
    pipe('./src/config/firefox/manifest.json', $.replace('$VERSION', getVersion()), './tmp/firefox')
  )
})

gulp.task('firefox:zip', () => {
  return pipe('./tmp/firefox/**/*', $.zip('firefox.zip'), './dist')
})

// Safari
gulp.task('safari:template', () => {
  return buildTemplate({SUPPORT_FILE_ICONS: true})
})

gulp.task('safari:js', ['safari:template', 'lib:ondemand'], () => {
  return buildJs([], {SUPPORT_FILE_ICONS: true})
})

gulp.task('safari', ['safari:js'], () => {
  return merge(
    pipe('./icons/icon64.png', $.rename('Icon-64.png'), './tmp/safari/octotree.safariextension'),
    pipe(
      ['./libs/**/*', '!./libs/ondemand{,/**}', './tmp/octotree.*', './tmp/ondemand.js'],
      './tmp/safari/octotree.safariextension/'
    ),
    pipe('./libs/file-icons.css', $.replace('../fonts', 'fonts'), './tmp/safari/octotree.safariextension/'),
    pipe('./src/config/safari/Info.plist', $.replace('$VERSION', getVersion()), './tmp/safari/octotree.safariextension')
  )
})

// Helpers
function pipe(src, ...transforms) {
  return transforms.reduce((stream, transform) => {
    const isDest = typeof transform === 'string'
    return stream.pipe(isDest ? gulp.dest(transform) : transform)
  }, gulp.src(src))
}

function html2js(template) {
  return map(escape)

  function escape(file, cb) {
    const path = $.util.replaceExtension(file.path, '.js')
    const content = file.contents.toString()
    const escaped = content
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/\r?\n/g, "\\n' +\n    '")
    const body = template.replace('$$', escaped)

    file.path = path
    file.contents = new Buffer(body)
    cb(null, file)
  }
}

function buildJs(overrides, ctx) {
  const src = [
    './tmp/template.js',
    './src/constants.js',
    './src/adapters/adapter.js',
    './src/adapters/pjax.js',
    './src/adapters/bitbucket.js',
    './src/adapters/github.js',
    './src/view.help.js',
    './src/view.error.js',
    './src/view.tree.js',
    './src/view.options.js',
    './src/util.location.js',
    './src/util.module.js',
    './src/util.async.js',
    './src/util.storage.js'
  ].concat(overrides)
   .concat('./src/octotree.js')

  return pipe(
    src,
    $.babel(),
    $.concat('octotree.js'),
    $.preprocess({context: ctx}),
    './tmp'
  )
}

function buildTemplate(ctx) {
  const LOTS_OF_SPACES = new Array(500).join(' ')

  return pipe(
    './src/template.html',
    $.preprocess({context: ctx}),
    $.replace('__SPACES__', LOTS_OF_SPACES),
    html2js('const TEMPLATE = \'$$\''),
    './tmp'
  )
}

function getVersion() {
  delete require.cache[require.resolve('./package.json')]
  return require('./package.json').version
}
