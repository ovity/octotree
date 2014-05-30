var gulp   = require('gulp')
  , gutil  = require('gulp-util')
  , less   = require('gulp-less')
  , clean  = require('gulp-clean')
  , concat = require('gulp-concat')
  , es     = require('event-stream')
  , map    = require('map-stream')
  , prefix = require('gulp-autoprefixer')
  , rseq   = require('gulp-run-sequence')
  , series = require('stream-series')

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
  return series(
    pipe('./libs/**/*.css'),
    pipe('./src/main.less', [less(), prefix({ cascade: true })])
  ).pipe(concat('inject.css')).pipe(gulp.dest('./tmp'))
})

gulp.task('template', function() {
  return pipe('./src/template.html', [html2js('const TEMPLATE = \'$$\'')], './tmp')
})

gulp.task('js', ['template'], function() {
  return pipe(
    [// libs
     './libs/js/jquery.js',
     './libs/js/jquery-ui.js',
     './libs/js/jquery.pjax.js',
     './libs/js/jstree.js',
     './libs/js/keymaster.js',

     // ext
     './src/main.prefix.js',
     './tmp/template.js',
     './src/constants.js',
     './src/main.js',
     './src/view.help.js',
     './src/view.error.js',
     './src/view.tree.js',
     './src/view.options.js',
     './src/util.storage.js',
     './src/util.location.js',
     './src/util.module.js',
     './src/adapter.github.js',
     './src/main.suffix.js'
    ], [concat('inject.js')], './tmp'
  )
})

gulp.task('chrome', function() {
  return es.merge(
    pipe('./icons/**/*', './tmp/chrome/icons'),
    pipe(['./tmp/inject.js', './tmp/inject.css', './src/chrome/**/*'], './tmp/chrome/')
  )
})

gulp.task('opera', function() {
  return es.merge(
    pipe('./icons/**/*', './tmp/opera/icons'),
    pipe(['./tmp/inject.js', './tmp/inject.css', './src/chrome/**/*'], './tmp/opera/')
  )
})

gulp.task('safari', function() {
  return es.merge(
    pipe('./icons/**/*', './tmp/safari/octotree.safariextension/icons'),
    pipe(['./tmp/inject.js', './tmp/inject.css', './src/safari/**/*'], './tmp/safari/octotree.safariextension/')
  )
})

gulp.task('firefox', function() {
  return es.merge(
    pipe('./icons/**/*', './tmp/firefox/data/icons'),
    pipe(['./tmp/inject.js', './tmp/inject.css', './src/firefox/**'], './tmp/firefox/data')
  )
})

gulp.task('default', function(cb) {
  rseq('clean', ['js', 'css'], ['chrome', 'opera', 'safari', 'firefox'], cb)
  gulp.watch(['./src/**/*'], ['default'])
})