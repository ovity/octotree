### v2.4.6
* Fix random page reload

### v2.4.4
* Fix layout in project page
* Fix intermittent page reload
* Support file icon in Safari
* Set default GitHub token options

### v2.4.3
* Fix issue branch path not encoded in file navigation

### v2.4.2
* Fix issue download icon not shown upon hover

### v2.4.1
* Support file icons

### v2.3.3
* Handle local storage error

### v2.3.2
* Improve file navigation speed in pull requests

### v2.3.1
* Fix bug PR mode doesn't work with lazy loading
* Fix bug sidebar width is not stable in Firefox

### v2.3.0
* Support PR viewing mode
* Handle reserved chars in URLs

### v2.2.0
* Support BitBucket (experimental)
* Fix minor bugs

### v2.1.0
* Remove GitLab support
* Improve GitHub styling

### v2.0.21
* Fix branch selection in pull request page

### v2.0.20
* Fix bug causing some branches not to show

### v2.0.19
* Accommodate new GitHub layout
* Support multiprocess for Firefox

### v2.0.18
* Update GitHub and GitLab layout
* Support cmd/ctrl/shift-click to open new tab

### v2.0.17
* Update for new GitLab layout and remove support for old GitLab layouts
* Fix bug GitHub not used cached branch

### v2.0.16
* Fix toggle button position in GitLab

### v2.0.15
* Avoid showing tree in raw GitHub pages

### v2.0.14
* Add more reserved names
* Update GitLab token link

### v2.0.12
* Fix issue due to GitLab redesign

### v2.0.11
* Encode branch before displaying to avoid XSS
* Fix bug project ID not retrieved in latest GitLab layout

### v2.0.10
* Retain forward slashes in URLs
* Improve behavior of middle-click

### v2.0.9
* Fix bug GitLab: diff box header shows on top of page header

### v2.0.8
* Support old GitLab CE deployments
* Fix bug Octotree shows in GitLab raw page

### v2.0.7
* Fix font icons issue on Firefox and Safari
* Fix bug help popup doesn't disappear upon error
* Allow Octotree to be used in Firefox private-browsing mode

### v2.0.4
* Fix font icons issue as GitHub switches to SVG
* Fix toggle button position when GitLab is in compact mode

### v2.0.3
* Fix bug cannot load Octotree in GitHub Enterprise
* No longer need to login to GitLab before showing tree

### v2.0.0
* Support GitLab
* Add ability to lazy-load individual folders
* Simplify Octotree settings
* Store settings for each host separately
* Support new GitHub layout
* And various bug fixes

### v1.7.2
* Fix bug long branches are not loaded correctly due to GitHub DOM change

### v1.7.1
* Fix space between tree and GitHub contents due to GitHub DOM change

### v1.7.0
* Support direct downloading when hovering a file

### v1.6.4
* Fix bug detecting branch/tag due to GitHub DOM change

### v1.6.3
* Fix bug when switching to branches with slashes in their names

### v1.6.2
* Fix branch selection no longer works due to GitHub change

### v1.6.1
* Update buttons' style to match GitHub new button style

### v1.6
* Update all dependencies to latest version
* Allow navigating to commit trees https://github.com/buunguyen/octotree/issues/157
* Support keyboard navigation https://github.com/buunguyen/octotree/issues/158
* Fix bug handling back tick in paths https://github.com/buunguyen/octotree/issues/160

### v1.5.3
* Fix bug https://github.com/buunguyen/octotree/pull/149
* Fix bug https://github.com/buunguyen/octotree/issues/151
* Fix bug https://github.com/buunguyen/octotree/issues/155

### v1.5.2
* Fix bug https://github.com/buunguyen/octotree/issues/147

### v1.5
* Option to show in non-code pages
* Option to load tree only when sidebar is visible
* Option to configure tab size
* Bug fixes

### v1.4.1
* New header to match new GitHub design
* Bug fixes

### v1.4
* Support GitHub enterprise
* Change default hotkey (`cmd+b` for Safari and `cmd+shift+s` for all other browsers)
* Some other minor changes

### v1.3
* Setting panel allowing:
 * Changing access token
 * Changing hotkeys
 * Changing sidebar default visibility
 * Changing folder collapsing option
* Sidebar appears better in large monitors
* More responsive in big repositories
* And bug fixes

### v1.2
* Hide sidebar by default (upon many user requests)
* Hotkey (`cmd+b`, `ctrl+b`) to toggle sidebar
* Sidebar is now resizable
* Support rendering submodules
* Reflect GitHub selection to Octotree
* New sidebar header and progress indicator
* And bug fixes

### v1.1
* New UI that blends better with GitHub!
* Hide Octotree on non-code pages
* When asking for token, show more detailed message and not fly out automatically
* Extend pjax timeout to work better with big files
* Sanitize file and folder names before displaying
* Fix error when a branch name contains slashes
* Gulp script to build for Chrome, Firefox and Safari
* And some other minor changes
