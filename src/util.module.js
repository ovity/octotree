// regexps from https://github.com/shockie/node-iniparser
const
    INI_SECTION = /^\s*\[\s*([^\]]*)\s*\]\s*$/
  , INI_COMMENT = /^\s*;.*$/
  , INI_PARAM   = /^\s*([\w\.\-\_]+)\s*=\s*(.*?)\s*$/
  , SEPARATOR   = /\r\n|\r|\n/

function parseGitmodules(data, cb) {
  if (!data) return cb()

  var submodules = {}
    , lines = data.split(SEPARATOR)
    , lastPath

  lines.forEach(function(line) {
    var match
    if (INI_SECTION.test(line) || INI_COMMENT.test(line) || !(match = line.match(INI_PARAM))) return
    if (match[1] === 'path') lastPath = match[2]
    else if (match[1] === 'url') submodules[lastPath] = match[2]
  })

  cb(null, submodules)
}