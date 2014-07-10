var gulp   = require('gulp')
  , gutil  = require('gulp-util')
  , less   = require('gulp-less')
  , clean  = require('gulp-clean')
  , concat = require('gulp-concat')
  , merge  = require('event-stream').merge
  , series = require('stream-series')
  , map    = require('map-stream')
  , prefix = require('gulp-autoprefixer')
  , rseq   = require('gulp-run-sequence')

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
    var path = gutil.replaceExtension(file.path, '.js')
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

gulp.task('clean', function() {
  return pipe('./tmp', [clean()])
})

gulp.task('css', function() {
  return pipe('./src/octotree.less', [less(), prefix({ cascade: true })], './tmp')
})

gulp.task('template', function() {
  return pipe('./src/template.html', [html2js('const TEMPLATE = \'$$\'')], './tmp')
})

function buildMainScript(additions) {
  var src = additions.concat([
    './src/adapter.github.js',
    './src/view.help.js',
    './src/view.error.js',
    './src/view.tree.js',
    './src/view.options.js',
    './src/util.location.js',
    './src/util.module.js',
    './tmp/template.js',
    './src/constants.js',
    './src/octotree.js',
  ])
  return pipe(src, [concat('octotree.js')], './tmp')
}

gulp.task('chrome:octotree', function() {
  return buildMainScript(['./src/chrome/storage.js'])
})
gulp.task('chrome', ['chrome:octotree'], function() {
  return merge(
    pipe('./icons/**/*', './tmp/chrome/icons'),
    pipe(['./libs/**/*', './tmp/octotree.*', './src/chrome/**/*', '!./src/chrome/storage.js'], './tmp/chrome/')
  )
})

gulp.task('opera', ['chrome'], function() {
  return pipe('./tmp/chrome/**/*', './tmp/opera')
})

gulp.task('safari:octotree', function() {
  return buildMainScript(['./src/safari/storage.js'])
})
gulp.task('safari', ['safari:octotree'], function() {
  return merge(
    pipe('./icons/**/*', './tmp/safari/octotree.safariextension/icons'),
    pipe(['./libs/**/*', './tmp/octotree.js', './tmp/octotree.css', 
          './src/safari/**/*', '!./src/safari/storage.js'], './tmp/safari/octotree.safariextension/')
  )
})

gulp.task('firefox:octotree', function() {
  return buildMainScript(['./src/firefox/storage.js'])
})
gulp.task('firefox', ['firefox:octotree'], function() {
  return merge(
    pipe('./icons/**/*', './tmp/firefox/data/icons'),
    pipe(['./libs/**/*', './tmp/octotree.js', './tmp/octotree.css'], './tmp/firefox/data'),
    pipe(['./src/firefox/firefox.js'], './tmp/firefox/lib'),
    pipe('./src/firefox/package.json', './tmp/firefox')
  )
})

gulp.task('default', function(cb) {
  rseq('clean', ['css', 'template'], 'chrome', 'opera', 'safari', 'firefox', cb)
  gulp.watch(['./src/**/*'], ['default'])
})