var gulp      = require('gulp')
  , clean     = require('gulp-clean')
  , replace   = require('gulp-replace')
  , es        = require('event-stream')
  , series    = require('stream-series')
  , rseq      = require('gulp-run-sequence')

// helpers
const EXT_BASE = '@EXT_BASE@'

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

// tasks
gulp.task('clean', function() {
  return pipe('./dist', [clean()])
})

gulp.task('chrome:copy', function() {
  return es.merge(
    pipe('./src/lib/**/*', './dist/chrome/lib'),
    pipe('./src/icons/**/*', './dist/chrome/icons'),
    pipe(['./src/inject.js', './src/inject.css', './src/manifest.json'], './dist/chrome/')
  )
})

gulp.task('chrome', ['chrome:copy'], function() {
  return pipe(
    './dist/chrome/**/*.css', 
    [replace(EXT_BASE, 'chrome-extension://__MSG_@@extension_id__/')],
    './dist/chrome/'
  )
})

gulp.task('safari:copy', function() {
  return es.merge(
    pipe('./src/lib/**/*', './dist/safari/octotree.safariextension/lib'),
    pipe('./src/icons/**/*', './dist/safari/octotree.safariextension/icons'),
    pipe(['./src/inject.js', './src/inject.css', './src/Info.plist'], './dist/safari/octotree.safariextension/')
  )
})

gulp.task('safari', ['safari:copy'], function() {
  return es.merge(
    pipe('./dist/safari/octotree.safariextension/inject.css', [replace(EXT_BASE, '')], 
         './dist/safari/octotree.safariextension/'),
    pipe('./dist/safari/octotree.safariextension/lib/css/jstree.css', [replace(EXT_BASE + 'lib/', '../')],
         './dist/safari/octotree.safariextension/lib/css')
  )
})

gulp.task('firefox', function() {
  // TODO
})

gulp.task('default', function(cb) {
  return rseq('clean', ['chrome', 'safari', 'firefox'], cb)
})