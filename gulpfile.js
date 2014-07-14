var gulp   = require('gulp')
  , merge  = require('event-stream').merge
  , series = require('stream-series')
  , map    = require('map-stream')
  , $      = require('gulp-load-plugins')()

function pipe(src, transforms, dest) {
  if (typeof transforms === 'string') {
    dest = transforms
    transforms = null
  }
  var stream = gulp.src(src)
  transforms && transforms.forEach(function(transform) {
    stream = stream.pipe(transform)
  })
  if (dest) stream = stream.pipe(gulp.dest(dest))
  return stream
}

function html2js(template) {
  return map(escape)

  function escape(file, cb) {
    var path = $.util.replaceExtension(file.path, '.js')
      , content = file.contents.toString()
      , escaped = content.replace(/\\/g, "\\\\")
                         .replace(/'/g, "\\'")
                         .replace(/\r?\n/g, "\\n' +\n    '")
      , body = template.replace('$$', escaped)
    file.path = path
    file.contents = new Buffer(body)
    cb(null, file)
  }
}

function buildJs(additions, ctx) {
  var src = additions.concat([
    './tmp/template.js',
    './src/constants.js',
    './src/adapter.github.js',
    './src/view.help.js',
    './src/view.error.js',
    './src/view.tree.js',
    './src/view.options.js',
    './src/util.location.js',
    './src/util.module.js',
    './src/util.async.js',
    './src/octotree.js',
  ])
  return pipe(src, [
    $.concat('octotree.js'),
    $.preprocess({ context: ctx })
  ], './tmp')
}

function buildTemplate(ctx) {
  return pipe('./src/template.html', [
    $.preprocess({ context: ctx }),
    html2js('const TEMPLATE = \'$$\'')
  ], './tmp')
}

gulp.task('clean', function() {
  return pipe('./tmp', [$.clean()])
})

gulp.task('css', function() {
  return pipe('./src/octotree.less', [$.less(), $.autoprefixer({ cascade: true })], './tmp')
})


gulp.task('default', function(cb) {
  $.runSequence('clean', 'css', 'chrome', 'opera', 'safari', 'firefox', cb)
  gulp.watch(['./src/**/*'], ['default'])
})


// Chrome
gulp.task('chrome:template', function() {
  return buildTemplate({ CHROME: true })
})

gulp.task('chrome:js', ['chrome:template'], function() {
  return buildJs(['./src/chrome/storage.js'], { CHROME: true })
})

gulp.task('chrome', ['chrome:js'], function() {
  return merge(
    pipe('./icons/**/*', './tmp/chrome/icons'),
    pipe(['./libs/**/*', './tmp/octotree.*', './src/chrome/**/*', '!./src/chrome/storage.js'], './tmp/chrome/')
  )
})

// Opera
gulp.task('opera', ['chrome'], function() {
  return pipe('./tmp/chrome/**/*', './tmp/opera')
})

// Safari
gulp.task('safari:template', function() {
  return buildTemplate({ SAFARI: true })
})

gulp.task('safari:js', ['safari:template'], function() {
  return buildJs(['./src/safari/storage.js'], { SAFARI: true })
})

gulp.task('safari', ['safari:js'], function() {
  return merge(
    pipe('./icons/**/*', './tmp/safari/octotree.safariextension/icons'),
    pipe(['./libs/**/*', './tmp/octotree.js', './tmp/octotree.css', 
          './src/safari/**/*', '!./src/safari/storage.js'], './tmp/safari/octotree.safariextension/')
  )
})

// Firefox
gulp.task('firefox:template', function() {
  return buildTemplate({ FIREFOX: true })
})

gulp.task('firefox:js', ['firefox:template'], function() {
  return buildJs(['./src/firefox/storage.js'], { FIREFOX: true })
})

gulp.task('firefox', ['firefox:js'], function() {
  return merge(
    pipe('./icons/**/*', './tmp/firefox/data/icons'),
    pipe(['./libs/**/*', './tmp/octotree.js', './tmp/octotree.css'], './tmp/firefox/data'),
    pipe(['./src/firefox/firefox.js'], './tmp/firefox/lib'),
    pipe('./src/firefox/package.json', './tmp/firefox')
  )
})