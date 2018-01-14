/**
 * ╭─╮ ┬ ┬   ╭─╮    ┬ ╭─╮ ╭─╮ ╭╮╭ ╭─╮
 * ├┤  │ │   ├┤     │ │   │ │ │││ ╰─╮
 * ┴   ┴ ┴─╯ ╰─╯    ┴ ╰─╯ ╰─╯ ╯╰╯ ╰─╯
 * File specific icons for the browser
 * from Atom File-icons, https://github.com/file-icons/atom
 *
 * @link      https://github.com/file-icons/atom
 * @author    Daniel Brooker, <dan@nocturnalcode.com>
 * @author    Adnan M.Sagar, <adnan@websemantics.ca>
 */

;(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], function() { return (root.FileIcons = factory()) })
    } else if (typeof module === 'object' && module.exports) { module.exports = factory()
    } else { root.FileIcons = factory() }
}(this, function() {

    var root = this || global
    var cache = {
        directoryName: {},
        directoryPath: {},
        fileName: {},
        filePath: {},
        interpreter: {},
        scope: {},
        language: {},
        signature: {}
    }

    /* ---------------------------------------------------------------------------
     * Icon
     * ------------------------------------------------------------------------- */

    /**
     * Create Icon instance
     *
     * @param {Number}  index - Index of the icon's appearance in the enclosing array
     * @param {Array}   data - icon's data points that contains the following,
     *
     * @property {Icon} icon - Icon's CSS class (e.g., "js-icon")
     * @property {Array} colour - Icon's colour classes
     * @property {RegExp} match - Pattern for matching names or pathnames
     * @property {Numeric} [priority=1] -  priority that determined icon's order of appearance
     * @property {Boolean} [matchPath=false] - Match against system path instead of basename
     * @property {RegExp} [interpreter=null] -  to match executable names in hashbangs
     * @property {RegExp} [scope=null] -  to match grammar scope-names
     * @property {RegExp} [lang=null] -  to match alias patterns
     * @property {RegExp} [sig=null] -  to match file signatures
     *
     * @constructor
     */

    var Icon = function(index, data) {
        this.index = index
        this.icon = data[0]
        this.colour = data[1]
        this.match = data[2]
        this.priority = data[3] || 1
        this.matchPath = data[4] || false
        this.interpreter = data[5] || null
        this.scope = data[6] || null
        this.lang = data[7] || null
        this.signature = data[8] || null
    }

    /**
  	 * Return the CSS classes for displaying the icon.
  	 *
  	 * @param {Number|null} colourMode
  	 * @param {Boolean} asArray
  	 * @return {String}
  	 */

    Icon.prototype.getClass = function(colourMode, asArray) {

        colourMode = colourMode !== undefined ? colourMode : null
        asArray = asArray !== undefined ? asArray  : false

        // No colour needed or available
        if (colourMode === null || this.colour[0] === null)
            return asArray ? [this.icon] : this.icon

        return asArray
            ? [this.icon, this.colour[colourMode]]
            : this.icon + " " + this.colour[colourMode]
    }

    /* ---------------------------------------------------------------------------
     * IconTables
     * ------------------------------------------------------------------------- */

    /**
     * Create IconTables instance
     *
     * @param {Array}   data - Icons database
     *
     * @property {Array} directoryIcons - Icons to match directory-type resources.
     * @property {Array} fileIcons      - Icons to match file resources.
     * @property {Icon}  binaryIcon     - Icon for binary files.
     * @property {Icon}  executableIcon - Icon for executables.
     * @class
     * @constructor
     */

    var IconTables = function(data) {
        this.directoryIcons = this.read(data[0])
        this.fileIcons = this.read(data[1])
        this.binaryIcon = this.matchScope("source.asm")
        this.executableIcon = this.matchInterpreter("bash")
    }

    /**
     * Populate icon-lists from a icons data table.
     *
     * @param {Array} table
     * @return {Object}
     * @private
     */

    IconTables.prototype.read = function(table) {

        var icons = table[0]
        var indexes = table[1]

        icons = icons.map(function(icon, index) {
            return new Icon(index, icon)
        })

        // Dereference Icon instances from their stored offset
        indexes = indexes.map(function(index) {
            return index.map(function(offset) {
                return icons[offset]
            })
        })

        return {
            byName: icons,
            byInterpreter: indexes[0],
            byLanguage: indexes[1],
            byPath: indexes[2],
            byScope: indexes[3],
            bySignature: indexes[4]
        }
    }

    /**
     * Match an icon using a resource's basename.
     *
     * @param {String} name - Name of filesystem entity
     * @param {Boolean} [directory=false] - Match folders instead of files
     * @return {Icon}
     */
    IconTables.prototype.matchName = function(name, directory) {

        directory = directory !== undefined
            ? directory
            : false
        var cachedIcons = directory
            ? this.cache.directoryName
            : cache.fileName
        var icons = directory
            ? this.directoryIcons.byName
            : this.fileIcons.byName

        if (cachedIcons[name]) {
            return cachedIcons[name]
        }

        for (var i in icons) {
            var icon = icons[i]
            if (icon.match.test(name)) {
                return cachedIcons[name] = icon
            }
        }
        return null
    }

    /**
     * Match an icon using a resource's system path.
     *
     * @param {String} path - Full pathname to check
     * @param {Boolean} [directory=false] - Match folders instead of files
     * @return {Icon}
     */
    IconTables.prototype.matchPath = function(path, directory) {

        directory = directory !== undefined
            ? directory
            : false
        var cachedIcons = directory
            ? cache.directoryName
            : cache.fileName
        var icons = directory
            ? this.directoryIcons.byPath
            : this.fileIcons.byPath

        if (cachedIcons[name]) {
            return cachedIcons[name]
        }

        for (var i in icons) {
            var icon = icons[i]
            if (icon.match.test(path)) {
                return cachedIcons[path] = icon
            }
        }
        return null
    }

    /**
     * Match an icon using the human-readable form of its related language.
     *
     * Typically used for matching modelines and Linguist-language attributes.
     *
     * @example IconTables.matchLanguage("JavaScript")
     * @param {String} name - Name/alias of language
     * @return {Icon}
     */
    IconTables.prototype.matchLanguage = function(name) {

        if (cache.language[name]) {
            return cache.language[name]
        }

        for (var i in this.fileIcons.byLanguage) {
            var icon = this.fileIcons.byLanguage[i]
            if (icon.lang.test(name)) {
                return cache.language[name] = icon
            }
        }
        return null
    }

    /**
     * Match an icon using the grammar-scope assigned to it.
     *
     * @example IconTables.matchScope("source.js")
     * @param {String} name
     * @return {Icon}
     */
    IconTables.prototype.matchScope = function(name) {

        if (cache.scope[name]) {
            return cache.scope[name]
        }

        for (var i in this.fileIcons.byScope) {
            var icon = this.fileIcons.byScope[i]
            if (icon.scope.test(name)) {
                return cache.scope[name] = icon
            }
        }
        return null
    }

    /**
     * Match an icon using the name of an interpreter which executes its language.
     *
     * Used for matching interpreter directives (a.k.a., "hashbangs").
     *
     * @example IconTables.matchInterpreter("bash")
     * @param {String} name
     * @return {Icon}
     */
    IconTables.prototype.matchInterpreter = function(name) {

        if (cache.interpreter[name]) {
            return cache.interpreter[name]
        }

        for (var i in this.fileIcons.byInterpreter) {
            var icon = this.fileIcons.byInterpreter[i]
            if (icon.interpreter.test(name)) {
                return cache.interpreter[name] = icon
            }
        }
        return null
    }

    /**
     * Match an icon using a resource's file signature.
     *
     * @example IconTables.matchSignature("\x1F\x8B")
     * @param {String} data
     * @return {Icon}
     */
    IconTables.prototype.matchSignature = function(data) {}

    /* ---------------------------------------------------------------------------
     * Icons Database
     * ------------------------------------------------------------------------- */

    var icondb = [
    [[["arttext-icon",["dark-purple","dark-purple"],/\.artx$/i],
    ["atom-icon",["dark-green","dark-green"],/^\.atom$/],
    ["bower-icon",["medium-yellow","medium-orange"],/^bower[-_]components$/],
    ["dropbox-icon",["medium-blue","medium-blue"],/^(?:Dropbox|\.dropbox\.cache)$/],
    ["emacs-icon",["medium-purple","medium-purple"],/^\.emacs\.d$/],
    ["dylib-icon",[null,null],/\.framework$/i],
    ["git-icon",["medium-red","medium-red"],/\.git$/],
    ["github-icon",[null,null],/^\.github$/],
    ["meteor-icon",["dark-orange","dark-orange"],/^\.meteor$/],
    ["node-icon",["medium-green","medium-green"],/^node_modules$/],
    ["package-icon",[null,null],/^\.bundle$/i],
    ["svn-icon",[null,null],/^\.svn$/i],
    ["textmate-icon",[null,null],/\.tmBundle$/i],
    ["vagrant-icon",["medium-cyan","medium-cyan"],/\.vagrant$/i],
    ["appstore-icon",[null,null],/\.xcodeproj$/i]],
    [[],[],[],[],[]]],
    [[["binary-icon",["dark-green","dark-green"],/\.swp$/i,4],
    ["link-icon",["medium-blue","medium-blue"],/\.lnk$/i,3],
    ["angular-icon",["medium-red","medium-red"],/^angular[^.]*\.js$/i,2],
    ["ant-icon",["dark-pink","dark-pink"],/^ant\.xml$|\.ant$/i,2],
    ["apache-icon",["medium-red","medium-red"],/^(?:apache2?|httpd).conf$/i,2],
    ["apache-icon",["dark-green","dark-green"],/\.vhost$/i,2],
    ["apache-icon",["medium-green","medium-green"],/\.thrift$/i,2],
    ["appcelerator-icon",["medium-red","medium-red"],/^appcelerator\.js$/i,2],
    ["appveyor-icon",["medium-blue","medium-blue"],/^appveyor\.yml$/i,2],
    ["archlinux-icon",["dark-purple","dark-purple"],/^\.install$/,2],
    ["archlinux-icon",["dark-maroon","dark-maroon"],/^\.SRCINFO$/,2],
    ["archlinux-icon",["dark-yellow","dark-yellow"],/^pacman\.conf$/,2],
    ["archlinux-icon",["light-yellow","light-yellow"],/^pamac\.conf$/,2],
    ["archlinux-icon",["dark-cyan","dark-cyan"],/^PKGBUILD$/,2],
    ["archlinux-icon",["light-yellow","light-yellow"],/yaourtrc$/i,2],
    ["backbone-icon",["dark-blue","dark-blue"],/^backbone(?:[-.]min|dev)?\.js$/i,2],
    ["boot-icon",["medium-green","dark-green"],/^Makefile\.boot$/i,2],
    ["bootstrap-icon",["medium-yellow","dark-yellow"],/^(?:custom\.)?bootstrap\S*\.js$/i,2],
    ["bootstrap-icon",["medium-blue","medium-blue"],/^(?:custom\.)?bootstrap\S*\.css$/i,2],
    ["bootstrap-icon",["dark-blue","dark-blue"],/^(?:custom\.)?bootstrap\S*\.less$/i,2],
    ["bootstrap-icon",["light-pink","light-pink"],/^(?:custom\.)?bootstrap\S*\.scss$/i,2],
    ["bootstrap-icon",["medium-green","medium-green"],/^(?:custom\.)?bootstrap\S*\.styl$/i,2],
    ["bower-icon",["medium-yellow","medium-orange"],/^(?:\.bowerrc|bower\.json|Bowerfile)$/i,2],
    ["brakeman-icon",["medium-red","medium-red"],/brakeman\.yml$/i,2],
    ["brakeman-icon",["dark-red","dark-red"],/^brakeman\.ignore$/i,2],
    ["broccoli-icon",["medium-green","medium-green"],/^Brocfile\./i,2],
    ["package-icon",["light-orange","light-orange"],/Cargo\.toml$/i,2],
    ["package-icon",["dark-orange","dark-orange"],/Cargo\.lock$/i,2],
    ["chai-icon",["medium-red","dark-red"],/^chai\.(?:[jt]sx?|es6?|coffee)$/i,2],
    ["chartjs-icon",["dark-pink","dark-pink"],/^Chart\.js$/i,2],
    ["circleci-icon",["medium-green","medium-green"],/^circle\.yml$/i,2],
    ["cc-icon",["medium-green","medium-green"],/\.codeclimate\.yml$/i,2],
    ["codecov-icon",["dark-pink","dark-pink"],/^codecov\.ya?ml$/i,2],
    ["coffee-icon",["medium-cyan","medium-cyan"],/\.coffee\.ecr$/i,2],
    ["coffee-icon",["medium-red","medium-red"],/\.coffee\.erb$/i,2],
    ["compass-icon",["medium-red","medium-red"],/^_?(?:compass|lemonade)\.scss$/i,2],
    ["composer-icon",["medium-yellow","medium-yellow"],/^composer\.(?:json|lock)$/i,2],
    ["composer-icon",["dark-blue","dark-blue"],/^composer\.phar$/i,2],
    ["cordova-icon",["light-blue","light-blue"],/^cordova(?:[^.]*\.|-(?:\d\.)+)js$/i,2],
    ["d3-icon",["medium-orange","medium-orange"],/^d3(?:\.v\d+)?[^.]*\.js$/i,2],
    ["database-icon",["medium-red","medium-red"],/^METADATA\.pb$/,2],
    ["database-icon",["medium-red","medium-red"],/\.git[\/\\](?:.*[\/\\])?(?:HEAD|ORIG_HEAD|packed-refs|logs[\/\\](?:.+[\/\\])?[^\/\\]+)$/,2,true],
    ["docker-icon",["dark-blue","dark-blue"],/^(?:Dockerfile|docker-compose)|\.docker(?:file|ignore)$/i,2,false,,/\.dockerfile$/i,/^Docker$/i],
    ["docker-icon",["dark-orange","dark-orange"],/^docker-sync\.yml$/i,2],
    ["dojo-icon",["light-red","light-red"],/^dojo\.js$/i,2],
    ["ember-icon",["medium-red","medium-red"],/^ember(?:\.|(?:-[^.]+)?-(?:\d+\.)+(?:debug\.)?)js$/i,2],
    ["eslint-icon",["medium-purple","medium-purple"],/\.eslint(?:cache|ignore)$/i,2],
    ["eslint-icon",["light-purple","light-purple"],/\.eslintrc(?:\.(?:js|json|ya?ml))?$/i,2],
    ["extjs-icon",["light-green","light-green"],/\bExtjs(?:-ext)?\.js$/i,2],
    ["fabfile-icon",["medium-blue","medium-blue"],/^fabfile\.py$/i,2],
    ["fuelux-icon",["medium-orange","dark-orange"],/^fuelux(?:\.min)?\.(?:css|js)$/i,2],
    ["gear-icon",["medium-blue","medium-blue"],/\.indent\.pro$/i,2],
    ["grunt-icon",["medium-yellow","medium-yellow"],/gruntfile\.js$/i,2],
    ["grunt-icon",["medium-maroon","medium-maroon"],/gruntfile\.coffee$/i,2],
    ["gulp-icon",["medium-red","medium-red"],/gulpfile\.js$|gulpfile\.babel\.js$/i,2],
    ["gulp-icon",["medium-maroon","medium-maroon"],/gulpfile\.coffee$/i,2],
    ["html5-icon",["medium-cyan","medium-cyan"],/\.html?\.ecr$/i,2],
    ["html5-icon",["medium-red","medium-red"],/\.(?:html?\.erb|rhtml)$/i,2,false,,/\.html\.erb$/i,/^HTML$/i],
    ["ionic-icon",["medium-blue","medium-blue"],/^ionic\.project$/,2],
    ["js-icon",["medium-cyan","medium-cyan"],/\.js\.ecr$/i,2],
    ["js-icon",["medium-red","medium-red"],/\.js\.erb$/i,2],
    ["jquery-icon",["dark-blue","dark-blue"],/^jquery(?:[-.](?:min|latest|\d\.\d+(?:\.\d+)?))*\.(?:[jt]sx?|es6?|coffee|map)$/i,2],
    ["jqueryui-icon",["dark-blue","dark-blue"],/^jquery(?:[-_.](?:ui[-_.](?:custom|dialog-?\w*)|effects)(?:\.[^.]*)?|[-.]?ui(?:-\d\.\d+(?:\.\d+)?)?(?:\.\w+)?)(?:[-_.]?min|dev)?\.(?:[jt]sx?|es6?|coffee|map|s?css|less|styl)$/i,2],
    ["karma-icon",["medium-cyan","medium-cyan"],/^karma\.conf\.js$/i,2],
    ["karma-icon",["medium-maroon","medium-maroon"],/^karma\.conf\.coffee$/i,2],
    ["knockout-icon",["medium-red","medium-red"],/^knockout[-.](?:\d+\.){3}(?:debug\.)?js$/i,2],
    ["leaflet-icon",["medium-green","medium-green"],/^leaflet\.(?:draw-src|draw|spin|coordinates-(?:\d+\.)\d+\.\d+\.src)\.(?:js|css)$|^wicket-leaflet\.js$/i,2],
    ["lein-icon",[null,null],/project\.clj$/i,2],
    ["manpage-icon",["dark-green","dark-green"],/^tmac\.|^(?:mmn|mmt)$/i,2],
    ["marko-icon",["medium-blue","medium-blue"],/\.marko$/i,2,false,/^marko$/,/\.marko$/i,/^mark[0o]$/i],
    ["marko-icon",["medium-maroon","medium-maroon"],/\.marko\.js$/i,2],
    ["materialize-icon",["light-red","light-red"],/^materialize(?:\.min)?\.(?:js|css)$/i,2],
    ["mathjax-icon",["dark-green","dark-green"],/^MathJax[^.]*\.js$/i,2],
    ["mocha-icon",["medium-maroon","medium-maroon"],/^mocha\.(?:[jt]sx?|es6?|coffee)$/i,2],
    ["mocha-icon",["medium-red","medium-red"],/^mocha\.(?:s?css|less|styl)$/i,2],
    ["mocha-icon",["light-maroon","light-maroon"],/mocha\.opts$/i,2],
    ["modernizr-icon",["medium-red","medium-red"],/^modernizr(?:[-\.]custom|-\d\.\d+)(?:\.\d+)?\.js$/i,2],
    ["mootools-icon",["medium-purple","medium-purple"],/^mootools[^.]*\d+\.\d+(?:.\d+)?[^.]*\.js$/i,2],
    ["neko-icon",["dark-orange","dark-orange"],/^run\.n$/,2],
    ["newrelic-icon",["medium-cyan","medium-cyan"],/^newrelic\.yml/i,2],
    ["nginx-icon",["dark-green","dark-green"],/^nginx\.conf$/i,2],
    ["shuriken-icon",["dark-cyan","dark-cyan"],/\.ninja\.d$/i,2],
    ["nodemon-icon",["medium-green","medium-green"],/^nodemon\.json$|^\.nodemonignore$/i,2],
    ["normalize-icon",["medium-red","medium-red"],/^normalize\.(?:css|less|scss|styl)$/i,2],
    ["npm-icon",["medium-red","medium-red"],/^(?:package\.json|\.npmignore|\.?npmrc|npm-debug\.log|npm-shrinkwrap\.json)$/i,2],
    ["postcss-icon",["medium-yellow","dark-yellow"],/\bpostcss\.config\.js$/i,2],
    ["protractor-icon",["medium-red","medium-red"],/^protractor\.conf\./i,2],
    ["pug-icon",["medium-orange","medium-orange"],/^\.pug-lintrc/i,2],
    ["raphael-icon",["medium-orange","medium-orange"],/^raphael(?:\.min|\.no-deps)*\.js$/i,2],
    ["react-icon",["dark-blue","dark-blue"],/^react(?:-[^.]*)?\.js$/i,2],
    ["react-icon",["medium-blue","dark-blue"],/\.react\.js$/i,2],
    ["book-icon",["medium-blue","medium-blue"],/^README(?:\b|_)|^(?:licen[sc]es?|(?:read|readme|click|delete|keep|test)\.me)$|\.(?:readme|1st)$/i,2],
    ["book-icon",["dark-blue","dark-blue"],/^(?:notice|bugs|changes|change[-_]?log(?:[-._]?\d+)?|contribute|contributing|contributors|copying|hacking|history|install|maintainers|manifest|more\.stuff|projects|revision|terms|thanks)$/i,2],
    ["requirejs-icon",["medium-blue","medium-blue"],/^require(?:[-.]min|dev)?\.js$/i,2],
    ["clojure-icon",["medium-maroon","dark-maroon"],/^riemann\.config$/i,2],
    ["rollup-icon",["medium-red","medium-red"],/^rollup\.config\./i,2],
    ["ruby-icon",["light-green","light-green"],/_spec\.rb$/i,2],
    ["scrutinizer-icon",["dark-blue","dark-blue"],/\.scrutinizer\.yml$/i,2],
    ["sencha-icon",["light-green","light-green"],/^sencha(?:\.min)?\.js$/i,2],
    ["snapsvg-icon",["medium-cyan","medium-cyan"],/^snap\.svg(?:[-.]min)?\.js$/i,2],
    ["sourcemap-icon",["medium-blue","medium-blue"],/\.css\.map$/i,2],
    ["sourcemap-icon",["medium-yellow","dark-yellow"],/\.js\.map$/i,2],
    ["stylelint-icon",["medium-purple","medium-purple"],/^\.stylelintrc(?:\.|$)/i,2],
    ["stylelint-icon",["medium-yellow","dark-yellow"],/^stylelint\.config\.js$/i,2],
    ["stylelint-icon",["dark-blue","dark-blue"],/\.stylelintignore$/i,2],
    ["toc-icon",["medium-cyan","dark-cyan"],/\.toc$/i,2,false,,/\.toc$/i,/^Table of Contents$/i],
    ["calc-icon",["medium-maroon","medium-maroon"],/\.8x[pk](?:\.txt)?$/i,2,false,,,,/^\*\*TI[789]\d\*\*/],
    ["travis-icon",["medium-red","medium-red"],/^\.travis/i,2],
    ["typedoc-icon",["dark-purple","dark-purple"],/^typedoc\.json$/i,2],
    ["typings-icon",["medium-maroon","medium-maroon"],/^typings\.json$/i,2],
    ["uikit-icon",["medium-blue","medium-blue"],/^uikit(?:\.min)?\.js$/i,2],
    ["webpack-icon",["medium-blue","medium-blue"],/webpack\.config\.|^webpackfile\.js$/i,2],
    ["wercker-icon",["medium-purple","medium-purple"],/^wercker\.ya?ml$/i,2],
    ["yarn-icon",["medium-blue","medium-blue"],/^yarn\.lock$/i,2],
    ["yeoman-icon",["medium-cyan","medium-cyan"],/\.yo-rc\.json$/i,2],
    ["yui-icon",["dark-blue","dark-blue"],/^(?:yahoo-|yui)[^.]*\.js$/i,2],
    ["emacs-icon",["medium-red","medium-red"],/\.gnus$/i,1.5],
    ["emacs-icon",["dark-green","dark-green"],/\.viper$/i,1.5],
    ["emacs-icon",["dark-blue","dark-blue"],/^Cask$/,1.5],
    ["emacs-icon",["medium-blue","medium-blue"],/^Project\.ede$/i,1.5],
    ["_1c-icon",["medium-red","medium-red"],/\.bsl$/i,,false,,/\.bsl$/i,/^1C$|^1[\W_ \t]?C[\W_ \t]?Enterprise$/i],
    ["_1c-icon",["dark-orange","dark-orange"],/\.sdbl$/i,,false,,/\.sdbl$/i,/^1C$|^1[\W_ \t]?C[\W_ \t]?Query$/i],
    ["_1c-icon",["dark-red","dark-red"],/\.os$/i],
    ["_1c-alt-icon",["medium-red","dark-red"],/\.mdo$/i],
    ["abap-icon",["medium-orange","medium-orange"],/\.abap$/i,,false,,/\.abp$/i,/^ABAP$/i],
    ["as-icon",["medium-blue","medium-blue"],/\.swf$/i],
    ["as-icon",["medium-red","medium-red"],/\.as$/i,,false,,/\.(?:flex-config|actionscript(?:\.\d+)?)$/i,/^ActionScript$|^(?:ActionScript\s*3|as3)$/i],
    ["as-icon",["medium-yellow","dark-yellow"],/\.jsfl$/i],
    ["as-icon",["dark-red","dark-red"],/\.swc$/i],
    ["ada-icon",["medium-blue","medium-blue"],/\.(?:ada|adb|ads)$/i,,false,,/\.ada$/i,/^Ada$|^(?:ada95|ada2005)$/i],
    ["ae-icon",["dark-pink","dark-pink"],/\.aep$/i],
    ["ae-icon",["dark-purple","dark-purple"],/\.aet$/i],
    ["ai-icon",["medium-orange","medium-orange"],/\.ai$/i],
    ["ai-icon",["dark-orange","dark-orange"],/\.ait$/i],
    ["indesign-icon",["dark-pink","dark-pink"],/\.indd$|\.idml$/i],
    ["indesign-icon",["medium-purple","medium-purple"],/\.indl$/i],
    ["indesign-icon",["dark-purple","dark-purple"],/\.indt$|\.inx$/i],
    ["indesign-icon",["dark-blue","dark-blue"],/\.indb$/i],
    ["psd-icon",["medium-blue","medium-blue"],/\.psd$/i,,false,,,,/^8BPS/],
    ["psd-icon",["dark-purple","dark-purple"],/\.psb$/i],
    ["premiere-icon",["dark-purple","dark-purple"],/\.prproj$/i],
    ["premiere-icon",["medium-maroon","medium-maroon"],/\.prel$/i],
    ["premiere-icon",["medium-purple","medium-purple"],/\.psq$/i],
    ["alloy-icon",["medium-red","medium-red"],/\.als$/i,,false,,/\.alloy$/i,/^Alloy$/i],
    ["alpine-icon",["dark-blue","dark-blue"],/(?:\.|^)APKBUILD$/],
    ["ampl-icon",["dark-maroon","dark-maroon"],/\.ampl$/i,,false,,/\.ampl$/i,/^AMPL$/i],
    ["sun-icon",["medium-yellow","dark-yellow"],/\.ansiweatherrc$/i],
    ["antlr-icon",["medium-red","medium-red"],/\.g$/i,,false,/^antlr$/,/\.antlr$/i,/^antlr$/i],
    ["antlr-icon",["medium-orange","medium-orange"],/\.g4$/i],
    ["apache-icon",["dark-red","dark-red"],/\.apacheconf$/i,,false,,/\.apache-config$/i,/^Apache$|^(?:aconf|ApacheConf)$/i],
    ["apache-icon",["medium-purple","medium-purple"],/apache2[\\\/]magic$/i,,true],
    ["api-icon",["medium-blue","medium-blue"],/\.apib$/i,,false,,/\.apib$/i,/^API Blueprint$/i],
    ["apl-icon",["dark-cyan","dark-cyan"],/\.apl$/i,,false,/^apl$/,/\.apl$/i,/^apl$/i],
    ["apl-icon",["medium-maroon","medium-maroon"],/\.apl\.history$/i],
    ["apple-icon",["medium-purple","medium-purple"],/\.(?:applescript|scpt)$/i,,false,/^osascript$/,/\.applescript$/i,/^Apple$|^[0o]sascript$/i],
    ["arc-icon",["medium-blue","medium-blue"],/\.arc$/i],
    ["arduino-icon",["dark-cyan","dark-cyan"],/\.ino$/i,,false,,/\.arduino$/i,/^Arduino$/i],
    ["asciidoc-icon",["medium-blue","medium-blue"],/\.(?:ad|adoc|asc|asciidoc)$/i,,false,,/\.asciidoc$/i,/^AsciiDoc$/i],
    ["asp-icon",["dark-blue","dark-blue"],/\.asp$/i,,false,,/\.asp$/i,/^[Aa][Ss][Pp][\W_ \t]?[Nn][Ee][Tt]$|^aspx(?:-vb)?$/],
    ["asp-icon",["medium-maroon","medium-maroon"],/\.asax$/i],
    ["asp-icon",["dark-green","dark-green"],/\.ascx$/i],
    ["asp-icon",["medium-green","medium-green"],/\.ashx$/i],
    ["asp-icon",["dark-cyan","dark-cyan"],/\.asmx$/i],
    ["asp-icon",["medium-purple","medium-purple"],/\.aspx$/i],
    ["asp-icon",["medium-cyan","medium-cyan"],/\.axd$/i],
    ["eclipse-icon",["medium-maroon","medium-maroon"],/\.aj$/i],
    ["binary-icon",["medium-red","medium-red"],/\.(?:l?a|[ls]?o|out|s|a51|n?asm|axf|elf|prx|puff|was[mt]|z80)$|\.rpy[bc]$/i,,false,,/(?:^|\.)(?:a[rs]m|x86|z80|lc-?3|cpu12|x86asm|m68k|assembly|avr(?:dis)?asm|dasm)(?:\.|$)/i,/^Assembly$|^n?asm$/i],
    ["binary-icon",["dark-blue","dark-blue"],/\.agc$|\.d-objdump$/i,,false,,/\.source\.agc$/i,/^Assembly$|^(?:Virtual\s*)?AGC$|^Apollo(?:[-_\s]*11)?\s*Guidance\s*Computer$/i],
    ["binary-icon",["dark-green","dark-green"],/\.ko$/i],
    ["binary-icon",["medium-blue","medium-blue"],/\.lst$/i,,false,/^lst-cpu12$/,/\.lst-cpu12$/i,/^Assembly$|^lst[\W_ \t]?cpu12$/i],
    ["binary-icon",["dark-orange","dark-orange"],/\.(?:(?:c(?:[+px]{2}?)?-?)?objdump|bsdiff|bin|dat|pak|pdb)$/i],
    ["binary-icon",["medium-orange","medium-orange"],/\.gcode|\.gco/i],
    ["binary-icon",["dark-purple","dark-purple"],/\.py[co]$/i],
    ["binary-icon",[null,null],/\.DS_Store$/i],
    ["ats-icon",["medium-red","medium-red"],/\.dats$/i,,false,,/\.ats$/i,/^ATS$|^ats2$/i],
    ["ats-icon",["medium-blue","medium-blue"],/\.hats$/i],
    ["ats-icon",["dark-yellow","dark-yellow"],/\.sats$/i],
    ["audacity-icon",["medium-yellow","medium-yellow"],/\.aup$/i],
    ["audio-icon",["medium-red","medium-red"],/\.mp3$/i,,false,,,,/^\xFF\xFB|^ID3/],
    ["audio-icon",["dark-yellow","dark-yellow"],/\.wav$/i,,false,,,,/^RIFF(?!.+WEBP)/],
    ["audio-icon",["dark-cyan","dark-cyan"],/\.(?:aac|ac3|m4p)$/i,,false,,,,/^\x0Bw/],
    ["audio-icon",["medium-purple","medium-purple"],/\.aif[fc]?$/i,,false,,,,/^FORM.{4}AIFF/],
    ["audio-icon",["medium-cyan","medium-cyan"],/\.au$/i,,false,,,,/^\.snd|^dns\./],
    ["audio-icon",["dark-red","dark-red"],/\.flac$/i,,false,,,,/^fLaC/],
    ["audio-icon",["medium-red","medium-red"],/\.f4[ab]$/i,,false,,,,/^FLV\x01\x04/],
    ["audio-icon",["medium-cyan","medium-cyan"],/\.m4a$/i,,false,,,,/^.{4}ftypM4A/],
    ["audio-icon",["dark-green","dark-green"],/\.(?:mpc|mp\+)$/i,,false,,,,/^MPCK/],
    ["audio-icon",["dark-orange","dark-orange"],/\.oga$/i],
    ["audio-icon",["dark-maroon","dark-maroon"],/\.opus$/i,,false,,,,/OpusHead/],
    ["audio-icon",["dark-blue","dark-blue"],/\.r[am]$/i,,false,,,,/^\.RMF/],
    ["audio-icon",["medium-blue","medium-blue"],/\.wma$/i],
    ["augeas-icon",["dark-orange","dark-orange"],/\.aug$/i],
    ["ahk-icon",["dark-blue","dark-blue"],/\.ahk$/i,,false,/^ahk$/,/\.ahk$/i,/^AutoHotkey$|^ahk$/i],
    ["ahk-icon",["dark-purple","dark-purple"],/\.ahkl$/i],
    ["autoit-icon",["medium-purple","medium-purple"],/\.au3$/i,,false,,/(?:^|\.)autoit(?:\.|$)/i,/^AutoIt$|^(?:AutoIt3|AutoItScript|au3)$/i],
    ["terminal-icon",["medium-blue","medium-blue"],/\.awk$/i,,false,/^awk$/,/\.awk$/i,/^awk$/i],
    ["terminal-icon",["medium-red","medium-red"],/\.gawk$/i,,false,/^gawk$/,/\.gawk$/i,/^AWK$|^gawk$/i],
    ["terminal-icon",["medium-maroon","medium-maroon"],/\.mawk$/i,,false,/^mawk$/,/\.mawk$/i,/^AWK$|^mawk$/i],
    ["terminal-icon",["dark-green","dark-green"],/\.nawk$/i,,false,/^nawk$/,/\.nawk$/i,/^AWK$|^nawk$/i],
    ["terminal-icon",["dark-cyan","dark-cyan"],/\.auk$/i],
    ["babel-icon",["medium-yellow","medium-yellow"],/\.(?:babelrc|languagebabel|babel)$/i],
    ["babel-icon",["dark-yellow","dark-yellow"],/\.babelignore$/i],
    ["bibtex-icon",["medium-red","dark-red"],/\.cbx$/i],
    ["bibtex-icon",["medium-orange","dark-orange"],/\.bbx$/i],
    ["bibtex-icon",["medium-yellow","dark-yellow"],/\.bib$/i,,false,/^bibtex$/,/\.bibtex$/i,/^bibtex$/i],
    ["bibtex-icon",["medium-green","dark-green"],/\.bst$/i],
    ["gnu-icon",["medium-red","medium-red"],/\.bison$/i,,false,,/\.bison$/i,/^Bison$/i],
    ["blender-icon",["medium-orange","medium-orange"],/\.blend$/i],
    ["blender-icon",["dark-orange","dark-orange"],/\.blend\d+$/i],
    ["blender-icon",["dark-blue","dark-blue"],/\.bphys$/i],
    ["bluespec-icon",["dark-blue","dark-blue"],/\.bsv$/i,,false,,/\.bsv$/i,/^Bluespec$/i],
    ["boo-icon",["medium-green","medium-green"],/\.boo$/i,,false,,/\.boo(?:\.unity)?$/i,/^Boo$/i],
    ["boot-icon",[null,null],/\.boot$/i],
    ["brain-icon",["dark-pink","dark-pink"],/\.bf?$/i,,false,,/\.(?:bf|brainfuck)$/i,/^Brainfuck$|^(?:bf|Brainf\**ck)$/i],
    ["brew-icon",["medium-orange","medium-orange"],/^Brewfile$/],
    ["bro-icon",["dark-cyan","dark-cyan"],/\.bro$/i,,false,,/\.bro$/i,/^Bro$/i],
    ["byond-icon",["medium-blue","medium-blue"],/\.dm$/i,,false,,/\.dm$/i,/^BYOND$|^(?:DM|Dream\s*Maker(?:\s*Script)?)$/i],
    ["c-icon",["medium-blue","medium-blue"],/\.c$/i,,false,/^tcc$/,/\.c$/i,/^C$/i],
    ["c-icon",["medium-purple","medium-purple"],/\.h$|\.cats$/i],
    ["c-icon",["medium-green","medium-green"],/\.idc$/i],
    ["c-icon",["medium-maroon","medium-maroon"],/\.w$/i],
    ["c-icon",["dark-blue","dark-blue"],/\.nc$/i],
    ["c-icon",["medium-cyan","medium-cyan"],/\.upc$/i],
    ["csharp-icon",["medium-blue","dark-blue"],/\.cs$/i,,false,,/\.cs$/i,/^C#$|^c\s*sharp$/i],
    ["csscript-icon",["dark-green","dark-green"],/\.csx$/i,,false,,/\.csx$/i,/^C#-Script$/i],
    ["cpp-icon",["medium-blue","dark-blue"],/\.c[+px]{2}$|\.cc$/i,,false,,/\.cpp$/i,/^C\+\+$|c[-_]?pp|cplusplus/i],
    ["cpp-icon",["medium-purple","dark-purple"],/\.h[+px]{2}$/i],
    ["cpp-icon",["medium-orange","dark-orange"],/\.[it]pp$/i],
    ["cpp-icon",["medium-red","dark-red"],/\.(?:tcc|inl)$/i],
    ["cabal-icon",["medium-cyan","medium-cyan"],/\.cabal$/i,,false,,/\.cabal$/i,/^Cabal$/i],
    ["cake-icon",["medium-yellow","medium-yellow"],/\.cake$/i,,false,,/\.cake$/i,/^Cake$/i],
    ["cakefile-icon",["medium-red","medium-red"],/^Cakefile$/],
    ["cakephp-icon",["medium-red","medium-red"],/\.ctp$/i],
    ["ceylon-icon",["medium-orange","medium-orange"],/\.ceylon$/i],
    ["chapel-icon",["medium-green","medium-green"],/\.chpl$/i,,false,,/\.chapel$/i,/^Chapel$|^chpl$/i],
    ["chrome-icon",["medium-red","medium-red"],/\.crx$/i,,false,,,,/^Cr24/],
    ["chuck-icon",["medium-green","medium-green"],/\.ck$/i,,false,,/\.chuck$/i,/^ChucK$/i],
    ["cirru-icon",["medium-pink","dark-pink"],/\.cirru$/i,,false,,/\.cirru$/i,/^Cirru$/i],
    ["clarion-icon",["medium-orange","medium-orange"],/\.clw$/i,,false,,/\.clarion$/i,/^Clarion$/i],
    ["clean-icon",["dark-cyan","dark-cyan"],/\.icl$/i,,false,/^clean$/,/\.clean$/i,/^clean$/i],
    ["clean-icon",["medium-cyan","medium-cyan"],/\.dcl$/i],
    ["clean-icon",["medium-blue","medium-blue"],/\.abc$/i],
    ["click-icon",["medium-yellow","medium-yellow"],/\.click$/i,,false,,/\.click$/i,/^Click$|^Click!$/i],
    ["clips-icon",["dark-green","dark-green"],/\.clp$/i,,false,,/\.clips$/i,/^CLIPS$/i],
    ["clojure-icon",["medium-blue","dark-blue"],/\.clj$/i,,false,/^clojure$/,/\.clojure$/i,/^cl[0o]jure$/i],
    ["clojure-icon",["medium-purple","dark-purple"],/\.cl2$/i],
    ["clojure-icon",["medium-green","dark-green"],/\.cljc$/i],
    ["clojure-icon",["medium-red","dark-red"],/\.cljx$|\.hic$/i],
    ["cljs-icon",["medium-blue","dark-blue"],/\.cljs(?:\.hl|cm)?$/i],
    ["cmake-icon",["medium-green","medium-green"],/\.cmake$/i,,false,/^cmake$/,/\.cmake$/i,/^cmake$/i],
    ["cmake-icon",["medium-red","medium-red"],/^CMakeLists\.txt$/],
    ["coffee-icon",["medium-maroon","medium-maroon"],/\.coffee$/i,,false,/^coffee$/,/\.coffee$/i,/^CoffeeScript$|^Coffee(?:-Script)?$/i],
    ["coffee-icon",["dark-maroon","dark-maroon"],/\.cjsx$/i],
    ["coffee-icon",["light-maroon","light-maroon"],/\.litcoffee$/i,,false,/^litcoffee$/,/\.litcoffee$/i,/^CoffeeScript$|^litc[0o]ffee$/i],
    ["coffee-icon",["medium-blue","medium-blue"],/\.iced$/i],
    ["cf-icon",["light-cyan","light-cyan"],/\.cfc$/i,,false,,/\.cfscript$/i,/^ColdFusion$|^(?:CFC|CFScript)$/i],
    ["cf-icon",["medium-cyan","medium-cyan"],/\.cfml?$/i,,false,,/\.cfml?$/i,/^ColdFusion$|^(?:cfml?|ColdFusion\s*HTML)$/i],
    ["khronos-icon",["medium-orange","medium-orange"],/\.dae$/i],
    ["cl-icon",["medium-orange","medium-orange"],/\.cl$/i,,false,/^(?:c?lisp|sbcl|[ec]cl)$/,/\.common-lisp$/i,/^Common Lisp$|^c?lisp$/i],
    ["cp-icon",["medium-maroon","medium-maroon"],/\.cp$/i],
    ["cp-icon",["dark-red","dark-red"],/\.cps$/i],
    ["zip-icon",[null,null],/\.(?:zip|z|xz)$/i,,false,,,,/^(?:\x50\x4B(?:\x03\x04|\x05\x06|\x07|\x08)|\x1F[\x9D\xA0]|BZh|RNC[\x01\x02]|\xD0\xCF\x11\xE0)/],
    ["zip-icon",["medium-blue","medium-blue"],/\.rar$/i,,false,,,,/^Rar!\x1A\x07\x01?\0/],
    ["zip-icon",["dark-blue","dark-blue"],/\.t?gz$|\.tar$|\.whl$/i,,false,,,,/^\x1F\x8B/],
    ["zip-icon",["medium-maroon","medium-maroon"],/\.(?:lzo?|lzma|tlz|tar\.lzma)$/i,,false,,,,/^LZIP/],
    ["zip-icon",["medium-maroon","medium-maroon"],/\.7z$/i,,false,,,,/^7z\xBC\xAF\x27\x1C/],
    ["zip-icon",["medium-red","medium-red"],/\.apk$|\.gem$/i],
    ["zip-icon",["dark-cyan","dark-cyan"],/\.bz2$/i],
    ["zip-icon",["medium-blue","medium-blue"],/\.iso$/i,,false,,,,/^\x45\x52\x02\0{3}|^\x8B\x45\x52\x02/],
    ["zip-icon",["medium-orange","medium-orange"],/\.xpi$/i],
    ["zip-icon",["medium-green","medium-green"],/\.epub$/i],
    ["zip-icon",["dark-pink","dark-pink"],/\.jar$/i],
    ["zip-icon",["medium-purple","medium-purple"],/\.war$/i],
    ["zip-icon",["dark-orange","dark-orange"],/\.xar$/i,,false,,,,/^xar!/],
    ["zip-icon",["light-orange","light-orange"],/\.egg$/i],
    ["config-icon",["medium-yellow","medium-yellow"],/\.(?:ini|desktop|directory|cfg|conf|prefs)$/i,,false,,/\.ini$/i,/^d[0o]sini$/i],
    ["config-icon",["medium-purple","medium-purple"],/\.properties$/i,,false,,/\.java-properties$/i],
    ["config-icon",["medium-green","medium-green"],/\.toml$|\.opts$/i],
    ["config-icon",["dark-red","dark-red"],/\.ld$/i],
    ["config-icon",["medium-red","medium-red"],/\.lds$|\.reek$/i],
    ["config-icon",["dark-blue","dark-blue"],/\.terminal$/i],
    ["config-icon",["medium-orange","medium-orange"],/^ld\.script$/i],
    ["config-icon",["dark-red","dark-red"],/\.git[\/\\](?:config|info[\/\\]\w+)$/,,true],
    ["config-icon",["dark-orange","dark-orange"],/^\/(?:private\/)?etc\/(?:[^\/]+\/)*[^\/]*\.(?:cf|conf|ini)(?:\.default)?$/i,,true],
    ["config-icon",["medium-maroon","medium-maroon"],/^\/(?:private\/)?etc\/(?:aliases|auto_(?:home|master)|ftpusers|group|gettytab|hosts(?:\.equiv)?|manpaths|networks|paths|protocols|services|shells|sudoers|ttys)$/i,,true],
    ["coq-icon",["medium-maroon","medium-maroon"],/\.coq$/i,,false,,/\.coq$/i,/^Coq$/i],
    ["creole-icon",["medium-blue","medium-blue"],/\.creole$/i,,false,,/\.creole$/i,/^Creole$/i],
    ["crystal-icon",["medium-cyan","medium-cyan"],/\.e?cr$/i,,false,/^crystal$/,/\.crystal$/i,/^Crystal$/i],
    ["csound-icon",["medium-maroon","medium-maroon"],/\.orc$/i,,false,,/\.csound$/i,/^Csound$|^cs[0o]und[\W_ \t]?[0o]rc$/i],
    ["csound-icon",["dark-orange","dark-orange"],/\.udo$/i],
    ["csound-icon",["dark-maroon","dark-maroon"],/\.csd$/i,,false,,/\.csound-document$/i,/^Csound$|^cs[0o]und[\W_ \t]?csd$/i],
    ["csound-icon",["dark-blue","dark-blue"],/\.sco$/i,,false,,/\.csound-score$/i,/^Csound$|^cs[0o]und[\W_ \t]?sc[0o]$/i],
    ["css3-icon",["medium-blue","medium-blue"],/\.css$/i,,false,/^css$/,/\.css$/i,/^css$/i],
    ["css3-icon",["dark-blue","dark-blue"],/\.less$/i,,false,/^less$/,/\.less$/i,/^CSS$|^less$/i],
    ["cucumber-icon",["medium-green","medium-green"],/\.feature$/i,,false,,/(?:^|\.)(?:gherkin\.feature|cucumber\.steps)(?:\.|$)/i,/^Cucumber$|^gherkin$/i],
    ["nvidia-icon",["medium-green","medium-green"],/\.cu$/i,,false,,/\.cuda(?:-c\+\+)?$/i,/^CUDA$/i],
    ["nvidia-icon",["dark-green","dark-green"],/\.cuh$/i],
    ["cython-icon",["medium-orange","medium-orange"],/\.pyx$/i,,false,,/\.cython$/i,/^Cython$|^pyrex$/i],
    ["cython-icon",["medium-blue","medium-blue"],/\.pxd$/i],
    ["cython-icon",["dark-blue","dark-blue"],/\.pxi$/i],
    ["dlang-icon",["medium-red","medium-red"],/\.di?$/i,,false,,/\.d$/i,/^D$/i],
    ["yang-icon",["medium-red","medium-red"],/\.dnh$/i,,false,,/\.danmakufu$/i,/^Danmakufu$/i],
    ["darcs-icon",["medium-green","medium-green"],/\.d(?:arcs)?patch$/i],
    ["dart-icon",["medium-cyan","medium-cyan"],/\.dart$/i,,false,/^dart$/,/\.dart$/i,/^Dart$/i],
    ["dashboard-icon",["medium-orange","medium-orange"],/\.s[kl]im$/i,,false,/^slim$/,/\.slim$/i,/^slim$/i],
    ["dashboard-icon",["medium-green","medium-green"],/\.cpuprofile$/i],
    ["database-icon",["medium-yellow","medium-yellow"],/\.(?:h|geo|topo)?json$/i],
    ["database-icon",["light-red","light-red"],/\.ya?ml$/i],
    ["database-icon",["medium-maroon","medium-maroon"],/\.cson$|\.ston$|^mime\.types$/i],
    ["database-icon",["dark-yellow","dark-yellow"],/\.json5$/i,,false,/^json5$/,/\.json5$/i,/^js[0o]n5$/i],
    ["database-icon",["medium-red","medium-red"],/\.http$|\.pot?$/i],
    ["database-icon",["medium-orange","medium-orange"],/\.ndjson$|\.pytb$/i,,false,,/\.python\.traceback$/i],
    ["database-icon",["light-blue","light-blue"],/\.fea$/i,,false,,/\.opentype$/i,/^afdk[0o]$/i],
    ["database-icon",["medium-purple","medium-purple"],/\.json\.eex$|\.edn$/i],
    ["database-icon",["dark-cyan","dark-cyan"],/\.proto$/i,,false,,/\.protobuf$/i,/^(?:protobuf|Protocol\s*Buffers?)$/i],
    ["database-icon",["dark-blue","dark-blue"],/\.pydeps$|\.rviz$/i],
    ["database-icon",["dark-purple","dark-purple"],/\.eam\.fs$/i],
    ["database-icon",["medium-pink","medium-pink"],/\.qml$/i],
    ["database-icon",["dark-pink","dark-pink"],/\.qbs$/i],
    ["database-icon",["medium-cyan","medium-cyan"],/\.ttl$/i,,false,,/\.turtle$/i],
    ["database-icon",["medium-blue","medium-blue"],/\.syntax$/i],
    ["database-icon",["dark-red","dark-red"],/[\/\\](?:magic[\/\\]Magdir|file[\/\\]magic)[\/\\][-.\w]+$|lib[\\\/]icons[\\\/]\.icondb\.js$/i,,true],
    ["dbase-icon",["medium-red","medium-red"],/\.dbf$/i],
    ["debian-icon",["medium-red","medium-red"],/\.deb$/i],
    ["debian-icon",["dark-cyan","dark-cyan"],/^control$/],
    ["debian-icon",["medium-cyan","medium-cyan"],/^rules$/],
    ["diff-icon",["medium-orange","medium-orange"],/\.diff$/i,,false,,/\.diff$/i,/^Diff$|^udiff$/i],
    ["earth-icon",["medium-blue","medium-blue"],/\.zone$/i],
    ["earth-icon",["medium-green","medium-green"],/\.arpa$/i],
    ["earth-icon",["dark-blue","dark-blue"],/^CNAME$/],
    ["doxygen-icon",["medium-blue","medium-blue"],/^Doxyfile$/,,false,,/\.doxygen$/i,/^Doxyfile$/i],
    ["dyalog-icon",["medium-orange","medium-orange"],/\.dyalog$/i,,false,/^dyalog$/],
    ["dylib-icon",["medium-cyan","medium-cyan"],/\.(?:dylib|bundle)$/i],
    ["e-icon",["medium-green","medium-green"],/\.E$/,,false,/^rune$/],
    ["eagle-icon",["medium-red","medium-red"],/\.sch$/i],
    ["eagle-icon",["dark-red","dark-red"],/\.brd$/i],
    ["ec-icon",["dark-blue","dark-blue"],/\.ec$/i,,false,/^ec$/,/\.ec$/i,/^ec$/i],
    ["ec-icon",["dark-purple","dark-purple"],/\.eh$/i],
    ["ecere-icon",["medium-blue","medium-blue"],/\.epj$/i],
    ["eclipse-icon",["dark-blue","dark-blue"],/\.c?project$/],
    ["eclipse-icon",["medium-red","medium-red"],/\.classpath$/i],
    ["editorconfig-icon",["medium-orange","medium-orange"],/\.editorconfig$/i,,false,,/\.editorconfig$/i,/^EditorConfig$/i],
    ["eiffel-icon",["medium-cyan","medium-cyan"],/\.e$/,,false,,/\.eiffel$/i,/^Eiffel$/i],
    ["elixir-icon",["dark-purple","dark-purple"],/\.ex$/i,,false,/^elixir$/,/\.elixir$/i,/^elixir$/i],
    ["elixir-icon",["medium-purple","medium-purple"],/\.(?:exs|eex)$/i],
    ["elixir-icon",["light-purple","light-purple"],/mix\.exs?$/i],
    ["elm-icon",["medium-blue","medium-blue"],/\.elm$/i,,false,,/\.elm$/i,/^Elm$/i],
    ["emacs-icon",["medium-purple","medium-purple"],/(?:^|\.)(?:el|_?emacs|spacemacs|emacs\.desktop|abbrev[-_]defs)$/i,,false,/^emacs$/,/\.emacs\.lisp$/i,/^Emacs Lisp$|^elisp$/i],
    ["emacs-icon",["dark-purple","dark-purple"],/(?:^|\.)(?:elc|eld)$/i,,false,,,,/^;ELC\x17\0{3}/],
    ["at-icon",["medium-red","dark-red"],/^(?:authors|owners)$/i],
    ["em-icon",["medium-red","medium-red"],/\.emberscript$/i,,false,,/\.ember(?:script)?$/i,/^EmberScript$/i],
    ["mustache-icon",["medium-blue","medium-blue"],/\.em(?:blem)?$/i,,false,,/\.emblem$/i,/^Emblem$/i],
    ["eq-icon",["medium-orange","medium-orange"],/\.eq$/i,,false,,/\.eq$/i,/^EQ$/i],
    ["erlang-icon",["medium-red","medium-red"],/\.erl$/i,,false,/^escript$/,/\.erlang$/i,/^Erlang$/i],
    ["erlang-icon",["dark-red","dark-red"],/\.beam$/i],
    ["erlang-icon",["medium-maroon","medium-maroon"],/\.hrl$/i],
    ["erlang-icon",["medium-green","medium-green"],/\.xrl$/i],
    ["erlang-icon",["dark-green","dark-green"],/\.yrl$/i],
    ["erlang-icon",["dark-maroon","dark-maroon"],/\.app\.src$/i],
    ["factor-icon",["medium-orange","medium-orange"],/\.factor$/i,,false,,/\.factor$/i,/^Factor$/i],
    ["factor-icon",["dark-orange","dark-orange"],/\.factor-rc$/i],
    ["factor-icon",["medium-red","medium-red"],/\.factor-boot-rc$/i],
    ["fancy-icon",["dark-blue","dark-blue"],/\.fy$/i,,false,/^fancy$/,/\.fancy$/i,/^fancy$/i],
    ["fancy-icon",["medium-blue","medium-blue"],/\.fancypack$/i],
    ["fancy-icon",["medium-green","medium-green"],/^Fakefile$/],
    ["fantom-icon",["medium-blue","medium-blue"],/\.fan$/i,,false,,/\.fan(?:tom)?$/i,/^Fantom$/i],
    ["fbx-icon",["medium-maroon","medium-maroon"],/\.fbx$/i],
    ["finder-icon",["medium-blue","medium-blue"],/^Icon\r$/],
    ["finder-icon",["dark-blue","dark-blue"],/\.rsrc$/i],
    ["flow-icon",["medium-orange","medium-orange"],/\.(?:flowconfig|js\.flow)$/i],
    ["flux-icon",["medium-blue","medium-blue"],/\.fx$/i],
    ["flux-icon",["dark-blue","dark-blue"],/\.flux$/i],
    ["font-icon",["dark-blue","dark-blue"],/\.woff2$/i,,false,,,,/^wOF2/],
    ["font-icon",["medium-blue","medium-blue"],/\.woff$/i,,false,,,,/^wOFF/],
    ["font-icon",["light-green","light-green"],/\.eot$/i,,false,,,,/^.{34}LP/],
    ["font-icon",["dark-green","dark-green"],/\.ttc$/i,,false,,,,/^ttcf/],
    ["font-icon",["medium-green","medium-green"],/\.ttf$/i,,false,,,,/^\0\x01\0{3}/],
    ["font-icon",["dark-yellow","dark-yellow"],/\.otf$/i,,false,,,,/^OTTO.*\0/],
    ["font-icon",["dark-red","dark-red"],/\.pfb$/i],
    ["font-icon",["medium-red","medium-red"],/\.pfm$/i],
    ["ff-icon",["medium-orange","medium-orange"],/\.pe$/i,,false,/^fontforge$/,/\.source\.fontforge$/i,/^FontForge$|^pfaedit$/i],
    ["ff-icon",["dark-blue","dark-blue"],/\.sfd$/i,,false,,/\.text\.sfd$/i,/^FontForge$/i],
    ["fortran-icon",["medium-maroon","medium-maroon"],/\.f$/i,,false,,/\.fortran\.?(?:modern|punchcard)?$/i,/^Fortran$/i],
    ["fortran-icon",["medium-green","medium-green"],/\.f90$/i,,false,,/\.fortran\.free$/i,/^Fortran$/i],
    ["fortran-icon",["medium-red","medium-red"],/\.f03$/i],
    ["fortran-icon",["medium-blue","medium-blue"],/\.f08$/i],
    ["fortran-icon",["medium-maroon","medium-maroon"],/\.f77$/i,,false,,/\.fortran\.fixed$/i,/^Fortran$/i],
    ["fortran-icon",["dark-pink","dark-pink"],/\.f95$/i],
    ["fortran-icon",["dark-cyan","dark-cyan"],/\.for$/i],
    ["fortran-icon",["dark-yellow","dark-yellow"],/\.fpp$/i],
    ["freemarker-icon",["medium-blue","medium-blue"],/\.ftl$/i,,false,,/\.ftl$/i,/^FreeMarker$|^ftl$/i],
    ["frege-icon",["dark-red","dark-red"],/\.fr$/i],
    ["fsharp-icon",["medium-blue","medium-blue"],/\.fs[xi]?$/i,,false,,/\.fsharp$/i,/^FSharp$|^f#$/i],
    ["gml-icon",["medium-green","medium-green"],/\.gml$/i],
    ["gams-icon",["dark-red","dark-red"],/\.gms$/i,,false,,/\.gams(?:-lst)?$/i,/^GAMS$/i],
    ["gap-icon",["medium-yellow","dark-yellow"],/\.gap$/i,,false,/^gap$/,/\.gap$/i,/^gap$/i],
    ["gap-icon",["dark-blue","dark-blue"],/\.gi$/i],
    ["gap-icon",["medium-orange","medium-orange"],/\.tst$/i],
    ["gdb-icon",["medium-green","dark-green"],/\.gdb$/i,,false,/^gdb$/,/\.gdb$/i,/^gdb$/i],
    ["gdb-icon",["medium-cyan","dark-cyan"],/gdbinit$/i],
    ["godot-icon",["medium-blue","medium-blue"],/\.gd$/i,,false,,/\.gdscript$/i,/^GDScript$/i],
    ["gear-icon",["medium-red","medium-red"],/^\.htaccess$|\.yardopts$/i],
    ["gear-icon",["medium-orange","medium-orange"],/^\.htpasswd$/i],
    ["gear-icon",["dark-green","dark-green"],/^\.env\.|\.pairs$/i],
    ["gear-icon",["dark-yellow","dark-yellow"],/^\.lesshintrc$/i],
    ["gear-icon",["medium-yellow","medium-yellow"],/^\.csscomb\.json$|\.csslintrc$|\.jsbeautifyrc$|\.jshintrc$|\.jscsrc$/i],
    ["gear-icon",["medium-maroon","medium-maroon"],/\.coffeelintignore$|\.codoopts$/i],
    ["gear-icon",["medium-blue","medium-blue"],/\.module$/i],
    ["gear-icon",["dark-blue","dark-blue"],/\.arcconfig$|\.python-version$/i],
    ["gear-icon",["dark-orange","dark-orange"],/\.lintstagedrc$/i],
    ["gears-icon",["dark-orange","dark-orange"],/\.dll$/i,,false,,,,/^PMOCCMOC/],
    ["code-icon",["medium-blue","medium-blue"],/\.xml$|\.config$|\.4th$|\.cocci$|\.dyl$|\.dylan$|\.ecl$|\.forth$|\.launch$|\.manifest$|\.menu$|\.srdf$|\.st$|\.ui$|\.wsf$|\.x3d$|\.xaml$/i,,false,,,,/^<\?xml /],
    ["code-icon",["dark-red","dark-red"],/\.rdf$|\.capnp$|\.dotsettings$|\.flex$|\.fsh$|\.fsproj$|\.prw$|\.xproj$/i,,false,,/\.capnp$/i],
    ["code-icon",["medium-blue","medium-blue"],/^_service$/],
    ["code-icon",["medium-red","medium-red"],/^configure\.ac$|\.ML$/],
    ["code-icon",["medium-green","medium-green"],/^Settings\.StyleCop$/],
    ["code-icon",["medium-green","medium-green"],/\.abnf$|\.ditaval$|\.storyboard$|\.xmi$|\.yacc$/i,,false,/^abnf$/,/\.abnf$/i,/^abnf$/i],
    ["code-icon",["medium-purple","medium-purple"],/\.aepx$|\.dita$|\.grace$|\.lid$|\.nproj$/i],
    ["code-icon",["dark-cyan","dark-cyan"],/\.agda$|\.plist$|\.wisp$|\.xlf$|\.xslt$/i,,false,,/\.plist$/i],
    ["code-icon",["medium-orange","medium-orange"],/\.appxmanifest$|\.befunge$|\.fun$|\.muf$|\.xul$/i],
    ["code-icon",["medium-cyan","medium-cyan"],/\.ash$|\.asn1?$|\.lagda$|\.lex$|\.props$|\.resx$|\.smt2$|\.vsh$|\.xsl$|\.yy$/i,,false,/^xsl$/,/\.xsl$/i],
    ["code-icon",["dark-blue","dark-blue"],/\.axml$|\.bmx$|\.brs$|\.ccxml$|\.clixml$|\.fth$|\.intr$|\.mdpolicy$|\.mtml$|\.myt$|\.xsd$/i,,false,/^brightscript$/,/\.brightscript$/i],
    ["code-icon",["medium-maroon","medium-maroon"],/\.bnf$|\.cbl$|\.cob$|\.cobol$|\.fxml$/i,,false,/^bnf$/,/\.bnf$/i,/^bnf$/i],
    ["code-icon",["dark-maroon","dark-maroon"],/\.ccp$|\.cpy$|\.mxml$/i],
    ["code-icon",["medium-red","medium-red"],/\.ch$|\.cw$|\.ebnf$|\.iml$|\.jflex$|\.m4$|\.mask$|\.mumps$|\.prg$|\.pt$|\.rl$|\.sml$|\.targets$|\.webidl$|\.wsdl$|\.xacro$|\.xliff$/i,,false,/^ebnf$/,/\.ebnf$/i],
    ["code-icon",["dark-pink","dark-pink"],/\.ct$|\.zcml$/i],
    ["code-icon",["dark-green","dark-green"],/\.cy$|\.eclxml$|\.ivy$|\.sed$|\.tml$|\.y$/i],
    ["code-icon",["dark-purple","dark-purple"],/\.ditamap$|\.frt$|\.lp$|\.omgrofl$|\.osm$|\.wxs$|\.xib$/i],
    ["code-icon",["medium-pink","medium-pink"],/\.filters$|\.lol$|\.pig$/i],
    ["code-icon",["dark-orange","dark-orange"],/\.grxml$|\.urdf$/i],
    ["code-icon",["medium-yellow","medium-yellow"],/\.jelly$/i],
    ["code-icon",["dark-yellow","dark-yellow"],/\.jsproj$|\.ohm$|\.sgml?$/i,,false,/^ohm$/,/\.ohm$/i],
    ["code-icon",["dark-blue","dark-blue"],/\.mq[45h]$/i,,false,,/(?:^|\.)mq[45](?=\.|$)/i],
    ["code-icon",["light-green","light-green"],/\.odd$/i],
    ["code-icon",["light-blue","light-blue"],/\.psc1$|\.smt$/i,,false,/boolector|cvc4|mathsat5|opensmt|smtinterpol|smt-rat|stp|verit|yices2|z3/,/\.smt$/i],
    ["code-icon",["light-cyan","light-cyan"],/\.scxml$/i],
    ["code-icon",["light-maroon","light-maroon"],/\.sig$|\.wxl$/i],
    ["code-icon",["light-orange","light-orange"],/\.ux$|\.wxi$/i],
    ["code-icon",["light-purple","light-purple"],/\.vxml$/i],
    ["genshi-icon",["medium-red","medium-red"],/\.kid$/i,,false,,/\.genshi$/i,/^Genshi$|^xml\+(?:genshi|kid)$/i],
    ["gentoo-icon",["dark-cyan","dark-cyan"],/\.ebuild$/i,,false,,/\.ebuild$/i,/^Gentoo$/i],
    ["gentoo-icon",["medium-blue","medium-blue"],/\.eclass$/i],
    ["git-icon",["medium-red","medium-red"],/^\.git|^\.keep$|\.mailmap$/i,,false,,/\.git-(?:commit|config|rebase)$/i,/^Git$/i],
    ["git-commit-icon",["medium-red","medium-red"],/^COMMIT_EDITMSG$/],
    ["git-merge-icon",["medium-red","medium-red"],/^MERGE_(?:HEAD|MODE|MSG)$/],
    ["glade-icon",["medium-green","medium-green"],/\.glade$/i],
    ["pointwise-icon",["medium-blue","medium-blue"],/\.glf$/i],
    ["glyphs-icon",["medium-green","medium-green"],/\.glyphs$/i],
    ["gn-icon",["dark-blue","dark-blue"],/\.gn$/i,,false,/^gn$/,/\.gn$/i,/^gn$/i],
    ["gn-icon",["medium-blue","medium-blue"],/\.gni$/i],
    ["gnu-icon",["medium-red","dark-red"],/\.(?:gnu|gplv[23])$/i],
    ["graph-icon",["medium-red","medium-red"],/\.(?:gp|plo?t|gnuplot)$/i,,false,/^gnuplot$/,/\.gnuplot$/i,/^Gnuplot$/i],
    ["go-icon",["medium-blue","medium-blue"],/\.go$/i,,false,,/\.go(?:template)?$/i,/^Go$/i],
    ["golo-icon",["medium-orange","medium-orange"],/\.golo$/i,,false,,/\.golo$/i,/^Golo$/i],
    ["gosu-icon",["medium-blue","medium-blue"],/\.gs$/i,,false,,/\.gosu(?:\.\d+)?$/i,/^Gosu$/i],
    ["gosu-icon",["medium-green","medium-green"],/\.gst$/i],
    ["gosu-icon",["dark-green","dark-green"],/\.gsx$/i],
    ["gosu-icon",["dark-blue","dark-blue"],/\.vark$/i],
    ["gradle-icon",["medium-blue","medium-blue"],/\.gradle$/i,,false,,/\.gradle$/i,/^Gradle$/i],
    ["gradle-icon",["dark-purple","dark-purple"],/gradlew$/i],
    ["gf-icon",["medium-red","medium-red"],/\.gf$/i],
    ["graphql-icon",["medium-pink","medium-pink"],/\.graphql$/i,,false,,/\.graphql$/i,/^GraphQL$/i],
    ["graphql-icon",["medium-purple","medium-purple"],/\.gql$/i],
    ["graphviz-icon",["medium-blue","medium-blue"],/\.gv$/i,,false,,/\.dot$/i,/^Graphviz$/i],
    ["graphviz-icon",["dark-cyan","dark-cyan"],/\.dot$/i],
    ["groovy-icon",["light-blue","light-blue"],/\.(?:groovy|grt|gtpl|gsp|gvy)$/i,,false,/^groovy$/,/\.groovy$/i,/^Groovy$|^gsp$/i],
    ["hack-icon",["medium-orange","medium-orange"],/\.hh$/i,,false,,/\.hack$/i,/^Hack$/i],
    ["haml-icon",["medium-yellow","medium-yellow"],/\.haml$/i,,false,/^haml$/,/\.haml$/i,/^haml$/i],
    ["haml-icon",["medium-maroon","medium-maroon"],/\.hamlc$/i,,false,/^hamlc$/,/\.hamlc$/i,/^Haml$|^hamlc$/i],
    ["harbour-icon",["dark-blue","dark-blue"],/\.hb$/i,,false,,/\.harbour$/i,/^Harbour$/i],
    ["hashicorp-icon",["dark-purple","dark-purple"],/\.hcl$/i,,false,,/(?:^|\.)(?:hcl|hashicorp)(?:\.|$)/i,/^Hashicorp Configuration Language$/i],
    ["haskell-icon",["medium-purple","medium-purple"],/\.hs$/i,,false,/^runhaskell$/,/\.source\.haskell$/i,/^Haskell$/i],
    ["haskell-icon",["medium-blue","medium-blue"],/\.hsc$/i,,false,,/\.hsc2hs$/i,/^Haskell$/i],
    ["haskell-icon",["dark-purple","dark-purple"],/\.c2hs$/i,,false,,/\.c2hs$/i,/^Haskell$|^C2hs(?:\s*Haskell)?$/i],
    ["haskell-icon",["dark-blue","dark-blue"],/\.lhs$/i,,false,,/\.latex\.haskell$/i,/^Haskell$|^(?:lhaskell|lhs|Literate\s*Haskell)$/i],
    ["haxe-icon",["medium-orange","medium-orange"],/\.hx(?:[sm]l|)?$/,,false,,/(?:^|\.)haxe(?:\.\d+)?$/i,/^Haxe$/i],
    ["heroku-icon",["medium-purple","medium-purple"],/^Procfile$/],
    ["heroku-icon",["light-purple","light-purple"],/\.buildpacks$/i],
    ["heroku-icon",["dark-purple","dark-purple"],/^\.vendor_urls$/],
    ["html5-icon",["medium-orange","medium-orange"],/\.x?html?$/i,,false,,/\.html\.basic$/i,/^HTML$|^(?:xhtml|htm)$/i],
    ["html5-icon",["medium-red","medium-red"],/\.cshtml$|\.latte$/i,,false,/^latte$/,/\.latte$/i],
    ["html5-icon",["medium-green","medium-green"],/\.ejs$|\.kit$|\.swig$/i,,false,/^swig$/,/\.swig$/i],
    ["html5-icon",["dark-blue","dark-blue"],/\.gohtml$|\.phtml$/i,,false,/^gohtml$/,/\.gohtml$/i,/^HTML$|^g[0o]html$/i],
    ["html5-icon",["medium-purple","medium-purple"],/\.html\.eex$|\.jsp$/i,,false,,/\.jsp$/i],
    ["html5-icon",["medium-cyan","medium-cyan"],/\.shtml$/i],
    ["html5-icon",["dark-red","dark-red"],/\.scaml$/i,,false,/^scaml$/,/\.scaml$/i,/^HTML$|^scaml$/i],
    ["html5-icon",["medium-red","medium-red"],/\.vash$/i,,false,/^vash$/,/\.vash$/i,/^HTML$|^vash$/i],
    ["html5-icon",["medium-blue","medium-blue"],/\.dtml$/i,,false,/^dtml$/,/\.dtml$/i,/^HTML$|^dtml$/i],
    ["hy-icon",["dark-blue","dark-blue"],/\.hy$/i,,false,,/\.hy$/i,/^Hy$|^hylang$/i],
    ["idl-icon",["medium-blue","medium-blue"],/\.dlm$/i,,false,,/\.idl$/i,/^IDL$/i],
    ["idris-icon",["dark-red","dark-red"],/\.idr$/i,,false,,/\.(?:idris|ipkg)$/i,/^Idris$/i],
    ["idris-icon",["medium-maroon","medium-maroon"],/\.lidr$/i],
    ["igorpro-icon",["dark-red","dark-red"],/\.ipf$/i],
    ["image-icon",["medium-orange","medium-orange"],/\.a?png$|\.svgz$/i,,false,,,,/^.PNG\r\n\x1A\n/],
    ["image-icon",["medium-yellow","medium-yellow"],/\.gif$|\.ora$|\.sgi$/i,,false,,,,/^GIF8[97]a/],
    ["image-icon",["medium-green","medium-green"],/\.jpg$/i,,false,,,,/^\xFF\xD8\xFF[\xDB\xE0\xE1]|(?:JFIF|Exif)\0|^\xCF\x84\x01|^\xFF\xD8.+\xFF\xD9$/],
    ["image-icon",["medium-blue","medium-blue"],/\.ico$/i,,false,,,,/^\0{2}\x01\0/],
    ["image-icon",["dark-blue","dark-blue"],/\.webp$|\.iff$|\.lbm$|\.liff$|\.nrrd$|\.pcx$|\.vsdx?$/i,,false,,,,/^RIFF.{4}WEBPVP8/],
    ["image-icon",["medium-red","medium-red"],/\.bmp$/i,,false,,,,/^BM/],
    ["image-icon",["medium-red","medium-red"],/\.bpg$/i,,false,,,,/^BPG\xFB/],
    ["image-icon",["medium-orange","medium-orange"],/\.cin$/i,,false,,,,/^\x80\x2A\x5F\xD7/],
    ["image-icon",["dark-green","dark-green"],/\.cd5$/i,,false,,,,/^_CD5\x10\0/],
    ["image-icon",["light-yellow","light-yellow"],/\.cpc$/i],
    ["image-icon",["medium-orange","medium-orange"],/\.cr2$/i,,false,,,,/^II\*\0\x10\0{3}CR/],
    ["image-icon",["medium-pink","medium-pink"],/\.dcm$|\.mpo$|\.pbm$/i,,false,,,,/^.{128}DICM/],
    ["image-icon",["dark-green","dark-green"],/\.dds$/i,,false,,,,/^DDS \|\0{3}/],
    ["image-icon",["medium-purple","medium-purple"],/\.djvu?$|\.pxr$/i,,false,,,,/^AT&TFORM/],
    ["image-icon",["dark-orange","dark-orange"],/\.dpx$|\.raw$/i,,false,,,,/^(?:SDPX|XPDS)/],
    ["image-icon",["light-blue","light-blue"],/\.ecw$|\.sct$/i],
    ["image-icon",["dark-yellow","dark-yellow"],/\.exr$/i,,false,,,,/^v\/1\x01/],
    ["image-icon",["medium-cyan","medium-cyan"],/\.fits?$|\.fts$/i,,false,,,,/^SIMPLE  =/],
    ["image-icon",["dark-red","dark-red"],/\.flif$|\.hdp$|\.heic$|\.heif$|\.jxr$|\.wdp$/i,,false,,,,/^FLIF/],
    ["image-icon",["medium-blue","medium-blue"],/\.hdr$/i,,false,,,,/^#\?RADIANCE\n/],
    ["image-icon",["medium-pink","medium-pink"],/\.icns$/i,,false,,,,/^icns/],
    ["image-icon",["dark-green","dark-green"],/\.(?:jp[f2xm]|j2c|mj2)$/i,,false,,,,/^\0{3}\fjP {2}/],
    ["image-icon",["dark-cyan","dark-cyan"],/\.jps$/i],
    ["image-icon",["medium-orange","medium-orange"],/\.mng$/i,,false,,,,/^.MNG\r\n\x1A\n/],
    ["image-icon",["light-red","light-red"],/\.pgf$/i],
    ["image-icon",["light-purple","light-purple"],/\.pict$/i],
    ["image-icon",["dark-orange","dark-orange"],/\.tga$/i,,false,,,,/TRUEVISION-XFILE\.\0$/],
    ["image-icon",["medium-red","medium-red"],/\.tiff?$/i,,false,,,,/^II\x2A\0|^MM\0\x2A/],
    ["image-icon",["dark-maroon","dark-maroon"],/\.wbm$/i],
    ["inform7-icon",["medium-blue","medium-blue"],/\.ni$/i,,false,,/\.inform-?7?$/i,/^Inform 7$|^i7$/i],
    ["inform7-icon",["dark-blue","dark-blue"],/\.i7x$/i],
    ["inno-icon",["dark-blue","dark-blue"],/\.iss$/i,,false,,/\.inno$/i,/^Inno Setup$/i],
    ["io-icon",["dark-purple","dark-purple"],/\.io$/i,,false,/^io$/,/^source\.io$/i,/^Io$/i],
    ["ioke-icon",["medium-red","medium-red"],/\.ik$/i,,false,/^ioke$/],
    ["isabelle-icon",["dark-red","dark-red"],/\.thy$/i,,false,,/\.isabelle\.theory$/i,/^Isabelle$/i],
    ["isabelle-icon",["dark-blue","dark-blue"],/^ROOT$/],
    ["j-icon",["light-blue","light-blue"],/\.ijs$/i,,false,/^jconsole$/,/\.j$/i,/^J$/i],
    ["jade-icon",["medium-red","medium-red"],/\.jade$/i,,false,,/\.jade$/i,/^Jade$/i],
    ["jake-icon",["medium-maroon","dark-maroon"],/^Jakefile$/],
    ["jake-icon",["medium-yellow","dark-yellow"],/\.jake$/i],
    ["java-icon",["medium-purple","medium-purple"],/\.java$/i,,false,,/\.java$/i,/^Java$/i],
    ["js-icon",["medium-yellow","dark-yellow"],/\.js$|\.es6$|\.es$/i,,false,/^(?:node|iojs)$/,/\.js$/i,/^JavaScript$|^(?:js|node)$/i],
    ["js-icon",["medium-orange","dark-orange"],/\._js$/i],
    ["js-icon",["medium-maroon","dark-maroon"],/\.jsb$|\.dust$/i],
    ["js-icon",["medium-blue","dark-blue"],/\.jsm$|\.mjs$|\.xsjslib$/i],
    ["js-icon",["medium-green","dark-green"],/\.jss$/i],
    ["js-icon",["medium-pink","dark-pink"],/\.sjs$/i],
    ["js-icon",["medium-red","dark-red"],/\.ssjs$/i],
    ["js-icon",["medium-purple","dark-purple"],/\.xsjs$/i],
    ["jenkins-icon",["medium-red","dark-red"],/^Jenkinsfile$/],
    ["jinja-icon",["dark-red","dark-red"],/\.jinja$/i,,false,,/\.jinja$/i,/^Jinja$|^(?:django|htmldjango|html\+django\/jinja|html\+jinja)$/i],
    ["jinja-icon",["medium-red","medium-red"],/\.jinja2$/i],
    ["jsonld-icon",["medium-blue","medium-blue"],/\.jsonld$/i],
    ["sql-icon",["medium-blue","medium-blue"],/\.jq$/i,,false,,/\.jq$/i,/^JSONiq$/i],
    ["jsx-icon",["medium-blue","dark-blue"],/\.jsx$/i,,false,,/\.jsx$/i,/^JSX$/i],
    ["julia-icon",["medium-purple","medium-purple"],/\.jl$/i,,false,,/\.julia$/i,/^Julia$/i],
    ["jupyter-icon",["dark-orange","dark-orange"],/\.ipynb$/i,,false,,/\.ipynb$/i,/^(?:ipynb|(?:Jupyter|IPython)\s*Notebook)$/i],
    ["jupyter-icon",["dark-cyan","dark-cyan"],/^Notebook$/],
    ["keynote-icon",["medium-blue","medium-blue"],/\.keynote$/i],
    ["keynote-icon",["dark-blue","dark-blue"],/\.knt$/i],
    ["kivy-icon",["dark-maroon","dark-maroon"],/\.kv$/i,,false,,/\.kv$/i,/^Kivy$/i],
    ["earth-icon",["medium-green","medium-green"],/\.kml$/i],
    ["kotlin-icon",["dark-blue","dark-blue"],/\.kt$/i,,false,/^kotlin$/,/\.kotlin$/i,/^k[0o]tlin$/i],
    ["kotlin-icon",["medium-blue","medium-blue"],/\.ktm$/i],
    ["kotlin-icon",["medium-orange","medium-orange"],/\.kts$/i],
    ["krl-icon",["medium-blue","medium-blue"],/\.krl$/i,,false,,/\.krl$/i,/^KRL$/i],
    ["labview-icon",["dark-blue","dark-blue"],/\.lvproj$/i],
    ["laravel-icon",["medium-orange","medium-orange"],/\.blade\.php$/i,,false,,/\.php\.blade$/i,/^Laravel$/i],
    ["lasso-icon",["dark-blue","dark-blue"],/\.lasso$|\.las$/i,,false,,/\.lasso$/i,/^Lasso$|^lass[0o]script$/i],
    ["lasso-icon",["medium-blue","medium-blue"],/\.lasso8$/i],
    ["lasso-icon",["medium-purple","medium-purple"],/\.lasso9$/i],
    ["lasso-icon",["medium-red","medium-red"],/\.ldml$/i],
    ["lean-icon",["dark-purple","dark-purple"],/\.lean$/i,,false,/^lean$/,/\.lean$/i,/^lean$/i],
    ["lean-icon",["dark-red","dark-red"],/\.hlean$/i],
    ["lfe-icon",["dark-red","dark-red"],/\.lfe$/i],
    ["lightwave-icon",["medium-red","medium-red"],/\.lwo$/i],
    ["lightwave-icon",["medium-blue","medium-blue"],/\.lws$/i],
    ["lisp-icon",["medium-red","medium-red"],/\.lsp$/i,,false,/^newlisp$/,/\.newlisp$/i,/^Lisp$|^newlisp$/i],
    ["lisp-icon",["dark-red","dark-red"],/\.lisp$/i,,false,/^lisp$/,/\.lisp$/i,/^lisp$/i],
    ["lisp-icon",["medium-maroon","medium-maroon"],/\.l$|\.nl$/i,,false,/picolisp|pil/],
    ["lisp-icon",["medium-blue","medium-blue"],/\.ny$|\.sexp$/i],
    ["lisp-icon",["medium-purple","medium-purple"],/\.podsl$/i],
    ["ls-icon",["medium-blue","medium-blue"],/\.ls$/i,,false,,/\.livescript$/i,/^LiveScript$|^(?:ls|live-script)$/i],
    ["ls-icon",["dark-blue","dark-blue"],/\._ls$/i],
    ["ls-icon",["medium-green","medium-green"],/^Slakefile$/],
    ["llvm-icon",["dark-green","dark-green"],/\.ll$/i,,false,/^llvm$/,/\.llvm$/i,/^llvm$/i],
    ["llvm-icon",["medium-yellow","dark-yellow"],/\.clang-format$/i],
    ["mobile-icon",["dark-blue","dark-blue"],/\.xm$/i,,false,/^logos$/,/\.logos$/i,/^l[0o]g[0o]s$/i],
    ["mobile-icon",["dark-red","dark-red"],/\.xi$/i],
    ["logtalk-icon",["medium-red","medium-red"],/\.(?:logtalk|lgt)$/i,,false,,/\.logtalk$/i,/^Logtalk$/i],
    ["lookml-icon",["medium-purple","medium-purple"],/\.lookml$/i],
    ["lsl-icon",["medium-cyan","medium-cyan"],/\.lsl$/i,,false,/^lsl$/,/\.lsl$/i,/^lsl$/i],
    ["lsl-icon",["dark-cyan","dark-cyan"],/\.lslp$/i],
    ["lua-icon",["medium-blue","medium-blue"],/\.lua$/i,,false,/^lua$/,/\.lua$/i,/^lua$/i],
    ["lua-icon",["dark-blue","dark-blue"],/\.pd_lua$/i],
    ["lua-icon",["dark-purple","dark-purple"],/\.rbxs$/i],
    ["lua-icon",["dark-red","dark-red"],/\.wlua$/i],
    ["checklist-icon",["medium-yellow","medium-yellow"],/^Makefile|^makefile$/,,false,/^make$/,/\.makefile$/i,/^Makefile$|^(?:bsdmake|make|mf)$/i],
    ["checklist-icon",["medium-yellow","medium-yellow"],/\.(?:mk|mak|make)$|^mkfile$/i],
    ["checklist-icon",["medium-red","medium-red"],/^BSDmakefile$|\.am$/i],
    ["checklist-icon",["medium-green","medium-green"],/^GNUmakefile$/i],
    ["checklist-icon",["medium-blue","medium-blue"],/^Kbuild$/],
    ["checklist-icon",["dark-blue","dark-blue"],/\.bb$/i],
    ["checklist-icon",["dark-blue","dark-blue"],/^DEPS$/],
    ["checklist-icon",["medium-blue","medium-blue"],/\.mms$/i],
    ["checklist-icon",["light-blue","light-blue"],/\.mmk$/i],
    ["checklist-icon",["dark-purple","dark-purple"],/\.pri$/i],
    ["mako-icon",["dark-blue","dark-blue"],/\.mak?o$/i,,false,,/\.mako$/i,/^Mako$/i],
    ["manpage-icon",["dark-green","dark-green"],/\.(?:1(?:[bcmsx]|has|in)?|[24568]|3(?:avl|bsm|3c|in|m|qt|x)?|7(?:d|fs|i|ipp|m|p)?|9[efps]?|chem|eqn|groff|man|mandoc|mdoc|me|mom|n|nroff|pic|tmac|tmac-u|tr|troff)$/i,,false,/man|mandoc|(?:[gnt]|dit)roff/i,/\.[gt]?roff$/i,/^Manual Page$|^(?:[gtn]?roff|manpage)$/i,/^\.TH[ \t]+(?:\S+)|^'\\" [tre]+(?=\s|$)/],
    ["manpage-icon",["dark-maroon","dark-maroon"],/\.(?:rnh|rno|roff|run|runoff)$/i,,false,/^runoff$/,/\.runoff$/i,/^Manual Page$|^run[0o]ff$/i],
    ["mapbox-icon",["medium-cyan","medium-cyan"],/\.mss$/i,,false,,/\.mss$/i,/^Mapbox$|^Carto(?:CSS)?$/i],
    ["markdown-icon",["medium-blue","medium-blue"],/\.(?:md|mdown|markdown|mkd|mkdown|mkdn|rmd|ron)$/i,,false,,/\.gfm$/i,/^Markdown$/i],
    ["mathematica-icon",["dark-red","dark-red"],/\.mathematica$|\.nbp$/i,,false,,/\.mathematica$/i,/^Mathematica$|^mma$/i],
    ["mathematica-icon",["medium-red","medium-red"],/\.cdf$/i],
    ["mathematica-icon",["medium-orange","medium-orange"],/\.ma$/i],
    ["mathematica-icon",["medium-maroon","medium-maroon"],/\.mt$/i],
    ["mathematica-icon",["dark-orange","dark-orange"],/\.nb$/i],
    ["mathematica-icon",["medium-yellow","medium-yellow"],/\.wl$/i],
    ["mathematica-icon",["dark-yellow","dark-yellow"],/\.wlt$/i],
    ["matlab-icon",["medium-yellow","medium-yellow"],/\.matlab$/i,,false,,/\.(?:matlab|octave)$/i,/^MATLAB$|^[0o]ctave$/i],
    ["max-icon",["dark-purple","dark-purple"],/\.maxpat$/i],
    ["max-icon",["medium-red","medium-red"],/\.maxhelp$/i],
    ["max-icon",["medium-blue","medium-blue"],/\.maxproj$/i],
    ["max-icon",["medium-purple","medium-purple"],/\.mxt$/i],
    ["max-icon",["medium-green","medium-green"],/\.pat$/i],
    ["maxscript-icon",["dark-blue","dark-blue"],/\.ms$/i,,false,,/\.maxscript$/i,/^MAXScript$/i],
    ["maxscript-icon",["dark-purple","dark-purple"],/\.mcr$/i],
    ["maxscript-icon",["medium-red","medium-red"],/\.mce$/i],
    ["maxscript-icon",["dark-cyan","dark-cyan"],/\.max$/i],
    ["maxscript-icon",["medium-cyan","medium-cyan"],/\.3ds$/i],
    ["maya-icon",["dark-cyan","dark-cyan"],/\.mb$/i],
    ["maya-icon",["dark-blue","dark-blue"],/\.mel$/i],
    ["maya-icon",["dark-purple","dark-purple"],/\.mcf[ip]$/i],
    ["mediawiki-icon",["medium-yellow","medium-yellow"],/\.mediawiki$/i,,false,/^mediawiki$/,/\.mediawiki$/i,/^mediawiki$/i],
    ["mediawiki-icon",["medium-orange","medium-orange"],/\.wiki$/i],
    ["bullhorn-icon",["medium-orange","medium-orange"],/^\.mention-bot$/i],
    ["mercury-icon",["medium-cyan","medium-cyan"],/\.moo$/i,,false,/^mmi$/,/\.mercury$/i,/^Mercury$/i],
    ["metal-icon",["dark-cyan","dark-cyan"],/\.metal$/i],
    ["access-icon",["dark-maroon","dark-maroon"],/\.accda$/i],
    ["access-icon",["medium-maroon","medium-maroon"],/\.accdb$/i],
    ["access-icon",["medium-green","medium-green"],/\.accde$/i],
    ["access-icon",["medium-red","medium-red"],/\.accdr$/i],
    ["access-icon",["dark-red","dark-red"],/\.accdt$/i],
    ["access-icon",["light-maroon","light-maroon"],/\.adn$|\.laccdb$/i],
    ["access-icon",["dark-purple","dark-purple"],/\.mdw$/i],
    ["excel-icon",["dark-orange","dark-orange"],/\.xls$/i],
    ["excel-icon",["dark-green","dark-green"],/\.xlsx$/i],
    ["excel-icon",["medium-green","medium-green"],/\.xlsm$/i],
    ["excel-icon",["medium-red","medium-red"],/\.xlsb$/i],
    ["excel-icon",["dark-cyan","dark-cyan"],/\.xlt$/i],
    ["onenote-icon",["dark-purple","dark-purple"],/\.one$/i],
    ["powerpoint-icon",["dark-red","dark-red"],/\.pps$/i],
    ["powerpoint-icon",["medium-orange","medium-orange"],/\.ppsx$/i],
    ["powerpoint-icon",["dark-orange","dark-orange"],/\.ppt$/i],
    ["powerpoint-icon",["medium-red","medium-red"],/\.pptx$/i],
    ["powerpoint-icon",["medium-maroon","medium-maroon"],/\.potm$/i],
    ["powerpoint-icon",["dark-green","dark-green"],/\.mpp$/i],
    ["word-icon",["medium-blue","medium-blue"],/\.doc$/i],
    ["word-icon",["dark-blue","dark-blue"],/\.docx$/i],
    ["word-icon",["medium-maroon","medium-maroon"],/\.docm$/i],
    ["word-icon",["dark-cyan","dark-cyan"],/\.docxml$/i],
    ["word-icon",["dark-maroon","dark-maroon"],/\.dotm$/i],
    ["word-icon",["medium-cyan","medium-cyan"],/\.dotx$/i],
    ["word-icon",["medium-orange","medium-orange"],/\.wri$/i],
    ["minecraft-icon",["dark-green","dark-green"],/^mcmod\.info$/i,,false,,/\.forge-config$/i,/^Minecraft$/i],
    ["mirah-icon",["medium-blue","medium-blue"],/\.dr?uby$/g,,false,/^mirah$/,/\.mirah$/i,/^mirah$/i],
    ["mirah-icon",["light-blue","light-blue"],/\.mir(?:ah)?$/g],
    ["model-icon",["medium-red","medium-red"],/\.obj$/i,,false,,/\.wavefront\.obj$/i],
    ["model-icon",["dark-blue","dark-blue"],/\.mtl$/i,,false,,/\.wavefront\.mtl$/i],
    ["model-icon",["dark-green","dark-green"],/\.stl$/i],
    ["model-icon",["medium-orange","medium-orange"],/\.u3d$/i],
    ["circle-icon",["light-red","light-red"],/\.mo$/i,,false,,/\.modelica(?:script)?$/i,/^Modelica$/i],
    ["modula2-icon",["medium-blue","medium-blue"],/\.mod$/i,,false,,/(?:^|\.)modula-?2(?:\.|$)/i,/^Modula-2$/i],
    ["modula2-icon",["medium-green","medium-green"],/\.def$/i],
    ["modula2-icon",["medium-red","medium-red"],/\.m2$/i],
    ["monkey-icon",["medium-maroon","medium-maroon"],/\.monkey$/i,,false,,/\.monkey$/i,/^Monkey$/i],
    ["moon-icon",["medium-yellow","medium-yellow"],/\.moon$/i,,false,/^moon$/,/\.moon$/i,/^MoonScript$/i],
    ["mruby-icon",["medium-red","medium-red"],/\.mrb$/i,,false,/^mruby$/],
    ["msql-icon",["medium-purple","medium-purple"],/\.dsql$/i],
    ["mupad-icon",["medium-red","medium-red"],/\.mu$/i],
    ["music-icon",["medium-orange","medium-orange"],/\.chord$/i],
    ["music-icon",["dark-blue","dark-blue"],/\.midi?$/i,,false,,,,/^MThd/],
    ["music-icon",["medium-green","medium-green"],/\.ly$/i,,false,,/\.(?:At)?lilypond-/i,/^Lily\s*Pond$/i],
    ["music-icon",["dark-green","dark-green"],/\.ily$/i],
    ["music-icon",["dark-red","dark-red"],/\.pd$/i],
    ["mustache-icon",["medium-orange","medium-orange"],/\.(?:hbs|handlebars|mustache)$/i,,false,,/(?:^|\.)(?:mustache|handlebars)(?:\.|$)/i,/^Mustache$|^(?:hbs|htmlbars|handlebars)$/i],
    ["nant-icon",["medium-orange","medium-orange"],/\.build$/i,,false,,/\.nant-build$/i,/^NAnt$/i],
    ["earth-icon",["medium-green","medium-green"],/\.ncl$/i,,false,,/\.ncl$/i,/^NCAR Command Language \(NCL\)$/i],
    ["neko-icon",["medium-orange","medium-orange"],/\.neko$/i,,false,/^neko$/,/\.neko$/i,/^nek[0o]$/i],
    ["amx-icon",["medium-blue","medium-blue"],/\.axs$/i],
    ["amx-icon",["dark-blue","dark-blue"],/\.axi$/i],
    ["netlogo-icon",["medium-red","medium-red"],/\.nlogo$/i],
    ["nginx-icon",["medium-green","medium-green"],/\.nginxconf$/i,,false,,/\.nginx$/i,/^NGINX$|^nginx[\W_ \t]?c[0o]nfigurati[0o]n[\W_ \t]?file$/i],
    ["nib-icon",["dark-orange","dark-orange"],/\.nib$/i],
    ["nimrod-icon",["medium-green","medium-green"],/\.nim(?:rod)?$/i,,false,,/\.nim$/i,/^Nimrod$/i],
    ["shuriken-icon",["medium-blue","medium-blue"],/\.ninja$/i,,false,/^ninja$/,/\.ninja$/i,/^ninja$/i],
    ["nit-icon",["dark-green","dark-green"],/\.nit$/i,,false,,/\.nit$/i,/^Nit$/i],
    ["nix-icon",["medium-cyan","medium-cyan"],/\.nix$/i,,false,,/\.nix$/i,/^Nix$|^nix[0o]s$/i],
    ["nmap-icon",["dark-blue","dark-blue"],/\.nse$/i,,false,,/\.nmap$/i,/^Nmap$/i],
    ["node-icon",["medium-green","medium-green"],/\.njs$|\.nvmrc$/i],
    ["node-icon",["dark-green","dark-green"],/\.node-version$/i],
    ["nsis-icon",["medium-purple","medium-purple"],/\.nsi$/i,,false,/^nsis$/,/\.nsis$/i,/^nsis$/i],
    ["nsis-icon",["dark-cyan","dark-cyan"],/\.nsh$/i],
    ["recycle-icon",["light-green","light-green"],/\.nu$/i,,false,/^nush$/,/\.nu$/i,/^Nu$|^nush$/i],
    ["recycle-icon",["dark-green","dark-green"],/^Nukefile$/],
    ["nuget-icon",["medium-blue","medium-blue"],/\.nuspec$/i],
    ["nuget-icon",["dark-purple","dark-purple"],/\.pkgproj$/i],
    ["numpy-icon",["dark-blue","dark-blue"],/\.numpy$/i],
    ["numpy-icon",["medium-blue","medium-blue"],/\.numpyw$/i],
    ["numpy-icon",["medium-orange","medium-orange"],/\.numsc$/i],
    ["nunjucks-icon",["dark-green","dark-green"],/\.(?:nunjucks|njk)$/i],
    ["objc-icon",["medium-blue","medium-blue"],/\.mm?$/i,,false,,/\.objc(?:pp)?$/i,/^Objective-C$|^(?:Obj-?C|ObjectiveC)(?:\+\+)?$/i],
    ["objc-icon",["dark-red","dark-red"],/\.pch$/i],
    ["objc-icon",["dark-green","dark-green"],/\.x$/i],
    ["objj-icon",["dark-orange","dark-orange"],/\.j$/i,,false,,/\.objj$/i,/^Objective-J$|^(?:Obj-?J|ObjectiveJ)$/i],
    ["objj-icon",["dark-red","dark-red"],/\.sj$/i],
    ["ocaml-icon",["medium-orange","medium-orange"],/\.ml$/i,,false,/ocaml(?:run|script)?/,/\.ocaml$/i,/^OCaml$/i],
    ["ocaml-icon",["dark-orange","dark-orange"],/\.mli$/i],
    ["ocaml-icon",["medium-red","medium-red"],/\.eliom$/i],
    ["ocaml-icon",["dark-red","dark-red"],/\.eliomi$/i],
    ["ocaml-icon",["medium-green","medium-green"],/\.ml4$/i],
    ["ocaml-icon",["dark-green","dark-green"],/\.mll$/i,,false,/^ocamllex$/,/\.ocamllex$/i,/^OCaml$|^[0o]camllex$/i],
    ["ocaml-icon",["dark-yellow","dark-yellow"],/\.mly$/i,,false,/^menhir$/,/\.menhir$/i,/^OCaml$|^menhir$/i],
    ["ooc-icon",["medium-green","medium-green"],/\.ooc$/i,,false,,/\.ooc$/i,/^OOC$/i],
    ["opa-icon",["medium-blue","medium-blue"],/\.opa$/i,,false,,/\.opa$/i,/^Opa$/i],
    ["opencl-icon",["medium-red","medium-red"],/\.opencl$/i,,false,,/\.opencl$/i,/^OpenCL$/i],
    ["progress-icon",["medium-red","medium-red"],/\.p$/i,,false,,/\.abl$/i,/^OpenEdge ABL$|^(?:progress|openedge|abl)$/i],
    ["openoffice-icon",["medium-blue","medium-blue"],/\.odt$/i],
    ["openoffice-icon",["dark-blue","dark-blue"],/\.ott$/i],
    ["openoffice-icon",["dark-purple","dark-purple"],/\.fodt$/i],
    ["openoffice-icon",["medium-green","medium-green"],/\.ods$/i],
    ["openoffice-icon",["dark-green","dark-green"],/\.ots$/i],
    ["openoffice-icon",["dark-cyan","dark-cyan"],/\.fods$/i],
    ["openoffice-icon",["medium-purple","medium-purple"],/\.odp$/i],
    ["openoffice-icon",["dark-pink","dark-pink"],/\.otp$/i],
    ["openoffice-icon",["medium-pink","medium-pink"],/\.fodp$/i],
    ["openoffice-icon",["medium-red","medium-red"],/\.odg$/i],
    ["openoffice-icon",["dark-red","dark-red"],/\.otg$/i],
    ["openoffice-icon",["dark-orange","dark-orange"],/\.fodg$/i],
    ["openoffice-icon",["medium-maroon","medium-maroon"],/\.odf$/i],
    ["openoffice-icon",["light-pink","light-pink"],/\.odb$/i],
    ["scad-icon",["medium-orange","medium-orange"],/\.scad$/i,,false,,/\.scad$/i,/^OpenSCAD$/i],
    ["scad-icon",["medium-yellow","medium-yellow"],/\.jscad$/i],
    ["org-icon",["dark-green","dark-green"],/\.org$/i],
    ["osx-icon",["medium-red","medium-red"],/\.dmg$/i,,false,,,,/^\x78\x01\x73\x0D\x62\x62\x60/],
    ["ox-icon",["medium-cyan","dark-cyan"],/\.ox$/i,,false,,/\.ox$/i,/^Ox$/i],
    ["ox-icon",["medium-green","dark-green"],/\.oxh$/i],
    ["ox-icon",["medium-blue","dark-blue"],/\.oxo$/i],
    ["oxygene-icon",["medium-cyan","dark-cyan"],/\.oxygene$/i,,false,,/\.oxygene$/i,/^Oxygene$/i],
    ["oz-icon",["medium-yellow","medium-yellow"],/\.oz$/i,,false,,/\.oz$/i,/^Oz$/i],
    ["pan-icon",["medium-red","medium-red"],/\.pan$/i],
    ["papyrus-icon",["medium-green","medium-green"],/\.psc$/i,,false,,/(?:^|\.)(?:papyrus\.skyrim|compiled-?papyrus|papyrus-assembly)(?:\.|$)/i,/^Papyrus$/i],
    ["parrot-icon",["medium-green","medium-green"],/\.parrot$/i,,false,/^parrot$/],
    ["parrot-icon",["dark-green","dark-green"],/\.pasm$/i,,false,,/\.parrot\.pasm$/i,/^Parrot$|^pasm$/i],
    ["parrot-icon",["dark-blue","dark-blue"],/\.pir$/i,,false,,/\.parrot\.pir$/i,/^Parrot$|^pir$/i],
    ["pascal-icon",["medium-purple","medium-purple"],/\.pas(?:cal)?$/i,,false,/pascal|instantfpc/,/\.pascal$/i,/^Pascal$/i],
    ["pascal-icon",["medium-blue","medium-blue"],/\.dfm$/i],
    ["pascal-icon",["dark-blue","dark-blue"],/\.dpr$/i],
    ["pascal-icon",["dark-purple","dark-purple"],/\.lpr$/i],
    ["patch-icon",["medium-green","medium-green"],/\.patch$/i],
    ["pawn-icon",["medium-orange","medium-orange"],/\.pwn$/i,,false,,/\.pwn$/i,/^PAWN$/i],
    ["pdf-icon",["medium-red","medium-red"],/\.pdf$/i,,false,,,,/^%PDF/],
    ["perl-icon",["medium-blue","medium-blue"],/\.p(?:er)?l$|\.t$/i,,false,/^perl$/,/\.perl$/i,/^perl$/i],
    ["perl-icon",["dark-purple","dark-purple"],/\.ph$/i],
    ["perl-icon",["medium-purple","medium-purple"],/\.plx$/i],
    ["perl-icon",["dark-blue","dark-blue"],/\.pm$/i],
    ["perl-icon",["medium-red","medium-red"],/\.(?:psgi|xs)$/i],
    ["perl6-icon",["medium-purple","medium-purple"],/\.pl6$/i,,false,/^perl6$/,/(?:^|\.)perl6(?:fe)?(?=\.|$)/,/^(?:pl6|Perl\s*6)$/i],
    ["perl6-icon",["light-blue","light-blue"],/\.[tp]6$|\.6pl$/i],
    ["perl6-icon",["dark-pink","dark-pink"],/\.(?:pm6|p6m)$/i],
    ["perl6-icon",["dark-cyan","dark-cyan"],/\.6pm$/i],
    ["perl6-icon",["dark-purple","dark-purple"],/\.nqp$/i],
    ["perl6-icon",["medium-blue","medium-blue"],/\.p6l$/i],
    ["perl6-icon",["dark-green","dark-green"],/\.pod6$/i],
    ["perl6-icon",["medium-green","medium-green"],/^Rexfile$/],
    ["phalcon-icon",["medium-cyan","medium-cyan"],/\.volt$/i,,false,,/\.volt$/i,/^Phalcon$/i],
    ["php-icon",["dark-blue","dark-blue"],/\.php(?:[st\d]|_cs)?$/i,,false,/^php$/,/\.php$/i,/^PHP$/i,/^<\?php/],
    ["php-icon",["dark-green","dark-green"],/^Phakefile/],
    ["pickle-icon",["dark-cyan","dark-cyan"],/\.pkl$/i],
    ["pike-icon",["dark-cyan","dark-cyan"],/\.pike$/i,,false,/^pike$/],
    ["pike-icon",["medium-blue","medium-blue"],/\.pmod$/i],
    ["sql-icon",["medium-red","medium-red"],/\.(?:pls|pck|pks|plb|plsql|pkb)$/i,,false,,/\.plsql(?:\.oracle)?(?:\.|$)/i,/^PLSQL$/i],
    ["pod-icon",["dark-blue","dark-blue"],/\.pod$/i],
    ["pogo-icon",["medium-orange","dark-orange"],/\.pogo$/i,,false,,/\.pogoscript$/i,/^PogoScript$/i],
    ["pony-icon",["light-maroon","light-maroon"],/\.pony$/i,,false,,/\.pony$/i,/^Pony$/i],
    ["postcss-icon",["dark-red","dark-red"],/\.p(?:ost)?css$/i,,false,/^postcss$/,/\.postcss$/i,/^p[0o]stcss$/i],
    ["postcss-icon",["dark-pink","dark-pink"],/\.sss$/i,,false,/^sugarss$/,/\.sugarss$/i,/^PostCSS$|^sugarss$/i],
    ["postcss-icon",["medium-orange","dark-orange"],/\.postcssrc$/i],
    ["postscript-icon",["medium-red","medium-red"],/\.ps$/i,,false,,/\.postscript$/i,/^PostScript$|^p[0o]stscr$/i,/^%!PS/],
    ["postscript-icon",["medium-orange","medium-orange"],/\.eps$/i],
    ["postscript-icon",["dark-blue","dark-blue"],/\.pfa$/i],
    ["postscript-icon",["medium-green","medium-green"],/\.afm$/i],
    ["povray-icon",["dark-blue","dark-blue"],/\.pov$/i],
    ["powerbuilder-icon",["medium-blue","medium-blue"],/\.pbl$|\.sra$/i],
    ["powerbuilder-icon",["dark-blue","dark-blue"],/\.pbt$/i],
    ["powerbuilder-icon",["medium-red","medium-red"],/\.srw$/i],
    ["powerbuilder-icon",["medium-orange","medium-orange"],/\.sru$/i],
    ["powerbuilder-icon",["medium-maroon","medium-maroon"],/\.srp$/i],
    ["powerbuilder-icon",["medium-purple","medium-purple"],/\.srj$/i],
    ["powershell-icon",["medium-blue","medium-blue"],/\.ps1$/i,,false,,/\.powershell$/i,/^PowerShell$|^p[0o]sh$/i],
    ["powershell-icon",["dark-blue","dark-blue"],/\.psd1$/i],
    ["powershell-icon",["medium-purple","medium-purple"],/\.psm1$/i],
    ["powershell-icon",["dark-purple","dark-purple"],/\.ps1xml$/i],
    ["print-icon",["dark-cyan","dark-cyan"],/\.ppd$/i],
    ["processing-icon",["dark-blue","dark-blue"],/\.pde$/i,,false,,/\.processing$/i,/^Processing$/i],
    ["prolog-icon",["medium-blue","medium-blue"],/\.pro$/i,,false,/^swipl$/,/\.prolog$/i,/^Prolog$/i],
    ["prolog-icon",["medium-cyan","medium-cyan"],/\.prolog$/i],
    ["prolog-icon",["medium-purple","medium-purple"],/\.yap$/i,,false,/^yap$/],
    ["propeller-icon",["medium-orange","medium-orange"],/\.spin$/i,,false,,/\.spin$/i,/^Propeller Spin$/i],
    ["pug-icon",["medium-red","medium-red"],/\.pug$/i,,false,,/\.pug$/i,/^Pug$/i],
    ["puppet-icon",["medium-purple","medium-purple"],/\.pp$/i,,false,/^puppet$/,/\.puppet$/i,/^puppet$/i],
    ["puppet-icon",["dark-blue","dark-blue"],/Modulefile$/i],
    ["purebasic-icon",["medium-red","medium-red"],/\.pb$/i,,false,/^purebasic$/,/\.purebasic$/i,/^purebasic$/i],
    ["purebasic-icon",["dark-orange","dark-orange"],/\.pbi$/i],
    ["purescript-icon",["dark-purple","dark-purple"],/\.purs$/i,,false,,/\.purescript$/i,/^PureScript$/i],
    ["python-icon",["dark-blue","dark-blue"],/\.py$|\.bzl$|\.py3$|\.?(?:pypirc|pythonrc|python-venv)$/i,,false,/python[\d.]*/,/\.python$/i,/^Python$|^rusth[0o]n$/i],
    ["python-icon",["medium-blue","medium-blue"],/\.ipy$/i],
    ["python-icon",["dark-green","dark-green"],/\.isolate$|\.gypi$|\.pyt$/i],
    ["python-icon",["medium-orange","medium-orange"],/\.pep$|\.pyde$/i,,false,/^pep8$/,/\.pep8$/i,/^Python$|^pep8$/i],
    ["python-icon",["medium-green","medium-green"],/\.gyp$/i],
    ["python-icon",["dark-purple","dark-purple"],/\.pyp$/i],
    ["python-icon",["medium-maroon","medium-maroon"],/\.pyw$/i],
    ["python-icon",["dark-pink","dark-pink"],/\.tac$/i],
    ["python-icon",["dark-red","dark-red"],/\.wsgi$/i],
    ["python-icon",["medium-yellow","dark-yellow"],/\.xpy$/i],
    ["python-icon",["medium-pink","medium-pink"],/\.rpy$/i,,false,,/\.renpy$/i,/^Python$|^Ren'?Py$/i],
    ["python-icon",["dark-green","dark-green"],/^(?:BUCK|BUILD|SConstruct|SConscript)$/],
    ["python-icon",["medium-green","medium-green"],/^(?:Snakefile|WATCHLISTS)$/],
    ["python-icon",["dark-maroon","dark-maroon"],/^wscript$/],
    ["r-icon",["medium-blue","medium-blue"],/\.(?:r|Rprofile|rsx|rd)$/i,,false,/^Rscript$/,/\.r$/i,/^R$|^(?:Rscript|splus|Rlang)$/i],
    ["racket-icon",["medium-red","medium-red"],/\.rkt$/i,,false,/^racket$/,/\.racket$/i,/^racket$/i],
    ["racket-icon",["medium-blue","medium-blue"],/\.rktd$/i],
    ["racket-icon",["light-red","light-red"],/\.rktl$/i],
    ["racket-icon",["dark-blue","dark-blue"],/\.scrbl$/i,,false,/^scribble$/,/\.scribble$/i,/^Racket$|^scribble$/i],
    ["raml-icon",["medium-cyan","medium-cyan"],/\.raml$/i,,false,,/\.raml$/i,/^RAML$/i],
    ["rascal-icon",["medium-yellow","medium-yellow"],/\.rsc$/i,,false,,/\.rascal$/i,/^Rascal$/i],
    ["rdoc-icon",["medium-red","medium-red"],/\.rdoc$/i,,false,,/\.rdoc$/i,/^RDoc$/i],
    ["xojo-icon",["medium-green","medium-green"],/\.rbbas$/i],
    ["xojo-icon",["dark-green","dark-green"],/\.rbfrm$/i],
    ["xojo-icon",["dark-cyan","dark-cyan"],/\.rbmnu$/i],
    ["xojo-icon",["medium-cyan","medium-cyan"],/\.rbres$/i],
    ["xojo-icon",["medium-blue","medium-blue"],/\.rbtbar$/i],
    ["xojo-icon",["dark-blue","dark-blue"],/\.rbuistate$/i],
    ["reason-icon",["medium-red","medium-red"],/\.re$/i,,false,/^reason$/,/\.reason$/i,/^reas[0o]n$/i],
    ["reason-icon",["medium-orange","medium-orange"],/\.rei$/i],
    ["rebol-icon",["dark-green","dark-green"],/\.reb(?:ol)?$/i,,false,/^rebol$/,/\.rebol$/i,/^reb[0o]l$/i],
    ["rebol-icon",["dark-red","dark-red"],/\.r2$/i],
    ["rebol-icon",["dark-blue","dark-blue"],/\.r3$/i],
    ["red-icon",["medium-red","medium-red"],/\.red$/i,,false,,/\.red$/i,/^Red$|^red\/?system$/i],
    ["red-icon",["light-red","light-red"],/\.reds$/i],
    ["red-hat-icon",["medium-red","medium-red"],/\.rpm$/i],
    ["red-hat-icon",["dark-red","dark-red"],/\.spec$/i],
    ["regex-icon",["medium-green","medium-green"],/\.regexp?$/i,,false,,/(?:\.|^)regexp?(?:\.|$)/i,/^RegExp$/i],
    ["android-icon",["dark-maroon","dark-maroon"],/\.rsh$/i],
    ["rst-icon",["dark-blue","dark-blue"],/\.re?st(?:\.txt)?$/i,,false,,/\.restructuredtext$/i,/^reStructuredText$|^re?st$/i],
    ["rexx-icon",["medium-red","medium-red"],/\.rexx?$/i,,false,/rexx|regina/i,/\.rexx$/i,/^REXX$/i],
    ["rexx-icon",["medium-blue","medium-blue"],/\.pprx$/i],
    ["riot-icon",["medium-red","medium-red"],/\.tag$/i,,false,,/\.riot$/i,/^RiotJS$/i],
    ["robot-icon",["medium-purple","medium-purple"],/\.robot$/i],
    ["clojure-icon",["medium-red","medium-red"],/\.rg$/i],
    ["rss-icon",["medium-orange","medium-orange"],/\.rss$/i],
    ["ruby-icon",["medium-red","medium-red"],/\.(?:rb|ru|ruby|erb|gemspec|god|mspec|pluginspec|podspec|rabl|rake|opal)$|^\.?(?:irbrc|gemrc|pryrc|rspec|ruby-(?:gemset|version))$/i,,false,/(?:mac|j)?ruby|rake|rbx/,/\.ruby$/i,/^Ruby$|^(?:rbx?|rake|jruby|macruby)$/i],
    ["ruby-icon",["medium-red","medium-red"],/^(?:Appraisals|(?:Rake|Gem|[bB]uild|Berks|Cap|Danger|Deliver|Fast|Guard|Jar|Maven|Pod|Puppet|Snap)file(?:\.lock)?)$|^rails$/],
    ["ruby-icon",["dark-red","dark-red"],/\.(?:jbuilder|rbuild|rb[wx]|builder)$/i],
    ["ruby-icon",["dark-yellow","dark-yellow"],/\.watchr$/i],
    ["rust-icon",["medium-maroon","medium-maroon"],/\.rs$/i,,false,/^rust$/,/\.rust$/i,/^rust$/i],
    ["rust-icon",["light-maroon","light-maroon"],/\.rlib$/i],
    ["sage-icon",["medium-blue","medium-blue"],/\.sage$/i,,false,/^sage$/,/\.sage$/i,/^sage$/i],
    ["sage-icon",["dark-blue","dark-blue"],/\.sagews$/i],
    ["saltstack-icon",["medium-blue","dark-blue"],/\.sls$/i,,false,,/\.salt$/i,/^SaltStack$|^Salt(?:State)?$/i],
    ["sas-icon",["medium-blue","medium-blue"],/\.sas$/i,,false,,/\.sas$/i,/^SAS$/i],
    ["sass-icon",["light-pink","light-pink"],/\.scss$/i,,false,/^scss$/,/\.scss$/i,/^Sass$|^scss$/i],
    ["sass-icon",["dark-pink","dark-pink"],/\.sass$/i,,false,/^sass$/,/\.sass$/i,/^sass$/i],
    ["sbt-icon",["dark-purple","dark-purple"],/\.sbt$/i],
    ["scala-icon",["medium-red","medium-red"],/\.(?:sc|scala)$/i,,false,/^scala$/,/\.scala$/i,/^Scala$/i],
    ["scheme-icon",["medium-red","medium-red"],/\.scm$/i,,false,/guile|bigloo|chicken/,/\.scheme$/i,/^Scheme$/i],
    ["scheme-icon",["medium-blue","medium-blue"],/\.sld$/i],
    ["scheme-icon",["medium-purple","medium-purple"],/\.sps$/i],
    ["scilab-icon",["dark-purple","dark-purple"],/\.sci$/i,,false,/^scilab$/,/\.scilab$/i,/^scilab$/i],
    ["scilab-icon",["dark-blue","dark-blue"],/\.sce$/i],
    ["scilab-icon",["dark-cyan","dark-cyan"],/\.tst$/i],
    ["secret-icon",[null,null],/\.secret$/i],
    ["self-icon",["dark-blue","dark-blue"],/\.self$/i,,false,,/\.self$/i,/^Self$/i],
    ["graph-icon",["light-red","light-red"],/\.csv$/i,,false,,/(?:^|\.)csv(?:\.semicolon)?(?:\.|$)/i],
    ["graph-icon",["light-green","light-green"],/\.(?:tab|tsv)$/i],
    ["graph-icon",["medium-green","medium-green"],/\.dif$/i],
    ["graph-icon",["medium-cyan","medium-cyan"],/\.slk$/i],
    ["sf-icon",["light-orange","light-orange"],/\.sfproj$/i],
    ["terminal-icon",["medium-purple","medium-purple"],/\.(?:sh|rc|bats|bash|tool|install|command)$/i,,false,/bash|sh|zsh|rc/,/\.shell$/i,/^(?:sh|shell|Shell-?Script|Bash)$/i],
    ["terminal-icon",["dark-purple","dark-purple"],/^(?:\.?bash(?:rc|[-_]?(?:profile|login|logout|history|prompt))|_osc|config|install-sh|PKGBUILD)$/i],
    ["terminal-icon",["dark-yellow","dark-yellow"],/\.ksh$/i],
    ["terminal-icon",["medium-yellow","dark-yellow"],/\.sh-session$/i,,false,,/\.shell-session$/i,/^(?:Bash|Shell|Sh)[-\s]*(?:Session|Console)$/i],
    ["terminal-icon",["medium-blue","medium-blue"],/\.zsh(?:-theme|_history)?$|^\.?(?:antigen|zpreztorc|zlogin|zlogout|zprofile|zshenv|zshrc)$|\.tmux$/i],
    ["terminal-icon",["medium-green","medium-green"],/\.fish$|^\.fishrc$|\.tcsh$/i,,false,/^fish$/,/\.fish$/i,/^fish$/i],
    ["terminal-icon",["medium-red","medium-red"],/\.inputrc$/i],
    ["terminal-icon",["medium-red","medium-red"],/^(?:configure|config\.(?:guess|rpath|status|sub)|depcomp|libtool|compile)$/],
    ["terminal-icon",["dark-purple","dark-purple"],/^\/(?:private\/)?etc\/(?:[^\/]+\/)*(?:profile$|nanorc$|rc\.|csh\.)/i,,true],
    ["terminal-icon",["medium-yellow","medium-yellow"],/\.csh$/i],
    ["shen-icon",["dark-cyan","dark-cyan"],/\.shen$/i],
    ["shopify-icon",["medium-green","medium-green"],/\.liquid$/i],
    ["sigils-icon",["dark-red","dark-red"],/\.sigils$/i],
    ["silverstripe-icon",["medium-blue","medium-blue"],/\.ss$/i,,false,,/(?:^|\.)ss(?:template)?(?:\.|$)/i,/^SilverStripe$/i],
    ["sketch-icon",["medium-orange","medium-orange"],/\.sketch$/i],
    ["slash-icon",["dark-blue","dark-blue"],/\.sl$/i,,false,,/\.slash$/i,/^Slash$/i],
    ["android-icon",["medium-green","medium-green"],/\.smali$/i,,false,,/\.smali$/i,/^Smali$/i],
    ["smarty-icon",["medium-yellow","dark-yellow"],/\.tpl$/i,,false,,/\.smarty$/i,/^Smarty$/i],
    ["snyk-icon",["dark-purple","dark-purple"],/\.snyk$/i],
    ["clojure-icon",["medium-yellow","dark-yellow"],/\.(?:sma|sp)$/i,,false,,/\.sp$/i,/^SourcePawn$|^s[0o]urcem[0o]d$/i],
    ["sparql-icon",["medium-blue","medium-blue"],/\.sparql$/i,,false,,/\.rq$/i,/^SPARQL$/i],
    ["sparql-icon",["dark-blue","dark-blue"],/\.rq$/i],
    ["sqf-icon",["dark-maroon","dark-maroon"],/\.sqf$/i,,false,/^sqf$/,/\.sqf$/i,/^sqf$/i],
    ["sqf-icon",["dark-red","dark-red"],/\.hqf$/i],
    ["sql-icon",["medium-orange","medium-orange"],/\.(?:my)?sql$/i,,false,/^sql$/,/\.sql$/i,/^sql$/i],
    ["sql-icon",["medium-blue","medium-blue"],/\.ddl$/i],
    ["sql-icon",["medium-green","medium-green"],/\.udf$/i],
    ["sql-icon",["dark-cyan","dark-cyan"],/\.viw$/i],
    ["sql-icon",["dark-blue","dark-blue"],/\.prc$/i],
    ["sql-icon",["medium-purple","medium-purple"],/\.db2$/i],
    ["sqlite-icon",["medium-blue","medium-blue"],/\.sqlite$/i],
    ["sqlite-icon",["dark-blue","dark-blue"],/\.sqlite3$/i],
    ["sqlite-icon",["medium-purple","medium-purple"],/\.db$/i],
    ["sqlite-icon",["dark-purple","dark-purple"],/\.db3$/i],
    ["squirrel-icon",["medium-maroon","medium-maroon"],/\.nut$/i,,false,,/\.nut$/i,/^Squirrel$/i],
    ["key-icon",["medium-yellow","medium-yellow"],/\.pub$/i],
    ["key-icon",["medium-orange","medium-orange"],/\.pem$/i],
    ["key-icon",["medium-blue","medium-blue"],/\.key$|\.crt$/i],
    ["key-icon",["medium-purple","medium-purple"],/\.der$/i],
    ["key-icon",["medium-red","medium-red"],/^id_rsa/],
    ["key-icon",["medium-green","medium-green"],/\.glyphs\d*License$|^git-credential-osxkeychain$/i],
    ["key-icon",["dark-green","dark-green"],/^(?:master\.)?passwd$/i],
    ["stan-icon",["medium-red","medium-red"],/\.stan$/i,,false,,/\.stan$/i,/^Stan$/i],
    ["stata-icon",["medium-blue","medium-blue"],/\.do$/i,,false,/^stata$/,/\.stata$/i,/^stata$/i],
    ["stata-icon",["dark-blue","dark-blue"],/\.ado$/i],
    ["stata-icon",["light-blue","light-blue"],/\.doh$/i],
    ["stata-icon",["medium-cyan","medium-cyan"],/\.ihlp$/i],
    ["stata-icon",["dark-cyan","dark-cyan"],/\.mata$/i,,false,/^mata$/,/\.mata$/i,/^Stata$|^mata$/i],
    ["stata-icon",["light-cyan","light-cyan"],/\.matah$/i],
    ["stata-icon",["medium-purple","medium-purple"],/\.sthlp$/i],
    ["storyist-icon",["medium-blue","medium-blue"],/\.story$/i],
    ["strings-icon",["medium-red","medium-red"],/\.strings$/i,,false,,/\.strings$/i,/^Strings$/i],
    ["stylus-icon",["medium-green","medium-green"],/\.styl$/i,,false,,/\.stylus$/i,/^Stylus$/i],
    ["sublime-icon",["medium-orange","medium-orange"],/\.(?:stTheme|sublime[-_](?:build|commands|completions|keymap|macro|menu|mousemap|project|settings|theme|workspace|metrics|session|snippet))$/i],
    ["sublime-icon",["dark-orange","dark-orange"],/\.sublime-syntax$/i],
    ["scd-icon",["medium-red","medium-red"],/\.scd$/i,,false,/sclang|scsynth/,/\.supercollider$/i,/^SuperCollider$/i],
    ["svg-icon",["dark-yellow","dark-yellow"],/\.svg$/i,,false,,/\.svg$/i,/^SVG$/i],
    ["swift-icon",["medium-green","medium-green"],/\.swift$/i,,false,,/\.swift$/i,/^Swift$/i],
    ["sysverilog-icon",["medium-blue","dark-blue"],/\.sv$/i],
    ["sysverilog-icon",["medium-green","dark-green"],/\.svh$/i],
    ["sysverilog-icon",["medium-cyan","dark-cyan"],/\.vh$/i],
    ["tag-icon",["medium-blue","medium-blue"],/\.?c?tags$/i],
    ["tag-icon",["medium-red","medium-red"],/\.gemtags/i],
    ["tcl-icon",["dark-orange","dark-orange"],/\.tcl$/i,,false,/tclsh|wish/,/\.tcl$/i,/^Tcl$/i],
    ["tcl-icon",["medium-orange","medium-orange"],/\.adp$/i],
    ["tcl-icon",["medium-red","medium-red"],/\.tm$/i],
    ["coffee-icon",["medium-orange","medium-orange"],/\.tea$/i,,false,,/\.tea$/i,/^Tea$/i],
    ["tt-icon",["medium-blue","medium-blue"],/\.tt2?$/i],
    ["tt-icon",["medium-purple","medium-purple"],/\.tt3$/i],
    ["tern-icon",["medium-blue","medium-blue"],/\.tern-project$/i],
    ["terraform-icon",["dark-purple","dark-purple"],/\.tf(?:vars)?$/i,,false,,/\.terra(?:form)?$/i,/^Terraform$/i],
    ["tex-icon",["medium-blue","dark-blue"],/\.tex$|\.ltx$|\.lbx$/i,,false,,/(?:^|\.)latex(?:\.|$)/i,/^TeX$|^latex$/i],
    ["tex-icon",["medium-green","dark-green"],/\.aux$|\.ins$/i],
    ["tex-icon",["medium-red","dark-red"],/\.sty$|\.texi$/i,,false,,/(?:^|\.)tex(?:\.|$)/i,/^TeX$/i],
    ["tex-icon",["medium-maroon","dark-maroon"],/\.dtx$/i],
    ["tex-icon",["medium-orange","dark-orange"],/\.cls$|\.mkiv$|\.mkvi$|\.mkii$/i],
    ["text-icon",["medium-blue","medium-blue"],/\.te?xt$|\.irclog$|\.uot$/i,,false,,,,/^\xEF\xBB\xBF|^\xFF\xFE/],
    ["text-icon",["medium-maroon","medium-maroon"],/\.log$|^Terminal[-_\s]Saved[-_\s]Output$|\.brf$/i],
    ["text-icon",["dark-red","dark-red"],/\.git[\/\\]description$/,,true],
    ["text-icon",["medium-red","medium-red"],/\.err$|\.no$|^(?:bug-report|fdl|for-release|tests)$/i],
    ["text-icon",["dark-red","dark-red"],/\.rtf$|\.uof$/i],
    ["text-icon",["dark-blue","dark-blue"],/\.i?nfo$/i],
    ["text-icon",["dark-purple","dark-purple"],/\.abt$|\.sub$/i],
    ["text-icon",["dark-orange","dark-orange"],/\.ans$/i],
    ["text-icon",["medium-yellow","medium-yellow"],/\.etx$/i],
    ["text-icon",["medium-orange","medium-orange"],/\.msg$/i],
    ["text-icon",["medium-purple","medium-purple"],/\.srt$|\.uop$/i],
    ["text-icon",["medium-cyan","medium-cyan"],/\.(?:utxt|utf8)$/i],
    ["text-icon",["medium-green","medium-green"],/\.weechatlog$|\.uos$/i],
    ["textile-icon",["medium-orange","medium-orange"],/\.textile$/i,,false,,/\.textile$/i,/^Textile$/i],
    ["textmate-icon",["dark-green","dark-green"],/\.tmcg$/i],
    ["textmate-icon",["dark-purple","dark-purple"],/\.tmLanguage$/i],
    ["textmate-icon",["medium-blue","medium-blue"],/\.tmCommand$/i],
    ["textmate-icon",["dark-blue","dark-blue"],/\.tmPreferences$/i],
    ["textmate-icon",["dark-orange","dark-orange"],/\.tmSnippet$/i],
    ["textmate-icon",["medium-pink","medium-pink"],/\.tmTheme$/i],
    ["textmate-icon",["medium-maroon","medium-maroon"],/\.tmMacro$/i],
    ["textmate-icon",["medium-orange","medium-orange"],/\.yaml-tmlanguage$/i],
    ["textmate-icon",["medium-purple","medium-purple"],/\.JSON-tmLanguage$/i],
    ["thor-icon",["medium-orange","medium-orange"],/\.thor$/i],
    ["thor-icon",["dark-orange","dark-orange"],/^Thorfile$/i],
    ["tsx-icon",["light-blue","light-blue"],/\.tsx$/i,,false,,/\.tsx$/i,/^TSX$/i],
    ["turing-icon",["medium-red","medium-red"],/\.tu$/i,,false,,/\.turing$/i,/^Turing$/i],
    ["twig-icon",["medium-green","medium-green"],/\.twig$/i,,false,,/\.twig$/i,/^Twig$/i],
    ["txl-icon",["medium-orange","medium-orange"],/\.txl$/i,,false,,/\.txl$/i,/^TXL$/i],
    ["ts-icon",["medium-blue","medium-blue"],/\.ts$/i,,false,,/\.ts$/i,/^(?:ts|Type[-\s]*Script)$/i],
    ["unity3d-icon",["dark-blue","dark-blue"],/\.anim$/i,,false,/^shaderlab$/,/\.shaderlab$/i,/^Unity3D$|^shaderlab$/i],
    ["unity3d-icon",["dark-green","dark-green"],/\.asset$/i],
    ["unity3d-icon",["medium-red","medium-red"],/\.mat$/i],
    ["unity3d-icon",["dark-red","dark-red"],/\.meta$/i],
    ["unity3d-icon",["dark-cyan","dark-cyan"],/\.prefab$/i],
    ["unity3d-icon",["medium-blue","medium-blue"],/\.unity$/i],
    ["unity3d-icon",["medium-maroon","medium-maroon"],/\.unityproj$/i],
    ["uno-icon",["dark-blue","dark-blue"],/\.uno$/i],
    ["unreal-icon",[null,null],/\.uc$/i,,false,,/\.uc$/i,/^UnrealScript$/i],
    ["link-icon",["dark-blue","dark-blue"],/\.url$/i],
    ["urweb-icon",["medium-maroon","medium-maroon"],/\.ur$/i,,false,,/\.ur$/i,/^UrWeb$|^Ur(?:\/Web)?$/i],
    ["urweb-icon",["dark-blue","dark-blue"],/\.urs$/i],
    ["vagrant-icon",["medium-cyan","medium-cyan"],/^Vagrantfile$/i],
    ["gnome-icon",["medium-purple","medium-purple"],/\.vala$/i,,false,/^vala$/,/\.vala$/i,/^vala$/i],
    ["gnome-icon",["dark-purple","dark-purple"],/\.vapi$/i],
    ["varnish-icon",["dark-blue","dark-blue"],/\.vcl$/i,,false,,/(?:^|\.)(?:varnish|vcl)(?:\.|$)/i,/^VCL$/i],
    ["verilog-icon",["dark-green","dark-green"],/\.v$/i,,false,/^verilog$/,/\.verilog$/i,/^veril[0o]g$/i],
    ["verilog-icon",["medium-red","medium-red"],/\.veo$/i],
    ["vhdl-icon",["dark-green","dark-green"],/\.vhdl$/i,,false,/^vhdl$/,/\.vhdl$/i,/^vhdl$/i],
    ["vhdl-icon",["medium-green","medium-green"],/\.vhd$/i],
    ["vhdl-icon",["dark-blue","dark-blue"],/\.vhf$/i],
    ["vhdl-icon",["medium-blue","medium-blue"],/\.vhi$/i],
    ["vhdl-icon",["dark-purple","dark-purple"],/\.vho$/i],
    ["vhdl-icon",["medium-purple","medium-purple"],/\.vhs$/i],
    ["vhdl-icon",["dark-red","dark-red"],/\.vht$/i],
    ["vhdl-icon",["dark-orange","dark-orange"],/\.vhw$/i],
    ["video-icon",["medium-blue","medium-blue"],/\.3gpp?$/i,,false,,,,/^.{4}ftyp3g/],
    ["video-icon",["dark-blue","dark-blue"],/\.(?:mp4|m4v|h264)$/i,,false,,,,/^.{4}ftyp/],
    ["video-icon",["medium-blue","medium-blue"],/\.avi$/i,,false,,,,/^MLVI/],
    ["video-icon",["medium-cyan","medium-cyan"],/\.mov$/i,,false,,,,/^.{4}moov/],
    ["video-icon",["medium-purple","medium-purple"],/\.mkv$/i,,false,,,,/^\x1AEß£\x93B\x82\x88matroska/],
    ["video-icon",["medium-red","medium-red"],/\.flv$/i,,false,,,,/^FLV\x01/],
    ["video-icon",["dark-blue","dark-blue"],/\.webm$/i,,false,,,,/^\x1A\x45\xDF\xA3/],
    ["video-icon",["medium-red","medium-red"],/\.mpe?g$/i,,false,,,,/^\0{2}\x01[\xB3\xBA]/],
    ["video-icon",["dark-purple","dark-purple"],/\.(?:asf|wmv)$/i,,false,,,,/^0&²u\x8EfÏ\x11¦Ù\0ª\0bÎl/],
    ["video-icon",["medium-orange","medium-orange"],/\.(?:ogm|og[gv])$/i,,false,,,,/^OggS/],
    ["vim-icon",["medium-green","medium-green"],/\.(?:vim|n?vimrc)$/i,,false,/Vim?/i,/\.viml$/i,/^(?:VimL?|NVim|Vim\s*Script)$/i],
    ["vim-icon",["dark-green","dark-green"],/^[gn_]?vim(?:rc|info)$/i],
    ["vs-icon",["medium-blue","medium-blue"],/\.(?:vba?|fr[mx]|bas)$/i,,false,,/\.vbnet$/i,/^Visual Studio$|^vb\.?net$/i],
    ["vs-icon",["medium-red","medium-red"],/\.vbhtml$/i],
    ["vs-icon",["medium-green","medium-green"],/\.vbs$/i],
    ["vs-icon",["dark-blue","dark-blue"],/\.csproj$/i],
    ["vs-icon",["dark-red","dark-red"],/\.vbproj$/i],
    ["vs-icon",["dark-purple","dark-purple"],/\.vcx?proj$/i],
    ["vs-icon",["dark-green","dark-green"],/\.vssettings$/i],
    ["vs-icon",["medium-maroon","medium-maroon"],/\.builds$/i],
    ["vs-icon",["medium-orange","medium-orange"],/\.sln$/i],
    ["vue-icon",["light-green","light-green"],/\.vue$/i,,false,,/\.vue$/i,/^Vue$/i],
    ["owl-icon",["dark-blue","dark-blue"],/\.owl$/i],
    ["windows-icon",["medium-purple","medium-purple"],/\.bat$|\.cmd$/i,,false,,/(?:^|\.)(?:bat|dosbatch)(?:\.|$)/i,/^(?:bat|(?:DOS|Win)?Batch)$/i],
    ["windows-icon",[null,null],/\.(?:exe|com|msi)$/i],
    ["windows-icon",["medium-blue","medium-blue"],/\.reg$/i],
    ["x10-icon",["light-maroon","light-maroon"],/\.x10$/i,,false,,/\.x10$/i,/^X10$|^xten$/i],
    ["x11-icon",["medium-orange","medium-orange"],/\.X(?:authority|clients|initrc|profile|resources|session-errors|screensaver)$/i],
    ["xmos-icon",["medium-orange","medium-orange"],/\.xc$/i],
    ["appstore-icon",["medium-blue","medium-blue"],/\.(?:pbxproj|pbxuser|mode\dv\3|xcplugindata|xcrequiredplugins)$/i],
    ["xojo-icon",["medium-green","medium-green"],/\.xojo_code$/i],
    ["xojo-icon",["medium-blue","medium-blue"],/\.xojo_menu$/i],
    ["xojo-icon",["medium-red","medium-red"],/\.xojo_report$/i],
    ["xojo-icon",["dark-green","dark-green"],/\.xojo_script$/i],
    ["xojo-icon",["dark-purple","dark-purple"],/\.xojo_toolbar$/i],
    ["xojo-icon",["dark-cyan","dark-cyan"],/\.xojo_window$/i],
    ["xpages-icon",["medium-blue","medium-blue"],/\.xsp-config$/i],
    ["xpages-icon",["dark-blue","dark-blue"],/\.xsp\.metadata$/i],
    ["xmos-icon",["dark-blue","dark-blue"],/\.xpl$/i],
    ["xmos-icon",["medium-purple","medium-purple"],/\.xproc$/i],
    ["sql-icon",["dark-red","dark-red"],/\.(?:xquery|xq|xql|xqm|xqy)$/i,,false,,/\.xq$/i,/^XQuery$/i],
    ["xtend-icon",["dark-purple","dark-purple"],/\.xtend$/i,,false,,/\.xtend$/i,/^Xtend$/i],
    ["yang-icon",["medium-yellow","medium-yellow"],/\.yang$/i,,false,,/\.yang$/i,/^YANG$/i],
    ["zbrush-icon",["dark-purple","dark-purple"],/\.zpr$/i],
    ["zephir-icon",["medium-pink","medium-pink"],/\.zep$/i],
    ["zimpl-icon",["medium-orange","medium-orange"],/\.(?:zimpl|zmpl|zpl)$/i],
    ["apple-icon",["medium-blue","medium-blue"],/^com\.apple\./,0.5],
    ["apache-icon",["medium-red","medium-red"],/^httpd\.conf/i,0],
    ["checklist-icon",["medium-yellow","medium-yellow"],/TODO/,0],
    ["config-icon",[null,null],/config|settings|option|pref/i,0],
    ["doge-icon",["medium-yellow","medium-yellow"],/\.djs$/i,0,false,,/\.dogescript$/i,/^Dogescript$/i],
    ["gear-icon",[null,null],/^\./,0],
    ["book-icon",["medium-blue","medium-blue"],/\b(?:changelog|copying(?:v?\d)?|install|read[-_]?me)\b|^licen[sc]es?[-._]/i,0],
    ["book-icon",["dark-blue","dark-blue"],/^news(?:[-_.]?[-\d]+)?$/i,0],
    ["v8-icon",["medium-blue","medium-blue"],/^(?:[dv]8|v8[-_.][^.]*|mksnapshot|mkpeephole)$/i,0]],
    [[69,147,152,154,169,192,195,196,197,198,204,217,239,244,249,251,253,258,287,292,293,303,304,309,331,333,336,343,347,353,362,380,395,398,416,420,421,422,424,431,434,448,451,465,467,468,471,480,481,482,485,486,487,525,526,529,534,555,565,570,571,572,578,580,584,586,590,601,602,626,629,658,669,670,681,688,694,696,709,714,715,745,748,755,760,769,772,778,779,798,800,803,805,808,811,822,823,826,836,838,848,854,858,860,864,865,867,868,871,881,886,903,905,924,928,936,944,987,1000,1003,1005,1023],[42,57,69,105,120,121,124,126,129,143,145,147,149,151,152,154,156,157,158,166,167,169,174,192,194,195,196,197,198,204,206,210,211,213,215,216,217,223,224,225,229,230,234,236,237,238,239,242,243,244,249,251,253,255,256,258,275,285,286,287,288,290,291,292,293,294,295,297,300,301,303,304,309,312,314,326,330,336,341,342,343,346,347,350,351,352,353,359,362,365,380,381,382,383,386,390,392,394,395,398,400,416,422,439,440,442,448,451,452,453,454,458,461,463,465,466,467,468,469,470,471,472,473,474,475,479,482,485,486,487,488,489,490,522,524,525,527,529,530,533,534,543,546,547,548,549,553,555,558,560,561,565,570,571,575,578,580,582,584,586,590,600,601,602,603,604,605,612,618,626,629,657,658,664,665,668,669,675,678,679,680,681,685,687,688,689,690,691,694,696,704,707,709,714,715,716,717,718,719,734,738,741,742,744,746,747,748,753,755,760,768,769,774,776,777,778,779,781,792,797,798,801,802,803,805,807,808,811,818,822,823,826,827,828,829,836,838,841,845,847,848,850,854,858,860,862,863,864,865,867,868,871,875,881,884,886,894,896,897,898,900,901,903,905,915,923,924,928,932,933,936,937,938,944,947,951,952,954,970,982,983,984,985,986,987,995,997,1000,1002,1003,1005,1023,1025,1034,1036,1039,1053,1054,1055,1063],[41,150,282,283,284,321,889,959],[42,57,69,105,120,121,124,126,129,143,145,147,149,151,152,154,156,157,158,166,167,169,174,192,194,195,196,197,198,204,206,210,211,213,215,216,217,223,224,225,229,230,234,236,237,238,239,242,243,244,249,251,253,255,256,258,275,276,285,286,287,288,290,291,292,293,294,295,297,300,301,303,304,309,311,312,314,319,326,330,336,341,342,343,346,347,350,351,352,353,359,362,365,380,381,382,383,386,390,392,394,395,398,400,412,416,418,420,421,422,424,431,432,434,439,440,442,448,451,452,453,454,458,461,463,465,466,467,468,469,470,471,472,473,474,475,479,480,481,482,483,485,486,487,488,489,490,522,524,525,527,529,530,533,534,543,546,547,548,549,553,555,558,560,561,565,570,571,575,578,580,582,584,586,590,600,601,602,603,604,605,612,618,626,629,657,658,660,661,664,665,668,669,675,678,679,680,681,685,687,688,689,690,691,694,696,704,707,709,714,715,716,717,718,719,734,738,741,742,744,746,747,748,753,755,760,768,769,774,776,777,778,779,781,792,797,798,801,802,803,805,807,808,811,818,822,823,826,827,828,829,836,838,841,845,847,848,850,854,858,860,862,863,864,865,867,868,871,875,876,881,884,886,894,896,897,898,900,901,903,905,915,923,924,928,932,933,936,937,938,944,947,951,952,954,970,982,983,984,985,986,987,995,997,1000,1002,1003,1005,1023,1025,1034,1036,1039,1053,1054,1055,1063],[106,138,178,179,180,181,182,183,184,185,186,188,189,235,261,262,263,264,265,268,273,348,372,373,374,375,376,377,410,411,493,494,495,496,497,498,499,500,501,503,504,505,506,507,509,510,511,512,513,514,516,519,520,601,674,737,754,769,781,957,1013,1014,1015,1016,1017,1018,1019,1020,1021,1022]]]
    ];

    /* ---------------------------------------------------------------------------
     * FileIcons
     * ------------------------------------------------------------------------- */

    /**
     * Create FileIcons instance
     *
     * @param {Array}   icondb - Icons database
     * @class
     * @constructor
     */

    var FileIcons = function(icondb) {
        this.db = new IconTables(icondb)
    }

    /**
     * Get icon class name of the provided filename. If not found, default to text icon.
     *
     * @param {string} name - file name
     * @return {string}
     * @public
     */

    FileIcons.prototype.getClass = function(name) {
        var match = this.db.matchName(name)
        return match ? match.getClass() : null
    }

    /**
     * Get icon class name of the provided filename with color. If not found, default to text icon.
     *
     * @param {string} name - file name
     * @return {string}
     * @public
     */

    FileIcons.prototype.getClassWithColor = function(name) {
        var match = this.db.matchName(name)
        return match ? match.getClass(0) : null
    }

    return new FileIcons(icondb)
}))
