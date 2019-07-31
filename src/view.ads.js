class AdsView {
  constructor($dom) {
    this.$smallAdView = $dom.find('.octotree-ad-small a');
  }

  get LINK() {
    return 'https://www.octotree.io/#pro?utm_source=lite&utm_medium=extension';
  }

  get LINES() {
    return [
      'Review pull requests faster',
      'Miss a code comment again?',
      'Toggle syntax theme with ease',
      'Want this sidebar on the right?',
      'Upgrade to Pro to support us',
      'Team of 5+ Get license discount',
      'The ultimate GitHub extension'
    ];
  }

  init() {
    const line = this.LINES[Math.floor(Math.random() * this.LINES.length)];
    this.$smallAdView.attr('href', `${this.LINK}&utm_content=${line}`).text(line);
  }
}
