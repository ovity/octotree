function isSafari() {
  return typeof safari !== 'undefined' && safari.self && typeof safari.self.addEventListener === 'function';
}

function isValidTimeStamp(timestamp) {
  return !isNaN(parseFloat(timestamp)) && isFinite(timestamp);
}

let $dummyDiv;
function deXss(str) {
  $dummyDiv = $dummyDiv || $('<div></div>');
  return $dummyDiv.text(str).html();
}

function parallel(arr, iter, done) {
  var total = arr.length;
  if (total === 0) return done();

  arr.forEach((item) => {
    iter(item, finish);
  });

  function finish() {
    if (--total === 0) done();
  }
}

function debounce(callback, time) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = null;
      callback(...args);
    }, time);
  };
};

// Regexps from https://github.com/shockie/node-iniparser
const INI_SECTION = /^\s*\[\s*([^\]]*)\s*\]\s*$/;
const INI_COMMENT = /^\s*;.*$/;
const INI_PARAM = /^\s*([\w\.\-\_]+)\s*=\s*(.*?)\s*$/;
const SEPARATOR = /\r\n|\r|\n/;
function parseGitmodules(data) {
  if (!data) return;

  const submodules = {};
  const lines = data.split(SEPARATOR);
  let lastPath;

  lines.forEach((line) => {
    let match;
    if (INI_SECTION.test(line) || INI_COMMENT.test(line) || !(match = line.match(INI_PARAM))) {
      return;
    }

    if (match[1] === 'path') lastPath = match[2];
    else if (match[1] === 'url') submodules[lastPath] = match[2];
  });

  return submodules;
}
