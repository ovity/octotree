var gulp  = require('gulp')
  , clean = require('gulp-clean')
  , es    = require('event-stream')
  , rseq  = require('gulp-run-sequence')

// helpers
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

gulp.task('chrome', function() {
  return es.merge(
    pipe('./src/lib/**/*', './dist/chrome/lib'),
    pipe('./src/icons/**/*', './dist/chrome/icons'),
    pipe(['./src/inject.js', './src/inject.css', './src/manifest.json'], './dist/chrome/')
  )
})

gulp.task('safari', function() {
  return es.merge(
    pipe('./src/lib/**/*', './dist/safari/octotree.safariextension/lib'),
    pipe('./src/icons/**/*', './dist/safari/octotree.safariextension/icons'),
    pipe(['./src/inject.js', './src/inject.css', './src/Info.plist'], './dist/safari/octotree.safariextension/')
  )
})

gulp.task('firefox', function() {
  return es.merge(
    pipe('./src/lib/**/*', './dist/firefox/data/lib'),
    pipe('./src/icons/**/*', './dist/firefox/data/icons'),
    pipe(['./src/inject.js', './src/inject.css', './src/firefox.js'], './dist/firefox/data'),
    pipe('./src/package.json', './dist/firefox')
  )
})

gulp.task('default', function(cb) {
  return rseq('clean', ['chrome', 'safari', 'firefox'], cb)
})