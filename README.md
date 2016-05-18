## Octotree
Browser extensions (Chrome, Firefox, Opera and Safari) to display GitHub and GitLab code in tree format. Useful for developers who frequently read source and do not want to download or checkout too many repositories. Features:

* Easy-to-navigate code tree like IDEs
* Fast browsing with pjax and Turbolinks
* Support private repositories (see [instructions](#access-token))
* Support GitHub and GitLab Enterprise (Chrome and Opera only, see [instructions](#enterprise-urls))

![Octotree on GitHub](docs/chrome-github.png)
![Octotree on GitLab](docs/chrome-gitlab.png)

### Install on Chrome, Firefox and Opera
* Install Octotree from [Chrome Web Store](https://chrome.google.com/webstore/detail/octotree/bkhaagjahfmjljalopjnoealnfndnagc), [Mozilla Add-ons Store](https://addons.mozilla.org/en-US/firefox/addon/octotree/) or [Opera Add-ons Store](https://addons.opera.com/en/extensions/details/octotree/)
* Navigate to any GitHub repository (or just refresh this page as an example)
* The code tree should show on the left-hand side of the screen

### Install on Safari

Octotree is not available on the Safari gallery. Instead, you must use the prebuilt package or build one from source. Follow the below instructions to install using the prebuilt package.

* Download the [Safari prebuilt package](https://github.com/buunguyen/octotree/blob/master/dist/safari.safariextz?raw=true)
* Double-click or drag it to Safari

### Install prebuilt packages (all browsers)

Prebuilt packages are available in the  [dist](https://github.com/buunguyen/octotree/tree/master/dist) folder. For security reason, only download Octotree from this location.

Firefox 43+ requires add-ons to be signed. Therefore, you should install Octotree from the Mozilla store. For some reason if you want to install the prebuilt package instead, you have to [disable sign-check](https://github.com/buunguyen/octotree/issues/220#issuecomment-166012724).

## Settings
### Access Token
#### GitHub
Octotree uses [GitHub API](https://developer.github.com/v3/) to retrieve repository metadata. By default, it makes unauthenticated requests to the GitHub API. However, there are two situations when requests must be authenticated:

* You access a private repository
* You exceed the [rate limit of unauthenticated requests](https://developer.github.com/v3/#rate-limiting)

When that happens, Octotree will ask for your [GitHub personal access token](https://help.github.com/articles/creating-an-access-token-for-command-line-use). If you don't already have one, [create one](https://github.com/settings/tokens/new), then copy and paste it into the textbox. Note that the minimal scopes that should be granted are `public_repo` and `repo` (if you need access to private repositories).

#### GitLab
Octotree uses [GitLab API](http://doc.gitlab.com/ce/api/) to retrieve repository metadata. By default, Octotree attempts to retrieve the access token embedded in the GitLab DOM and use the token to authenticate against the GitLab API. If Octotree cannot retrieve the token, it will prompt you to [create one](https://gitlab.com/profile/account).


### Enterprise URLs
By default, Octotree only works on `github.com` and `gitlab.com`. To support enterprise version on Chrome and Opera, you must grant Octotree sufficient permissions. Follow these steps to do so:

* To add GitHub enterprise, go to any GitHub repo; otherwise, go to any GitLab repo (e.g. [gitlab-ce](https://gitlab.com/gitlab-org/gitlab-ce)).
* Open the Octotree settings panel

![Settings](docs/settings.jpg)

* Fill in the GitHub/GitLab Enterprise URLs textbox, _one URL per line_
* Click Save and accept the permission prompt
* Navigate to your GitHub/GitLab Enterprise site
* You might be asked to create an [access token](#access-token)

### Others
* __Hotkeys__: Octotree uses [keymaster](https://github.com/madrobby/keymaster) to register hotkeys. Checkout the [supported keys](https://github.com/madrobby/keymaster#supported-keys).
* __Remember sidebar visibility__: if checked, show or hide Octotree based on its last visibility.
* __Show in non-code pages__: if checked, allow Octotree to show in non-code pages such as Issues and Pull Requests.
* __Load entire tree at once__: if checked, load and render the entire code tree at once. To avoid long loading, this should be unchecked if you frequently work with very large repos.

## Credits
* [@crashbell](https://github.com/crashbell) for helping with GitLab and others
* [@Ephemera](https://github.com/Ephemera) for fixing many bugs
* [@athaeryn](https://github.com/athaeryn) and [@letunglam](https://github.com/letunglam) for helping with UI design
* And many other people who submit bug fixes and reports
