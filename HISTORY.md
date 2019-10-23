### v4.0

Dealing with 2 separate versions of Octotree in many browsers has been a major pain for our team. Starting from this version, we have combined them to make our release effort simpler as well as ease the process of trial, downgrading and upgrading for our users. There is now one software: Octotree. We will deprecated Octotree Pro in the near future. All Octotree Pro users should switch to Octotree to enjoy the new features.

Other notable changes in this release:

- Octotree for Safari is now available for free!
- File search, bookmarking and dark mode are available for free when you log in.
- More Pro features (see README).

### v3.0.10

- Hot fix bug on Windows

### v3.0.9

- Hide tree in users and marketplace pages

### v3.0.2 - v3.0.8

- Many improvements to sidebar behavior
- Fix bug page reload when clicking a file
- Hide Octotree in Topics page

### v3.0.1

- Add option to show sidebar upon hover
- Fix bug sidebar shows when mouse over screen border

### v3.0.0

Since this release, we have 2 version of Octotree: an open-source, community version that has been and will forever remain free and a commercial version, Octotree Pro, that contains many advanced features.

**Changes to Octotree**

- Improved UI: more elegant and easy to use
- No longer support GitHub Enterprise on Chrome and Opera

**Octotree Pro**

- Dark mode
- File search
- Change docking position
- Multiple GitHub accounts
- GitHub Enterprise on Chrome, Opera and Firefox (at last!)
- Official Safari extension

Learn more about Octotree Pro on the [official Octotree website](https://www.octotree.io).

**Why 2 versions?**

I have been working on Octotree for the last 5 years in my spare time. For the past year or so, I started accepting donation, but that didn't work out too well. I need a sustainable source of income to fund the on-going development cost of Octotree. This is more important than ever as a few other developers have joined me to help maintain and improve Octotree.

Make no mistake, we will not abandon the free version of Octotree. We commit to keep updating and improving it with features that the majority of users need. We removed Chrome GitHub Enterprise support in this release because we had to rewrite this feature from scratch to support Firefox and we consider this an advanced feature that most users don't need. If you need this feature, please consider upgrading to Octotree Pro to support the developers and enjoy other premium features.

### v2.5.1

- Fix bug not working when branch names contain slashes

### v2.5.0

- Remove BitBucket experiment feature
- Update file opening behavior
- Fix bug tree not matching current commit
- Fix bug global style breaking certain GitHub enterprise UI
- Reduce extension size
- Upgrade to jQuery 3
- And some other minor improvements

### v2.4.7 - v2.4.9

- Minor UI tweaks

### v2.4.6

- Fix random page reload

### v2.4.4

- Fix layout in project page
- Fix intermittent page reload
- Support file icon in Safari
- Set default GitHub token options

### v2.4.3

- Fix issue branch path not encoded in file navigation

### v2.4.2

- Fix issue download icon not shown upon hover

### v2.4.1

- Support file icons

### v2.3.3

- Handle local storage error

### v2.3.2

- Improve file navigation speed in pull requests

### v2.3.1

- Fix bug PR mode doesn't work with lazy loading
- Fix bug sidebar width is not stable in Firefox

### v2.3.0

- Support PR viewing mode
- Handle reserved chars in URLs

### v2.2.0

- Support BitBucket (experimental)
- Fix minor bugs

### v2.1.0

- Remove GitLab support
- Improve GitHub styling

### v2.0.21

- Fix branch selection in pull request page

### v2.0.20

- Fix bug causing some branches not to show

### v2.0.19

- Accommodate new GitHub layout
- Support multiprocess for Firefox

### v2.0.18

- Update GitHub and GitLab layout
- Support cmd/ctrl/shift-click to open new tab

### v2.0.17

- Update for new GitLab layout and remove support for old GitLab layouts
- Fix bug GitHub not used cached branch

### v2.0.16

- Fix toggle button position in GitLab

### v2.0.15

- Avoid showing tree in raw GitHub pages

### v2.0.14

- Add more reserved names
- Update GitLab token link

### v2.0.12

- Fix issue due to GitLab redesign

### v2.0.11

- Encode branch before displaying to avoid XSS
- Fix bug project ID not retrieved in latest GitLab layout

### v2.0.10

- Retain forward slashes in URLs
- Improve behavior of middle-click

### v2.0.9

- Fix bug GitLab: diff box header shows on top of page header

### v2.0.8

- Support old GitLab CE deployments
- Fix bug Octotree shows in GitLab raw page

### v2.0.7

- Fix font icons issue on Firefox and Safari
- Fix bug help popup doesn't disappear upon error
- Allow Octotree to be used in Firefox private-browsing mode

### v2.0.4

- Fix font icons issue as GitHub switches to SVG
- Fix toggle button position when GitLab is in compact mode

### v2.0.3

- Fix bug cannot load Octotree in GitHub Enterprise
- No longer need to login to GitLab before showing tree

### v2.0.0

- Support GitLab
- Add ability to lazy-load individual folders
- Simplify Octotree settings
- Store settings for each host separately
- Support new GitHub layout
- And various bug fixes

### v1.7.2

- Fix bug long branches are not loaded correctly due to GitHub DOM change

### v1.7.1

- Fix space between tree and GitHub contents due to GitHub DOM change

### v1.7.0

- Support direct downloading when hovering a file

### v1.6.4

- Fix bug detecting branch/tag due to GitHub DOM change

### v1.6.3

- Fix bug when switching to branches with slashes in their names

### v1.6.2

- Fix branch selection no longer works due to GitHub change

### v1.6.1

- Update buttons' style to match GitHub new button style

### v1.6

- Update all dependencies to latest version
- Allow navigating to commit trees https://github.com/buunguyen/octotree/issues/157
- Support keyboard navigation https://github.com/buunguyen/octotree/issues/158
- Fix bug handling back tick in paths https://github.com/buunguyen/octotree/issues/160

### v1.5.3

- Fix bug https://github.com/buunguyen/octotree/pull/149
- Fix bug https://github.com/buunguyen/octotree/issues/151
- Fix bug https://github.com/buunguyen/octotree/issues/155

### v1.5.2

- Fix bug https://github.com/buunguyen/octotree/issues/147

### v1.5

- Option to show in non-code pages
- Option to load tree only when sidebar is visible
- Option to configure tab size
- Bug fixes

### v1.4.1

- New header to match new GitHub design
- Bug fixes

### v1.4

- Support GitHub enterprise
- Change default hotkey (`cmd+b` for Safari and `cmd+shift+s` for all other browsers)
- Some other minor changes

### v1.3

- Setting panel allowing:
- Changing access token
- Changing hotkeys
- Changing sidebar default visibility
- Changing folder collapsing option
- Sidebar appears better in large monitors
- More responsive in big repositories
- And bug fixes

### v1.2

- Hide sidebar by default (upon many user requests)
- Hotkey (`cmd+b`, `ctrl+b`) to toggle sidebar
- Sidebar is now resizable
- Support rendering submodules
- Reflect GitHub selection to Octotree
- New sidebar header and progress indicator
- And bug fixes

### v1.1

- New UI that blends better with GitHub!
- Hide Octotree on non-code pages
- When asking for token, show more detailed message and not fly out automatically
- Extend pjax timeout to work better with big files
- Sanitize file and folder names before displaying
- Fix error when a branch name contains slashes
- Gulp script to build for Chrome, Firefox and Safari
- And some other minor changes
