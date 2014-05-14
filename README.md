## Octotree
Browser extensions (Chrome, Firefox and Safari) to display GitHub code in tree format. Useful for developers who frequently read source in GitHub and do not want to download or checkout too many repositories. Features:

* Easy-to-navigate code tree like IDEs
* Fast browsing with pjax
* Support private repositories (require [personal access token](#github-api-rate-limit))

## Install on Chrome
* Download and install [Octotree](https://chrome.google.com/webstore/detail/octotree/bkhaagjahfmjljalopjnoealnfndnagc) from the Chrome store
* Navigate to any GitHub project (or just refresh this page as an example)
* The code tree should show as follows:

![When extension is active](https://raw.githubusercontent.com/buunguyen/octotree/master/docs/chrome.png)

## Install on Firefox and Safari
I'm in the process of submitting the extensions to Mozilla and Safari stores. Meanwhile, you can install the prebuilt extensions located in the [dist](https://github.com/buunguyen/octotree/tree/master/dist) folder.

* Firefox: drag `octotree.xpi` to the browser and follow the instructions
* Safari: drag `octotree.safariextz` to the browser and follow the instructions

## GitHub API Rate Limit
Octotree uses [GitHub API](https://developer.github.com/v3/) to retrieve repository metadata. By default, it makes unauthenticated requests to the GitHub API. However, there are two situations when requests must be authenticated:

* You access a private repository
* You exceed the [rate limit of unauthenticated requests](https://developer.github.com/v3/#rate-limiting)

When that happens, Octotree shows the screen below to ask for your [GitHub personal access token](https://help.github.com/articles/creating-an-access-token-for-command-line-use). If you don't already have one, [create one](https://github.com/settings/tokens/new) and enter it into the textbox and save.

![Enter personal access token](https://raw.githubusercontent.com/buunguyen/octotree/master/docs/token.png)

Alternatively, you can manually enter or update the token by following these steps:

* Navigate to any GitHub page
* Open the Chrome (or Safari, Firefox) developer console
* Execute the following line:
```javascript
localStorage.setItem('octotree.github_access_token', JSON.stringify('REPLACE WITH TOKEN'))
```

## Contribution
There are several improvements that can be made to Octotree. Contribution is very welcome.

- [ ] Hide sidebar when navigating to non-code pages like Issues, PRs...
- [ ] Make the width of the sidebar resizable.
- [ ] Allow docking sidebar to either the left or right side.
- [ ] Allow users to enter access token any time.
- [ ] Synchronize (two-way) between sidebar selection and GitHub selection.
- [ ] Show progress indicator while the code tree or a file is being loaded (with Pjax). (Showing spinner in the toggle button?)

## Credit
* [Icon](https://github.com/pstadler/octofolders) by [pstadler](https://github.com/pstadler)
* Thanks to many people submitting pull requests, reporting bugs and suggesting ideas here and on [HN](https://news.ycombinator.com/item?id=7740226)