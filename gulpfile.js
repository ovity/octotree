const gulp = require('gulp');
const gutil = require('gulp-util');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {merge} = require('event-stream');
const map = require('map-stream');
const {spawn} = require('child_process');
const $ = require('gulp-load-plugins')();
const uglify = require('gulp-uglify-es').default;

// Shared
gulp.task('clean', () => {
  return pipe(
    './tmp',
    $.clean()
  );
});

gulp.task('build', (cb) => {
  $.runSequence('clean', 'css', 'wex', 'chrome', 'opera', 'firefox', cb);
});

gulp.task('default', ['build'], () => {
  gulp.watch(['./libs/**/*', './src/**/*', './package.json'], ['default']);
});

gulp.task('dist', ['build'], (cb) => {
  $.runSequence('chrome:zip', 'chrome:crx', 'opera:nex', 'firefox:zip', cb);
});

gulp.task('css', () => {
  return pipe(
    './src/styles/octotree.less',
    $.plumber(),
    $.less({relativeUrls: true}),
    $.autoprefixer({cascade: true}),
    gutil.env.production && $.cssmin(),
    './tmp'
  );
});

gulp.task('lib:ondemand', (cb) => {
  const dir = './libs/ondemand';
  const code = fs
    .readdirSync(dir)
    .map((file) => {
      return `window['${file}'] = function () {
      ${fs.readFileSync(path.join(dir, file))}
    };\n`;
    })
    .join('');

  fs.writeFileSync('./tmp/ondemand.js', code, {flag: 'w'});
  cb();
});

// WebExtensions
gulp.task('wex:template', () => buildTemplate());
gulp.task('wex:js:ext', ['wex:template', 'lib:ondemand'], () => buildJs());

gulp.task('wex:js', ['wex:js:ext'], () => {
  const src = [
    './libs/file-icons.js',
    './libs/jquery.js',
    './libs/jquery-ui.js',
    './libs/jstree.js',
    './libs/keymaster.js',
    './tmp/ondemand.js',
    './tmp/octotree.js'
  ];
  return pipe(
    src,
    $.wrap('(function(){\n<%= contents %>\n})();'),
    $.concat('content.js'),
    gutil.env.production && uglify(),
    './tmp'
  );
});

gulp.task('wex', ['wex:js']);

// Firefox
gulp.task('firefox:css:libs', () => buildCssLibs('.', 'moz-extension://__MSG_@@extension_id__/'));
gulp.task('firefox:css', ['firefox:css:libs'], () => buildCss());

gulp.task('firefox', ['firefox:css'], () => prepareWexFolder('./tmp/firefox'));

gulp.task('firefox:zip', () => {
  return pipe(
    './tmp/firefox/**/*',
    $.zip('firefox.zip'),
    './dist'
  );
});

// Chrome
gulp.task('chrome:css:libs', () => buildCssLibs('.', 'chrome-extension://__MSG_@@extension_id__/'));
gulp.task('chrome:css', ['chrome:css:libs'], () => buildCss());

gulp.task('chrome', ['chrome:css'], () => prepareWexFolder('./tmp/chrome'));

gulp.task('chrome:zip', () => {
  return pipe(
    './tmp/chrome/**/*',
    $.zip('chrome.zip'),
    './dist'
  );
});

gulp.task('chrome:crx', () => {
  // This will package the crx using a private key.
  // For the convenience of people who want to build locally without having to
  // Manage their own Chrome key, this code will use the bundled test key if
  // A real key is not found in ~/.ssh.
  const real = path.join(os.homedir() + '.ssh/chrome.pem');
  const test = './chrome_test_key.pem';
  const privateKey = fs.existsSync(real) ? fs.readFileSync(real) : fs.readFileSync(test);

  return pipe(
    './tmp/chrome',
    $.crxPack({
      privateKey: privateKey,
      filename: 'chrome.crx'
    }),
    './dist'
  );
});

// Opera
gulp.task('opera', ['chrome'], () => {
  return pipe(
    './tmp/chrome/**/*',
    './tmp/opera'
  );
});

gulp.task('opera:nex', () => {
  return pipe(
    './tmp/opera/**/*',
    $.zip('opera.nex'),
    './dist'
  );
});

// Helpers
function pipe(src, ...transforms) {
  const work = transforms.filter((t) => !!t).reduce((stream, transform) => {
    const isDest = typeof transform === 'string';
    return stream.pipe(isDest ? gulp.dest(transform) : transform).on('error', (err) => {
      gutil.log(gutil.colors.red('[Error]'), err.toString());
    });
  }, gulp.src(src));

  return work;
}

function html2js(template) {
  return map(escape);

  function escape(file, cb) {
    const path = $.util.replaceExtension(file.path, '.js');
    const content = file.contents.toString();
    /* eslint-disable quotes */
    const escaped = content
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\r?\n/g, "\\n' +\n    '");
    /* eslint-enable */
    const body = template.replace('$$', escaped);

    file.path = path;
    file.contents = new Buffer(body);
    cb(null, file);
  }
}

function buildJs(prefix = '.', ctx = {}) {
  const src = [
    `${prefix}/tmp/template.js`,
    `${prefix}/src/util.module.js`,
    `${prefix}/src/util.async.js`,
    `${prefix}/src/core.constants.js`,
    `${prefix}/src/core.storage.js`,
    `${prefix}/src/core.plugins.js`,
    `${prefix}/src/adapters/adapter.js`,
    `${prefix}/src/adapters/pjax.js`,
    `${prefix}/src/adapters/github.js`,
    `${prefix}/src/view.help.js`,
    `${prefix}/src/view.error.js`,
    `${prefix}/src/view.tree.js`,
    `${prefix}/src/view.options.js`,
    `${prefix}/src/main.js`
  ];

  return pipe(
    src,
    $.preprocess({context: ctx}),
    $.concat('octotree.js'),
    './tmp'
  );
}

function buildCssLibs(prefix = '.', targetPrefix = '') {
  return merge(
    pipe(
      `${prefix}/libs/file-icons.css`,
      $.replace('../fonts', `${targetPrefix}fonts`),
      './tmp'
    ),
    pipe(
      `${prefix}/libs/jstree.css`,
      $.replace('url("32px.png")', `url("${targetPrefix}images/32px.png")`),
      $.replace('url("40px.png")', `url("${targetPrefix}images/40px.png")`),
      $.replace('url("throbber.gif")', `url("${targetPrefix}images/throbber.gif")`),
      './tmp'
    )
  );
}

function buildCss(prefix = '.') {
  return pipe(
    [`${prefix}/tmp/file-icons.css`, `${prefix}/tmp/jstree.css`, `${prefix}/tmp/octotree.css`],
    $.concat('content.css'),
    './tmp'
  );
}

function buildTemplate(prefix = '.', ctx = {}) {
  const LOTS_OF_SPACES = new Array(500).join(' ');

  return pipe(
    `${prefix}/src/template.html`,
    $.preprocess({context: ctx}),
    $.replace('__SPACES__', LOTS_OF_SPACES),
    html2js('const TEMPLATE = \'$$\''),
    './tmp'
  );
}

function prepareWexFolder(dest) {
  return merge(
    pipe(
      './icons/**/*',
      `${dest}/icons`
    ),
    pipe(
      './libs/fonts/**/*',
      `${dest}/fonts`
    ),
    pipe(
      './libs/images/**/*',
      `${dest}/images`
    ),
    pipe(
      './tmp/content.*',
      dest
    ),
    pipe(
      './src/config/wex/background.js',
      gutil.env.production && uglify(),
      dest
    ),
    pipe(
      './src/config/wex/manifest.json',
      $.replace('$VERSION', getVersion()),
      dest
    )
  );
}

function getVersion() {
  delete require.cache[require.resolve('./package.json')];
  return require('./package.json').version;
}

module.exports = {
  pipe,
  buildTemplate,
  buildJs,
  buildCssLibs,
  buildCss
};
