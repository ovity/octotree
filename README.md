[![OpenCollective](https://opencollective.com/octotree/backers/badge.svg)](#backers) 
[![OpenCollective](https://opencollective.com/octotree/sponsors/badge.svg)](#sponsors)

## Octotree
Browser extension (Chrome, Firefox, Opera and Safari) to show a code tree on GitHub. Awesome for exploring project source without having to pull every single repository to your machine. Features:

* Easy-to-navigate code tree, just like in IDEs
* Fast browsing with pjax and Turbolinks
* Support private repositories (see [instructions](#access-token))
* Support GitHub Enterprise (Chrome and Opera only, see [instructions](#enterprise-urls))

__GitLab is no longer supported__:
As of version 2.1.0, Octotree no longer supports GitLab. There are 2 reasons for this. First, GitLab has changed so much recently that it would take a lot of effort to keep Octotree up to date. Second, the GitLab team has [told me](https://github.com/buunguyen/octotree/issues/265) they would build a tree feature in GitLab itself. I can't afford working on something knowing my effort will be irrelevant any time soon. That being said, if anyone wants to work on supporting the new GitLab, I'll gladly accept contributions to add back GitLab support.

![Octotree on GitHub](docs/chrome-github.png)


### Install on Chrome, Firefox and Opera
* Install Octotree from [Chrome Web Store](https://chrome.google.com/webstore/detail/octotree/bkhaagjahfmjljalopjnoealnfndnagc), [Mozilla Add-ons Store](https://addons.mozilla.org/en-US/firefox/addon/octotree/) or [Opera Add-ons Store](https://addons.opera.com/en/extensions/details/octotree/)
* Navigate to any GitHub repository (or just refresh this page as an example)
* The code tree should show on the left-hand side of the screen

__Note__: to configure Octotree for GitHub Enteprise, see [instructions](#enterprise-urls)

### Install on Safari

Octotree is not available on the Safari gallery. Instead, you must use the prebuilt package or build one from source.

* Download the [Safari prebuilt package](https://github.com/buunguyen/octotree/blob/master/dist/safari.safariextz?raw=true)
* Double-click or drag it to Safari

### Install from prebuilt packages (all browsers)

Prebuilt packages are available in the  [dist](https://github.com/buunguyen/octotree/tree/master/dist) folder. For security reason, only download Octotree from this location.

__Note__: Firefox 43+ requires add-ons to be signed. Therefore, you should install Octotree from the Mozilla store. For some reason if you want to install the prebuilt package instead, you have to [disable sign-check](https://github.com/buunguyen/octotree/issues/220#issuecomment-166012724).

## Settings
### Access Token

__Note for the paranoids (like me!)__: Octotree stores access tokens in your browser local storage and never transmits it anywhere. If you want to verify, check out the source, starting with [this line](https://github.com/buunguyen/octotree/blob/master/src/view.options.js#L77).

#### GitHub
Octotree uses [GitHub API](https://developer.github.com/v3/) to retrieve repository metadata. By default, it makes unauthenticated requests to the GitHub API. However, there are two situations when requests must be authenticated:

* You access a private repository
* You exceed the [rate limit of unauthenticated requests](https://developer.github.com/v3/#rate-limiting)

When that happens, Octotree will ask for your [GitHub personal access token](https://help.github.com/articles/creating-an-access-token-for-command-line-use). If you don't already have one, [create one](https://github.com/settings/tokens/new), then copy and paste it into the textbox. Note that the minimal scopes that should be granted are `public_repo` and `repo` (if you need access to private repositories).

#### Bitbucket
Octotree uses [Bitbucket API](https://confluence.atlassian.com/bitbucket/repositories-endpoint-1-0-296092719.html) to retrieve repository metadata. By defualt, Octotree will ask for your [Bitbucket App password](https://confluence.atlassian.com/bitbucket/app-passwords-828781300.html). If you don't already have one, [create one](https://bitbucket.org/account/admin/app-passwords) (the minimal requirement is `Repositories`'s `Read` permission), then copy and paste it into the textbox.

Note that Octotree extract your username from your current page by default for calling Bitbucket API. If fail to extract, Octotree will ask you for a token update, then you just need to prepend your username to the token, separated by a colon, i.e. `USERNAME:TOKEN`.

### Enterprise URLs
By default, Octotree only works on `github.com`. To support enterprise version (Chrome and Opera only), you must grant Octotree sufficient permissions. Follow these steps to do so:

* Go to any GitHub repo
* Open the Octotree settings panel

![Settings](docs/settings.jpg)

* Fill in the GitHub Enterprise URLs textbox, _one URL per line_
* Click Save and accept the permission prompt
* Navigate to your GitHub Enterprise site
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

## Backers

Support us with a monthly donation and help us continue our activities. [[Become a backer](https://opencollective.com/octotree#backer)]

<a href="https://opencollective.com/octotree/backer/0/website" target="_blank"><img src="https://opencollective.com/octotree/backer/0/avatar.svg"></a>
<a href="https://opencollective.com/octotree/backer/1/website" target="_blank"><img src="https://opencollective.com/octotree/backer/1/avatar.svg"></a>
<a href="https://opencollective.com/octotree/backer/2/website" target="_blank"><img src="https://opencollective.com/octotree/backer/2/avatar.svg"></a>
<a href="https://opencollective.com/octotree/backer/3/website" target="_blank"><img src="https://opencollective.com/octotree/backer/3/avatar.svg"></a>
<a href="https://opencollective.com/octotree/backer/4/website" target="_blank"><img src="https://opencollective.com/octotree/backer/4/avatar.svg"></a>
<a href="https://opencollective.com/octotree/backer/5/website" target="_blank"><img src="https://opencollective.com/octotree/backer/5/avatar.svg"></a>
<a href="https://opencollective.com/octotree/backer/6/website" target="_blank"><img src="https://opencollective.com/octotree/backer/6/avatar.svg"></a>
<a href="https://opencollective.com/octotree/backer/7/website" target="_blank"><img src="https://opencollective.com/octotree/backer/7/avatar.svg"></a>
<a href="https://opencollective.com/octotree/backer/8/website" target="_blank"><img src="https://opencollective.com/octotree/backer/8/avatar.svg"></a>
<a href="https://opencollective.com/octotree/backer/9/website" target="_blank"><img src="https://opencollective.com/octotree/backer/9/avatar.svg"></a>
<a href="https://opencollective.com/octotree/backer/10/website" target="_blank"><img src="https://opencollective.com/octotree/backer/10/avatar.svg"></a>
<a href="https://opencollective.com/octotree/backer/11/website" target="_blank"><img src="https://opencollective.com/octotree/backer/11/avatar.svg"></a>
<a href="https://opencollective.com/octotree/backer/12/website" target="_blank"><img src="https://opencollective.com/octotree/backer/12/avatar.svg"></a>
<a href="https://opencollective.com/octotree/backer/13/website" target="_blank"><img src="https://opencollective.com/octotree/backer/13/avatar.svg"></a>
<a href="https://opencollective.com/octotree/backer/14/website" target="_blank"><img src="https://opencollective.com/octotree/backer/14/avatar.svg"></a>
<a href="https://opencollective.com/octotree/backer/15/website" target="_blank"><img src="https://opencollective.com/octotree/backer/15/avatar.svg"></a>
<a href="https://opencollective.com/octotree/backer/16/website" target="_blank"><img src="https://opencollective.com/octotree/backer/16/avatar.svg"></a>
<a href="https://opencollective.com/octotree/backer/17/website" target="_blank"><img src="https://opencollective.com/octotree/backer/17/avatar.svg"></a>
<a href="https://opencollective.com/octotree/backer/18/website" target="_blank"><img src="https://opencollective.com/octotree/backer/18/avatar.svg"></a>
<a href="https://opencollective.com/octotree/backer/19/website" target="_blank"><img src="https://opencollective.com/octotree/backer/19/avatar.svg"></a>
<a href="https://opencollective.com/octotree/backer/20/website" target="_blank"><img src="https://opencollective.com/octotree/backer/20/avatar.svg"></a>
<a href="https://opencollective.com/octotree/backer/21/website" target="_blank"><img src="https://opencollective.com/octotree/backer/21/avatar.svg"></a>
<a href="https://opencollective.com/octotree/backer/22/website" target="_blank"><img src="https://opencollective.com/octotree/backer/22/avatar.svg"></a>
<a href="https://opencollective.com/octotree/backer/23/website" target="_blank"><img src="https://opencollective.com/octotree/backer/23/avatar.svg"></a>
<a href="https://opencollective.com/octotree/backer/24/website" target="_blank"><img src="https://opencollective.com/octotree/backer/24/avatar.svg"></a>
<a href="https://opencollective.com/octotree/backer/25/website" target="_blank"><img src="https://opencollective.com/octotree/backer/25/avatar.svg"></a>
<a href="https://opencollective.com/octotree/backer/26/website" target="_blank"><img src="https://opencollective.com/octotree/backer/26/avatar.svg"></a>
<a href="https://opencollective.com/octotree/backer/27/website" target="_blank"><img src="https://opencollective.com/octotree/backer/27/avatar.svg"></a>
<a href="https://opencollective.com/octotree/backer/28/website" target="_blank"><img src="https://opencollective.com/octotree/backer/28/avatar.svg"></a>
<a href="https://opencollective.com/octotree/backer/29/website" target="_blank"><img src="https://opencollective.com/octotree/backer/29/avatar.svg"></a>

## Sponsors

Become a sponsor and get your logo on our README on Github with a link to your site. [[Become a sponsor](https://opencollective.com/octotree#sponsor)]

<a href="https://opencollective.com/octotree/sponsor/0/website" target="_blank"><img src="https://opencollective.com/octotree/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/octotree/sponsor/1/website" target="_blank"><img src="https://opencollective.com/octotree/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/octotree/sponsor/2/website" target="_blank"><img src="https://opencollective.com/octotree/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/octotree/sponsor/3/website" target="_blank"><img src="https://opencollective.com/octotree/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/octotree/sponsor/4/website" target="_blank"><img src="https://opencollective.com/octotree/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/octotree/sponsor/5/website" target="_blank"><img src="https://opencollective.com/octotree/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/octotree/sponsor/6/website" target="_blank"><img src="https://opencollective.com/octotree/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/octotree/sponsor/7/website" target="_blank"><img src="https://opencollective.com/octotree/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/octotree/sponsor/8/website" target="_blank"><img src="https://opencollective.com/octotree/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/octotree/sponsor/9/website" target="_blank"><img src="https://opencollective.com/octotree/sponsor/9/avatar.svg"></a>
<a href="https://opencollective.com/octotree/sponsor/10/website" target="_blank"><img src="https://opencollective.com/octotree/sponsor/10/avatar.svg"></a>
<a href="https://opencollective.com/octotree/sponsor/11/website" target="_blank"><img src="https://opencollective.com/octotree/sponsor/11/avatar.svg"></a>
<a href="https://opencollective.com/octotree/sponsor/12/website" target="_blank"><img src="https://opencollective.com/octotree/sponsor/12/avatar.svg"></a>
<a href="https://opencollective.com/octotree/sponsor/13/website" target="_blank"><img src="https://opencollective.com/octotree/sponsor/13/avatar.svg"></a>
<a href="https://opencollective.com/octotree/sponsor/14/website" target="_blank"><img src="https://opencollective.com/octotree/sponsor/14/avatar.svg"></a>
<a href="https://opencollective.com/octotree/sponsor/15/website" target="_blank"><img src="https://opencollective.com/octotree/sponsor/15/avatar.svg"></a>
<a href="https://opencollective.com/octotree/sponsor/16/website" target="_blank"><img src="https://opencollective.com/octotree/sponsor/16/avatar.svg"></a>
<a href="https://opencollective.com/octotree/sponsor/17/website" target="_blank"><img src="https://opencollective.com/octotree/sponsor/17/avatar.svg"></a>
<a href="https://opencollective.com/octotree/sponsor/18/website" target="_blank"><img src="https://opencollective.com/octotree/sponsor/18/avatar.svg"></a>
<a href="https://opencollective.com/octotree/sponsor/19/website" target="_blank"><img src="https://opencollective.com/octotree/sponsor/19/avatar.svg"></a>
<a href="https://opencollective.com/octotree/sponsor/20/website" target="_blank"><img src="https://opencollective.com/octotree/sponsor/20/avatar.svg"></a>
<a href="https://opencollective.com/octotree/sponsor/21/website" target="_blank"><img src="https://opencollective.com/octotree/sponsor/21/avatar.svg"></a>
<a href="https://opencollective.com/octotree/sponsor/22/website" target="_blank"><img src="https://opencollective.com/octotree/sponsor/22/avatar.svg"></a>
<a href="https://opencollective.com/octotree/sponsor/23/website" target="_blank"><img src="https://opencollective.com/octotree/sponsor/23/avatar.svg"></a>
<a href="https://opencollective.com/octotree/sponsor/24/website" target="_blank"><img src="https://opencollective.com/octotree/sponsor/24/avatar.svg"></a>
<a href="https://opencollective.com/octotree/sponsor/25/website" target="_blank"><img src="https://opencollective.com/octotree/sponsor/25/avatar.svg"></a>
<a href="https://opencollective.com/octotree/sponsor/26/website" target="_blank"><img src="https://opencollective.com/octotree/sponsor/26/avatar.svg"></a>
<a href="https://opencollective.com/octotree/sponsor/27/website" target="_blank"><img src="https://opencollective.com/octotree/sponsor/27/avatar.svg"></a>
<a href="https://opencollective.com/octotree/sponsor/28/website" target="_blank"><img src="https://opencollective.com/octotree/sponsor/28/avatar.svg"></a>
<a href="https://opencollective.com/octotree/sponsor/29/website" target="_blank"><img src="https://opencollective.com/octotree/sponsor/29/avatar.svg"></a>
