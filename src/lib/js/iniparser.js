// modified from https://github.com/shockie/node-iniparser/blob/master/lib/node-iniparser.js
// https://github.com/shockie/node-iniparser

(function() {
  var iniParser = {}
  iniParser.parse = function(data) {
    var regex = {
      section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
      param: /^\s*([\w\.\-\_]+)\s*=\s*(.*?)\s*$/,
      comment: /^\s*;.*$/
    }
    var value = {}
    var lines = data.split(/\r\n|\r|\n/)
    var section = null
    lines.forEach(function(line) {
      if(regex.comment.test(line)) {
        return
      }else if(regex.param.test(line)) {
        var match = line.match(regex.param)
        if(section) {
          value[section][match[1]] = match[2]
        }else{
          value[match[1]] = match[2]
        }
      }else if(regex.section.test(line)) {
        var match = line.match(regex.section)
        value[match[1]] = {}
        section = match[1]
      }else if(line.length == 0 && section) {
        section = null
      }
    })
    return value
  }
  if (typeof exports !== 'undefined') {
    module.exports = iniParser
  } else {
    window.iniParser = iniParser
  }
}).call(this)