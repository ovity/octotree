var gulp  = require('gulp')
  , clean = require('gulp-clean')
  , es    = require('event-stream')
  , rseq  = require('gulp-run-sequence')

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

gulp.task('clean', function() {
  return pipe('./tmp', [clean()])
})

gulp.task('chrome', function() {
  return es.merge(
    pipe('./src/lib/**/*', './tmp/chrome/lib'),
    pipe('./src/icons/**/*', './tmp/chrome/icons'),
    pipe(['./src/inject.js', './src/inject.css', './src/manifest.json'], './tmp/chrome/')
  )
})

gulp.task('safari', function() {
  return es.merge(
    pipe('./src/lib/**/*', './tmp/safari/octotree.safariextension/lib'),
    pipe('./src/icons/**/*', './tmp/safari/octotree.safariextension/icons'),
    pipe(['./src/inject.js', './src/inject.css', './src/Info.plist'], './tmp/safari/octotree.safariextension/')
  )
})

gulp.task('firefox', function() {
  return es.merge(
    pipe('./src/lib/**/*', './tmp/firefox/data/lib'),
    pipe('./src/icons/**/*', './tmp/firefox/data/icons'),
    pipe(['./src/inject.js', './src/inject.css', './src/firefox.js'], './tmp/firefox/data'),
    pipe('./src/package.json', './tmp/firefox')
  )
})

gulp.task('default', function(cb) {
  return rseq('clean', ['chrome', 'safari', 'firefox'], cb)
})

gulp.task('watch', function() {
  gulp.watch(['./src/**/*'], ['default'])
})