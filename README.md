[![OpenCollective](https://opencollective.com/octotree/backers/badge.svg)](#backers)
[![OpenCollective](https://opencollective.com/octotree/sponsors/badge.svg)](#sponsors)

## Octotree

Browser extension (Chrome, Firefox and Opera) to show a code tree on GitHub. Awesome for exploring project source without having to pull every single repository to your machine. Features:

- Easy-to-navigate code tree, just like in IDEs
- Fast browsing with pjax
- Support private repositories (see [instructions](#access-token))

![Octotree on GitHub](docs/chrome-github.jpg)

### Install on Chrome, Firefox and Opera

- Install Octotree from [Chrome Web Store](https://chrome.google.com/webstore/detail/octotree/bkhaagjahfmjljalopjnoealnfndnagc), [Mozilla Add-ons Store](https://addons.mozilla.org/en-US/firefox/addon/octotree/) or [Opera Add-ons Store](https://addons.opera.com/en/extensions/details/octotree/)
- Navigate to any GitHub repository (or just refresh this page as an example)
- The code tree should show on the left-hand side of the screen

## Settings

### Access Token

**Note for the paranoids (like me!)**: Octotree stores access tokens in your browser local storage and never transmits it anywhere.

#### GitHub

Octotree uses [GitHub API](https://developer.github.com/v3/) to retrieve repository metadata. By default, it makes unauthenticated requests to the GitHub API. However, there are two situations when requests must be authenticated:

- You access a private repository
- You exceed the [rate limit of unauthenticated requests](https://developer.github.com/v3/#rate-limiting)

When that happens, Octotree will ask for your [GitHub personal access token](https://help.github.com/articles/creating-an-access-token-for-command-line-use). If you don't already have one, [create one](https://github.com/settings/tokens/new), then copy and paste it into the textbox. Note that the minimal scopes that should be granted are `public_repo` and `repo` (if you need access to private repositories).

### Others

- **Hotkeys**: Octotree uses [keymaster](https://github.com/madrobby/keymaster) to register hotkeys. Check out the [supported keys](https://github.com/madrobby/keymaster#supported-keys).
- **Show in non-code pages**: if checked, allow Octotree to show in non-code pages such as Issues and Pull Requests.
- **Load entire tree at once**: if checked, load and render the entire code tree at once. To avoid long loading, this should be unchecked if you frequently work with very large repos.
- **Show only pull request changes** _(new!)_: if checked and in "Pull requests" page, only show the change set of the pull request.

## Contribution

1.  Install [node 8 or above](https://nodejs.org/en/download/)
1.  Run `npm install` to install dependencies
1.  Run `npm run build` to watch code changes and build unpacked extensions
1.  Install unpacked extentions in the `tmp` folder (check specific browser instructions)
1.  Please follow existing style for new code

## Credits

- [@crashbell](https://github.com/crashbell) for helping with GitLab and others
- [@Ephemera](https://github.com/Ephemera) for fixing many bugs
- [@athaeryn](https://github.com/athaeryn) and [@letunglam](https://github.com/letunglam) for helping with UI design
- And many other people who submit bug fixes and reports

## Donate

Loving Octotree? [Donating](https://opencollective.com/octotree) to help us continue working on it.
