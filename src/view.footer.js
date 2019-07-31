const FOOTER_OPTIONS = [
  ['Review pull requests faster', 'https://www.octotree.io/'],
  ['Never miss a review comment', 'https://www.octotree.io/'],
  ['View all pull request comments', 'https://www.octotree.io/'],
  ['Change GitHub theme with ease', 'https://www.octotree.io/'],
  ['Octotree and GitHub in dark mode', 'https://www.octotree.io/'],
  ['Want this sidebar on the right?', 'https://www.octotree.io/'],
  ['Team of 5: Discount for Pro', 'https://www.octotree.io/pricing'],
  ['The ultimate GitHub extension', 'https://www.octotree.io/'],
  ['What is better than Octotree?', 'https://www.octotree.io/'],
  [
    'Help improve Octotree',
    'https://docs.google.com/forms/d/e/1FAIpQLSdCJX4_xO1BvJ3yjJ0H5ry95mRVwublj7WLny3R5rPtxbPzxA/viewform'
  ],
  ['Report an issue', 'https://github.com/ovity/octotree/issues/new'],
  [
    'Review us on Chrome',
    'https://chrome.google.com/webstore/detail/octotree/bkhaagjahfmjljalopjnoealnfndnagc?hl=en-US'
  ]
];

class FooterView {
  constructor($dom) {
    this.$footer = $dom.find('.octotree-ad-small a');
  }

  init() {
    let [text, link] = FOOTER_OPTIONS[Math.floor(Math.random() * FOOTER_OPTIONS.length)];
    if (link.includes('https://www.octotree.io')) {
      link = `${link}?utm_source=lite&utm_medium=extension&utm_content=${text}`;
    }
    this.$footer.attr('href', link).text(text);
  }
}
