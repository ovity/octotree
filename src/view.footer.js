const FOOTER_OPTIONS = [
  ['Review pull requests better', 'https://www.octotree.io/'],
  ['Never miss a PR comment', 'https://www.octotree.io/'],
  ['Enhanced code review', 'https://www.octotree.io/'],
  ['Change GitHub syntax theme', 'https://www.octotree.io/'],
  ['Want this sidebar on the right?', 'https://www.octotree.io/'],
  ['Team of 5? Get Pro discount', 'https://www.octotree.io/pricing'],
  [
    'Help us improve Octotree',
    'https://docs.google.com/forms/d/e/1FAIpQLSdCJX4_xO1BvJ3yjJ0H5ry95mRVwublj7WLny3R5rPtxbPzxA/viewform'
  ],
  [
    'Rate Octotree on Chrome',
    'https://chrome.google.com/webstore/detail/octotree/bkhaagjahfmjljalopjnoealnfndnagc?hl=en-US'
  ]
];

class FooterView {
  constructor($dom) {
    this.$footer = $dom.find('.octotree-tip a');
  }

  init() {
    let [text, link] = FOOTER_OPTIONS[Math.floor(Math.random() * FOOTER_OPTIONS.length)];
    if (link.includes('https://www.octotree.io')) {
      link = `${link}?utm_source=lite&utm_medium=extension&utm_content=${text}`;
    }
    this.$footer.attr('href', link).text(text);
  }
}
