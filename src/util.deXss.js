let $dummyDiv;

window.deXss = (str) => {
  $dummyDiv = $dummyDiv || $('<div></div>');

  return $dummyDiv.text(str).html();
}
