## Octotree
Chrome extension to display GitHub code in tree format. Useful for developers who frequently read source in GitHub and do not want to download or checkout every single repository. Features:

* Easy-to-navigate code tree like IDEs
* Super fast browsing with Pjax
* Work with public and private repositories

## Install
* Download and install [Octotree](https://chrome.google.com/webstore/detail/octotree/bkhaagjahfmjljalopjnoealnfndnagc) from the Chrome store
* Navigate to any GitHub project (or just refresh this page as an example)
* The code tree should show as follows:

![When extension is active](https://raw.githubusercontent.com/buunguyen/octotree/master/screen_ext.png)

## GitHub API Rate Limit
Octotree uses [GitHub API](https://developer.github.com/v3/) to retrieve repository metadata. By default, it makes unauthenticated requests to the GitHub API. However, there are two situations when requests must be authenticated:

* You are accessing a private repository
* You exceed the [rate limit of unauthenticated requests](https://developer.github.com/v3/#rate-limiting)

When that happens, Octotree will show the following screen to ask for your [GitHub personal access token](https://help.github.com/articles/creating-an-access-token-for-command-line-use). 

![Enter personal access token](https://raw.githubusercontent.com/buunguyen/octotree/master/screen_token.png)

If you don't already have one, create one at [this page](https://github.com/settings/tokens/new). Then enter the generated token into the textbox and save.

Alternatively, you can always manually enter or update the token by following these steps:

* Navigate to any GitHub page
* Open the Chrome developer console
* Execute the following line:
```javascript
localStorage.setItem('octotree.github_access_token', 'REPLACE WITH TOKEN')
```

## Contribution
There are several improvements that can be made to Octotree. Contribution is very welcome.

- [ ] Hide sidebar when navigating to non-code pages like Issues, PRs...
- [ ] Make the width of the sidebar resizable.
- [ ] Allow users to enter access token any time.
- [ ] Synchronize (two-way) between sidebar selection and GitHub selection.
- [ ] Show progress indicator while the code tree or a file is being loaded (with Pjax). (Showing spinner in the toggle button?)

## Credit
[Icon](https://github.com/pstadler/octofolders) by [pstadler](https://github.com/pstadler)