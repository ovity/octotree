## Octotree

Browser extension (Chrome, Firefox, Opera and Safari) to show a code tree on GitHub. Awesome for exploring project source without having to pull every single repository to your machine.

Features:

- Easy-to-navigate code tree, just like in IDEs
- Fast browsing with pjax
- Support private repositories (see [instructions](#access-token))

Features of Octotree Plus (_require subscription_)

- Dark mode
- File search
- Change docking position
- Multiple GitHub accounts
- Support GitHub Enterprise on Chrome, Opera and Firefox
- Official Safari version

Learn more about these features from [our website](https://octotree.io).

![Octotree on GitHub](docs/chrome-github.jpg)

### Install Octotree

- Octotree: [Chrome](https://chrome.google.com/webstore/detail/octotree/bkhaagjahfmjljalopjnoealnfndnagc), [Firefox](https://addons.mozilla.org/en-US/firefox/addon/octotree/), [Opera](https://addons.opera.com/en/extensions/details/octotree/)
- Octotree Plus: [Chrome](), [Firefox](), [Opera](), [Safari]()

## Settings

### Access Token

Octotree uses the [GitHub API](https://developer.github.com/v3/) to retrieve repository metadata. By default, it makes unauthenticated requests to get these data. However, there are two situations when GitHub require such requests to be authenticated:

- You access a private repository
- You exceed the [API rate limit](https://developer.github.com/v3/#rate-limiting)

When that happens, Octotree will ask for your [GitHub personal access token](https://help.github.com/articles/creating-an-access-token-for-command-line-use). If you don't already have one, [create one](https://github.com/settings/tokens/new?scopes=repo&description=Octotree%20browser%20extension), then copy and paste it into the token textbox in the Settings screen. Note that the minimal scopes that should be granted are `public_repo` and `repo` (if you need access to private repositories).

Octotree stores access token in your browser local storage and uses it exclusively to authenticate with GitHub (see the code that does that [here](https://github.com/ovity/octotree/blob/559291ed9017f0c3429bc49419d001d9ea0ac510/src/adapters/github.js#L296-L313)). Octotree never transmits access token to any other servers except GitHub itself and the data received is used **only** to render the tree on your local machine. Using access tokens to access private repository and increase API rate limit is a standard practice that many GitHub extensions use.

### Others

- **Hotkeys**: key combinations to pin/unpin the sidebar. Check out the [supported keys](https://github.com/madrobby/keymaster#supported-keys).
- **Show in non-code pages**: if checked, show Octotree in non-code pages such as Issues and Wiki.
- **Load entire tree at once**: if checked, load the entire code tree at once. To avoid long delay, this should be unchecked if you frequently work with very large repos.
- **Show only pull request changes**: if checked, show only the change set of a pull request.

## Contribution

1.  Install [node 8 or above](https://nodejs.org/en/download/)
1.  Run `npm install` to install dependencies
1.  Run `npm start` to watch code changes and build unpacked extensions
1.  Load the unpacked extensions in the `tmp` folder (check instructions of the specific browser)
1.  Please follow existing style for new code

## Core Team

- [Buu Nguyen](https://github.com/buunguyen)
- [Duy Lam](https://github.com/duylam)
- [Phi Nguyen](https://github.com/nphi1212)
- [An Nguyen](https://github.com/crashbell)

### Credits

Octotree and Octotree Plus use the following open-source software:

- [jQuery](https://github.com/jquery/jquery)
- [jQuery UI](https://github.com/jquery/jquery-ui)
- [jstree](https://github.com/vakata/jstree)
- [file-icons](https://github.com/file-icons/atom)
- [keymaster](https://github.com/madrobby/keymaster)
- [jquery-pjax](https://github.com/defunkt/jquery-pjax)
- [github-dark](https://github.com/StylishThemes/GitHub-Dark)
